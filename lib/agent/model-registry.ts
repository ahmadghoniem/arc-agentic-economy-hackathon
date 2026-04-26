export type ProviderId = "gemini" | "featherless" | "aivml"

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
  const geminiModels = parseModelList(process.env.GEMINI_MODEL, ["gemini-2.5-flash", "gemini-2.0-flash"])
  const featherlessModels = parseModelList(process.env.FEATHERLESS_MODEL, ["qwen3.5-plus", "claude-haiku-4-5", "nemotron-super-free"])
  const aivmlModels = parseModelList(process.env.AIVML_MODEL, ["gpt-4o-mini", "mistral-small"])

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

  for (const model of aivmlModels) {
    registry.push({
      provider: "aivml",
      id: model,
      label: model,
      enabled: Boolean(process.env.AIVML_API_KEY) && Boolean(process.env.AIVML_BASE_URL),
      requiresEnv: "AIVML_API_KEY,AIVML_BASE_URL",
    })
  }

  return registry
}

export function pickDefaultModel(provider: ProviderId): string {
  const registry = getModelRegistry().filter((entry) => entry.provider === provider)
  return registry[0]?.id ?? ""
}

export function inferProviderFromModel(model: string): ProviderId | null {
  const found = getModelRegistry().find((entry) => entry.id === model)
  return found?.provider ?? null
}

export function getProviderAvailability() {
  return {
    gemini: Boolean(process.env.GEMINI_API_KEY),
    featherless: Boolean(process.env.FEATHERLESS_API_KEY),
    aivml: Boolean(process.env.AIVML_API_KEY) && Boolean(process.env.AIVML_BASE_URL),
  }
}