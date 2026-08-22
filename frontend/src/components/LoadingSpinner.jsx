import React from 'react';
import '../styles/LoadingSpinner.css'; // Ensure you have this CSS file for styling

function LoadingSpinner() {
  return (
    <div className="spinner-container">
      <div className="loading-spinner"></div>
    </div>
  );
}

export default LoadingSpinner;