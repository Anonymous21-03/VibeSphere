// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, BrowserRouter } from 'react-router-dom';
import Navbar from './Components/Navbar';
import LandingPage from './Components/LandingPage';
import ImageAnalysisPage from './Components/ImageAnalysisPage';
import VideoAnalysisPage from './Components/VideoAnalysisPage';
import LoginPage from './Components/LoginPage';
import SignupPage from './Components/SignupPage';
import MusicGenerationPage from './Components/MusicGenerationPage';
import PlaylistPage from './Components/PlaylistPage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="*" element={
          <>
            <Navbar />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/image-analysis" element={<ImageAnalysisPage />} />
              <Route path="/video-analysis" element={<VideoAnalysisPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/music-generation" element={<MusicGenerationPage />} />
              <Route path="/playlist" element={<PlaylistPage />} /> {/* Add the playlist route */}
            </Routes>
          </>
        }
        />
      </Routes>
    </Router>
  );
}

export default App;
