import { defaultRedisClient } from "../configs/redis.config.js";
import { enqueueWhatsappImmediate } from "../services/whatsappEnqueue.service.js";
import { sendWhatsappImmediateValidation } from "../validations/whatsapp.validation.js";
import { ValidationError } from "../errors/index.js";
import { z } from "zod";

const REDIS_KEY_QR = "whatsapp:qr";
const REDIS_KEY_CONNECTED = "whatsapp:connected";

export default class WhatsappController {
  static async getStatus(req, res, next) {
    try {
      const connected = await defaultRedisClient.get(REDIS_KEY_CONNECTED);
      res.status(200).json({
        success: true,
        data: {
          connected: connected === "1",
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getQR(req, res, next) {
    try {
      const qr = await defaultRedisClient.get(REDIS_KEY_QR);
      if (!qr) {
        return res.status(200).json({
          success: true,
          data: null,
          message: "No QR code available. The WhatsApp service may already be connected or not yet started.",
        });
      }
      res.status(200).json({
        success: true,
        data: { qr },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Queue an immediate WhatsApp text message (same queue as schedules; worker drains ASAP).
   * Body: { to: E.164 digits without +, body: string }
   */
  static async sendImmediate(req, res, next) {
    try {
      const parsed = sendWhatsappImmediateValidation.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError({ details: z.flattenError(parsed.error).fieldErrors });
      }

      await enqueueWhatsappImmediate(parsed.data);

      res.status(202).json({
        success: true,
        message: "Message queued for immediate delivery",
        data: { to: parsed.data.to },
      });
    } catch (error) {
      next(error);
    }
  }
}
