import { pool } from "./db.js";
import { hashPassword, verifyPasswordHash } from "./auth.js";

export async function createRole(name, permissions) {
  const { rows } = await pool.query(
    "INSERT INTO admin_roles (name, permissions) VALUES ($1, $2) RETURNING *",
    [name, JSON.stringify(permissions || {})],
  );
  return rows[0];
}

export async function getRoles() {
  const { rows } = await pool.query(
    "SELECT * FROM admin_roles ORDER BY created_at ASC",
  );
  return rows;
}

export async function updateRole(id, name, permissions) {
  const { rows } = await pool.query(
    "UPDATE admin_roles SET name = $1, permissions = $2 WHERE id = $3 RETURNING *",
    [name, JSON.stringify(permissions || {}), id],
  );
  return rows[0] || null;
}

export async function deleteRole(id) {
  const { rowCount } = await pool.query(
    "DELETE FROM admin_roles WHERE id = $1",
    [id],
  );
  return rowCount > 0;
}

export async function createAdminUser(name, email, password, roleId) {
  const password_hash = hashPassword(password);
  const { rows } = await pool.query(
    "INSERT INTO admin_users (name, email, password_hash, role_id) VALUES ($1, $2, $3, $4) RETURNING *",
    [name, email, password_hash, roleId || null],
  );
  return rows[0];
}

export async function getAdminUsers() {
  const { rows } = await pool.query(`
    SELECT au.*, ar.name AS role_name, ar.permissions AS role_permissions
    FROM admin_users au
    LEFT JOIN admin_roles ar ON au.role_id = ar.id
    ORDER BY au.created_at ASC
  `);
  return rows;
}

export async function updateAdminUser(id, { name, email, roleId, isActive }) {
  const fields = [];
  const vals = [];
  let idx = 1;
  if (name !== undefined) {
    fields.push(`name = $${idx++}`);
    vals.push(name);
  }
  if (email !== undefined) {
    fields.push(`email = $${idx++}`);
    vals.push(email);
  }
  if (roleId !== undefined) {
    fields.push(`role_id = $${idx++}`);
    vals.push(roleId || null);
  }
  if (isActive !== undefined) {
    fields.push(`is_active = $${idx++}`);
    vals.push(isActive);
  }
  if (fields.length === 0) return getAdminUserById(id);
  vals.push(id);
  const { rows } = await pool.query(
    `UPDATE admin_users SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
    vals,
  );
  return rows[0] || null;
}

export async function deleteAdminUser(id) {
  const { rowCount } = await pool.query(
    "DELETE FROM admin_users WHERE id = $1",
    [id],
  );
  return rowCount > 0;
}

export async function verifyAdminLogin(email, password) {
  const { rows } = await pool.query(
    `
    SELECT au.*, ar.name AS role_name, ar.permissions AS role_permissions
    FROM admin_users au
    LEFT JOIN admin_roles ar ON au.role_id = ar.id
    WHERE lower(au.email) = lower($1) AND au.is_active = TRUE
  `,
    [email],
  );
  const user = rows[0];
  if (!user) return null;
  if (!verifyPasswordHash(password, user.password_hash)) return null;
  return user;
}

export async function getAdminUserById(id) {
  const { rows } = await pool.query(
    `
    SELECT au.*, ar.name AS role_name, ar.permissions AS role_permissions
    FROM admin_users au
    LEFT JOIN admin_roles ar ON au.role_id = ar.id
    WHERE au.id = $1
  `,
    [id],
  );
  return rows[0] || null;
}
