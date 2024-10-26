import React, { useState } from 'react';
import axios from 'axios';
import './styles/MusicGenerationPage.css';

const MusicGenerationPage = () => {
  const [prompt, setPrompt] = useState('');
  const [audioSrc, setAudioSrc] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateMusic = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/generate-music', { prompt });
      setAudioSrc(response.data.audio_url); // Assuming backend sends audio URL
    } catch (error) {
      console.error("Error generating music:", error);
    }
    setLoading(false);
  };

  return (
    <div className="music-generation-page">
      <h1>Generate Music Based on Prompt</h1>
      <input 
        type="text" 
        placeholder="Enter prompt..." 
        value={prompt} 
        onChange={(e) => setPrompt(e.target.value)} 
      />
      <button onClick={handleGenerateMusic} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Music'}
      </button>

      {audioSrc && (
        <div className="audio-player">
          <h2>Generated Music:</h2>
          <audio controls>
            <source src={audioSrc} type="audio/wav" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
}

export default MusicGenerationPage;
