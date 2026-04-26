import { NextResponse } from "next/server"

import { getAvailableTools } from "@/lib/agent/api-catalog"
import { planAgentTask } from "@/lib/agent/ai-planner"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      provider?: "auto" | "gemini" | "featherless" | "aivml"
      model?: string
      prompt?: string
    }

    const prompt = String(body.prompt || "").trim()
    if (!prompt) {
      return NextResponse.json(
        {
          ok: false,
          error: "prompt is required",
          steps: [],
        },
        { status: 400 }
      )
    }

    const plan = await planAgentTask({
      provider: body.provider || "auto",
      model: body.model || "",
      prompt,
      availableTools: getAvailableTools(),
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