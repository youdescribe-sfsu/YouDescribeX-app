import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import '../assets/css/editAudioDesc.css';
import '../assets/css/notes.css';

const Notes = ({ currentTime, audioDescriptionId, notesData }) => {
  // React State Variables
  const [noteValue, setNoteValue] = useState(''); // to store Notes text
  const [noteId, setNoteId] = useState(''); // to store Note Id - for POST requests later
  const [noteDetails, setNoteDetails] = useState([]); // to store Notes Details

  // this function handles keyUp event in the Notes textarea -> whenever an enter key is hit,
  // a timestamp is inserted in the Notes
  const handleNewNoteLine = (e) => {
    const tempNoteValue = noteValue;
    let keycode = e.keyCode ? e.keyCode : e.which;
    if (keycode === parseInt('13')) {
      setNoteValue(tempNoteValue + currentTime + ' - ');
      handleNoteAutoSave(tempNoteValue + currentTime + ' - ');
    }
  };
  // for focus event of Notes Textarea -> if the notes is empty, timestamp is inserted
  const handleTextAreaFocus = (e) => {
    let tempNoteValue = noteValue;
    if (noteValue === '') {
      setNoteValue(tempNoteValue + currentTime + ' - ');
      handleNoteAutoSave(tempNoteValue + currentTime + ' - ');
    }
    // TODO: what if notes is not empty
  };

  const handleNoteChange = (e) => {
    let updatedNoteValue = '';
    if (noteValue === '') {
      // insert current time if all notes is cleared and didn't lose focus
      updatedNoteValue = currentTime + ' - ' + e.target.value;
    } else if (noteValue.split('').reverse().join('').indexOf('\n') === 0) {
      // After a new line/enter, if user clears the time and enters note directly
      // e.nativeEvent.data will have the key entered - adding currentime before that
      if (e.nativeEvent.data !== null) {
        updatedNoteValue = noteValue + currentTime + ' - ' + e.nativeEvent.data;
      } else {
        updatedNoteValue = e.target.value;
      }
    } else {
      updatedNoteValue = e.target.value;
    }
    setNoteValue(updatedNoteValue);
    handleNoteAutoSave(updatedNoteValue);
  };

  const handleNoteAutoSave = (currentNoteValue) => {
    axios
      .post('/api/notes/post-note', {
        noteId: noteId,
        notes: currentNoteValue,
        adId: audioDescriptionId,
      })
      .then((res) => {
        setNoteId(res.data.notes_id); // setting this in the case of inserting new note
      })
      .catch((err) => {
        console.error(err.response.data);
        toast.error('Error Saving Note! Please Try Again...');
      });
  };

  const handleNoteHighlight = () => {
    let noteList = noteValue.split(/\r?\n/);
    let tempNoteDetails = [];
    noteList.forEach((note, key) => {
      if (note.slice(0, 8).match(/\d{2}:\d{2}:\d{2}/)) {
        const noteTimestamp = {
          id: key,
          note: note.slice(11), // assuming user wouldn't mess with the format of the note text
          time: note.slice(0, 8),
        };
        tempNoteDetails.push(noteTimestamp);
        console.log(tempNoteDetails);
        setNoteDetails(tempNoteDetails);
      }
    });
  };

  useEffect(() => {
    // If there is an notes entry in db
    if (notesData !== undefined) {
      // inserting notes_text into the note value
      setNoteValue(notesData.notes_text);
      setNoteId(notesData.notes_id);
    } else {
      // else insert empty strings - somehow, useState('') is not working
      setNoteValue('');
      setNoteId('');
    }
  }, [notesData]);

  return (
    <div className="notes-bg rounded">
      <div className="d-flex justify-content-between align-items-center pt-1 px-3 notes-label">
        <h6 className="text-white">Notes:</h6>
      </div>
      <div className="mx-auto my-auto notes-textarea-div align-items-center border rounded">
        <textarea
          className="form-control border rounded notes-textarea"
          rows="9"
          id="notes"
          name="notes"
          placeholder="Start taking your Notes.."
          onFocus={handleTextAreaFocus}
          onKeyUp={handleNewNoteLine}
          onChange={handleNoteChange}
          value={noteValue}
        ></textarea>
      </div>
    </div>
  );
};

export default Notes;
