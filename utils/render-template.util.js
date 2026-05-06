import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @param {string} filename - file under templates/emails/
 * @param {Record<string, string | number>} vars - keys match {{KEY}} in the template
 */
export async function renderEmailTemplate(filename, vars) {
  const emailTemplatesDir = path.join(__dirname, "..", "templates", "emails");

  let html = await fs.readFile(path.join(emailTemplatesDir, filename), "utf8");

  for (const [key, value] of Object.entries(vars)) {
    html = html.replaceAll(`{{${key}}}`, String(value));
  }

  return html;
}
