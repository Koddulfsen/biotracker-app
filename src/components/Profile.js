import React, { useState } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    age: user?.profile?.age || '',
    sex: user?.profile?.sex || '',
    height: user?.profile?.height || '',
    weight: user?.profile?.weight || '',
    activityLevel: user?.profile?.activityLevel || 'moderate',
  });

  const handleSave = async () => {
    try {
      await updateProfile(profile);
      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>My Profile</h1>
        <button 
          className="btn btn-primary"
          onClick={() => editing ? handleSave() : setEditing(true)}
        >
          {editing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h2>Account Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Email</label>
              <div className="info-value">{user?.email}</div>
            </div>
            <div className="info-item">
              <label>Account Type</label>
              <div className="info-value">{user?.type?.charAt(0).toUpperCase() + user?.type?.slice(1)}</div>
            </div>
            <div className="info-item">
              <label>Subscription</label>
              <div className="info-value">
                <span className="tier-badge">{user?.tier?.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Personal Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Age</label>
              {editing ? (
                <input
                  type="number"
                  className="form-input"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                />
              ) : (
                <div className="info-value">{profile.age || 'Not set'}</div>
              )}
            </div>
            <div className="info-item">
              <label>Biological Sex</label>
              {editing ? (
                <select
                  className="form-input"
                  value={profile.sex}
                  onChange={(e) => setProfile({ ...profile, sex: e.target.value })}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <div className="info-value">{profile.sex || 'Not set'}</div>
              )}
            </div>
            <div className="info-item">
              <label>Height (cm)</label>
              {editing ? (
                <input
                  type="number"
                  className="form-input"
                  value={profile.height}
                  onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                />
              ) : (
                <div className="info-value">{profile.height || 'Not set'}</div>
              )}
            </div>
            <div className="info-item">
              <label>Weight (kg)</label>
              {editing ? (
                <input
                  type="number"
                  className="form-input"
                  value={profile.weight}
                  onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
                />
              ) : (
                <div className="info-value">{profile.weight || 'Not set'}</div>
              )}
            </div>
            <div className="info-item">
              <label>Activity Level</label>
              {editing ? (
                <select
                  className="form-input"
                  value={profile.activityLevel}
                  onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value })}
                >
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Lightly Active</option>
                  <option value="moderate">Moderately Active</option>
                  <option value="active">Very Active</option>
                  <option value="extreme">Extremely Active</option>
                </select>
              ) : (
                <div className="info-value">{profile.activityLevel || 'Not set'}</div>
              )}
            </div>
          </div>
        </div>

        {user?.tier === 'freemium' && (
          <div className="upgrade-section">
            <h3>Unlock Premium Features</h3>
            <p>Get access to advanced analytics, unlimited scans, and 100+ nutrient tracking</p>
            <button className="btn btn-primary">Upgrade to Premium</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;