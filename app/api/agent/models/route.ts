import { NextResponse } from "next/server"

import { getModelRegistry } from "@/lib/agent/model-registry"

export async function GET() {
  const entries = getModelRegistry()
  const groups = [
    {
      provider: "featherless",
      models: entries.filter((entry) => entry.provider === "featherless"),
    },
  ]

  return NextResponse.json({ ok: true, groups })
}
