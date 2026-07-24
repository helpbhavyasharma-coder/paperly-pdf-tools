import { NextResponse } from "next/server";
import { cookieName } from "../../../lib/admin-auth";
export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url), 303);
  response.cookies.set(cookieName, "", { httpOnly: true, sameSite: "strict", secure: new URL(request.url).protocol === "https:", path: "/", maxAge: 0 });
  return response;
}
