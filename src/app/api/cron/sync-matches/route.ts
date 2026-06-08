import { NextRequest, NextResponse } from "next/server";
import { syncMatchResults } from "@/lib/api-sports";

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncMatchResults();

  const status = result.errors.length > 0 ? 207 : 200;
  return NextResponse.json(result, { status });
}
