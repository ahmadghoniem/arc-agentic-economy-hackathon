import { NextResponse } from "next/server"

import { getModelRegistry } from "@/lib/agent/model-registry"

export async function GET() {
  const entries = getModelRegistry()
  const groups = ["gemini", "featherless"].map((provider) => ({
    provider,
    models: entries.filter((entry) => entry.provider === provider),
  }))

  return NextResponse.json({ ok: true, groups })
}
