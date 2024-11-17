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
    if (audioRef.current) {
      // Add error handling
      const handleError = (e) => {
        console.error('Audio loading error:', e);
        setError('Failed to load audio file');
        setIsPlaying(false);
      };

      // Add loading handler
      const handleCanPlay = () => {
        setError(null);
        setDuration(audioRef.current.duration);
        if (isPlaying) {
          audioRef.current.play().catch(handleError);
        }
      };

      audioRef.current.addEventListener('error', handleError);
      audioRef.current.addEventListener('canplay', handleCanPlay);
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current.duration);
      });
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current.currentTime);
      });

      // Load the new audio source
      audioRef.current.load();

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('error', handleError);
          audioRef.current.removeEventListener('canplay', handleCanPlay);
          audioRef.current.removeEventListener('loadedmetadata', () => {});
          audioRef.current.removeEventListener('timeupdate', () => {});
        }
      };
    }
  }, [audioSrc]);

  const togglePlay = () => {
    if (error) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => {
        console.error('Playback error:', e);
        setError('Failed to play audio');
      });
    }
    setIsPlaying(!isPlaying);
  };


  const handleTimeChange = (e) => {
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e) => {
    const value = parseFloat(e.target.value);
    audioRef.current.volume = value;
    setVolume(value);
    setIsMuted(value === 0);
  };

  const toggleMute = () => {
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
        onError={(e) => {
          console.error('Audio error:', e);
          setError('Failed to load audio file');
        }}
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
            <button className="control-button" onClick={() => audioRef.current.currentTime -= 10}>
              <SkipBack size={24} />
            </button>

            <button className="play-button" onClick={togglePlay}>
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>

            <button className="control-button" onClick={() => audioRef.current.currentTime += 10}>
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
