import React from 'react';
import './NutritionTracker.css';

const NutritionTracker = () => {
  return (
    <div className="nutrition-tracker">
      <div className="page-header">
        <h1>Track Nutrition</h1>
        <p className="page-subtitle">Log your meals and monitor your nutritional intake</p>
      </div>
      
      <div className="content-placeholder">
        <div className="placeholder-icon">🥗</div>
        <h2>Nutrition Tracking Coming Soon</h2>
        <p>This feature will allow you to track meals and monitor 100+ nutrients.</p>
      </div>
    </div>
  );
};

export default NutritionTracker;