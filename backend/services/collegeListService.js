import pool from '../config/db.js';

export async function listColleges() {
  const r = await pool.query('SELECT * FROM college_list ORDER BY college_name');
  return r.rows.map((row) => ({
    id: row.id,
    college_name: row.college_name ?? '',
    place: row.place ?? null,
  }));
}

export async function createCollege({ college_name, place }) {
  const r = await pool.query(
    'INSERT INTO college_list (college_name, place) VALUES ($1, $2) RETURNING *',
    [college_name?.trim() || '', place?.trim() || null]
  );
  return r.rows[0];
}

export async function updateCollege(id, { college_name, place }) {
  const r = await pool.query(
    'UPDATE college_list SET college_name = $1, place = $2 WHERE id = $3 RETURNING *',
    [college_name?.trim(), place?.trim() || null, id]
  );
  return r.rows[0] || null;
}

export async function deleteCollege(id) {
  const r = await pool.query('DELETE FROM college_list WHERE id = $1 RETURNING id', [id]);
  return r.rowCount > 0;
}
