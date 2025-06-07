import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const WebcamMoodDetector = ({ onMoodDetected, isActive }) => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detectionStatus, setDetectionStatus] = useState('Initializing...');
  const [currentProbabilities, setCurrentProbabilities] = useState({});
  const [faceDetected, setFaceDetected] = useState(false);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    let detectionInterval;
    
    const loadModels = async () => {
      try {
        setDetectionStatus('Loading AI models...');
        const MODEL_URL = process.env.PUBLIC_URL + '/models';
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ]);
        
        setDetectionStatus('Models loaded successfully');
        await startVideo();
      } catch (err) {
        console.error('Error loading models:', err);
        setError('Failed to load AI models. Please refresh the page.');
        setDetectionStatus('Error loading models');
      }
    };

    const startVideo = async () => {
      try {
        setDetectionStatus('Requesting camera access...');
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user'
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
          setDetectionStatus('Camera ready');
          
          videoRef.current.onloadedmetadata = () => {
            setIsLoading(false);
            setDetectionStatus('Ready for detection');
            startDetection();
          };
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
        setError('Camera access denied. Please allow camera permissions.');
        setDetectionStatus('Camera access failed');
        setIsLoading(false);
      }
    };

    const startDetection = () => {
      if (!isActive) return;
      
      detectionInterval = setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState === 4 && canvasRef.current) {
          try {
            const detections = await faceapi
              .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({
                inputSize: 416,
                scoreThreshold: 0.5
              }))
              .withFaceExpressions()
              .withFaceLandmarks();

            const canvas = canvasRef.current;
            const displaySize = { 
              width: videoRef.current.videoWidth || 640, 
              height: videoRef.current.videoHeight || 480 
            };
            
            faceapi.matchDimensions(canvas, displaySize);
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (detections && detections.expressions) {
              setFaceDetected(true);
              setDetectionStatus('Face detected - analyzing mood...');
              
              // Draw face detection box
              const resizedDetections = faceapi.resizeResults(detections, displaySize);
              faceapi.draw.drawDetections(canvas, resizedDetections);
              faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

              const expressions = detections.expressions;
              setCurrentProbabilities(expressions);

              // Get dominant emotion with improved mapping
              const emotionMapping = {
                'happy': 'Happy',
                'sad': 'Sad', 
                'angry': 'Motivated',
                'neutral': 'Relaxed',
                'surprised': 'Happy',
                'fearful': 'Sad',
                'disgusted': 'Sad'
              };

              const sortedExpressions = Object.entries(expressions)
                .sort((a, b) => b[1] - a[1]);

              const [dominantExpression, probability] = sortedExpressions[0];
              const mappedEmotion = emotionMapping[dominantExpression] || dominantExpression;

              // Only trigger if confidence is reasonable and expression is significant
              if (probability > 0.3) {
                setDetectionStatus(`Detected: ${mappedEmotion} (${Math.round(probability * 100)}%)`);
                onMoodDetected(mappedEmotion, expressions);
              } else {
                setDetectionStatus('Analyzing facial expressions...');
              }

            } else {
              setFaceDetected(false);
              setDetectionStatus('No face detected - please face the camera');
              setCurrentProbabilities({});
            }
          } catch (err) {
            console.error('Detection error:', err);
            setDetectionStatus('Detection error - retrying...');
          }
        }
      }, 500); // Faster detection for better responsiveness
    };

    if (isActive) {
      loadModels();
    }

    return () => {
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onMoodDetected, isActive]);

  // Stop/start detection based on isActive prop
  useEffect(() => {
    if (!isActive && stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsLoading(true);
      setFaceDetected(false);
      setCurrentProbabilities({});
      setDetectionStatus('Detection stopped');
    }
  }, [isActive, stream]);

  if (!isActive) {
    return (
      <div className="webcam-inactive">
        <div className="inactive-placeholder">
          <div className="camera-icon">📹</div>
          <p>Mood detection is off</p>
          <small>Turn on detection to analyze your mood automatically</small>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="webcam-error">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h3>Camera Error</h3>
          <p>{error}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="webcam-detector">
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`webcam-video ${faceDetected ? 'face-detected' : ''}`}
        />
        <canvas
          ref={canvasRef}
          className="detection-canvas"
        />
        
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Initializing camera...</p>
          </div>
        )}

        <div className="detection-overlay">
          <div className={`status-indicator ${faceDetected ? 'active' : ''}`}>
            <div className="status-dot"></div>
            <span className="status-text">{detectionStatus}</span>
          </div>

          {faceDetected && (
            <div className="confidence-meter">
              <div className="meter-header">
                <span>Confidence</span>
                <span>{Math.round(Math.max(...Object.values(currentProbabilities)) * 100)}%</span>
              </div>
              <div className="meter-bar">
                <div 
                  className="meter-fill"
                  style={{ 
                    width: `${Math.max(...Object.values(currentProbabilities)) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="detection-guide">
          <div className="face-outline">
            <div className="corner top-left"></div>
            <div className="corner top-right"></div>
            <div className="corner bottom-left"></div>
            <div className="corner bottom-right"></div>
          </div>
          {!faceDetected && !isLoading && (
            <p className="guide-text">Position your face within the frame</p>
          )}
        </div>
      </div>

      {Object.keys(currentProbabilities).length > 0 && (
        <div className="live-emotions">
          <h4>Live Emotion Analysis</h4>
          <div className="emotions-grid">
            {Object.entries(currentProbabilities)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 6)
              .map(([emotion, probability]) => (
                <div key={emotion} className="emotion-item">
                  <div className="emotion-header">
                    <span className="emotion-name">
                      {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                    </span>
                    <span className="emotion-value">
                      {Math.round(probability * 100)}%
                    </span>
                  </div>
                  <div className="emotion-bar">
                    <div 
                      className="emotion-fill"
                      style={{ 
                        width: `${probability * 100}%`,
                        backgroundColor: `hsl(${120 * probability}, 70%, 50%)`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebcamMoodDetector;