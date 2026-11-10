// xiao1009 The preset buttons the panel renders. Only id, label and the UI-facing text live here: the
// full instruction text stays on the backend (api/src/prompts/refinePresets.ts), so wording can be
// changed without releasing the frontend.
//
// The ids and the labels below are copied from that file and must match it exactly. The backend
// answers 400 with the list of valid ids if they ever drift apart.
//
// Leijie `description` is the preview shown on hover and keyboard focus, and read by screen readers
// through aria-describedby (option A in refinead-button-pipeline.md section 2). When a prompt changes
// on the backend, check that its description here still says what the button does.
import { RefinePresetId } from '@/shared/types/refine'

export type RefinePresetGroup = 'refine' | 'style' | 'timing'

// Leijie One labelled row per group, in this order. The panel renders a row only if it has presets.
export const REFINE_PRESET_GROUPS: { id: RefinePresetGroup; label: string }[] =
  [
    { id: 'refine', label: 'Refine text' },
    { id: 'style', label: 'Style (optional)' },
    { id: 'timing', label: 'Check timing' },
  ]

export interface RefinePresetButton {
  id: RefinePresetId
  label: string
  description: string
  group: RefinePresetGroup
  // Leijie Sends the free-text box along with the preset, and refuses to send when the box is empty.
  needsInstruction?: boolean
}

// xiao1009 The panel renders this array in a loop, so adding a preset is one entry here plus one
// entry in the backend file. Order is the order the buttons appear in.
export const REFINE_PRESETS: RefinePresetButton[] = [
  {
    id: 'make-concise',
    label: 'Make concise',
    description:
      'Cut extra details and only keep who, what happens, and key on-screen text.',
    group: 'refine',
  },
  {
    id: 'polish',
    label: 'Polish',
    description:
      'Rewrites sentences in a natural way, and fixes grammar. Keeps all information and technical terms.',
    group: 'refine',
  },
  // Leijie Text-only for now: the describer types the details, the AI works them in.
  {
    id: 'add-details',
    label: 'Add details',
    description:
      'Type the details you want added in the box below, then press Add details.',
    group: 'refine',
    needsInstruction: true,
  },
  // Leijie refinead-button-pipeline.md section 6.5. Its timing suggestion is shown, never applied.
  {
    id: 'fix-timing',
    label: 'Fix timing',
    description:
      'Makes the description fit before the next dialogue: shortens it, suggests a better start time, or suggests pausing the video for it.',
    group: 'timing',
  },
  {
    id: 'style-character-focus',
    label: 'Character focus',
    description:
      'Puts the people first: who they are, their expressions, and their reactions. (conversations with several people)',
    group: 'style',
  },
  {
    id: 'style-action-focus',
    label: 'Action focus',
    description:
      'Puts the action first, in the order it happens. (cooking, crafts, DIY, and sports)',
    group: 'style',
  },
  {
    id: 'style-environment-focus',
    label: 'Environment focus',
    description:
      'Puts the setting first: the place, time, lighting, and where things are. (travel, home tours, and nature documentaries)',
    group: 'style',
  },
  {
    id: 'style-simple-language',
    label: 'Simple words',
    description:
      'Uses everyday words and short sentences. Explains technical terms instead of removing them.(children content and beginner lessons)',
    group: 'style',
  },
]
