import React, { useState } from 'react';
import axios from 'axios';
import CustomAudioPlayer from './CustomAudioPlayer';
import './styles/VideoAnalysisPage.css';

const VideoAnalysisPage = () => {
  const [video, setVideo] = useState(null);
  const [emotion, setEmotion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatingMusic, setGeneratingMusic] = useState(false);
  const [musicUrl, setMusicUrl] = useState(null);

  const handleVideoUpload = (e) => {
    const uploadedVideo = e.target.files[0];
    setVideo(uploadedVideo);
    // Reset previous results
    setEmotion(null);
    setError(null);
    setMusicUrl(null);
  };

  const handleAnalyze = async () => {
    if (!video) {
      alert('Please upload a video first');
      return;
    }

    const formData = new FormData();
    formData.append('file', video);

    setLoading(true);
    setEmotion(null);
    setError(null);
    setMusicUrl(null);

    try {
      const response = await axios.post('http://localhost:5000/upload_video', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data' 
        },
      });

      if (response.data.emotion) {
        setEmotion(`Detected Emotion: ${response.data.emotion}`);
      } else {
        setError('No emotion detected');
      }
    } catch (error) {
      console.error('Error:', error);
      
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
    if (!emotion) {
      alert('Please perform video analysis first');
      return;
    }

    const detectedEmotion = emotion.replace('Detected Emotion: ', '');
    const musicPrompt = `Create a ${detectedEmotion.toLowerCase()} music piece`;

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
    <div className="video-analysis-page">
      <div className="content">
        <div className="search-container">
          <h1>Video Emotion Analysis & Music Generation</h1>
          
          <div className="input-container">
            <input 
              type="file" 
              accept="video/*" 
              onChange={handleVideoUpload} 
              className="file-input"
            />
            <button 
              onClick={handleAnalyze} 
              disabled={!video || loading}
            >
              {loading ? 'Analyzing...' : 'Analyze Video'}
            </button>
          </div>
          
          {video && (
            <video 
              src={URL.createObjectURL(video)} 
              controls 
              className="uploaded-video" 
            />
          )}
          
          {error && <div className="error-message">{error}</div>}
          
          {emotion && (
            <div className="result-section">
              <p>{emotion}</p>
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

export default VideoAnalysisPage;