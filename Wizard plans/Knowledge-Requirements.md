# Knowledge Requirements for Implementation

## Documentation Needed

### 1. Database Migration
- PostgreSQL ALTER TABLE syntax
- Node.js migration tools (if using one)
- Existing database schema reference

### 2. React Animation Libraries
- CSS transitions for XP bar
- Optional: framer-motion basics for celebrations
- React state animations patterns

### 3. File Upload (Future)
- Cloudinary or S3 integration (for Phase 2)
- For MVP: Simple URL validation

### 4. API Security
- Express middleware patterns
- User authorization (ensure users can only edit own profile)
- Input validation best practices

## Existing Code to Reference

### Backend
- `backend/src/routes/user.routes.js` - User route patterns
- `backend/src/middleware/auth.js` - Auth middleware
- `backend/src/config/database.js` - DB connection

### Frontend  
- `src/contexts/AuthContext.js` - Context patterns
- `src/components/Dashboard.js` - Component structure
- `src/services/api.js` - API call patterns

## External Resources

### Quick References
1. **PostgreSQL Migrations**
   ```sql
   ALTER TABLE users 
   ADD COLUMN avatar_url VARCHAR(255),
   ADD COLUMN bio TEXT,
   ADD COLUMN total_xp INTEGER DEFAULT 0;
   ```

2. **React Progress Bar**
   ```jsx
   <div className="xp-bar">
     <div className="xp-fill" style={{width: `${percentage}%`}}/>
   </div>
   ```

3. **Express Route Pattern**
   ```js
   router.put('/profile/:userId', auth, async (req, res) => {
     // Implementation
   });
   ```

## Potential Issues & Solutions

### Issue: Real-time XP updates
**Solution**: Use React state optimistic updates

### Issue: Profile image sizing
**Solution**: CSS object-fit: cover for consistent display

### Issue: XP calculation consistency  
**Solution**: Always calculate server-side, never trust client

### Issue: Mobile responsiveness
**Solution**: Use flexbox/grid, test on Chrome DevTools

## No External Dependencies Needed
The MVP can be built entirely with existing tools in the codebase. No additional learning required beyond standard React/Express patterns.