import { getGeminiClient } from "./gemini.client.js";
import { config } from "../../configs/env.js";

const RECEIPT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    merchant: { type: "string" },
    date: { type: ["string", "null"], description: "YYYY-MM-DD or null if unknown" },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          qty: { type: "number" },
          unit: { type: "string" },
          price: { type: "number" },
        },
        required: ["name", "qty", "unit", "price"],
      },
    },
    subtotal: { type: ["number", "null"] },
    tax: { type: ["number", "null"] },
    total: { type: ["number", "null"] },
    currency: { type: "string" },
  },
  required: ["merchant", "date", "items", "subtotal", "tax", "total", "currency"],
};

function _coerceReceiptShape(obj) {
  const out = typeof obj === "object" && obj !== null ? obj : {};
  return {
    merchant: typeof out.merchant === "string" ? out.merchant : "",
    date: typeof out.date === "string" ? out.date : null,
    items: Array.isArray(out.items)
      ? out.items.map((i) => ({
          name: typeof i?.name === "string" ? i.name : "",
          qty: Number.isFinite(i?.qty) ? i.qty : 1,
          unit: typeof i?.unit === "string" && i.unit.trim() ? i.unit : "pcs",
          price: Number.isFinite(i?.price) ? i.price : 0,
        }))
      : [],
    subtotal: Number.isFinite(out.subtotal) ? out.subtotal : null,
    tax: Number.isFinite(out.tax) ? out.tax : null,
    total: Number.isFinite(out.total) ? out.total : null,
    currency: typeof out.currency === "string" && out.currency.trim() ? out.currency : "IDR",
  };
}

export async function extractReceipt(imageBuffer, mimeType) {
  const ai = getGeminiClient();
  const model = config.gemini?.model || "gemini-2.5-flash";

  const isPdf = mimeType === "application/pdf";
  const prompt = [
    "You are an OCR + receipt understanding system for Indonesian receipts.",
    "Extract the receipt into the JSON schema exactly.",
    isPdf
      ? "The input is a PDF. If it contains multiple pages, use the page that looks like a purchase receipt (or merge if clearly the same receipt)."
      : null,
    "",
    "Rules:",
    "- Use currency: IDR unless you are very confident it's another currency.",
    "- Date must be 'YYYY-MM-DD' or null if not found.",
    "- Items: include only purchased line items; exclude totals, tax lines, cashier, thanks, member id, etc.",
    "- qty should be numeric (default 1). unit default 'pcs'. price is per-unit price if clear, otherwise line price.",
    "- subtotal/tax/total should be integers if possible; otherwise numbers; null if unknown.",
  ]
    .filter(Boolean)
    .join("\n");

  const inlineData = {
    mimeType: mimeType || "image/jpeg",
    data: imageBuffer.toString("base64"),
  };

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }, { inlineData }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: RECEIPT_SCHEMA,
    },
  });

  let parsed;
  try {
    parsed = JSON.parse(response.text ?? "");
  } catch (e) {
    const err = new Error("Gemini returned non-JSON response");
    err.cause = e;
    err.details = response.text;
    throw err;
  }

  return _coerceReceiptShape(parsed);
}

