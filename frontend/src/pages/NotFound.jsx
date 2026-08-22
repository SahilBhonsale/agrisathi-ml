import React from 'react';
import { Link } from 'react-router-dom';
// import '../styles/NotFound.css';

function NotFound() {
  return (
    <div className="not-found-container">
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for doesn't exist or has been moved.</p>
      <Link to="/" className="home-link">Go back to Home</Link>
    </div>
  );
}

export default NotFound;