# MVP Definition - User Profile & Experience System

## Core Features for First Working Version

### 1. User Profile Page
**Components:**
- Avatar display (URL input)
- Username (editable)
- Bio text (140 char limit)
- Statistics:
  - Current Level
  - Total XP
  - Meals Logged
  - Member Since

**User Actions:**
- Edit profile information
- View own statistics
- See XP progress to next level

### 2. Experience Bar Component
**Features:**
- Visual progress bar showing XP
- Current XP / XP to next level
- Animated fill on XP gain
- Integrated into main navigation

### 3. XP Gain System
**Triggers:**
- +10 XP when logging a meal
- Immediate visual feedback
- Server-side validation

### 4. Level Display
**Calculation:**
- Level = Math.floor(totalXP / 100) + 1
- Levels 1-99 possible
- "Level X" badge on profile

## Definition of Done
1. User can create and edit profile
2. XP is gained when logging meals
3. Level is calculated and displayed correctly
4. Progress bar animates on XP gain
5. All data persists in database
6. Mobile responsive design
7. No console errors
8. API endpoints are secure

## User Acceptance Criteria
- Profile loads in < 1 second
- XP updates immediately after meal log
- Level-up shows celebration message
- Profile changes save without page reload
- Works on mobile devices

## Nice-to-Have Features (Phase 2)
- Profile photo upload
- Achievement badges
- Daily login streaks
- XP multipliers
- Leaderboard
- Social sharing