import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import './WebcamMoodDetector.css';

function WebcamMoodDetector({ setMood }) {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [loading, setLoading] = useState(true);

  // Load models once on mount
  useEffect(() => {
    const loadModels = async () => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models/tiny_face_detector_model'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models/face_expression_model')
      ]);
      startVideo();
    };

    loadModels();
  }, []);

  // Start webcam stream
  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error('Error accessing webcam:', err));
  };

  // Handle video playing → start detection loop
  const handleVideoOnPlay = () => {
    setLoading(false);

    const interval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4) return;

      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: 0.5
      });

      const detections = await faceapi
        .detectAllFaces(videoRef.current, options)
        .withFaceExpressions();

      const dims = {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight
      };

      faceapi.matchDimensions(canvasRef.current, dims);

      const resized = faceapi.resizeResults(detections, dims);

      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, dims.width, dims.height);

      faceapi.draw.drawDetections(canvasRef.current, resized);
      faceapi.draw.drawFaceExpressions(canvasRef.current, resized);

      if (detections.length > 0) {
        const expr = detections[0].expressions;
        const sorted = Object.entries(expr).sort((a, b) => b[1] - a[1]);
        const topExpression = sorted[0][0];
        setMood(topExpression);
      }
    }, 1000);

    // Cleanup when unmounting
    return () => clearInterval(interval);
  };

  return (
    <div className="webcam-container">
      {loading && <p>Loading models and webcam...</p>}
      <video
        ref={videoRef}
        autoPlay
        muted
        width="640"
        height="480"
        onPlay={handleVideoOnPlay}
      />
      <canvas ref={canvasRef} className="overlay" />
    </div>
  );
}

export default WebcamMoodDetector;
