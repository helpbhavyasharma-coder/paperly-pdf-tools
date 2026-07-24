import { NextResponse } from "next/server";
import { cookieName, createAdminSession, hashPassword, validAdminCredentials } from "../../../lib/admin-auth";
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null;
  if (!body?.email || !body?.password) return NextResponse.json({ error: "Enter both email and password." }, { status: 400 });
  const passwordHash = await hashPassword(body.password);
  if (!validAdminCredentials(body.email, passwordHash)) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, await createAdminSession(body.email.trim().toLowerCase()), { httpOnly: true, sameSite: "strict", secure: new URL(request.url).protocol === "https:", path: "/", maxAge: 8 * 60 * 60 });
  return response;
}
