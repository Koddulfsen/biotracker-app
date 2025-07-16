# TODO List - BioTracker Profile & XP System

## Database Tasks (Complexity: 2)
- [ ] Create migration script for user profile fields
  - Add avatar_url VARCHAR(255)
  - Add bio TEXT (140 char limit)
  - Add total_xp INTEGER DEFAULT 0
  - Add created_at TIMESTAMP
- [ ] Run migration on development database
- [ ] Create seed data for testing

## Backend API Tasks (Complexity: 3)

### Profile Endpoints
- [ ] GET /api/users/profile/:userId
  - Return user profile data including XP and level
- [ ] PUT /api/users/profile/:userId
  - Update avatar_url and bio
  - Validate bio length
- [ ] GET /api/users/stats/:userId
  - Return detailed statistics

### XP System
- [ ] Create experience.service.js
  - calculateLevel(xp) function
  - addExperience(userId, amount) function
- [ ] Modify POST /api/meals endpoint
  - Call addExperience after meal creation
  - Return new XP total in response
- [ ] Add XP validation middleware

## Frontend Tasks (Complexity: 4)

### Components
- [ ] Create ExperienceBar.js component
  ```
  - Progress bar with current/next level XP
  - Animation on XP gain
  - Responsive design
  ```
- [ ] Create UserProfile.js page
  ```
  - Avatar display/edit
  - Bio display/edit
  - Statistics grid
  - Save changes functionality
  ```
- [ ] Create LevelBadge.js component
  ```
  - Display current level
  - Visual level indicator
  ```

### Integration Tasks
- [ ] Update AuthContext.js
  - Add userProfile to context
  - Add XP/level getters
- [ ] Modify Dashboard.js
  - Add ExperienceBar to top
  - Show level badge
- [ ] Update Navigation.js
  - Add profile link
  - Show user avatar
- [ ] Modify meal logging flow
  - Show +10 XP animation
  - Update XP bar immediately

### Styling Tasks
- [ ] Create Profile.css
- [ ] Create ExperienceBar.css
- [ ] Add XP gain animation styles
- [ ] Ensure mobile responsiveness

## Testing Tasks (Complexity: 2)
- [ ] Write unit tests for XP calculations
- [ ] Test profile API endpoints
- [ ] Test meal → XP flow
- [ ] Manual testing on mobile

## Deployment Tasks (Complexity: 1)
- [ ] Update environment variables
- [ ] Run production migrations
- [ ] Deploy backend changes
- [ ] Deploy frontend changes

## Setup Requirements (User Action Needed)
- [ ] ⚠️ Configure database connection in backend/src/config/database.js
- [ ] ⚠️ Set up Firebase project (if not already done)
- [ ] ⚠️ Update .env files with required variables

## Notes
- Each task marked with ⚠️ requires user configuration
- Estimated total time: 2-3 days
- All tasks should maintain backwards compatibility