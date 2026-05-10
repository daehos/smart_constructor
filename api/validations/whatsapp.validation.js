import { sendWhatsappImmediatePayload } from "@smart-constructor/contracts/queues";

/** Immediate WhatsApp send — same E.164 / body rules as contracts */
export const sendWhatsappImmediateValidation = sendWhatsappImmediatePayload;
