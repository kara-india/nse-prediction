import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const serviceUrl = process.env.ML_SERVICE_URL;

  if (!serviceUrl) {
    return NextResponse.json(
      { service: "ml", status: "unconfigured" },
      { status: 503 },
    );
  }

  try {
    const baseUrl = `${serviceUrl.replace(/\/+$/, "")}/`;
    const response = await fetch(new URL("health", baseUrl), {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { service: "ml", status: "unavailable" },
        { status: 502 },
      );
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json(
      { service: "ml", status: "unavailable" },
      { status: 503 },
    );
  }
}
