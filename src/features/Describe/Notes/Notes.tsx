import axios from 'axios'
import React, { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import '@/assets/css/editAudioDesc.css'
import '@/assets/css/notes.css'
import { debounce } from 'debounce'
import { Clip } from '@/shared/utils/convertClipObject'
import Modal from 'react-bootstrap/Modal'

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
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([])
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

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

  const importSingleNote = async (
    note: ParsedNote,
    playbackType: 'inline' | 'extended',
    options?: {
      silent?: boolean
      skipExisting?: boolean
    },
  ) => {
    if (!audioDescriptionId || !youtubeVideoId || !userId) {
      toast.error('Missing editor context for note import.')
      return { imported: false, skipped: false }
    }

    const skipExisting = options?.skipExisting ?? false

    if (skipExisting && isImported(note, playbackType)) {
      return { imported: false, skipped: true }
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
      if (!options?.silent) {
        toast.success(`Exported note to ${playbackType}`)
      }
      return { imported: true, skipped: false }
    } catch (error) {
      console.error(error)
      if (!options?.silent) {
        toast.error(`Failed to export note to ${playbackType}.`)
      }
      return { imported: false, skipped: false }
    } finally {
      setImportingKey('')
      setShowSpinner?.(false)
    }
  }

  const handleImportNote = async (
    note: ParsedNote,
    playbackType: 'inline' | 'extended',
  ) => {
    const result = await importSingleNote(note, playbackType)
    if (result.imported) {
      window.dispatchEvent(new Event('ydx:new-clip-saved'))
      onClipsImported?.()
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

  useEffect(() => {
    setSelectedNoteIds((prev) =>
      prev.filter((noteId) => parsedNotes.some((note) => note.id === noteId)),
    )
  }, [parsedNotes])

  const hasEditorContext = !!audioDescriptionId && !!youtubeVideoId && !!userId

  const allSelected =
    parsedNotes.length > 0 && selectedNoteIds.length === parsedNotes.length

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNoteIds((prev) =>
      prev.includes(noteId)
        ? prev.filter((currentId) => currentId !== noteId)
        : [...prev, noteId],
    )
  }

  const selectAllNotes = () => {
    setSelectedNoteIds(parsedNotes.map((note) => note.id))
  }

  const clearSelectedNotes = () => {
    setSelectedNoteIds([])
  }

  const batchExportNotes = async (
    notesToExport: ParsedNote[],
    playbackType: 'inline' | 'extended',
  ) => {
    if (notesToExport.length === 0) {
      toast.info('Select at least one note to export.')
      return
    }

    setShowSpinner?.(true)
    let importedCount = 0
    let skippedCount = 0

    for (const note of notesToExport) {
      const result = await importSingleNote(note, playbackType, {
        silent: true,
        skipExisting: true,
      })
      if (result.imported) importedCount += 1
      if (result.skipped) skippedCount += 1
    }

    setShowSpinner?.(false)

    if (importedCount > 0) {
      window.dispatchEvent(new Event('ydx:new-clip-saved'))
      onClipsImported?.()
    }

    if (importedCount > 0 || skippedCount > 0) {
      toast.success(
        `${importedCount} exported to ${playbackType}${
          skippedCount > 0 ? `, ${skippedCount} skipped` : ''
        }`,
      )
    } else {
      toast.info(`No notes were exported to ${playbackType}.`)
    }
  }

  const selectedNotes = parsedNotes.filter((note) =>
    selectedNoteIds.includes(note.id),
  )

  return (
    <div className="notes-bg rounded">
      <div className="notes-label">
        <div className="notes-header-copy">
          <h6 className="text-white mb-0">Notes:</h6>
          <span className="notes-header-helper">
            One line = one note. Press Enter for a new timestamp.
          </span>
        </div>
      </div>
      <div className="mx-auto notes-textarea-div align-items-center border rounded">
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
      <div className="notes-export-trigger-row">
        <button
          type="button"
          className="notes-import-btn compact"
          disabled={parsedNotes.length === 0}
          onClick={() => setIsExportModalOpen(true)}
        >
          Export Notes
        </button>
      </div>
      <Modal
        show={isExportModalOpen}
        onHide={() => setIsExportModalOpen(false)}
        centered
        dialogClassName="notes-export-modal"
      >
        <div className="modal-content notes-export-modal-content">
          <div className="modal-header notes-export-modal-header">
            <div>
              <h4 className="modal-title">Export Notes as Clips</h4>
              <div className="notes-export-modal-subtitle">
                Review saved notes, select them, and export to inline or
                extended clips.
              </div>
            </div>
            <button
              type="button"
              className="btn-close ydx-button"
              onClick={() => setIsExportModalOpen(false)}
            ></button>
          </div>
          <div className="modal-body notes-export-modal-body">
            {parsedNotes.length === 0 ? (
              <div className="notes-empty-state">
                Add timestamped notes first, then export them from here.
              </div>
            ) : (
              <>
                {!hasEditorContext && (
                  <div className="notes-empty-state">
                    Export actions are unavailable until the editor context is
                    fully loaded.
                  </div>
                )}
                <div className="notes-export-toolbar">
                  <div className="notes-export-toolbar-left">
                    <button
                      type="button"
                      className="notes-toolbar-link"
                      onClick={
                        allSelected ? clearSelectedNotes : selectAllNotes
                      }
                    >
                      {allSelected ? 'Clear all' : 'Select all'}
                    </button>
                    <button
                      type="button"
                      className="notes-toolbar-link"
                      onClick={clearSelectedNotes}
                      disabled={selectedNoteIds.length === 0}
                    >
                      Clear
                    </button>
                    <span className="notes-selected-count">
                      {selectedNoteIds.length} selected
                    </span>
                  </div>
                </div>
                <div className="notes-import-list modal-list">
                  {parsedNotes.map((note) => {
                    const inlineImported = isImported(note, 'inline')
                    const extendedImported = isImported(note, 'extended')

                    return (
                      <div className="notes-import-row" key={note.id}>
                        <div className="notes-import-main-row">
                          <label className="notes-select-control">
                            <input
                              type="checkbox"
                              checked={selectedNoteIds.includes(note.id)}
                              onChange={() => toggleNoteSelection(note.id)}
                            />
                          </label>
                          <div className="notes-import-copy">
                            <div className="notes-import-time">
                              {note.timeLabel}
                            </div>
                            <div className="notes-import-text">{note.text}</div>
                            <div className="notes-import-mini-badges">
                              {inlineImported && (
                                <span className="notes-status-badge is-added compact">
                                  Inline exported
                                </span>
                              )}
                              {extendedImported && (
                                <span className="notes-status-badge is-added compact">
                                  Extended exported
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="notes-import-actions">
                            <button
                              type="button"
                              className={`notes-import-btn inline ${
                                inlineImported ? 'is-disabled' : ''
                              }`}
                              disabled={
                                !hasEditorContext ||
                                inlineImported ||
                                importingKey === `${note.id}-inline`
                              }
                              onClick={() => handleImportNote(note, 'inline')}
                            >
                              {inlineImported
                                ? 'Inline Exported'
                                : 'Export Inline'}
                            </button>
                            <button
                              type="button"
                              className={`notes-import-btn extended ${
                                extendedImported ? 'is-disabled' : ''
                              }`}
                              disabled={
                                !hasEditorContext ||
                                extendedImported ||
                                importingKey === `${note.id}-extended`
                              }
                              onClick={() => handleImportNote(note, 'extended')}
                            >
                              {extendedImported
                                ? 'Extended Exported'
                                : 'Export Extended'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
          {parsedNotes.length > 0 && (
            <div className="modal-footer notes-export-modal-footer">
              <button
                type="button"
                className="notes-import-btn inline"
                disabled={selectedNotes.length === 0 || !hasEditorContext}
                onClick={async () => {
                  await batchExportNotes(selectedNotes, 'inline')
                }}
              >
                Export Selected to Inline
              </button>
              <button
                type="button"
                className="notes-import-btn extended"
                disabled={selectedNotes.length === 0 || !hasEditorContext}
                onClick={async () => {
                  await batchExportNotes(selectedNotes, 'extended')
                }}
              >
                Export Selected to Extended
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default Notes
