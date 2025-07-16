const { Pool } = require('pg');
require('dotenv').config();

// Use the same configuration as in your database.js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://biotracker:biotracker123@localhost:5432/biotracker',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Connected to database successfully!');
    
    // Check if our profile fields exist
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('avatar_url', 'bio', 'total_xp', 'created_at')
    `);
    
    if (result.rows.length === 4) {
      console.log('✅ Profile fields are present in the database:');
      result.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log('⚠️  Profile fields not found. Run the migration script.');
      console.log('   Run: psql -U biotracker -d biotracker < scripts/add-profile-fields.sql');
    }
    
    // Check for xp_transactions table
    const xpTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'xp_transactions'
      );
    `);
    
    if (xpTableResult.rows[0].exists) {
      console.log('✅ XP transactions table exists');
    } else {
      console.log('⚠️  XP transactions table not found');
    }
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n📝 Make sure PostgreSQL is running and accessible.');
    console.log('   If using Docker: docker-compose up -d postgres');
    console.log('   Database URL:', process.env.DATABASE_URL || 'postgresql://biotracker:biotracker123@localhost:5432/biotracker');
    process.exit(1);
  }
}

testConnection();