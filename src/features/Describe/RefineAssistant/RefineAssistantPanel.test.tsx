// xiao1009 Tests for the RefineAD panel. Mock set-up follows InsertPublish.test.tsx:6-13: axios is
// mocked wholesale and the css import is mocked virtually, so nothing touches the network or a real
// stylesheet.
import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import axios from 'axios'
import RefineAssistantPanel from './RefineAssistantPanel'
import { REFINE_PRESETS } from './refinePresets'

jest.mock('axios')
jest.mock('@/assets/css/refineAssistant.css', () => ({}), { virtual: true })

const mockedAxios = axios as jest.Mocked<typeof axios>

const AD_ID = '650506db3ff1c2140ea10ec1'
const CLIP_ID = '650506db3ff1c2140ea10ec2'
const CURRENT_TEXT = 'She very carefully tips the plant out of its pot.'

const suggestionResponse = (overrides: Record<string, unknown> = {}) => ({
  data: {
    requestId: 'req-1',
    model: 'gpt-4o-mini',
    suggestions: [
      {
        clipId: CLIP_ID,
        original: CURRENT_TEXT,
        suggestion: 'She tips the plant out of its pot.',
        unchanged: false,
        ...overrides,
      },
    ],
  },
})

const renderPanel = () => {
  const onAccept = jest.fn()
  const onClose = jest.fn()
  const onFocusTrigger = jest.fn()
  const result = render(
    <RefineAssistantPanel
      audioDescriptionId={AD_ID}
      clipId={CLIP_ID}
      currentText={CURRENT_TEXT}
      onAccept={onAccept}
      onClose={onClose}
      onFocusTrigger={onFocusTrigger}
    />,
  )
  return { ...result, onAccept, onClose, onFocusTrigger }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('RefineAssistantPanel — preset buttons', () => {
  it('renders one button per preset, generated from the list', () => {
    renderPanel()

    REFINE_PRESETS.forEach((preset) => {
      expect(screen.getByRole('button', { name: preset.label })).toBeTruthy()
    })
    // every preset label is on screen, and nothing extra was hand-written
    const presetButtons = screen
      .getAllByRole('button')
      .filter((button) =>
        REFINE_PRESETS.some((preset) => preset.label === button.textContent),
      )
    expect(presetButtons).toHaveLength(REFINE_PRESETS.length)
  })

  it('describes every preset to screen readers, not only on hover', () => {
    renderPanel()

    REFINE_PRESETS.forEach((preset) => {
      const button = screen.getByRole('button', { name: preset.label })
      const descriptionId = button.getAttribute('aria-describedby') as string
      expect(document.getElementById(descriptionId)?.textContent).toBe(
        preset.description,
      )
    })
  })

  it('renders one labelled row per group, in order', () => {
    renderPanel()

    const rows = screen
      .getAllByRole('group')
      .filter((group) => group.getAttribute('aria-labelledby'))
    expect(
      rows.map(
        (row) =>
          row.querySelector('.refine-assistant__group-label')?.textContent,
      ),
    ).toEqual(['Refine text', 'Style (optional)', 'Check timing'])
    expect(
      screen
        .getByRole('group', { name: 'Refine text' })
        .contains(screen.getByRole('button', { name: 'Add details' })),
    ).toBe(true)
    expect(
      screen
        .getByRole('group', { name: 'Check timing' })
        .contains(screen.getByRole('button', { name: 'Fix timing' })),
    ).toBe(true)
  })

  it('puts the Style options in their own labelled group', () => {
    renderPanel()

    const styleGroup = screen.getByRole('group', { name: 'Style (optional)' })
    REFINE_PRESETS.filter((preset) => preset.group === 'style').forEach(
      (preset) => {
        expect(
          styleGroup.contains(
            screen.getByRole('button', { name: preset.label }),
          ),
        ).toBe(true)
      },
    )
    expect(
      styleGroup.contains(screen.getByRole('button', { name: 'Polish' })),
    ).toBe(false)
  })

  it('gives every control type="button" so none of them submits a form', () => {
    renderPanel()

    screen.getAllByRole('button').forEach((button) => {
      expect(button.getAttribute('type')).toBe('button')
    })
  })

  it('posts the clip and the preset id to the refine endpoint', async () => {
    mockedAxios.post.mockResolvedValue(suggestionResponse())
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Polish' }))

    await waitFor(() => expect(mockedAxios.post).toHaveBeenCalledTimes(1))
    const [url, body] = mockedAxios.post.mock.calls[0]
    expect(url).toContain('/refine/suggest')
    expect(body).toEqual({
      audioDescriptionId: AD_ID,
      clips: [{ clipId: CLIP_ID, currentText: CURRENT_TEXT }],
      presetId: 'polish',
      instruction: undefined,
    })
  })
})

describe('RefineAssistantPanel — Add details', () => {
  it('asks for the details instead of sending when the box is empty', () => {
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Add details' }))

    expect(mockedAxios.post).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toMatch(/type the details/i)
    expect(document.activeElement).toBe(
      screen.getByLabelText('Or tell the AI what to change'),
    )
  })

  it('sends the typed details along with the preset', async () => {
    mockedAxios.post.mockResolvedValue(suggestionResponse())
    renderPanel()

    fireEvent.change(screen.getByLabelText('Or tell the AI what to change'), {
      target: { value: '  the pot is terracotta  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add details' }))

    await waitFor(() => expect(mockedAxios.post).toHaveBeenCalledTimes(1))
    expect(mockedAxios.post.mock.calls[0][1]).toMatchObject({
      presetId: 'add-details',
      instruction: 'the pot is terracotta',
    })
  })
})

describe('RefineAssistantPanel — Fix timing', () => {
  it('shows the reason and the suggested change, and accepting only hands over the text', async () => {
    mockedAxios.post.mockResolvedValue(
      suggestionResponse({
        suggestion: CURRENT_TEXT,
        unchanged: true,
        timing: { estimatedSeconds: 4, availableSeconds: 1 },
        timingChange: { startTime: 12.5 },
        reason: 'Too long for the gap.',
      }),
    )
    const { onAccept } = renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Fix timing' }))

    await waitFor(() =>
      expect(screen.getByText('Too long for the gap.')).toBeTruthy(),
    )
    expect(mockedAxios.post.mock.calls[0][1]).toMatchObject({
      presetId: 'fix-timing',
    })
    expect(screen.getByText(/Suggested start time: 12.50 s/)).toBeTruthy()
    expect(screen.getByText(/text unchanged/)).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe(
      'Timing suggestion ready',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Accept suggestion' }))

    expect(onAccept).toHaveBeenCalledWith(CURRENT_TEXT)
    expect(screen.getByRole('status').textContent).toMatch(
      /apply the suggested timing change/i,
    )
  })
})

describe('RefineAssistantPanel — too short for a Style option', () => {
  it('shows the reason as a note and in the status', async () => {
    const reason =
      'The description is too short for a style change: there is nothing to rearrange.'
    mockedAxios.post.mockResolvedValue(
      suggestionResponse({ suggestion: CURRENT_TEXT, unchanged: true, reason }),
    )
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Character focus' }))

    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe(reason),
    )
    expect(screen.getByText('Note')).toBeTruthy()
    expect(screen.queryByText('Timing')).toBeNull()
  })
})

describe('RefineAssistantPanel — free text', () => {
  it('keeps Send disabled until the box has non-blank text', () => {
    renderPanel()
    const send = screen.getByRole('button', {
      name: 'Send',
    }) as HTMLButtonElement

    expect(send.disabled).toBe(true)

    fireEvent.change(screen.getByLabelText('Or tell the AI what to change'), {
      target: { value: '   ' },
    })
    expect(send.disabled).toBe(true)

    fireEvent.change(screen.getByLabelText('Or tell the AI what to change'), {
      target: { value: 'shorter please' },
    })
    expect(send.disabled).toBe(false)
  })

  it('sends a trimmed instruction with no presetId', async () => {
    mockedAxios.post.mockResolvedValue(suggestionResponse())
    renderPanel()

    fireEvent.change(screen.getByLabelText('Or tell the AI what to change'), {
      target: { value: '  make it less robotic  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => expect(mockedAxios.post).toHaveBeenCalledTimes(1))
    expect(mockedAxios.post.mock.calls[0][1]).toMatchObject({
      presetId: undefined,
      instruction: 'make it less robotic',
    })
  })
})

describe('RefineAssistantPanel — showing a suggestion', () => {
  it('shows the current text and the suggestion, and announces that it is ready', async () => {
    mockedAxios.post.mockResolvedValue(suggestionResponse())
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Polish' }))

    await waitFor(() =>
      expect(
        screen.getByText('She tips the plant out of its pot.'),
      ).toBeTruthy(),
    )
    expect(screen.getByText(CURRENT_TEXT)).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe('Suggestion ready')
  })

  it('moves focus to Accept once the suggestion renders', async () => {
    mockedAxios.post.mockResolvedValue(suggestionResponse())
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Polish' }))

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Accept suggestion' }),
      ).toBeTruthy(),
    )
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Accept suggestion' }),
    )
  })

  it('says so when the AI returned the description unchanged', async () => {
    mockedAxios.post.mockResolvedValue(
      suggestionResponse({ suggestion: CURRENT_TEXT, unchanged: true }),
    )
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Make concise' }))

    await waitFor(() =>
      expect(screen.getByText(/no changes needed/)).toBeTruthy(),
    )
    expect(screen.getByRole('status').textContent).toMatch(/no changes needed/i)
  })

  it('hides the preset buttons while a suggestion is on screen', async () => {
    mockedAxios.post.mockResolvedValue(suggestionResponse())
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Polish' }))

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Accept suggestion' }),
      ).toBeTruthy(),
    )
    expect(screen.queryByRole('button', { name: 'Polish' })).toBeNull()
  })
})

describe('RefineAssistantPanel — accept, reject, try again', () => {
  const showSuggestion = async () => {
    mockedAxios.post.mockResolvedValue(suggestionResponse())
    const handles = renderPanel()
    fireEvent.click(screen.getByRole('button', { name: 'Polish' }))
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Accept suggestion' }),
      ).toBeTruthy(),
    )
    return handles
  }

  it('hands the suggestion text to onAccept and gives focus back to the trigger', async () => {
    const { onAccept, onFocusTrigger } = await showSuggestion()

    fireEvent.click(screen.getByRole('button', { name: 'Accept suggestion' }))

    expect(onAccept).toHaveBeenCalledWith('She tips the plant out of its pot.')
    expect(onFocusTrigger).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('status').textContent).toMatch(/inserted/i)
  })

  it('clears the suggestion on reject without accepting anything', async () => {
    const { onAccept, onFocusTrigger } = await showSuggestion()

    fireEvent.click(screen.getByRole('button', { name: 'Reject suggestion' }))

    expect(onAccept).not.toHaveBeenCalled()
    expect(onFocusTrigger).toHaveBeenCalledTimes(1)
    expect(
      screen.queryByRole('button', { name: 'Accept suggestion' }),
    ).toBeNull()
    expect(screen.getByRole('button', { name: 'Polish' })).toBeTruthy()
    expect(screen.getByRole('status').textContent).toMatch(/discarded/i)
  })

  it('repeats the same request on try again', async () => {
    await showSuggestion()

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    await waitFor(() => expect(mockedAxios.post).toHaveBeenCalledTimes(2))
    expect(mockedAxios.post.mock.calls[1][1]).toMatchObject({
      presetId: 'polish',
    })
  })
})

describe('RefineAssistantPanel — errors', () => {
  it('puts the backend message in the alert region', async () => {
    mockedAxios.post.mockRejectedValue({
      response: {
        status: 503,
        data: { message: 'AI service timed out, please try again' },
      },
    })
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Polish' }))

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe(
        'AI service timed out, please try again',
      ),
    )
    expect(
      screen.queryByRole('button', { name: 'Accept suggestion' }),
    ).toBeNull()
  })

  it('falls back to a readable message when the backend sent none', async () => {
    mockedAxios.post.mockRejectedValue({ message: 'Network Error' })
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Polish' }))

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toMatch(
        /please try again/i,
      ),
    )
  })

  it('explains an expired session rather than showing the raw 401 message', async () => {
    mockedAxios.post.mockRejectedValue({
      response: { status: 401, data: { message: 'Authentication required' } },
    })
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Polish' }))

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toMatch(
        /session has expired/i,
      ),
    )
  })

  it('treats a 200 with no suggestions as an error', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { requestId: 'r', model: 'gpt-4o-mini', suggestions: [] },
    })
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Polish' }))

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toMatch(/did not return/i),
    )
  })

  it('leaves both live regions mounted and empty before anything happens', () => {
    renderPanel()

    expect(screen.getByRole('status').textContent).toBe('')
    expect(screen.getByRole('alert').textContent).toBe('')
  })
})

describe('RefineAssistantPanel — keyboard', () => {
  // xiao1009 Escape is handled on the panel element, so it only fires while focus is inside the
  // panel. This is what makes Escape work the moment the panel opens.
  it('puts focus on the first preset as soon as it opens', () => {
    renderPanel()

    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: REFINE_PRESETS[0].label }),
    )
  })

  it('closes on Escape pressed from where focus actually lands', () => {
    const { onClose } = renderPanel()

    fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape', () => {
    const { onClose } = renderPanel()

    fireEvent.keyDown(screen.getByRole('group', { name: 'AI Assistant' }), {
      key: 'Escape',
    })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ignores other keys', () => {
    const { onClose } = renderPanel()

    fireEvent.keyDown(screen.getByRole('group', { name: 'AI Assistant' }), {
      key: 'a',
    })

    expect(onClose).not.toHaveBeenCalled()
  })

  it('disables the preset buttons while a request is in flight', async () => {
    let resolveRequest: (value: unknown) => void = () => undefined
    mockedAxios.post.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve
      }) as any,
    )
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Polish' }))

    await waitFor(() =>
      expect(
        (screen.getByRole('button', { name: 'Polish' }) as HTMLButtonElement)
          .disabled,
      ).toBe(true),
    )
    expect(screen.getByRole('status').textContent).toMatch(/working/i)

    resolveRequest(suggestionResponse())
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Accept suggestion' }),
      ).toBeTruthy(),
    )
  })
})
