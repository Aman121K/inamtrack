import { NextResponse } from "next/server";

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function error(message: string, status = 400) {
  console.error(`[API Error] ${status}: ${message}`);
  return NextResponse.json({ ok: false, error: message }, { status });
}
