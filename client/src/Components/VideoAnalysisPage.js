import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './styles/VideoAnalysisPage.css'; // Ensure this path is correct

const VideoAnalysisPage = () => {
  const [video, setVideo] = useState(null);
  const [socket, setSocket] = useState(null);
  const [emotion, setEmotion] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const socketIo = io('http://localhost:5000');
    setSocket(socketIo);

    socketIo.on('emotion_update', (data) => {
      setEmotion(data.emotion);
    });

    return () => {
      socketIo.disconnect();
    };
  }, []);

  const handleVideoUpload = (e) => {
    setVideo(e.target.files[0]); // Store the file object
  };

  const handleAnalyze = async () => {
    if (!video) {
      alert('Please upload a video first');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', video);

    try {
      await fetch('http://localhost:5000/upload_video', {
        method: 'POST',
        body: formData,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  return (
    <div className="video-analysis-page">
      <h2>Real-Time Video Emotion Analysis</h2>
      <div className="upload-section">
        <input
          type="file"
          accept="video/*"
          onChange={handleVideoUpload}
          className="file-input"
        />
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="analyze-button"
        >
          {loading ? 'Analyzing...' : 'Analyze Video'}
        </button>
      </div>
      {video && (
        <div className="video-preview">
          <h3>Uploaded Video Preview:</h3>
          <video
            src={URL.createObjectURL(video)}
            controls
            className="uploaded-video"
          />
        </div>
      )}
      {emotion && <div className="result">Current Emotion: {emotion}</div>}
    </div>
  );
};

export default VideoAnalysisPage;
