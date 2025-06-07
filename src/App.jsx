// App.jsx
import React, { useState, useEffect } from 'react';
import './App.css';
import WebcamMoodDetector from './WebcamMoodDetector';

const moods = [
  { label: 'Happy 😊', query: 'happy songs' },
  { label: 'Sad 😢', query: 'sad songs' },
  { label: 'Motivated 💪', query: 'motivational speeches' },
  { label: 'Relaxed 😴', query: 'lofi chill beats' }
];

const YOUTUBE_API_KEY = 'AIzaSyBPVV0I2exnXdmLiLSmSU988FcnM9xROGc'; // replace with your actual API key

function App() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [moodHistory, setMoodHistory] = useState([]);

  useEffect(() => {
    const fetchVideos = async (query) => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=8&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`
        );
        const data = await response.json();
        const videoItems = data.items.map(item => ({
          id: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium.url,
          channel: item.snippet.channelTitle
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

      // Add to mood history
      setMoodHistory(prevHistory => {
        const newHistory = [selectedMood.label, ...prevHistory];
        return newHistory.slice(0, 5); // keep last 5 moods
      });
    }
  }, [selectedMood]);

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>MoodTube 🎵</h1>

      <div className="webcam-container">
        <WebcamMoodDetector
          onMoodDetected={(moodLabel) => {
            const moodObj = moods.find((mood) => mood.label === moodLabel);
            if (moodObj) {
              setSelectedMood(moodObj);
            }
          }}
        />
      </div>

      <p>Select your mood:</p>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {moods.map((mood, index) => (
          <button
            key={index}
            onClick={() => setSelectedMood(mood)}
            style={{
              padding: '10px 20px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: selectedMood?.label === mood.label ? '#6366f1' : '#1f1f1f',
              color: selectedMood?.label === mood.label ? 'white' : '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '1rem'
            }}
          >
            {mood.label}
          </button>
        ))}
      </div>

      {selectedMood && (
        <>
          <h2>Selected Mood: {selectedMood.label}</h2>
          <p>Showing videos for: <strong>{selectedMood.query}</strong></p>

          {loading ? (
            <p>Loading videos...</p>
          ) : (
            <div className="video-grid">
              {videos.map(video => (
                <div key={video.id} className="video-card">
                  <a
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                    />
                  </a>
                  <h3>{video.title}</h3>
                  <p>{video.channel}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mood-history">
            <h3>🕒 Mood History:</h3>
            <ul>
              {moodHistory.map((moodLabel, index) => (
                <li key={index}>
                  {index + 1}. {moodLabel}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
