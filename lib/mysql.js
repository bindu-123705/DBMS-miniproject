import mysql from 'mysql2/promise';

// One pool per application role. Each pool logs in with a DIFFERENT MySQL
// account (see db/mysql/04_rbac.sql), so database privileges follow the
// logged-in user's role: role-based access control inside the database.
const pools = globalThis.__epPools || (globalThis.__epPools = {});

export function pool(role = 'student') {
  const key = ['auth', 'student', 'head', 'admin'].includes(role) ? role : 'student';
  if (!pools[key]) {
    pools[key] = mysql.createPool({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: Number(process.env.MYSQL_PORT || 3306),
      database: process.env.MYSQL_DATABASE || 'eveport',
      user: process.env[`DB_${key.toUpperCase()}_USER`],
      password: process.env[`DB_${key.toUpperCase()}_PASSWORD`],
      waitForConnections: true,
      connectionLimit: 5,
      dateStrings: true,
      multipleStatements: false,
    });
  }
  return pools[key];
}

// session role -> database account
export const dbRole = (role) => (role === 'admin' ? 'admin' : role === 'club_head' ? 'head' : 'student');

export async function query(role, sql, params = []) {
  const [rows] = await pool(role).query(sql, params);
  return rows;
}

// CALL proc(...) and return the first result set
export async function call(role, name, params = []) {
  const [res] = await pool(role).query(`CALL ${name}(${params.map(() => '?').join(',')})`, params);
  return Array.isArray(res[0]) || res.length === 0 ? res[0] || [] : res;
}
