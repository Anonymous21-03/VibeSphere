import React, { useState, useEffect } from 'react';
import './styles/PlaylistPage.css';
import axios from 'axios';
import CustomAudioPlayer from './CustomAudioPlayer';

const PlaylistPage = () => {
  const [playlists, setPlaylists] = useState([]);
  const [allSongs, setAllSongs] = useState([]);
  const [expandedPlaylist, setExpandedPlaylist] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentPlayingSong, setCurrentPlayingSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playlistSongs, setPlaylistSongs] = useState([]);

  useEffect(() => {
    fetchAllSongs();
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/playlists');
      setPlaylists(response.data);
    } catch (err) {
      console.error('Error fetching playlists:', err);
      setError('Failed to load playlists');
    }
  };

  const fetchPlaylistSongs = async (playlistId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/playlists/${playlistId}/songs`
      );
      setPlaylistSongs(response.data);
    } catch (err) {
      console.error('Error fetching playlist songs:', err);
      setError('Failed to load playlist songs');
    }
  };

  const fetchAllSongs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:5000/api/songs');
      
      if (!response.data) {
        throw new Error('No data received from the server');
      }

      setAllSongs(response.data);
    } catch (err) {
      console.error('Error fetching songs:', err);
      setError('Failed to load songs');
      setAllSongs([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = (song) => {
    try {
      setCurrentPlayingSong(song);
    } catch (err) {
      console.error('Error playing song:', err);
      setError('Failed to play song');
    }
  };

  const handlePlaylistClick = async (playlistId) => {
    setExpandedPlaylist(playlistId);
    await fetchPlaylistSongs(playlistId);
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      try {
        await axios.post('http://localhost:5000/api/playlists', {
          name: newPlaylistName
        });
        setNewPlaylistName('');
        setShowModal(false);
        fetchPlaylists();
      } catch (err) {
        console.error('Error creating playlist:', err);
        setError('Failed to create playlist');
      }
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    try {
      await axios.delete(`http://localhost:5000/api/playlists/${playlistId}`);
      fetchPlaylists();
      setExpandedPlaylist(null);
    } catch (err) {
      console.error('Error deleting playlist:', err);
      setError('Failed to delete playlist');
    }
  };

  const handleAddToPlaylist = async (playlistId, song) => {
    try {
      await axios.post(
        `http://localhost:5000/api/playlists/${playlistId}/songs`,
        {
          songTitle: song.originalPrompt || song.name
        }
      );
      
      if (expandedPlaylist === playlistId) {
        await fetchPlaylistSongs(playlistId);
      }
      
      alert('Song added to playlist successfully!');
    } catch (err) {
      console.error('Error adding song to playlist:', err);
      alert('Failed to add song to playlist');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

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

      {expandedPlaylist ? (
        <div className="expanded-playlist">
          <div className="expanded-header">
            <button 
              className="back-button"
              onClick={() => setExpandedPlaylist(null)}
            >
              ← Back
            </button>
            <h2>{playlists.find(p => p._id === expandedPlaylist)?.name}</h2>
            <button 
              className="delete-button"
              onClick={() => handleDeletePlaylist(expandedPlaylist)}
            >
              Delete Playlist
            </button>
          </div>
          <div className="expanded-songs">
            {playlistSongs.map((song, index) => (
              <div key={index} className="expanded-song-item">
                <div className="expanded-song-details">
                  <span className="song-name">{song.originalPrompt || song.name}</span>
                </div>
                <button 
                  className="play-button"
                  onClick={() => handlePlaySong(song)}
                >
                  ▶
                </button>
                {currentPlayingSong?.audio === song.audio && (
                  <div className="audio-player-container">
                    <CustomAudioPlayer audioSrc={song.audio} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <h1>Your Playlists</h1>
          <div className="playlist-list">
            {playlists.map((playlist) => (
              <div 
                key={playlist._id} 
                className="playlist"
                onClick={() => handlePlaylistClick(playlist._id)}
              >
                <div className="playlist-image" />
                <div className="playlist-info">
                  <h3>{playlist.name}</h3>
                  <p className="song-count">
                    {playlist.songs?.length || 0} songs
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="all-songs-section">
            <h2>All Generated Songs</h2>
            <div className="songs-grid">
              {allSongs.map((song, index) => (
                <div key={index} className="song-card">
                  <div className="song-card-content">
                    <div className="song-info">
                      <h3>{song.originalPrompt || song.name}</h3>
                      <div className="song-actions">
                        <button 
                          className="play-button"
                          onClick={() => handlePlaySong(song)}
                        >
                          ▶
                        </button>
                        <div className="playlist-dropdown">
                          <select 
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAddToPlaylist(e.target.value, song);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">Add to playlist...</option>
                            {playlists.map((playlist) => (
                              <option key={playlist._id} value={playlist._id}>
                                {playlist.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
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
          </div>
        </>
      )}
    </div>
  );
};

export default PlaylistPage;