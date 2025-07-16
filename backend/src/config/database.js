const knex = require('knex');
const { logger } = require('../utils/logger');

const config = {
  client: 'postgresql',
  connection: process.env.DATABASE_URL || {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'biotracker',
    password: process.env.DB_PASSWORD || 'biotracker123',
    database: process.env.DB_NAME || 'biotracker'
  },
  pool: {
    min: 2,
    max: 10,
    afterCreate: (conn, done) => {
      // Enable Row Level Security
      conn.query('SET row_security = on;', (err) => {
        done(err, conn);
      });
    }
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations'
  },
  seeds: {
    directory: './seeds'
  }
};

const db = knex(config);

// Test database connection
db.raw('SELECT 1')
  .then(() => {
    logger.info('Database connected successfully');
  })
  .catch(err => {
    logger.error('Database connection failed:', err);
    process.exit(1);
  });

module.exports = db;