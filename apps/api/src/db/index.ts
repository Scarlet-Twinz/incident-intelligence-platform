import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5435),
  user: process.env.DB_USER ?? "vanta",
  password: process.env.DB_PASSWORD ?? "vanta_dev_password",
  database: process.env.DB_NAME ?? "vanta",
});

export async function testDatabaseConnection() {
  const result = await pool.query("SELECT NOW() AS now");
  return result.rows[0];
}
