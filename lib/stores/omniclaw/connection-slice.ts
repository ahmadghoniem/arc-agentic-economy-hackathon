import { fetchJson } from "./api"
import type { ConnectionSlice, OmniClawSliceCreator } from "./types"

export const createConnectionSlice: OmniClawSliceCreator<ConnectionSlice> = (
  set
) => ({
  connection: {
    health: null,
    status: "idle",
    error: null,
  },

  async refreshConnection() {
    set((state) => ({
      connection: { ...state.connection, status: "loading", error: null },
    }))

    try {
      const health = await fetchJson("/api/omniclaw/health")
      set({ connection: { health, status: "success", error: null } })
    } catch (error) {
      set((state) => ({
        connection: {
          ...state.connection,
          status: "error",
          error: String(error),
        },
      }))
    }
  },
})
