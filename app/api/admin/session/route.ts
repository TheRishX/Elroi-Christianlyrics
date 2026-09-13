import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cookieName, validSession } from "@/lib/auth";
export async function GET() { const store=await cookies(); return NextResponse.json({authenticated:validSession(store.get(cookieName)?.value)}); }
