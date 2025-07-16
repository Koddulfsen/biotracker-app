import React from 'react';
import './Loading.css';

const Loading = ({ fullScreen = true, message = 'Loading...' }) => {
  return (
    <div className={`loading-container ${fullScreen ? 'fullscreen' : ''}`}>
      <div className="loading-content">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
};

export default Loading;