# BioTracker User Profile & Experience System - PRD Lite

## Problem Statement
Users need motivation and engagement to consistently track their nutrition. A gamification system with user profiles and experience points will increase retention and make tracking enjoyable.

## Target Users
- Primary: Individual users tracking personal nutrition
- Secondary: Health-conscious individuals who enjoy gamification

## Core Features (MVP)

### 1. User Profiles
- Customizable username
- Avatar (URL-based)
- Bio text (140 characters)
- Member since date
- Statistics display

### 2. Experience System
- Earn 10 XP per meal logged
- Total XP tracked per user
- Visual XP progress bar

### 3. Level System
- Simple calculation: Level = floor(XP / 100) + 1
- Level displayed on profile and dashboard
- Level-up notifications

## Success Criteria
- Users log 50% more meals after implementation
- 70% of users customize their profile
- Average session time increases by 30%

## Technical Constraints
- Must integrate with existing React/Node.js/PostgreSQL stack
- No additional authentication required (uses existing Firebase auth)
- Mobile-responsive design
- Server-side XP calculations (prevent cheating)

## Out of Scope (Future Features)
- Achievements/badges system
- Leaderboards
- Streak tracking
- Social features
- XP from other activities