import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';
import './Navigation.css';

const Navigation = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [userLevel, setUserLevel] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: '📊',
      badge: null,
    },
    {
      path: '/nutrition',
      label: 'Track Nutrition',
      icon: '🥗',
      badge: user?.tier === 'freemium' ? 'FREE' : null,
    },
    {
      path: '/meals',
      label: 'My Meals',
      icon: '🍽️',
      badge: null,
    },
    {
      path: '/scan',
      label: 'Scan Food',
      icon: '📱',
      badge: user?.tier === 'freemium' ? '5/day' : null,
    },
    {
      path: '/insights',
      label: 'Insights',
      icon: '💡',
      badge: user?.tier === 'freemium' ? 'PRO' : null,
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: '👤',
      badge: null,
    },
  ];

  // Add practitioner-specific items
  if (user?.type === 'practitioner') {
    navItems.splice(4, 0, {
      path: '/patients',
      label: 'Patients',
      icon: '👥',
      badge: null,
    });
  }

  return (
    <nav className={`navigation ${collapsed ? 'collapsed' : ''}`}>
      <div className="nav-header">
        <div className="nav-logo">
          <span className="logo-icon">🧬</span>
          {!collapsed && <span className="logo-text">Bio-Tracker</span>}
        </div>
        <button
          className="nav-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle navigation"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <div className="nav-user">
        <div className="user-avatar">
          {user?.email?.[0]?.toUpperCase() || 'U'}
          {userLevel && (
            <div className="user-level-badge" title={`Level ${userLevel}`}>
              {userLevel}
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="user-info">
            <div className="user-name">{user?.email?.split('@')[0]}</div>
            <div className="user-tier">
              {userLevel ? `Level ${userLevel} • ` : ''}
              {user?.tier?.toUpperCase()} PLAN
            </div>
          </div>
        )}
      </div>

      <ul className="nav-menu">
        {navItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="nav-label">{item.label}</span>
                  {item.badge && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="nav-footer">
        {user?.tier === 'freemium' && !collapsed && (
          <button className="upgrade-btn" onClick={() => navigate('/upgrade')}>
            <span className="upgrade-icon">⚡</span>
            Upgrade to Pro
          </button>
        )}
        
        <button className="logout-btn" onClick={handleLogout}>
          <span className="logout-icon">🚪</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </nav>
  );
};

export default Navigation;