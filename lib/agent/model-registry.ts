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
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
  ])
  const featherlessModels = parseModelList(process.env.FEATHERLESS_MODEL, [
    "Qwen/Qwen3-8B",
    "Qwen/Qwen3-14B",
    "Qwen/Qwen3-30B-A3B",
    "mistralai/Mistral-Nemo-Instruct-2407",
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
