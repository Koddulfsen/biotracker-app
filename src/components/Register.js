import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';
// Removed Firebase imports - using backend API instead
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { register, error: authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    type: 'personal',
    profile: {
      age: '',
      sex: '',
      height: '',
      weight: '',
      activityLevel: 'moderate',
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('profile.')) {
      const profileField = name.split('.')[1];
      setFormData({
        ...formData,
        profile: {
          ...formData.profile,
          [profileField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const validateStep1 = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      return 'Please fill in all fields';
    }
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleNext = () => {
    const error = validateStep1();
    if (error) {
      alert(error);
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Register user via backend API
      const registrationData = {
        email: formData.email,
        password: formData.password,
        type: formData.type,
        profile: {
          age: parseInt(formData.profile.age),
          sex: formData.profile.sex,
          height: parseFloat(formData.profile.height),
          weight: parseFloat(formData.profile.weight),
          activityLevel: formData.profile.activityLevel,
        },
      };
      
      await register(registrationData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      alert(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Start tracking your nutrition journey</p>
        </div>

        {authError && (
          <div className="error-message">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {step === 1 ? (
            <>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  disabled={loading}
                />
                <small>At least 8 characters</small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="type">Account Type</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="personal">Personal</option>
                  <option value="practitioner">Healthcare Practitioner</option>
                </select>
              </div>

              <button
                type="button"
                className="auth-button"
                onClick={handleNext}
                disabled={loading}
              >
                Next
              </button>
            </>
          ) : (
            <>
              <h3>Personal Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="profile.age">Age</label>
                  <input
                    type="number"
                    id="profile.age"
                    name="profile.age"
                    value={formData.profile.age}
                    onChange={handleChange}
                    required
                    min="1"
                    max="150"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="profile.sex">Biological Sex</label>
                  <select
                    id="profile.sex"
                    name="profile.sex"
                    value={formData.profile.sex}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="profile.height">Height (cm)</label>
                  <input
                    type="number"
                    id="profile.height"
                    name="profile.height"
                    value={formData.profile.height}
                    onChange={handleChange}
                    required
                    min="50"
                    max="300"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="profile.weight">Weight (kg)</label>
                  <input
                    type="number"
                    id="profile.weight"
                    name="profile.weight"
                    value={formData.profile.weight}
                    onChange={handleChange}
                    required
                    min="20"
                    max="500"
                    step="0.1"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="profile.activityLevel">Activity Level</label>
                <select
                  id="profile.activityLevel"
                  name="profile.activityLevel"
                  value={formData.profile.activityLevel}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="sedentary">Sedentary (little to no exercise)</option>
                  <option value="light">Lightly Active (1-3 days/week)</option>
                  <option value="moderate">Moderately Active (3-5 days/week)</option>
                  <option value="active">Very Active (6-7 days/week)</option>
                  <option value="extreme">Extremely Active (athlete)</option>
                </select>
              </div>

              <div className="form-actions-row">
                <button
                  type="button"
                  className="auth-button secondary"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="auth-button"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </>
          )}
        </form>

        {step === 1 && (
          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;