"use client"

import * as React from "react"

import { createInitialSteps } from "@/components/chat/demo-data"
import type { TraceStep } from "@/components/chat/types"
import {
  CHAT_STORAGE_KEYS,
  loadFromStorage,
  saveToStorage,
} from "@/lib/storage/chat-storage"

/**
 * Applies a patch to the matching step. When the subtitle changes we also
 * append it to `activityLog` so the dropdown shows a history of what happened
 * during that step. If `activityLog` is provided explicitly in the patch we
 * trust the caller and use it as-is (escape hatch for streaming UIs).
 */
export function updateStep(
  steps: TraceStep[],
  id: number,
  patch: Partial<TraceStep>
): TraceStep[] {
  return steps.map((step) => {
    if (step.id !== id) return step
    const subtitle = patch.subtitle ?? step.subtitle
    const shouldAppendActivity =
      patch.subtitle !== undefined && patch.subtitle !== step.subtitle
    return {
      ...step,
      ...patch,
      activityLog: shouldAppendActivity
        ? [...step.activityLog, subtitle]
        : (patch.activityLog ?? step.activityLog),
    }
  })
}

export type PatchStep = (id: number, patch: Partial<TraceStep>) => void

/**
 * useTraceSteps
 *
 * Owns the trace-step state, a stale-run guard (`runIdRef`) so that
 * abandoned runs can't write into newer ones, and a `patch()` helper that
 * silently no-ops when the run id changes.
 *
 * Returned `withRun()` lets a caller stake out a fresh run id and receive
 * a scoped patch function.
 */
export function useTraceSteps() {
  const [steps, setSteps] = React.useState<TraceStep[]>(() =>
    loadFromStorage(CHAT_STORAGE_KEYS.steps, createInitialSteps())
  )
  const runIdRef = React.useRef(0)

  React.useEffect(() => {
    saveToStorage(CHAT_STORAGE_KEYS.steps, steps)
  }, [steps])

  // Bump runId on unmount so any in-flight async work bails out.
  React.useEffect(() => {
    return () => {
      runIdRef.current += 1
    }
  }, [])

  const resetSteps = React.useCallback(() => {
    setSteps(createInitialSteps())
  }, [])

  /**
   * Stakes out a new run id. Returns the id plus a `patch` helper that only
   * mutates state when the run is still current. Use `isCurrent()` after each
   * `await` to early-return abandoned runs cleanly.
   */
  const withRun = React.useCallback(() => {
    const runId = runIdRef.current + 1
    runIdRef.current = runId
    const patch: PatchStep = (id, p) => {
      if (runIdRef.current === runId)
        setSteps((curr) => updateStep(curr, id, p))
    }
    const isCurrent = () => runIdRef.current === runId
    return { runId, patch, isCurrent }
  }, [])

  /**
   * Patch a step without staking out a new run. Used for one-off updates
   * (e.g. cancel actions) where there's no async work to guard.
   */
  const patchOnce = React.useCallback(
    (id: number, p: Partial<TraceStep>) => {
      setSteps((curr) => updateStep(curr, id, p))
    },
    []
  )

  return { steps, setSteps, resetSteps, withRun, patchOnce, runIdRef }
}
