// xiao1009 Request and response types for POST /api/refine/suggest (RefineAD).
// These mirror api/src/dtos/refine.dto.ts field for field. If the backend contract changes, change
// both files in the same PR.

// xiao1009 Must stay identical to REFINE_PRESETS in api/src/prompts/refinePresets.ts: the frontend
// only ever sends the id, and the backend answers 400 for one it does not know.
export type RefinePresetId =
  | 'make-concise'
  | 'polish'
  | 'add-details'
  | 'fix-timing'
  | 'style-character-focus'
  | 'style-action-focus'
  | 'style-environment-focus'
  | 'style-simple-language'

export interface RefineClipInput {
  clipId: string
  currentText: string
}

// xiao1009 v1 sends exactly one clip; the backend rejects anything else with 400. presetId and
// instruction are each optional, but at least one of them has to be present.
export interface RefineSuggestRequest {
  audioDescriptionId: string
  clips: RefineClipInput[]
  presetId?: RefinePresetId
  instruction?: string
}

// Leijie `unchanged` is true when the AI returned the description as it was: a valid answer meaning
// "no change needed", not an error.
export interface RefineSuggestion {
  clipId: string
  original: string
  suggestion: string
  unchanged: boolean
  // Leijie Fix timing only. timingChange is a suggestion the describer applies in the editor.
  // reason also comes with a Style option skipped because the description is too short.
  timing?: RefineTiming
  timingChange?: RefineTimingChange
  reason?: string
}

export interface RefineTiming {
  estimatedSeconds: number
  availableSeconds?: number
}

export interface RefineTimingChange {
  startTime?: number
  track?: 'inline' | 'extended'
}

export interface RefineSuggestResponse {
  requestId: string
  model: string
  suggestions: RefineSuggestion[]
}

// xiao1009 Every backend failure answers with this shape, from error.middleware.ts.
export interface RefineErrorResponse {
  message: string
}
