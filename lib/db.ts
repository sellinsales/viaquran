import mysql, { Pool } from "mysql2/promise";

declare global {
  var __viaquranPool: Pool | undefined;
}

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required database environment variable: ${name}`);
  }
  return value;
}

export function getDbPool() {
  if (!global.__viaquranPool) {
    global.__viaquranPool = mysql.createPool({
      host: required("DB_HOST"),
      port: Number(process.env.DB_PORT || "3306"),
      database: required("DB_NAME"),
      user: required("DB_USER"),
      password: required("DB_PASSWORD"),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: "utf8mb4",
      namedPlaceholders: true,
    });
  }

  return global.__viaquranPool;
}

