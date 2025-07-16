import React, { useEffect, useState } from 'react';
import './ExperienceBar.css';

const ExperienceBar = ({ currentXp, currentLevel, xpToNextLevel, showAnimation = false }) => {
  const [animatedXp, setAnimatedXp] = useState(currentXp);
  const [showLevelUp, setShowLevelUp] = useState(false);
  
  // Calculate progress percentage
  const levelXp = (currentLevel - 1) * 100;
  const xpInCurrentLevel = currentXp - levelXp;
  const progressPercentage = (xpInCurrentLevel / 100) * 100;

  useEffect(() => {
    if (showAnimation && currentXp > animatedXp) {
      // Animate XP increase
      const difference = currentXp - animatedXp;
      const steps = 20;
      const increment = difference / steps;
      let step = 0;

      const interval = setInterval(() => {
        step++;
        setAnimatedXp(prev => {
          const newXp = prev + increment;
          // Check if we leveled up
          if (Math.floor(newXp / 100) > Math.floor(prev / 100)) {
            setShowLevelUp(true);
            setTimeout(() => setShowLevelUp(false), 3000);
          }
          return newXp;
        });

        if (step >= steps) {
          setAnimatedXp(currentXp);
          clearInterval(interval);
        }
      }, 50);

      return () => clearInterval(interval);
    } else {
      setAnimatedXp(currentXp);
    }
  }, [currentXp, showAnimation]);

  return (
    <div className="experience-bar-container">
      <div className="experience-info">
        <div className="level-badge">
          <span className="level-text">Level</span>
          <span className="level-number">{currentLevel}</span>
        </div>
        <div className="xp-text">
          <span className="current-xp">{Math.floor(animatedXp)} XP</span>
          <span className="xp-separator">/</span>
          <span className="next-level-xp">{currentLevel * 100} XP</span>
        </div>
      </div>
      
      <div className="experience-bar">
        <div 
          className="experience-fill"
          style={{ 
            width: `${progressPercentage}%`,
            transition: showAnimation ? 'width 1s ease-out' : 'none'
          }}
        >
          <div className="experience-glow"></div>
        </div>
      </div>

      <div className="xp-to-next">
        {xpToNextLevel} XP to Level {currentLevel + 1}
      </div>

      {showLevelUp && (
        <div className="level-up-notification">
          <div className="level-up-content">
            <h2>LEVEL UP!</h2>
            <p>You've reached Level {currentLevel}!</p>
            <div className="celebration-emoji">🎉</div>
          </div>
        </div>
      )}

      {showAnimation && currentXp > animatedXp && (
        <div className="xp-gain-popup">
          +10 XP!
        </div>
      )}
    </div>
  );
};

export default ExperienceBar;