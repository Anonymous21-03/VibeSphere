import React, { useState } from 'react';
import axios from 'axios';
import CustomAudioPlayer from './CustomAudioPlayer';
import './styles/ImageAnalysisPage.css';

const ImageAnalysisPage = () => {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatingMusic, setGeneratingMusic] = useState(false);
  const [musicUrl, setMusicUrl] = useState(null);

  const handleImageUpload = (e) => {
    const uploadedImage = e.target.files[0];
    setImage(uploadedImage);
    // Reset previous results
    setResult(null);
    setError(null);
    setMusicUrl(null);
  };

  const handleAnalyze = async () => {
    if (!image) {
      alert('Please upload an image first');
      return;
    }

    const formData = new FormData();
    formData.append('file', image);

    setLoading(true);
    setResult(null);
    setError(null);
    setMusicUrl(null);

    try {
      const response = await axios.post('http://localhost:5000/ml/analyze-image', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data' 
        },
      });

      // Adjust based on your actual API response structure
      if (response.data.emotion) {
        setResult(`Detected Emotion: ${response.data.emotion}`);
      } else if (response.data.result) {
        setResult(response.data.result);
      } else {
        setError('Unexpected response format');
      }
    } catch (error) {
      console.error('Error:', error);
      
      // More detailed error handling
      if (error.response) {
        setError(error.response.data.error || 'Server error occurred');
      } else if (error.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError('Error setting up the request');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMusic = async () => {
    if (!result) {
      alert('Please perform image analysis first');
      return;
    }

    const emotion = result.replace('Detected Emotion: ', '');
    const musicPrompt = `Create a ${emotion.toLowerCase()} music piece`;

    setGeneratingMusic(true);
    setMusicUrl(null);

    try {
      const response = await axios.post('http://localhost:5000/generate-music', { 
        prompt: musicPrompt 
      });

      if (response.data.audio_url) {
        setMusicUrl(response.data.audio_url);
      } else {
        setError('Failed to generate music');
      }
    } catch (error) {
      console.error('Music Generation Error:', error);
      setError('Error generating music');
    } finally {
      setGeneratingMusic(false);
    }
  };

  return (
    <div className="music-page">
      <div className="content">
        <div className="search-container">
          <h1>Image Emotion Analysis & Music Generation</h1>
          
          <div className="input-container">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              className="file-input"
            />
            <button 
              onClick={handleAnalyze} 
              disabled={!image || loading}
            >
              {loading ? 'Analyzing...' : 'Analyze Image'}
            </button>
          </div>
          
          {image && (
            <img 
              src={URL.createObjectURL(image)} 
              alt="Uploaded" 
              className="uploaded-image" 
            />
          )}
          
          {error && <div className="error-message">{error}</div>}
          
          {result && (
            <div className="result-section">
              <p>{result}</p>
              <button 
                onClick={handleGenerateMusic}
                disabled={generatingMusic}
                className="generate-music-btn"
              >
                {generatingMusic ? 'Generating Music...' : 'Generate Music'}
              </button>
            </div>
          )}
        </div>
      </div>

      {musicUrl && (
        <div className="player-container">
          <CustomAudioPlayer audioSrc={musicUrl} />
        </div>
      )}
    </div>
  );
}

export default ImageAnalysisPage;