import pg from 'pg';

const { Pool } = pg;

// Use DATABASE_URL (e.g. from Railway, Render) or individual DB_* env vars
const url = process.env.DATABASE_URL;
const config = url
  ? {
      connectionString: url,
      ssl: /^postgres(ql)?:\/\//i.test(url) ? { rejectUnauthorized: false } : undefined,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'mycap',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(config);

export default pool;
