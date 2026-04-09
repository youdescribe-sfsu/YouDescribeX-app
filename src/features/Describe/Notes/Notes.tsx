import axios from 'axios'
import React, { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import '@/assets/css/editAudioDesc.css'
import '@/assets/css/notes.css'
import { debounce } from 'debounce'
import { Clip } from '@/shared/utils/convertClipObject'

interface Props {
  currentTime: string
  audioDescriptionId: string
  notesData: any
  handleVideoPause: () => void
  userId?: string
  youtubeVideoId?: string
  existingClips?: Clip[]
  setShowSpinner?: React.Dispatch<React.SetStateAction<boolean>>
  onClipsImported?: () => void
}

interface ParsedNote {
  id: string
  timeLabel: string
  seconds: number
  text: string
}

const NOTE_TIMESTAMP_REGEX = /^(\d{2}):(\d{2}):(\d{2})(?::(\d{2}))?\s*-\s*(.+)$/

const parseTimestampToSeconds = (
  hours: string,
  minutes: string,
  seconds: string,
  centiseconds?: string,
) => {
  return (
    Number(hours) * 3600 +
    Number(minutes) * 60 +
    Number(seconds) +
    Number(centiseconds || '0') / 100
  )
}

const normalizeText = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLowerCase()

const buildClipTitle = (noteText: string) => {
  const trimmed = noteText.trim()
  if (!trimmed) return 'Imported Note'
  return trimmed.length > 40 ? `${trimmed.slice(0, 37)}...` : trimmed
}

const buildTimestampPrefix = (timeLabel: string) => `${timeLabel} - `

const Notes = ({
  currentTime,
  audioDescriptionId,
  notesData,
  handleVideoPause,
  userId = '',
  youtubeVideoId = '',
  existingClips = [],
  setShowSpinner,
  onClipsImported,
}: Props) => {
  // React State Variables
  const [noteValue, setNoteValue] = useState('') // to store Notes text
  const [noteId, setNoteId] = useState('') // to store Note Id - for POST requests later
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [noteDetails, setNoteDetails] = useState<any[]>([]) // to store Notes Details
  const [importingKey, setImportingKey] = useState('')

  // for focus event of Notes Textarea -> if the notes is empty, timestamp is inserted
  const handleTextAreaFocus = () => {
    if (!noteValue) {
      const nextValue = buildTimestampPrefix(currentTime)
      setNoteValue(nextValue)
      handleNoteAutoSave(nextValue)
    }
  }

  const handleNoteChange = (e: any) => {
    handleVideoPause()
    const updatedNoteValue = e.target.value
    setNoteValue(updatedNoteValue)
    debouncedHandleNoteAutoSave(updatedNoteValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter') return

    e.preventDefault()

    const textarea = e.currentTarget
    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    const currentText = String(noteValue || '')
    const timestampPrefix = buildTimestampPrefix(currentTime)
    const insertedValue =
      currentText.slice(0, selectionStart) +
      `\n${timestampPrefix}` +
      currentText.slice(selectionEnd)

    setNoteValue(insertedValue)
    debouncedHandleNoteAutoSave(insertedValue)

    window.requestAnimationFrame(() => {
      const nextCursorPosition = selectionStart + 1 + timestampPrefix.length
      textarea.selectionStart = nextCursorPosition
      textarea.selectionEnd = nextCursorPosition
    })
  }

  const handleNoteAutoSave = (currentNoteValue: any) => {
    axios
      .post(`${process.env.REACT_APP_YDX_BACKEND_URL}/api/notes/post-note`, {
        noteId: noteId,
        notes: currentNoteValue,
        adId: audioDescriptionId,
      })
      .then((res) => {
        setNoteId(res.data.notes_id) // setting this in the case of inserting new note
      })
      .catch((err) => {
        console.error(err.response.data)
        toast.error('Error Saving Note! Please Try Again...')
      })
  }

  const debouncedHandleNoteAutoSave = useMemo(
    () => debounce(handleNoteAutoSave, 2000),
    [noteId, audioDescriptionId],
  )

  const parsedNotes = useMemo<ParsedNote[]>(() => {
    return String(noteValue || '')
      .split(/\r?\n/)
      .map((line, index) => {
        const trimmedLine = line.trim()
        if (!trimmedLine) return null

        const match = trimmedLine.match(NOTE_TIMESTAMP_REGEX)
        if (!match) return null

        const [, hours, minutes, seconds, centiseconds, noteText] = match
        return {
          id: `${index}-${hours}-${minutes}-${seconds}-${centiseconds || '00'}`,
          timeLabel: `${hours}:${minutes}:${seconds}${
            centiseconds ? `:${centiseconds}` : ''
          }`,
          seconds: parseTimestampToSeconds(
            hours,
            minutes,
            seconds,
            centiseconds,
          ),
          text: noteText.trim(),
        }
      })
      .filter((note): note is ParsedNote => !!note && !!note.text)
  }, [noteValue])

  const existingClipKeys = useMemo(() => {
    const keys = new Set<string>()
    existingClips.forEach((clip) => {
      const normalizedDescription = normalizeText(clip.description_text || '')
      if (!normalizedDescription) return

      const roundedStart = clip.clip_start_time.toFixed(2)
      keys.add(`inline:${roundedStart}:${normalizedDescription}`)
      keys.add(`extended:${roundedStart}:${normalizedDescription}`)
      keys.add(`${clip.playback_type}:${roundedStart}:${normalizedDescription}`)
    })
    return keys
  }, [existingClips])

  const isImported = (note: ParsedNote, playbackType: 'inline' | 'extended') =>
    existingClipKeys.has(
      `${playbackType}:${note.seconds.toFixed(2)}:${normalizeText(note.text)}`,
    )

  const handleImportNote = async (
    note: ParsedNote,
    playbackType: 'inline' | 'extended',
  ) => {
    if (!audioDescriptionId || !youtubeVideoId || !userId) {
      toast.error('Missing editor context for note import.')
      return
    }

    const formData = new FormData()
    formData.append('newACTitle', buildClipTitle(note.text))
    formData.append('newACType', 'Visual')
    formData.append('newACPlaybackType', playbackType)
    formData.append('newACStartTime', String(note.seconds))
    formData.append('isRecorded', 'false')
    formData.append('youtubeVideoId', youtubeVideoId)
    formData.append('userId', userId)
    formData.append('newACDescriptionText', note.text)

    const importKey = `${note.id}-${playbackType}`
    setImportingKey(importKey)
    setShowSpinner?.(true)

    try {
      await axios.post(
        `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/add-new-clip/${audioDescriptionId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      toast.success(`Imported note as ${playbackType} clip`)
      window.dispatchEvent(new Event('ydx:new-clip-saved'))
      onClipsImported?.()
    } catch (error) {
      console.error(error)
      toast.error(`Failed to import note as ${playbackType} clip.`)
    } finally {
      setImportingKey('')
      setShowSpinner?.(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleNoteHighlight = () => {
    const noteList = String(noteValue || '').split(/\r?\n/)
    const tempNoteDetails: any[] = []
    noteList.forEach((note, key) => {
      if (note.slice(0, 8).match(/\d{2}:\d{2}:\d{2}/)) {
        const noteTimestamp = {
          id: key,
          note: note.slice(11), // assuming user wouldn't mess with the format of the note text
          time: note.slice(0, 8),
        }
        tempNoteDetails.push(noteTimestamp)
        // console.log(tempNoteDetails)
        setNoteDetails(tempNoteDetails)
      }
    })
  }

  useEffect(() => {
    // If there is an notes entry in db
    if (
      notesData &&
      typeof notesData === 'object' &&
      'notes_text' in notesData
    ) {
      // inserting notes_text into the note value
      setNoteValue(String(notesData.notes_text || ''))
      setNoteId(String(notesData.notes_id || ''))
    } else {
      // else insert empty strings - somehow, useState('') is not working
      setNoteValue('')
      setNoteId('')
    }
  }, [notesData])

  const canImportNotes =
    !!audioDescriptionId && !!youtubeVideoId && !!userId && !!onClipsImported

  return (
    <div className="notes-bg rounded">
      <div className="d-flex justify-content-between align-items-center pt-1 px-3 notes-label">
        <h6 className="text-white">Notes:</h6>
        <span className="notes-summary">
          {parsedNotes.length} reusable{' '}
          {parsedNotes.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>
      <div className="notes-helper-copy">
        One line = one note. Press Enter to start a new timestamped note.
      </div>
      <div className="mx-auto my-auto notes-textarea-div align-items-center border rounded">
        <textarea
          className="form-control border rounded notes-textarea"
          rows={9}
          id="notes"
          name="notes"
          placeholder="Start taking your Notes.."
          onFocus={handleTextAreaFocus}
          onKeyDown={handleKeyDown}
          onChange={handleNoteChange}
          value={noteValue}
        ></textarea>
      </div>
      <div className="notes-import-panel">
        <div className="notes-import-header">
          <span>Convert Notes to Clips</span>
          <span className="notes-import-subtitle">
            Review saved notes and turn each one into inline or extended audio
          </span>
        </div>
        <div className="notes-import-list">
          {parsedNotes.length === 0 ? (
            <div className="notes-empty-state">
              Add timestamped notes first, then you can import them into clips
              here.
            </div>
          ) : !canImportNotes ? (
            <div className="notes-empty-state">
              Notes are available here, but note-to-clip import is only enabled
              in the editor view.
            </div>
          ) : (
            parsedNotes.map((note) => {
              const inlineImported = isImported(note, 'inline')
              const extendedImported = isImported(note, 'extended')

              return (
                <div className="notes-import-row" key={note.id}>
                  <div className="notes-import-copy">
                    <div className="notes-import-time">{note.timeLabel}</div>
                    <div className="notes-import-text">{note.text}</div>
                  </div>
                  <div className="notes-import-status-row">
                    <span
                      className={`notes-status-badge ${
                        inlineImported ? 'is-added' : 'is-pending'
                      }`}
                    >
                      Inline {inlineImported ? 'added' : 'not added'}
                    </span>
                    <span
                      className={`notes-status-badge ${
                        extendedImported ? 'is-added' : 'is-pending'
                      }`}
                    >
                      Extended {extendedImported ? 'added' : 'not added'}
                    </span>
                  </div>
                  <div className="notes-import-actions">
                    {!inlineImported && (
                      <button
                        type="button"
                        className="notes-import-btn inline"
                        disabled={importingKey === `${note.id}-inline`}
                        onClick={() => handleImportNote(note, 'inline')}
                      >
                        Add Inline
                      </button>
                    )}
                    {!extendedImported && (
                      <button
                        type="button"
                        className="notes-import-btn extended"
                        disabled={importingKey === `${note.id}-extended`}
                        onClick={() => handleImportNote(note, 'extended')}
                      >
                        Add Extended
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default Notes
