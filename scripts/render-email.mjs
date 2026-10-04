#!/usr/bin/env node
// Renders the login-code email to docs/email/login-code.html (a preview with a sample code).
//   node scripts/render-email.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loginCodeEmail } from "../lib/email/login-code.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mail = loginCodeEmail("482913", { minutes: 5 });
mkdirSync(join(root, "docs/email"), { recursive: true });
writeFileSync(join(root, "docs/email/login-code.html"), mail.html);
writeFileSync(join(root, "docs/email/login-code.txt"), `Subject: ${mail.subject}\n\n${mail.text}\n`);
console.log(`docs/email/login-code.html — subject: ${mail.subject}`);
