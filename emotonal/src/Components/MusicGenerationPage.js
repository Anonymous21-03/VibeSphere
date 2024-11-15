import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CustomAudioPlayer from '../Components/CustomAudioPlayer';
import { GeneratedSongsList, SaveSongDialog } from '../Components/SaveSongDialog';
import './styles/MusicGenerationPage.css';

const MusicGenerationPage = () => {
  const [prompt, setPrompt] = useState('');
  const [audioSrc, setAudioSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  
  // Defining exploreTracks and topPrompts
  const [exploreTracks, setExploreTracks] = useState([]);
  const [topPrompts, setTopPrompts] = useState([
    "Chill Piano",
    "Calm Ocean Waves",
    "Relaxing Jazz"
  ]);

  const handleGenerateMusic = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://localhost:5000/generate-music', { prompt });
      console.log('Generated audio URL:', response.data.audio_url); // Add this for debugging
      setAudioSrc(response.data.audio_url);
      setCurrentGeneration({ prompt, audioUrl: response.data.audio_url });
      setShowSaveDialog(true);
    } catch (error) {
      console.error("Error generating music:", error);
      setError("Failed to generate music. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSong = (songName) => {
    const savedSongs = JSON.parse(localStorage.getItem('generatedSongs') || '[]');
    const newSong = {
      name: songName,
      prompt: currentGeneration.prompt,
      audioUrl: currentGeneration.audioUrl,
      date: new Date().toLocaleString()
    };
    savedSongs.push(newSong);
    localStorage.setItem('generatedSongs', JSON.stringify(savedSongs));
    setShowSaveDialog(false);
  };

  const handleCreatePlaylist = () => {
    console.log('Creating new playlist:', playlistName);
    setShowModal(false);
    setPlaylistName('');
  };

  useEffect(() => {
    // Fetching curated tracks for the "Explore" section
    setExploreTracks([ 
      { name: "Calm Waves", audioUrl: "/path/to/calm_waves.mp3" },
      { name: "Soothing Melody", audioUrl: "/path/to/soothing_melody.mp3" }
    ]);
  }, []);

  return (
    <div className="music-page">
      <div className="content">
        <div className="search-container">
          <h1>AI Music Generator</h1>
          <div className="input-container">
            <input 
              type="text"
              placeholder="Describe the music you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
            />
            <button
              onClick={handleGenerateMusic}
              disabled={loading || !prompt.trim()}
              className="generate-button"
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="top-prompts">
          <h3>Top Prompts</h3>
          <ul>
            {topPrompts.map((prompt, index) => (
              <li key={index}>{prompt}</li>
            ))}
          </ul>
        </div>

        {audioSrc && (
          <div className="player-container">
            <CustomAudioPlayer audioSrc={audioSrc} />
          </div>
        )}
        
        <GeneratedSongsList />
        <SaveSongDialog show={showSaveDialog} onSave={handleSaveSong} />
        
        {/* Explore Section */}
        <div className="explore-section">
          <h2>Explore Music</h2>
          <ul>
            {exploreTracks.map((track, index) => (
              <li key={index} onClick={() => console.log('Play track', track.name)}>
                {track.name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button className="plus-button" onClick={() => setShowModal(true)}>
        +
      </button>

      {/* Modal for playlist creation */}
      {showModal && (
        <div className="modal-container">
          <div className="modal">
            <h2>Create Playlist</h2>
            <input 
              type="text" 
              value={playlistName} 
              onChange={(e) => setPlaylistName(e.target.value)} 
              placeholder="Enter Playlist Name"
            />
            <button onClick={handleCreatePlaylist}>Create</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicGenerationPage;
