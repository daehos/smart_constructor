import { GoogleGenAI } from "@google/genai";
import { config } from "../../configs/env.js";

let _client = null;

export function getGeminiClient() {
  if (_client) return _client;
  if (!config.gemini?.apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }
  _client = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  return _client;
}

