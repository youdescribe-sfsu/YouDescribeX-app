import { Howl, Howler } from 'howler'

// Description Volume slider is 0-300. Values in 0-100 map to Howler's built-in
// per-clip volume (0.0-1.0); values 100-300 hold Howler at 1.0 and drive a
// Web Audio GainNode from 1.0 up to 3.0 to amplify quiet recordings.
export const DESCRIPTION_VOLUME_MAX = 300
export const DESCRIPTION_VOLUME_UNITY = 100

export const howlerVolumeFor = (slider: number): number =>
  Math.min(Math.max(slider, 0), DESCRIPTION_VOLUME_UNITY) /
  DESCRIPTION_VOLUME_UNITY

export const amplificationFor = (slider: number): number =>
  Math.max(slider, DESCRIPTION_VOLUME_UNITY) / DESCRIPTION_VOLUME_UNITY

let audioContext: AudioContext | null = null
let ampGain: GainNode | null = null
const attached = new WeakSet<HTMLMediaElement>()

// Howler's html5 audio pool creates plain `new Audio()` elements without
// setting crossOrigin. Once we route an element through a MediaElementSource,
// its output would be silenced by CORS on cross-origin sources unless
// crossOrigin was set BEFORE the src was assigned. Patch _obtainHtml5Audio
// at import time so every audio element leaves the pool with
// crossOrigin='anonymous' — this must run before any Howl is created.
const anyHowler = (Howler ?? {}) as unknown as {
  _obtainHtml5Audio?: () => HTMLAudioElement
}
const originalObtain = anyHowler._obtainHtml5Audio
if (typeof originalObtain === 'function') {
  anyHowler._obtainHtml5Audio = function (...args: unknown[]) {
    const node = (
      originalObtain as unknown as (...a: unknown[]) => HTMLAudioElement
    ).apply(this, args)
    if (node && !node.crossOrigin) node.crossOrigin = 'anonymous'
    return node
  }
}

const ensureContext = (): { ctx: AudioContext; gain: GainNode } | null => {
  if (audioContext && ampGain) return { ctx: audioContext, gain: ampGain }
  const AC =
    (typeof window !== 'undefined' &&
      (window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext)) ||
    null
  if (!AC) return null
  try {
    audioContext = new AC()
    ampGain = audioContext.createGain()
    ampGain.gain.value = 1
    ampGain.connect(audioContext.destination)
    return { ctx: audioContext, gain: ampGain }
  } catch {
    return null
  }
}

export const setDescriptionAmplification = (sliderValue: number): void => {
  const ready = ensureContext()
  if (!ready) return
  const target = amplificationFor(sliderValue)
  try {
    ready.gain.gain.setTargetAtTime(target, ready.ctx.currentTime, 0.015)
  } catch {
    ready.gain.gain.value = target
  }
}

const wireElement = (
  ctx: AudioContext,
  gain: GainNode,
  node: HTMLMediaElement,
): void => {
  if (attached.has(node)) return
  const audioNode = node as HTMLAudioElement
  if (!audioNode.crossOrigin) {
    audioNode.crossOrigin = 'anonymous'
  }
  try {
    const source = ctx.createMediaElementSource(node)
    source.connect(gain)
    attached.add(node)
  } catch {
    // createMediaElementSource can throw if this element was already
    // attached to a different context. Fall back to native playback
    // (no amplification for this element); .volume still works.
  }
}

// Attach the underlying HTMLAudioElement of a Howl instance to the shared
// gain node. Safe to call repeatedly; each element is wired at most once.
export const attachHowlToGain = (howl: Howl): void => {
  const ready = ensureContext()
  if (!ready) return
  if (ready.ctx.state === 'suspended') {
    ready.ctx.resume().catch(() => undefined)
  }
  const sounds = (
    howl as unknown as { _sounds?: Array<{ _node?: HTMLMediaElement }> }
  )._sounds
  if (!sounds || !sounds.length) return
  for (const sound of sounds) {
    const node = sound?._node
    if (!node) continue
    wireElement(ready.ctx, ready.gain, node)
  }
}

// Attach a raw HTMLMediaElement (e.g. an edit-panel preview created with
// `new Audio(...)`) to the shared gain node.
export const attachAudioElementToGain = (
  node: HTMLMediaElement | null | undefined,
): void => {
  if (!node) return
  const ready = ensureContext()
  if (!ready) return
  if (ready.ctx.state === 'suspended') {
    ready.ctx.resume().catch(() => undefined)
  }
  wireElement(ready.ctx, ready.gain, node)
}
