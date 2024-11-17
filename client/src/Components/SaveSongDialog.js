import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import './styles/SaveSongDialog.css';

export const SaveSongDialog = ({ isOpen, onClose, onSave }) => {
  const [songName, setSongName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (songName.trim()) {
      onSave(songName);
      setSongName('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <h2>Save Generated Song</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={songName}
            onChange={(e) => setSongName(e.target.value)}
            placeholder="Enter song name..."
            className="song-name-input"
            autoFocus
          />
          <div className="dialog-buttons">
            <button type="button" onClick={onClose} className="cancel-button">Cancel</button>
            <button type="submit" disabled={!songName.trim()} className="save-button">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const GeneratedSongsList = ({ onSongSelect }) => {
  const [songs, setSongs] = useState(JSON.parse(localStorage.getItem('generatedSongs') || '[]'));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const handleDelete = (index) => {
    const newSongs = [...songs];
    newSongs.splice(index, 1);
    localStorage.setItem('generatedSongs', JSON.stringify(newSongs));
    setSongs(newSongs);
    setShowDeleteConfirm(null);
  };

  if (songs.length === 0) {
    return (
      <div className="saved-songs">
        <h2>Your Generated Songs</h2>
        <p className="no-songs">No songs generated yet. Create your first one!</p>
      </div>
    );
  }

  return (
    <div className="saved-songs">
      <h2>Your Generated Songs</h2>
      <div className="songs-list">
        {songs.map((song, index) => (
          <div key={index} className="song-item">
            <div className="song-info">
              <span className="song-name">{song.name}</span>
              <span className="song-prompt">"{song.prompt}"</span>
              {song.date && <span className="song-date">{song.date}</span>}
            </div>
            <div className="song-actions">
              <button onClick={() => onSongSelect(song.audioUrl)} className="play-button">
                Play
              </button>
              {showDeleteConfirm === index ? (
                <div className="delete-confirm">
                  <span>Delete?</span>
                  <button onClick={() => handleDelete(index)} className="confirm-yes">Yes</button>
                  <button onClick={() => setShowDeleteConfirm(null)} className="confirm-no">No</button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowDeleteConfirm(index)} 
                  className="delete-button"
                  title="Delete song"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};