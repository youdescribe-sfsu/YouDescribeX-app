import axios from 'axios'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import '@/assets/css/editAudioDesc.css'
import '@/assets/css/notes.css'
import { debounce } from 'debounce'

interface NoteItem {
  id: string
  timeSeconds: number
  text: string
}

interface ImportEntry extends NoteItem {
  playbackType: 'inline' | 'extended'
  selected: boolean
}

interface Props {
  currentTime: string // HH:MM:SS:MS from parent
  audioDescriptionId: string
  notesData: any
  handleVideoPause: () => void
  userId: string
  youtubeVideoId: string
  onClipsImported?: () => void
}

const genId = () => Math.random().toString(36).slice(2, 9)

// HH:MM:SS:MS → seconds
const parseCurrentTime = (time: string): number => {
  const parts = time.split(':').map(Number)
  if (parts.length === 4)
    return parts[0] * 3600 + parts[1] * 60 + parts[2] + parts[3] / 100
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return 0
}

// seconds → MM:SS or H:MM:SS
const formatTime = (secs: number): string => {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// user-typed MM:SS or H:MM:SS → seconds
const parseDisplayTime = (display: string): number => {
  const parts = display.split(':').map((n) => parseInt(n) || 0)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return 0
}

const deserializeNotes = (text: string): NoteItem[] => {
  if (!text) return []
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        id: item.id || genId(),
        timeSeconds:
          item.timeSeconds ?? parseCurrentTime(item.time || '00:00:00:00'),
        text: item.text ?? item.note ?? '',
      }))
    }
  } catch (_e) {
    // ignore parse errors, fall through to legacy format
  }
  // Legacy line-by-line format: HH:MM:SS:MS - text
  return text
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((line) => {
      const match = line.match(/^(\d{2}:\d{2}:\d{2}(?::\d{2})?)\s*-\s*(.*)$/)
      if (match)
        return {
          id: genId(),
          timeSeconds: parseCurrentTime(match[1]),
          text: match[2].trim(),
        }
      return { id: genId(), timeSeconds: 0, text: line.trim() }
    })
}

const serializeNotes = (notes: NoteItem[]): string => JSON.stringify(notes)

const Notes = ({
  currentTime,
  audioDescriptionId,
  notesData,
  handleVideoPause,
  userId,
  youtubeVideoId,
  onClipsImported,
}: Props) => {
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [noteId, setNoteId] = useState('')
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null)
  const [editingTimeValue, setEditingTimeValue] = useState('')
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportEntries, setExportEntries] = useState<ImportEntry[]>([])
  const [isExporting, setIsExporting] = useState(false)

  const handleNoteAutoSave = (current: NoteItem[]) => {
    axios
      .post(`${process.env.REACT_APP_YDX_BACKEND_URL}/api/notes/post-note`, {
        noteId,
        notes: serializeNotes(current),
        adId: audioDescriptionId,
      })
      .then((res) => setNoteId(res.data.notes_id))
      .catch(() => toast.error('Error saving note!'))
  }

  const debouncedSave = useMemo(
    () => debounce(handleNoteAutoSave, 1500),
    [noteId, audioDescriptionId],
  )

  const updateNotes = (updated: NoteItem[]) => {
    setNotes(updated)
    debouncedSave(updated)
  }

  const handleAddNote = () => {
    handleVideoPause()
    const newItem: NoteItem = {
      id: genId(),
      timeSeconds: parseCurrentTime(currentTime),
      text: '',
    }
    const updated = [...notes, newItem]
    setNotes(updated)
    debouncedSave(updated)
    // Focus the new text input after render
    setTimeout(() => {
      const inputs =
        document.querySelectorAll<HTMLInputElement>('.note-text-input')
      inputs[inputs.length - 1]?.focus()
    }, 50)
  }

  const handleChangeText = (id: string, text: string) => {
    updateNotes(notes.map((n) => (n.id === id ? { ...n, text } : n)))
  }

  const handleDelete = (id: string) => {
    updateNotes(notes.filter((n) => n.id !== id))
  }

  const handleTimeClick = (note: NoteItem) => {
    setEditingTimeId(note.id)
    setEditingTimeValue(formatTime(note.timeSeconds))
  }

  const handleTimeBlur = (id: string) => {
    const secs = parseDisplayTime(editingTimeValue)
    updateNotes(
      notes.map((n) => (n.id === id ? { ...n, timeSeconds: secs } : n)),
    )
    setEditingTimeId(null)
  }

  const handleOpenExport = () => {
    const entries = notes
      .filter((n) => n.text.trim())
      .map((n) => ({ ...n, playbackType: 'inline' as const, selected: true }))
    if (entries.length === 0) {
      toast.info('No notes to export.')
      return
    }
    setExportEntries(entries)
    setShowExportModal(true)
  }

  const handleExportConfirm = async () => {
    const selected = exportEntries.filter((e) => e.selected && e.text.trim())
    if (selected.length === 0) {
      toast.info('No entries selected.')
      return
    }
    setIsExporting(true)
    let ok = 0,
      fail = 0
    for (const entry of selected) {
      try {
        const formData = new FormData()
        formData.append('newACTitle', entry.text.slice(0, 50))
        formData.append('newACType', 'Visual')
        formData.append('newACPlaybackType', entry.playbackType)
        formData.append('newACStartTime', String(entry.timeSeconds))
        formData.append('newACDescriptionText', entry.text)
        formData.append('youtubeVideoId', youtubeVideoId)
        formData.append('userId', userId)
        formData.append('isRecorded', 'false')
        formData.append('newACDuration', '0')
        await axios.post(
          `${process.env.REACT_APP_YDX_BACKEND_URL}/api/audio-clips/add-new-clip/${audioDescriptionId}`,
          formData,
        )
        ok++
      } catch {
        fail++
      }
    }
    setIsExporting(false)
    setShowExportModal(false)
    if (ok > 0) {
      toast.success(`Exported ${ok} clip${ok > 1 ? 's' : ''}!`)
      onClipsImported?.()
    }
    if (fail > 0) toast.error(`${fail} clip${fail > 1 ? 's' : ''} failed.`)
  }

  useEffect(() => {
    if (notesData !== undefined) {
      setNotes(deserializeNotes(notesData.notes_text))
      setNoteId(notesData.notes_id)
    } else {
      setNotes([])
      setNoteId('')
    }
  }, [notesData])

  return (
    <div className="notes-bg rounded">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center pt-1 px-3 notes-label">
        <h6 className="text-white">Notes:</h6>
        <button
          className="btn btn-sm btn-outline-light"
          onClick={handleOpenExport}
        >
          Export to Clips
        </button>
      </div>

      {/* Notes list */}
      <div className="notes-textarea-div px-2 py-1">
        {notes.length === 0 && (
          <p className="text-muted small mt-2 px-1">
            Click &quot;+ Add note&quot; to start.
          </p>
        )}
        {notes.map((note) => (
          <div key={note.id} className="d-flex align-items-center gap-1 mb-1">
            {/* Time badge / editable input */}
            {editingTimeId === note.id ? (
              <input
                type="text"
                value={editingTimeValue}
                onChange={(e) => setEditingTimeValue(e.target.value)}
                onBlur={() => handleTimeBlur(note.id)}
                onKeyDown={(e) => e.key === 'Enter' && handleTimeBlur(note.id)}
                autoFocus
                style={{
                  width: 60,
                  fontFamily: 'monospace',
                  fontSize: 12,
                  padding: '2px 4px',
                  border: '1px solid #6c9bd1',
                  borderRadius: 3,
                  flexShrink: 0,
                }}
              />
            ) : (
              <span
                onClick={() => handleTimeClick(note)}
                title="Click to edit time"
                style={{
                  width: 56,
                  fontFamily: 'monospace',
                  fontSize: 12,
                  padding: '2px 6px',
                  background: '#e8f0fe',
                  color: '#1a4a8a',
                  borderRadius: 3,
                  cursor: 'pointer',
                  flexShrink: 0,
                  userSelect: 'none',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatTime(note.timeSeconds)}
              </span>
            )}

            {/* Text input */}
            <input
              type="text"
              className="note-text-input"
              value={note.text}
              onChange={(e) => handleChangeText(note.id, e.target.value)}
              placeholder="Note..."
              style={{
                flex: 1,
                fontSize: 13,
                padding: '2px 6px',
                border: '1px solid #ccc',
                borderRadius: 3,
                minWidth: 0,
              }}
            />

            {/* Delete */}
            <button
              onClick={() => handleDelete(note.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#aaa',
                cursor: 'pointer',
                fontSize: 16,
                lineHeight: 1,
                padding: '0 2px',
                flexShrink: 0,
              }}
              aria-label="Delete note"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add button */}
      <div className="px-3 pb-1 pt-1">
        <button
          className="btn btn-sm btn-outline-light w-100"
          onClick={handleAddNote}
        >
          + Add note at current time
        </button>
      </div>

      {/* Export modal */}
      {showExportModal && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Export Notes as Clips</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowExportModal(false)}
                />
              </div>
              <div
                className="modal-body"
                style={{ maxHeight: '60vh', overflowY: 'auto' }}
              >
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>
                        <input
                          type="checkbox"
                          checked={exportEntries.every((e) => e.selected)}
                          onChange={(ev) =>
                            setExportEntries(
                              exportEntries.map((e) => ({
                                ...e,
                                selected: ev.target.checked,
                              })),
                            )
                          }
                        />
                      </th>
                      <th style={{ width: 80 }}>Time</th>
                      <th>Description</th>
                      <th style={{ width: 120 }}>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportEntries.map((entry, i) => (
                      <tr
                        key={entry.id}
                        style={{ opacity: entry.selected ? 1 : 0.45 }}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={entry.selected}
                            onChange={(ev) =>
                              setExportEntries(
                                exportEntries.map((e, j) =>
                                  j === i
                                    ? { ...e, selected: ev.target.checked }
                                    : e,
                                ),
                              )
                            }
                          />
                        </td>
                        <td>
                          <code>{formatTime(entry.timeSeconds)}</code>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={entry.text}
                            onChange={(ev) =>
                              setExportEntries(
                                exportEntries.map((e, j) =>
                                  j === i ? { ...e, text: ev.target.value } : e,
                                ),
                              )
                            }
                          />
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={entry.playbackType}
                            onChange={(ev) =>
                              setExportEntries(
                                exportEntries.map((e, j) =>
                                  j === i
                                    ? {
                                        ...e,
                                        playbackType: ev.target.value as
                                          | 'inline'
                                          | 'extended',
                                      }
                                    : e,
                                ),
                              )
                            }
                          >
                            <option value="inline">Inline</option>
                            <option value="extended">Extended</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <span className="me-auto text-muted" style={{ fontSize: 13 }}>
                  {exportEntries.filter((e) => e.selected).length} of{' '}
                  {exportEntries.length} selected
                </span>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowExportModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleExportConfirm}
                  disabled={
                    isExporting ||
                    exportEntries.filter((e) => e.selected).length === 0
                  }
                >
                  {isExporting ? 'Exporting...' : 'Export'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Notes
