/**
 * Generates the admin credentials block for .env.local.
 *
 *   npm run set-admin-password
 *
 * You type the password at your own terminal with the echo suppressed. Only its
 * scrypt hash is written to disk, so the file never contains a usable password:
 * a copy of .env.local leaking into a backup, a log or a screen share does not
 * hand anyone the portal.
 */

import { createInterface } from "node:readline";
import { randomBytes, scryptSync } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const ENV_FILE = path.join(ROOT, ".env.local");

// Must stay identical to src/lib/admin/auth.ts.
const SCRYPT_PARAMS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = function (chunk) {
        if (this.stdoutMuted) return;
        this.output.write(chunk);
      };
      rl.stdoutMuted = false;
      rl.question(question, (value) => {
        rl.output.write("\n");
        rl.close();
        resolve(value);
      });
      rl.stdoutMuted = true;
      rl.output.write(question);
    } else {
      rl.question(question, (value) => {
        rl.close();
        resolve(value.trim());
      });
    }
  });
}

function passwordProblem(pw) {
  if (pw.length < 12) return "Use at least 12 characters.";
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw)) return "Mix upper and lower case.";
  if (!/[0-9]/.test(pw)) return "Include at least one digit.";
  return null;
}

console.log("\n  eShifa admin — set the portal credentials\n");

const email = (await ask("  Admin email: ")).toLowerCase();
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("\n  ✗ That is not a valid email address.\n");
  process.exit(1);
}

let password;
for (;;) {
  password = await ask("  Password (hidden): ", { hidden: true });
  const problem = passwordProblem(password);
  if (problem) {
    console.log(`  ✗ ${problem}`);
    continue;
  }
  const again = await ask("  Confirm password: ", { hidden: true });
  if (again !== password) {
    console.log("  ✗ Passwords did not match. Try again.");
    continue;
  }
  break;
}

const salt = randomBytes(16);
// Colon separators: dotenv expands `$name` inside .env values.
const hash = `scrypt:${salt.toString("hex")}:${scryptSync(password.normalize("NFKC"), salt, 64, SCRYPT_PARAMS).toString("hex")}`;
password = null;

// A fresh signing secret invalidates any session issued under the old password.
const sessionSecret = randomBytes(32).toString("base64url");

let env = "";
try {
  env = readFileSync(ENV_FILE, "utf8");
} catch {
  console.error(`\n  ✗ ${ENV_FILE} not found. Copy .env.example to .env.local first.\n`);
  process.exit(1);
}

const set = (contents, key, value) => {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^#?\\s*${key}=.*$`, "m");
  return pattern.test(contents) ? contents.replace(pattern, line) : `${contents.trimEnd()}\n${line}\n`;
};

env = set(env, "ADMIN_EMAIL", email);
env = set(env, "ADMIN_PASSWORD_HASH", hash);
env = set(env, "ADMIN_SESSION_SECRET", sessionSecret);
writeFileSync(ENV_FILE, env);

console.log(`\n  ✓ Credentials saved to .env.local for ${email}.`);
console.log("    Only the hash was written — the password itself is not stored.");
console.log("    Restart the dev server, then sign in at /admin/login\n");
