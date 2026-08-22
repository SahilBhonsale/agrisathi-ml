import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiCheck, FiMail, FiRefreshCw, FiShield, FiUser } from 'react-icons/fi';
import '../styles/Profile.css';

function Profile() {
  const { user, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      const result = await refreshUser();
      if (!result.success) throw new Error('Unable to refresh account information');
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (!user) {
    return (
      <div className="profile-container page-shell">
        <div className="error-state">
          <h2> Access Denied</h2>
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="profile-container page-shell">
      <div className="profile-header">
        <div><span className="eyebrow">Account center</span><h1>Your profile</h1><p>Review your AgriSathi identity and account access.</p></div>
        <button 
          className="refresh-btn" 
          onClick={handleRefresh}
          disabled={refreshing}
          title="Log out and refresh admin status"
        >
          <FiRefreshCw className={refreshing ? 'spinning' : ''} /> {refreshing ? 'Refreshing…' : 'Refresh status'}
        </button>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar">
            <div className="avatar-circle">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div><h2>{user.name}</h2><p>{user.isAdmin ? 'Platform administrator' : 'AgriSathi member'}</p></div>
          </div>

          <div className="profile-info">
            <div className="info-section">
              <h3><FiUser /> Basic information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Full name</span>
                  <span className="value">{user.name}</span>
                </div>
                <div className="info-item">
                  <span className="label"><FiMail /> Email</span>
                  <span className="value">{user.email}</span>
                </div>
                <div className="info-item">
                  <span className="label">Account ID</span>
                  <span className="value">{user._id}</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3><FiShield /> Account access</h3>
              <div className="status-grid">
                <div className="status-item">
                  <span className="status-label">Account type</span>
                  <span className={`status-badge ${user.isAdmin ? 'admin' : 'user'}`}>
                    {user.isAdmin ? 'Administrator' : 'Member'}
                  </span>
                </div>
                {user.createdAt && (
                  <div className="info-item">
                    <span className="label">Member since</span>
                    <span className="value">{formatDate(user.createdAt)}</span>
                  </div>
                )}
                
                {user.isAdmin && (
                  <div className="admin-privileges">
                    <h4>Administrator privileges</h4>
                    <ul className="privileges-list">
                      <li><FiCheck /> Manage the care library</li>
                      <li><FiCheck /> Access administration tools</li>
                      <li><FiCheck /> Moderate community discussions</li>
                      <li><FiCheck /> Manage marketplace listings</li>
                      <li><FiCheck /> Review platform analytics</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {user.isAdmin && (
              <div className="admin-verification">
                <div className="verification-card">
                  <h3>Verified access</h3>
                  <div className="verification-status">
                    <div className="verification-check">
                      <FiShield /> <strong>Verified administrator</strong>
                    </div>
                    <p className="verification-text">
                      You have full administrative privileges on this platform. 
                      You can manage content, moderate discussions, and access all admin features.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
