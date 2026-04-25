export type ProviderId = "gemini" | "featherless"

export type ModelRegistryEntry = {
  provider: ProviderId
  id: string
  label: string
  enabled: boolean
  requiresEnv: string
}

function parseModelList(value: string | undefined, fallback: string[]) {
  if (!value || !value.trim()) return fallback
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

export function getModelRegistry(): ModelRegistryEntry[] {
  const geminiModels = parseModelList(process.env.GEMINI_MODEL, [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
  ])
  const featherlessModels = parseModelList(process.env.FEATHERLESS_MODEL, [
    "claude-haiku-4-5",
    "qwen3.5-plus",
    "nemotron-super-free",
  ])

  const registry: ModelRegistryEntry[] = []

  for (const model of geminiModels) {
    registry.push({
      provider: "gemini",
      id: model,
      label: model,
      enabled: Boolean(process.env.GEMINI_API_KEY),
      requiresEnv: "GEMINI_API_KEY",
    })
  }

  for (const model of featherlessModels) {
    registry.push({
      provider: "featherless",
      id: model,
      label: model,
      enabled: Boolean(process.env.FEATHERLESS_API_KEY),
      requiresEnv: "FEATHERLESS_API_KEY",
    })
  }

  return registry
}

export function inferProviderFromModel(model: string): ProviderId | null {
  const found = getModelRegistry().find((entry) => entry.id === model)
  return found?.provider ?? null
}

export function getProviderAvailability() {
  return {
    gemini: Boolean(process.env.GEMINI_API_KEY),
    featherless: Boolean(process.env.FEATHERLESS_API_KEY),
  }
}
