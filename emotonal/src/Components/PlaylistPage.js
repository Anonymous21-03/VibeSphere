import React, { useState, useRef } from 'react';
import './styles/PlaylistPage.css';

const PlaylistPage = () => {
  const [playlists, setPlaylists] = useState([
    {
      name: 'Chill Vibes',
      songs: [
        { 
          name: 'This is a very long song name that should be truncated', 
          image: 'path/to/song1-image.jpg', 
          audio: 'C:/Users/rahul/OneDrive/Desktop/Jaypee Assignments/sem 7/Major/Music Generation/Website/backend/generated_music.wav' 
        },
        { 
          name: 'Song 2', 
          image: 'path/to/song2-image.jpg', 
          audio: 'C:/Users/rahul/OneDrive/Desktop/Jaypee Assignments/sem 7/Major/Music Generation/Website/backend/generated_music.wav' 
        }
      ]
    },
    {
      name: 'Party Hits',
      songs: [
        { 
          name: 'Song 3', 
          image: 'path/to/song3-image.jpg', 
          audio: 'C:/Users/rahul/OneDrive/Desktop/Jaypee Assignments/sem 7/Major/Music Generation/Website/backend/generated_music.wav'  
        },
        { 
          name: 'Song 4', 
          image: 'path/to/song4-image.jpg', 
          audio: 'C:/Users/rahul/OneDrive/Desktop/Jaypee Assignments/sem 7/Major/Music Generation/Website/backend/generated_music.wav' 
        }
      ]
    }
  ]);

  const [expandedPlaylist, setExpandedPlaylist] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showModal, setShowModal] = useState(false); // State for modal visibility
  const audioRef = useRef(null);

  const handlePlaySong = (audioFile, e) => {
    e.stopPropagation();

    // Stop the current audio if it's playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    audioRef.current = new Audio(audioFile);
    audioRef.current.play();
  };

  const handlePlaylistClick = (index) => {
    setExpandedPlaylist(expandedPlaylist === index ? null : index);
  };

  const handleCreatePlaylist = (e) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      const newPlaylist = {
        name: newPlaylistName,
        songs: []
      };
      setPlaylists([...playlists, newPlaylist]);
      setNewPlaylistName('');
      setShowModal(false); // Close the modal after creating playlist
    }
  };

  const truncateText = (text, maxLength = 20) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div className="playlist-page">
      <button 
        className="plus-button"
        onClick={() => setShowModal(true)}
        aria-label="Create new playlist"
      >
        +
      </button>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <button 
              className="close-button"
              onClick={() => setShowModal(false)}
              aria-label="Close modal"
            >
              ×
            </button>
            <h3>Create New Playlist</h3>
            <form onSubmit={handleCreatePlaylist}>
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Enter new playlist name"
                className="playlist-input"
              />
              <button 
                type="submit" 
                className="create-playlist-btn"
                aria-label="Create new playlist"
              >
                Create Playlist
              </button>
            </form>
          </div>
        </div>
      )}

      {expandedPlaylist !== null ? (
        <div className="expanded-playlist">
          <div className="expanded-header">
            <button 
              className="back-button"
              onClick={() => setExpandedPlaylist(null)}
              aria-label="Back to playlist overview"
            >
              ← Back
            </button>
            <h2>{playlists[expandedPlaylist].name}</h2>
          </div>
          <div className="expanded-songs">
            {playlists[expandedPlaylist].songs.map((song, index) => (
              <div 
                key={index} 
                className="expanded-song-item"
                onClick={(e) => handlePlaySong(song.audio, e)}
              >
                <img src={song.image} alt={song.name} className="expanded-song-image" />
                <div className="expanded-song-details">
                  <span className="song-name">{song.name}</span>
                </div>
                <button 
                  className="play-button" 
                  aria-label={`Play ${song.name}`}
                >
                  ▶
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <h1>Your Playlists</h1>
          <div className="playlist-list">
            {playlists.map((playlist, index) => (
              <div 
                key={index} 
                className="playlist"
                onClick={() => handlePlaylistClick(index)}
              >
                <div
                  className="playlist-image"
                  style={{ 
                    backgroundImage: `url(${playlist.songs[0]?.image || 'default-image.jpg'})`
                  }}
                />
                <div className="playlist-info">
                  <h3>{playlist.name}</h3>
                  <p className="first-song">
                    {playlist.songs[0] 
                      ? truncateText(playlist.songs[0].name) 
                      : 'No songs yet'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PlaylistPage;
