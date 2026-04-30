import { NextResponse } from "next/server"

import { planAgentTask } from "@/lib/agent/ai-planner"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      provider?: "auto" | "featherless"
      model?: string
      prompt?: string
      endpointFocus?: string
    }

    const prompt = String(body.prompt || "").trim()
    if (!prompt) {
      return NextResponse.json(
        { ok: false, error: "prompt is required", steps: [] },
        { status: 400 }
      )
    }

    const plan = await planAgentTask({
      provider: body.provider || "auto",
      model: body.model || "",
      prompt,
      endpointFocus: body.endpointFocus || "Auto",
    })

    return NextResponse.json(plan)
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Plan request failed",
        steps: [],
      },
      { status: 500 }
    )
  }
}
