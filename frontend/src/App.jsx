import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AppRoutes from './routes/AppRoutes';
import Sidebar from './components/Sidebar';
import './styles/App.css';
// import AskQuestion from './pages/AskQuestion';

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div> Loading AgriSathi...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />
      <div className="main-layout">
        {user && <Sidebar />}
        <div className="content">
          <AppRoutes />
        </div>
      </div>
    </div>
  );
};

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const app = (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );

  if (!googleClientId) return app;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {app}
    </GoogleOAuthProvider>
  );
}

{/* <Route path="/forum/ask" element={<AskQuestion />} /> */}
export default App;
