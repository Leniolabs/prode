import { NextRequest, NextResponse } from "next/server";
import { syncMatchResults } from "@/lib/espn";

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Optional: caller can pass ?date=YYYY-MM-DD to limit to one day.
  // Without it, the sync scans the full tournament date range (one fetch per day).
  const date = req.nextUrl.searchParams.get("date") ?? undefined;

  const result = await syncMatchResults(date);

  const status = result.errors.length > 0 ? 207 : 200;
  return NextResponse.json(result, { status });
}
