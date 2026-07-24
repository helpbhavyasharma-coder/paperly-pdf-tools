const encoder = new TextEncoder();
const cookieName = "paperly_admin";

function base64Url(bytes: Uint8Array) {
  let value = "";
  bytes.forEach((byte) => (value += String.fromCharCode(byte)));
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signature(payload: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return "";
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))));
}

function equal(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return result === 0;
}

export async function createAdminSession(email: string) {
  const payload = base64Url(encoder.encode(JSON.stringify({ email, expires: Date.now() + 8 * 60 * 60 * 1000 })));
  return `${payload}.${await signature(payload)}`;
}

export async function verifyAdminSession(token?: string) {
  if (!token) return false;
  const [payload, supplied] = token.split(".");
  if (!payload || !supplied || !equal(supplied, await signature(payload))) return false;
  try {
    const json = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(payload.replace(/-/g, "+").replace(/_/g, "/")), (char) => char.charCodeAt(0))));
    return json.email === process.env.ADMIN_EMAIL && Number(json.expires) > Date.now();
  } catch { return false; }
}

export async function hashPassword(password: string) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(password)));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function validAdminCredentials(email: string, passwordHash: string) {
  const allowedEmail = process.env.ADMIN_EMAIL || "";
  const allowedHash = process.env.ADMIN_PASSWORD_HASH || "";
  return equal(email.trim().toLowerCase(), allowedEmail.trim().toLowerCase()) && equal(passwordHash, allowedHash);
}

export { cookieName };
