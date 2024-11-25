import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import './styles/CustomAudioPlayer.css';

const CustomAudioPlayer = ({ audioSrc }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    // Reset state
    setIsPlaying(false);
    setCurrentTime(0);
    setError(null);

    // Event listeners
    const handleCanPlay = () => {
      setDuration(audioElement.duration);
      if (isPlaying) {
        audioElement.play().catch(handlePlayError);
      }
    };

    const handlePlayError = (e) => {
      console.error('Playback error:', e);
      setError('Failed to play audio');
      setIsPlaying(false);
    };

    const handleLoadError = (e) => {
      console.error('Audio loading error:', e);
      setError('Failed to load audio file');
      setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audioElement.currentTime);
    };

    // Add event listeners
    audioElement.addEventListener('canplay', handleCanPlay);
    audioElement.addEventListener('error', handleLoadError);
    audioElement.addEventListener('timeupdate', handleTimeUpdate);

    // Attempt to load and potentially play
    audioElement.load();

    // Cleanup
    return () => {
      audioElement.removeEventListener('canplay', handleCanPlay);
      audioElement.removeEventListener('error', handleLoadError);
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [audioSrc]);

  const togglePlay = () => {
    if (error || !audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(e => {
          console.error('Playback error:', e);
          setError('Failed to play audio');
          setIsPlaying(false);
        });
    }
  };

  const handleTimeChange = (e) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e) => {
    if (!audioRef.current) return;
    const value = parseFloat(e.target.value);
    audioRef.current.volume = value;
    setVolume(value);
    setIsMuted(value === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-player">
      {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
      />
      
      <div className="player-content">
        <div className="progress-bar-container">
          <input 
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleTimeChange}
            className="progress-bar"
          />
          <div className="time-display">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="controls-container">
          <div className="main-controls">
            <button 
              className="control-button" 
              onClick={() => audioRef.current && (audioRef.current.currentTime -= 10)}
            >
              <SkipBack size={24} />
            </button>

            <button className="play-button" onClick={togglePlay}>
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>

            <button 
              className="control-button" 
              onClick={() => audioRef.current && (audioRef.current.currentTime += 10)}
            >
              <SkipForward size={24} />
            </button>
          </div>

          <div className="volume-controls">
            <button className="control-button" onClick={toggleMute}>
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="volume-slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomAudioPlayer;