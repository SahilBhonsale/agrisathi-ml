import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { FiArrowRight, FiCheck, FiEye, FiEyeOff, FiLock, FiMail, FiShield } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();
  const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Login failed');
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
      setError(result.message || 'Google login failed');
    }

    setLoading(false);
  };

  const handleGoogleError = () => {
    setError('Google sign-in could not start. Confirm this website domain is listed as an Authorized JavaScript Origin in Google Cloud Console.');
  };

  return (
    <main className="login-page page-shell">
      <section className="login-story" aria-label="AgriSathi field intelligence">
        <div className="login-story-copy">
          <span className="eyebrow">Your agricultural workspace</span>
          <h1>Return to the<br />rhythm of your <em>field.</em></h1>
          <p>Plant health, local weather, trusted field knowledge and practical AI guidance—ready where you left them.</p>
        </div>

        <div className="login-landscape" aria-hidden="true">
          <div className="login-sun" />
          <div className="login-hill hill-back" />
          <div className="login-hill hill-front" />
          <div className="login-field field-one" />
          <div className="login-field field-two" />
          <div className="login-field field-three" />
          <div className="login-plant"><i /><i /><span /></div>
        </div>

        <div className="login-story-footer">
          <span>FIELD OS · 01</span>
          <div><i /> Secure connection</div>
        </div>
      </section>

      <section className="login-access">
        <div className="login-access-inner">
          <header className="login-heading">
            <span className="eyebrow">Welcome back</span>
            <h2>Continue growing.</h2>
            <p>Sign in to open your AgriSathi workspace.</p>
          </header>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-field-group">
              <span>Email address</span>
              <div className="login-input-shell">
                <FiMail />
                <input
                  type="email"
                  placeholder="farmer@example.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                />
              </div>
            </label>

            <label className="login-field-group">
              <span>Password</span>
              <div className="login-input-shell">
                <FiLock />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </label>

            {error && <div className="login-error" role="alert"><span>!</span>{error}</div>}

            <button type="submit" className="login-submit" disabled={loading}>
              <span>{loading ? 'Opening your workspace…' : 'Enter AgriSathi'}</span>
              {loading ? <i className="login-button-loader" /> : <FiArrowRight />}
            </button>

            {googleEnabled && (
              <>
                <div className="login-divider"><span>or continue securely with</span></div>
                <div className="login-google"><GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} text="signin_with" size="large" width="320" /></div>
              </>
            )}
          </form>

          <div className="login-register">
            <div><strong>New to AgriSathi?</strong><span>Create your free growing workspace.</span></div>
            <Link to="/signup">Create account <FiArrowRight /></Link>
          </div>

          <div className="login-assurance">
            <span><FiShield /> Your data stays private</span>
            <span><FiCheck /> Secure sign in</span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;
