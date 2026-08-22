import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, googleLogin } = useAuth();
  const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(formData.name, formData.email, formData.password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Registration failed');
    }

    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);

    const result = await googleLogin(credentialResponse.credential);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Google sign up failed');
    }

    setLoading(false);
  };

  const handleGoogleError = () => {
    setError('Google sign-up could not start. Confirm this website domain is listed as an Authorized JavaScript Origin in Google Cloud Console.');
  };

  return (
    <div className="auth-container">
      <h2>📝 Join AgriSathi</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          required
          value={formData.name}
          onChange={handleChange}
          disabled={loading}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
        {error && <div className="auth-error">{error}</div>}

        {googleEnabled && <><div className="divider-or"><span>or</span></div><div className="google-login-wrapper"><GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} text="signup_with" size="large" /></div></>}
        
        Already have an account? <Link to="/login">Login here</Link>
      </form>
    </div>
  );
}

export default Signup;
