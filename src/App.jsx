import React, { useState, useEffect } from 'react';
import './App.css';
import WebcamMoodDetector from './WebcamMoodDetector';

const moods = [
  { 
    label: 'Happy', 
    query: 'happy songs', 
    themeColor: '#FFD93D',
    gradientStart: '#FFD93D',
    gradientEnd: '#FF6B6B',
    darkColor: '#1a1a1a',
    lightColor: '#2d2d2d'
  },
  { 
    label: 'Sad', 
    query: 'sad songs', 
    themeColor: '#4D6CFA',
    gradientStart: '#4D6CFA',
    gradientEnd: '#667eea',
    darkColor: '#0f0f23',
    lightColor: '#1a1a3a'
  },
  { 
    label: 'Motivated', 
    query: 'motivational speeches', 
    themeColor: '#E94560',
    gradientStart: '#E94560',
    gradientEnd: '#F38BA8',
    darkColor: '#2d0a0f',
    lightColor: '#3d1520'
  },
  { 
    label: 'Relaxed', 
    query: 'lofi chill beats', 
    themeColor: '#38B6FF',
    gradientStart: '#38B6FF',
    gradientEnd: '#7DD3FC',
    darkColor: '#0a1a2d',
    lightColor: '#152538'
  }
];

const YOUTUBE_API_KEY = 'AIzaSyBPVV0I2exnXdmLiLSmSU988FcnM9xROGc';  // put your real API key here

function App() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [moodProbabilities, setMoodProbabilities] = useState({});
  const [detectionActive, setDetectionActive] = useState(false);
  const [currentPlayingVideo, setCurrentPlayingVideo] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchVideos = async (query) => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`
        );
        const data = await response.json();
        const videoItems = data.items.map(item => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium.url,
          channel: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt
        }));
        setVideos(videoItems);
      } catch (error) {
        console.error('Error fetching YouTube videos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedMood) {
      fetchVideos(selectedMood.query);
      setSelectedVideoId(null);
      
      const root = document.documentElement;
      root.style.setProperty('--theme-color', selectedMood.themeColor);
      root.style.setProperty('--gradient-start', selectedMood.gradientStart);
      root.style.setProperty('--gradient-end', selectedMood.gradientEnd);
      root.style.setProperty('--dark-bg', selectedMood.darkColor);
      root.style.setProperty('--light-bg', selectedMood.lightColor);

      document.body.className = `theme-${selectedMood.label.toLowerCase()}`;
    }
  }, [selectedMood]);

  const handleMoodDetected = (detectedMood, probabilities) => {
    setMoodProbabilities(probabilities);

    const moodObj = moods.find((mood) => 
      mood.label.toLowerCase() === detectedMood.toLowerCase()
    );

    if (moodObj && probabilities[detectedMood] > 0.75) {
      setSelectedMood(moodObj);
    }
  };

  const playVideo = (video) => {
    setSelectedVideoId(video.id);
    setCurrentPlayingVideo(video);
  };

  const closeVideo = () => {
    setSelectedVideoId(null);
    setCurrentPlayingVideo(null);
  };

  const toggleDetection = () => {
    setDetectionActive(!detectionActive);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <button 
            className="menu-button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <h1 className="app-title">
            MoodTube
          </h1>
        </div>

        <div className="header-right">
          <button 
            className={`detection-toggle ${detectionActive ? 'active' : ''}`}
            onClick={toggleDetection}
          >
            {detectionActive ? '📹 ON' : '📹 OFF'}
          </button>
        </div>
      </header>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-section">
          <h3>Your Moods</h3>
          <div className="mood-list">
            {moods.map((mood, index) => (
              <button
                key={index}
                onClick={() => setSelectedMood(mood)}
                className={`mood-item ${selectedMood?.label === mood.label ? 'active' : ''}`}
              >
                <span className="mood-name">{mood.label}</span>
              </button>
            ))}
          </div>
        </div>

        {Object.keys(moodProbabilities).length > 0 && (
          <div className="sidebar-section">
            <h3>Live Detection</h3>
            <div className="mood-probabilities">
              {Object.entries(moodProbabilities)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 4)
                .map(([emotion, probability]) => (
                  <div key={emotion} className="probability-bar">
                    <span className="emotion-label">{emotion}</span>
                    <div className="progress-track">
                      <div 
                        className="progress-fill"
                        style={{ width: `${probability * 100}%` }}
                      ></div>
                    </div>
                    <span className="probability-value">
                      {Math.round(probability * 100)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </aside>

      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {detectionActive && (
          <section className="webcam-section">
            <div className="webcam-container">
              <WebcamMoodDetector
                onMoodDetected={handleMoodDetected}
                isActive={detectionActive}
              />
              <div className="detection-info">
                <h3>AI Mood Detection</h3>
                <p>Let AI detect your mood automatically</p>
              </div>
            </div>
          </section>
        )}

        <section className="mood-selection">
          <h2>Choose Your Vibe</h2>
          <div className="mood-buttons">
            {moods.map((mood, index) => (
              <button
                key={index}
                onClick={() => setSelectedMood(mood)}
                className={`mood-button ${selectedMood?.label === mood.label ? 'active' : ''}`}
                style={{
                  '--button-color': mood.themeColor,
                  '--button-gradient': `linear-gradient(135deg, ${mood.gradientStart}, ${mood.gradientEnd})`
                }}
              >
                <span className="mood-text">{mood.label}</span>
              </button>
            ))}
          </div>
        </section>

        {selectedMood && (
          <section className="content-section">
            <div className="section-header">
              <h2>{selectedMood.label} Vibes</h2>
              <p className="section-subtitle">
                Curated {selectedMood.query} just for you
              </p>
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Finding perfect content for your mood...</p>
              </div>
            ) : (
              <div className="videos-grid">
                {videos.map(video => (
                  <article
                    key={video.id}
                    className="video-card"
                    onClick={() => playVideo(video)}
                  >
                    <div className="video-thumbnail">
                      <img src={video.thumbnail} alt={video.title} />
                      <div className="play-overlay">
                        <div className="play-button">▶</div>
                      </div>
                    </div>
                    <div className="video-info">
                      <h3 className="video-title">{video.title}</h3>
                      <p className="video-channel">{video.channel}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {!selectedMood && !detectionActive && (
          <section className="welcome-section">
            <div className="welcome-content">
              <h2>Welcome to MoodTube</h2>
              <p>Discover content that matches your mood</p>
              <div className="welcome-actions">
                <button 
                  className="primary-button"
                  onClick={toggleDetection}
                >
                  Start Mood Detection
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {selectedVideoId && (
        <div className="popup-overlay" onClick={closeVideo}>
          <div className="popup-player" onClick={(e) => e.stopPropagation()}>
            <div className="player-header">
              <h3>{currentPlayingVideo?.title}</h3>
              <button className="close-button" onClick={closeVideo}>✕</button>
            </div>
            <div className="player-container">
              <iframe
                width="100%"
                height="500"
                src={`https://www.youtube.com/embed/${selectedVideoId}?autoplay=1&rel=0`}
                frameBorder="0"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                title="YouTube Video Player"
              ></iframe>
            </div>
            <div className="player-info">
              <p className="channel-name">{currentPlayingVideo?.channel}</p>
            </div>
          </div>
        </div>
      )}

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
    </div>
  );
}

export default App;
