import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/SupabaseAuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import NutritionTab from './NutritionTab';
import UserProfile from './components/UserProfile';
import Loading from './components/Loading';
import Navigation from './components/Navigation';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <Loading />;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// App Layout Component
const AppLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="app-container">
      {isAuthenticated && <Navigation />}
      <main className="app-main">
        {children}
      </main>
    </div>
  );
};

// Main App Component
function App() {
  const [theme, setTheme] = useState('dark');
  
  useEffect(() => {
    // Apply theme class to body
    document.body.className = `theme-${theme}`;
    
    // Add smooth transitions after initial load
    setTimeout(() => {
      document.body.classList.add('transitions-enabled');
    }, 100);
  }, [theme]);
  
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/nutrition" element={
            <ProtectedRoute>
              <AppLayout>
                <NutritionTab />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <AppLayout>
                <UserProfile />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;