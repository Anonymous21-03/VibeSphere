import React, { useState, useEffect, useRef } from 'react';
import './styles/PlaylistPage.css';
import axios from 'axios';
import CustomAudioPlayer from './CustomAudioPlayer';

const PlaylistPage = () => {
  const [playlists, setPlaylists] = useState([
    {
      name: 'Chill Vibes',
      songs: [
        { 
          name: 'This is a very long song name that should be truncated', 
          image: 'path/to/song1-image.jpg', 
          audio: 'path/to/generated_music.wav' 
        },
        { 
          name: 'Song 2', 
          image: 'path/to/song2-image.jpg', 
          audio: 'path/to/generated_music.wav' 
        }
      ]
    },
    {
      name: 'Party Hits',
      songs: [
        { 
          name: 'Song 3', 
          image: 'path/to/song3-image.jpg', 
          audio: 'path/to/generated_music.wav'  
        },
        { 
          name: 'Song 4', 
          image: 'path/to/song4-image.jpg', 
          audio: 'path/to/generated_music.wav' 
        }
      ]
    }
  ]);
  const [allSongs, setAllSongs] = useState([]);
  const [expandedPlaylist, setExpandedPlaylist] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentPlayingSong, setCurrentPlayingSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllSongs();
  }, []);

  const fetchAllSongs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/songs');
      console.log('Fetched songs:', response.data);
      setAllSongs(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching songs:', err);
      setError('Failed to load songs');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = (song) => {
    setCurrentPlayingSong(song);
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
      setShowModal(false);
    }
  };

  const truncateText = (text, maxLength = 20) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Function to format the date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="playlist-page">
      {/* Create Playlist Button */}
      <button 
        className="plus-button"
        onClick={() => setShowModal(true)}
        aria-label="Create new playlist"
      >
        +
      </button>

      {/* Create Playlist Modal */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <button 
              className="close-button"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
            <h3>Create New Playlist</h3>
            <form onSubmit={handleCreatePlaylist}>
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Enter playlist name"
                className="playlist-input"
              />
              <button type="submit" className="create-playlist-btn">
                Create Playlist
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      {expandedPlaylist !== null ? (
        <div className="expanded-playlist">
          <div className="expanded-header">
            <button 
              className="back-button"
              onClick={() => setExpandedPlaylist(null)}
            >
              ← Back
            </button>
            <h2>{playlists[expandedPlaylist].name}</h2>
          </div>
          <div className="expanded-songs">
            {playlists[expandedPlaylist].songs.map((song, index) => (
              <div key={index} className="expanded-song-item">
                <img 
                  src={song.image || '/default-song-image.jpg'} 
                  alt={song.name} 
                  className="expanded-song-image" 
                />
                <div className="expanded-song-details">
                  <span className="song-name">{song.name}</span>
                </div>
                <button 
                  className="play-button"
                  onClick={() => handlePlaySong(song)}
                >
                  ▶
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Playlists Grid */}
          <h1>Your Playlists</h1>
          <div className="playlist-list">
            {playlists.map((playlist, index) => (
              <div 
                key={index} 
                className="playlist"
                onClick={() => handlePlaylistClick(index)}
              >
                <div className="playlist-image" />
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

          {/* All Songs Section */}
          <div className="all-songs-section">
            <h2>All Generated Songs</h2>
            {loading && <div className="loading">Loading songs...</div>}
            {error && <div className="error">{error}</div>}
            {!loading && !error && (
              <div className="songs-grid">
                {allSongs.map((song, index) => (
                  <div key={index} className="song-card">
                    <div className="song-card-content">
                      <div className="song-info">
                        <h3>{truncateText(song.originalPrompt || song.name, 30)}</h3>
                        {song.metadata && (
                          <p className="song-metadata">
                            {formatDate(song.metadata.createdAt)}
                          </p>
                        )}
                      </div>
                      <div className="song-controls">
                        <button 
                          className="play-button"
                          onClick={() => handlePlaySong(song)}
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                    {currentPlayingSong?.audio === song.audio && (
                      <div className="audio-player-container">
                        <CustomAudioPlayer audioSrc={song.audio} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PlaylistPage;
