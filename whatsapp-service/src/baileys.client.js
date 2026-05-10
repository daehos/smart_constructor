import { readdir } from "fs/promises";
import {
  DEFAULT_CONNECTION_CONFIG,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeWASocket,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import qrcodeTerminal from "qrcode-terminal";
import { config } from "./config/env.js";
import { defaultRedisClient } from "./redis.config.js";

const REDIS_KEY_QR = "whatsapp:qr";
const REDIS_KEY_CONNECTED = "whatsapp:connected";

let _socket = null;
let _isReady = false;
let _hasQR = false;
let _saveCreds = null;

/** Resolved once per process — avoids refetch on every reconnect loop. */
let _waVersionPromise = null;

/** Prevents overlapping connect() runs while tearing down / spinning up sockets. */
let _connectChain = Promise.resolve();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Pull live client_revision from WhatsApp (formats change; try several patterns). */
async function fetchVersionFromSwJs() {
  const res = await fetch("https://web.whatsapp.com/sw.js", {
    headers: {
      "sec-fetch-site": "none",
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) {
    throw new Error(`sw.js HTTP ${res.status}`);
  }
  const text = await res.text();
  const patterns = [
    /"client_revision"\s*:\s*(\d+)/,
    /client_revision\s*:\s*(\d+)/,
    /\\?"client_revision\\?"\s*:\s*(\d+)/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      return /** @type {const} */ ([2, 3000, Number(m[1])]);
    }
  }
  throw new Error("client_revision not found in sw.js");
}

function formatDisconnectDetails(lastDisconnect) {
  const err = lastDisconnect?.error;
  if (!err) return "(no lastDisconnect.error)";
  const boom = err;
  const summary = {
    message: boom.message,
    statusCode: boom.output?.statusCode,
    error: boom.output?.payload?.error,
    payload: boom.output?.payload,
  };
  try {
    return JSON.stringify(summary);
  } catch {
    return `${boom.message} (status ${boom.output?.statusCode})`;
  }
}

/** WhatsApp maps multiple stream errors to HTTP-style codes; 401 can mean conflict (reconnect) not phone logout. */
function shouldStopReconnect(lastDisconnect) {
  const statusCode = lastDisconnect?.error?.output?.statusCode;
  const msg = String(lastDisconnect?.error?.message ?? "");
  const isConflict =
    /conflict/i.test(msg) ||
    statusCode === DisconnectReason.connectionReplaced ||
    statusCode === DisconnectReason.multideviceMismatch;

  if (isConflict) {
    return false;
  }

  // Explicit logout / bad session — do not loop forever
  if (statusCode === DisconnectReason.loggedOut) {
    return true;
  }

  if (statusCode === DisconnectReason.badSession) {
    return true;
  }

  return false;
}

async function resolveWaVersion() {
  const manual = config.whatsapp.waVersionOverride;
  if (manual) {
    console.info(`[baileys] WA version from WHATSAPP_WA_VERSION: ${JSON.stringify(manual)}`);
    return manual;
  }

  try {
    const v = await fetchVersionFromSwJs();
    console.info(`[baileys] WA version from web.whatsapp.com/sw.js: ${JSON.stringify(v)}`);
    return v;
  } catch (err) {
    console.warn("[baileys] Could not read version from sw.js:", err?.message ?? err);
  }

  try {
    const { version, isLatest, error } = await fetchLatestBaileysVersion();
    if (error) {
      console.warn("[baileys] fetchLatestBaileysVersion reported error:", error?.message ?? error);
    }
    console.info(
      `[baileys] WA version from Baileys repo JSON ${isLatest ? "(ok)" : "(fallback)"}: ${JSON.stringify(version)}`,
    );
    return version;
  } catch (err) {
    console.warn("[baileys] fetchLatestBaileysVersion failed:", err?.message ?? err);
  }

  const fallback = DEFAULT_CONNECTION_CONFIG.version;
  console.info(`[baileys] WA version fallback (bundled Baileys default): ${JSON.stringify(fallback)}`);
  return fallback;
}

function getWaVersion() {
  if (!_waVersionPromise) {
    _waVersionPromise = resolveWaVersion();
  }
  return _waVersionPromise;
}

function destroyPreviousSocket(reason) {
  const prev = _socket;
  _socket = null;
  _isReady = false;
  if (!prev) return;

  try {
    if (typeof prev.end === "function") {
      prev.end(reason ?? new Error("baileys: reconnecting"));
    }
  } catch (err) {
    console.warn("[baileys] Error while closing previous socket:", err?.message ?? err);
  }
}

async function connect() {
  _connectChain = _connectChain.then(() => connectInner());
  return _connectChain;
}

async function connectInner() {
  let authFileCount = 0;
  try {
    const names = await readdir(config.whatsapp.authDir);
    authFileCount = names.filter((n) => n !== ".gitkeep").length;
  } catch {
    authFileCount = 0;
  }
  console.info(
    `[baileys] Starting session (auth dir: ${config.whatsapp.authDir}, ${authFileCount} file(s)). ` +
      "A QR code appears only when no valid session exists or pairing is required again.",
  );

  destroyPreviousSocket(new Error("baileys: replacing socket"));

  const version = await getWaVersion();

  const { state, saveCreds } = await useMultiFileAuthState(config.whatsapp.authDir);
  _saveCreds = saveCreds;

  _socket = makeWASocket({
    version,
    auth: state,
    // Defaults (20s / 60s) are tight right after a 515 restart or on slow Docker/network paths;
    // init queries like fetchProps can hit "Timed Out" (408) otherwise.
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 120_000,
    printQRInTerminal: false,
    logger: {
      level: config.app.env === "production" ? "silent" : "warn",
      trace: () => {},
      debug: () => {},
      info: () => {},
      warn: (msg) => console.warn("[baileys]", msg),
      error: (msg) => console.error("[baileys]", msg),
      fatal: (msg) => console.error("[baileys]", msg),
      child: () => ({
        level: "silent",
        trace: () => {},
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
        fatal: () => {},
        child: () => ({}),
      }),
    },
  });

  _socket.ev.on("creds.update", async () => {
    if (_saveCreds) await _saveCreds();
  });

  _socket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      _hasQR = true;
      _isReady = false;
      console.info("[baileys] Pairing required — scan this QR with WhatsApp on your bot phone:");
      qrcodeTerminal.generate(qr, { small: true }, (output) => {
        console.info(output);
      });
      try {
        await defaultRedisClient.set(REDIS_KEY_QR, qr, "EX", config.whatsapp.qrTtlSeconds);
      } catch (err) {
        console.error("[baileys] Failed to store QR in Redis:", err?.message);
      }
    }

    if (connection === "open") {
      _isReady = true;
      _hasQR = false;
      console.info("[baileys] Connected to WhatsApp");
      try {
        await defaultRedisClient.set(REDIS_KEY_CONNECTED, "1");
        await defaultRedisClient.del(REDIS_KEY_QR);
      } catch (err) {
        console.error("[baileys] Failed to update connection status in Redis:", err?.message);
      }
    }

    if (connection === "close") {
      _isReady = false;
      try {
        await defaultRedisClient.set(REDIS_KEY_CONNECTED, "0");
      } catch {
        // best-effort
      }

      const statusCode = lastDisconnect?.error?.output?.statusCode;

      console.warn(`[baileys] Connection closed — ${formatDisconnectDetails(lastDisconnect)}`);

      if (shouldStopReconnect(lastDisconnect)) {
        console.warn(
          "[baileys] Session ended — scan QR again from a fresh start (check Linked Devices if this device is still listed).",
        );
        return;
      }

      const delayMs =
        statusCode === DisconnectReason.restartRequired
          ? 800
          : statusCode === DisconnectReason.timedOut
            ? 2000
            : /conflict/i.test(String(lastDisconnect?.error?.message ?? ""))
              ? 1500
              : 3000;

      console.warn(
        `[baileys] Reconnecting in ${delayMs}ms (code ${statusCode ?? "?"}) — pairing often triggers 515 restart; ` +
          "401/conflict usually means a second socket was still open; we now close the old socket first.",
      );
      await sleep(delayMs);
      connect().catch((err) => console.error("[baileys] Reconnect error:", err?.message));
    }
  });
}

export const whatsappClient = {
  async init() {
    await connect();
  },

  async sendText(to, body) {
    if (!_isReady || !_socket) {
      throw new Error("WhatsApp client is not connected");
    }

    const jitter = Math.floor(Math.random() * config.whatsapp.sendDelayMs);
    if (jitter > 0) await sleep(jitter);

    const jid = `${to}@s.whatsapp.net`;
    const result = await _socket.sendMessage(jid, { text: body });
    return result?.key?.id ?? null;
  },

  getStatus() {
    return {
      connected: _isReady,
      hasQR: _hasQR,
    };
  },
};
