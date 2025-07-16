import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
// import { mealsAPI, userAPI } from '../services/api';
import ExperienceBar from './ExperienceBar';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todayCalories: 0,
    weeklyAverage: 0,
    nutrientGoals: 0,
    streak: 0,
  });
  const [recentMeals, setRecentMeals] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [showXpAnimation, setShowXpAnimation] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch user stats including XP
      if (user?.id || user?.uid) {
        // For now, use default stats until backend is set up
        setUserStats({
          totalXp: user?.profile?.total_xp || 0,
          currentLevel: user?.profile?.level || 1,
          xpToNextLevel: 100,
          levelProgress: (user?.profile?.total_xp || 0) % 100
        });
      }

      // In a real app, these would be actual API calls
      setStats({
        todayCalories: 1850,
        weeklyAverage: 2100,
        nutrientGoals: 75,
        streak: 7,
      });

      setRecentMeals([
        {
          id: 1,
          name: 'Breakfast',
          time: '8:30 AM',
          calories: 450,
          icon: '🥞',
        },
        {
          id: 2,
          name: 'Lunch',
          time: '12:45 PM',
          calories: 680,
          icon: '🥗',
        },
        {
          id: 3,
          name: 'Snack',
          time: '3:30 PM',
          calories: 220,
          icon: '🍎',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: 'Track Meal', icon: '➕', action: '/nutrition' },
    { label: 'Scan Food', icon: '📷', action: '/scan' },
    { label: 'View Report', icon: '📊', action: '/insights' },
    { label: 'Set Goals', icon: '🎯', action: '/goals' },
  ];

  if (loading) {
    return (
      <div className="dashboard loading">
        <div className="skeleton skeleton-header"></div>
        <div className="skeleton skeleton-stats"></div>
        <div className="skeleton skeleton-content"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Experience Bar at the top */}
      {userStats && (
        <ExperienceBar
          currentXp={userStats.totalXp}
          currentLevel={userStats.currentLevel}
          xpToNextLevel={userStats.xpToNextLevel}
          showAnimation={showXpAnimation}
        />
      )}

      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Welcome back, {user?.email?.split('@')[0]}! 👋
          </h1>
          <p className="dashboard-subtitle">
            Here's your nutrition overview for today
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/nutrition'}
          >
            <span>Track Meal</span>
            <span className="btn-icon">➕</span>
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.todayCalories}</div>
            <div className="stat-label">Calories Today</div>
            <div className="stat-change positive">+12% vs goal</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value">{stats.weeklyAverage}</div>
            <div className="stat-label">Weekly Average</div>
            <div className="stat-change neutral">On track</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">{stats.nutrientGoals}%</div>
            <div className="stat-label">Goals Met</div>
            <div className="stat-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${stats.nutrientGoals}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card pulse">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.streak}</div>
            <div className="stat-label">Day Streak</div>
            <div className="stat-change positive">Keep it up!</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="dashboard-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="action-card"
              onClick={() => window.location.href = action.action}
            >
              <div className="action-icon">{action.icon}</div>
              <div className="action-label">{action.label}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Recent Meals */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Today's Meals</h2>
          <a href="/meals" className="section-link">View all →</a>
        </div>
        <div className="meals-list">
          {recentMeals.map((meal) => (
            <div key={meal.id} className="meal-item">
              <div className="meal-icon">{meal.icon}</div>
              <div className="meal-info">
                <div className="meal-name">{meal.name}</div>
                <div className="meal-time">{meal.time}</div>
              </div>
              <div className="meal-calories">
                <span className="calories-value">{meal.calories}</span>
                <span className="calories-unit">kcal</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Nutrient Overview */}
      <section className="dashboard-section">
        <h2 className="section-title">Nutrient Overview</h2>
        <div className="nutrient-grid">
          <div className="nutrient-card">
            <div className="nutrient-header">
              <span className="nutrient-name">Protein</span>
              <span className="nutrient-value">65g / 80g</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '81%' }}></div>
            </div>
          </div>
          <div className="nutrient-card">
            <div className="nutrient-header">
              <span className="nutrient-name">Carbs</span>
              <span className="nutrient-value">180g / 250g</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '72%' }}></div>
            </div>
          </div>
          <div className="nutrient-card">
            <div className="nutrient-header">
              <span className="nutrient-name">Fats</span>
              <span className="nutrient-value">55g / 70g</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '79%' }}></div>
            </div>
          </div>
          <div className="nutrient-card">
            <div className="nutrient-header">
              <span className="nutrient-name">Fiber</span>
              <span className="nutrient-value">22g / 30g</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '73%' }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Upgrade Prompt for Free Users */}
      {user?.tier === 'freemium' && (
        <div className="upgrade-prompt">
          <div className="upgrade-content">
            <h3>Unlock Full Nutrition Insights</h3>
            <p>Track 100+ nutrients, unlimited scans, and advanced analytics</p>
          </div>
          <button className="btn btn-primary">
            Upgrade to Premium
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;