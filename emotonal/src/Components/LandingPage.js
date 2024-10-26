import React from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <section className="landing-page">
      {/* Hero Section */}
      <div className="hero">
        <h1 className="hero-heading">
          Discover Music That Matches <span>Your Emotions</span>
        </h1>
        <p className="hero-subtext">Analyze emotions through text, photos, or video and let our AI generate music tailored to your mood.</p>
        <button className="cta-btn" onClick={() => navigate("/music-generation")}>Generate Music</button>
      </div>

      {/* Features Section */}
      <div className="features">
        <div className="feature card">
          <h2>Text Sentiment Analysis</h2>
          <p>Analyze emotions from written text and generate personalized music that reflects your mood.</p>
        </div>
        <div className="feature card">
          <h2>Video Emotion Detection</h2>
          <p>Upload videos or use live webcam to detect emotions and generate emotion-driven music instantly.</p>
        </div>
        <div className="feature card">
          <h2>Photo Emotion Detection</h2>
          <p>Upload a photo to detect emotions and turn them into a unique melody.</p>
        </div>
      </div>
    </section>
  );
}

export default LandingPage;
