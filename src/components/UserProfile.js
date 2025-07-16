import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import ExperienceBar from './ExperienceBar';
import { userAPI } from '../services/api';
import './UserProfile.css';

const UserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    avatarUrl: '',
    bio: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getProfileWithStats(user.id || user.uid);
      setProfile(response.profile);
      setStats(response.stats);
      setEditForm({
        username: response.profile.username || '',
        avatarUrl: response.profile.avatarUrl || '',
        bio: response.profile.bio || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setEditing(false);
    setEditForm({
      username: profile.username || '',
      avatarUrl: profile.avatarUrl || '',
      bio: profile.bio || ''
    });
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Character count validation for bio
    if (name === 'bio' && value.length > 140) {
      setError('Bio must be 140 characters or less');
    } else {
      setError(null);
    }
  };

  const handleSave = async () => {
    if (editForm.bio.length > 140) {
      setError('Bio must be 140 characters or less');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const response = await userAPI.updateProfileById(user.id || user.uid, editForm);
      setProfile(prev => ({
        ...prev,
        ...response.profile
      }));
      setEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile || !stats) {
    return (
      <div className="profile-error">
        <p>Failed to load profile. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="avatar-container">
            {profile.avatarUrl ? (
              <img 
                src={profile.avatarUrl} 
                alt={profile.username || 'User avatar'} 
                className="profile-avatar"
              />
            ) : (
              <div className="profile-avatar-placeholder">
                {(profile.username || profile.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {editing && (
            <input
              type="url"
              name="avatarUrl"
              value={editForm.avatarUrl}
              onChange={handleChange}
              placeholder="Avatar URL"
              className="avatar-url-input"
            />
          )}
        </div>

        <div className="profile-info-section">
          {editing ? (
            <input
              type="text"
              name="username"
              value={editForm.username}
              onChange={handleChange}
              placeholder="Username"
              className="username-input"
            />
          ) : (
            <h1 className="profile-username">{profile.username || profile.email}</h1>
          )}

          <p className="member-since">Member since {formatDate(profile.memberSince)}</p>

          {editing ? (
            <div className="bio-edit-container">
              <textarea
                name="bio"
                value={editForm.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                className="bio-textarea"
                maxLength={140}
              />
              <span className="bio-char-count">
                {editForm.bio.length}/140
              </span>
            </div>
          ) : (
            <p className="profile-bio">{profile.bio || 'No bio yet. Click edit to add one!'}</p>
          )}
        </div>

        <div className="profile-actions">
          {editing ? (
            <>
              <button 
                onClick={handleSave} 
                disabled={saving || error}
                className="save-button"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button 
                onClick={handleCancel}
                disabled={saving}
                className="cancel-button"
              >
                Cancel
              </button>
            </>
          ) : (
            <button onClick={handleEdit} className="edit-button">
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <ExperienceBar
        currentXp={stats.totalXp}
        currentLevel={stats.currentLevel}
        xpToNextLevel={stats.xpToNextLevel}
        showAnimation={false}
      />

      <div className="profile-stats">
        <h2>Your Stats</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.currentLevel}</div>
            <div className="stat-label">Current Level</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalXp}</div>
            <div className="stat-label">Total XP</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.mealsLogged}</div>
            <div className="stat-label">Meals Logged</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.daysTracked}</div>
            <div className="stat-label">Days Tracked</div>
          </div>
        </div>
      </div>

      <div className="profile-achievements">
        <h2>Achievements</h2>
        <p className="coming-soon">Coming soon! Keep tracking your meals to unlock achievements.</p>
      </div>
    </div>
  );
};

export default UserProfile;