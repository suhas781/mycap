import pool from '../config/db.js';

/**
 * Revenue analytics from lead_conversion_details + leads.
 * Admin: all converted leads. Team Lead: only leads where source_id IN (lead_sources with team_lead_id = userId).
 * Optional: cluster_manager, architect, hr → same as admin (read-only).
 */
function getLeadFilterForRole(role, userId) {
  if (role === 'admin' || role === 'cluster_manager' || role === 'architect' || role === 'hr') {
    return { sql: '', params: [] };
  }
  if (role === 'team_lead') {
    return {
      sql: ` AND l.source_id IN (SELECT id FROM lead_sources WHERE team_lead_id = $1)`,
      params: [userId],
    };
  }
  return null;
}

/**
 * GET revenue analytics. Returns totals, by course, and over time.
 * @param {Object} opts - { userId, role, dateFrom, dateTo } (dateFrom/dateTo optional, for revenue_over_time)
 */
export async function getRevenueAnalytics(opts) {
  const { userId, role, dateFrom, dateTo } = opts;
  const filter = getLeadFilterForRole(role, userId);
  if (filter === null) {
    return {
      total_revenue: 0,
      total_units: 0,
      avg_revenue_per_unit: 0,
      total_due: 0,
      revenue_by_course: [],
      revenue_over_time: [],
    };
  }

  const baseWhere = `FROM lead_conversion_details c INNER JOIN leads l ON l.id = c.lead_id AND l.status = 'Converted'${filter.sql}`;
  const params = [...filter.params];

  const totalRes = await pool.query(
    `SELECT
       COALESCE(SUM(c.amount_paid), 0)::numeric AS total_revenue,
       COUNT(c.id)::int AS total_units,
       COALESCE(SUM(c.due_amount), 0)::numeric AS total_due
     ${baseWhere}`,
    params
  );
  const row = totalRes.rows[0] || {};
  const totalRevenue = Number(row.total_revenue) || 0;
  const totalUnits = Number(row.total_units) || 0;
  const totalDue = Number(row.total_due) || 0;
  const avgRevenuePerUnit = totalUnits > 0 ? totalRevenue / totalUnits : 0;

  const byCourseRes = await pool.query(
    `SELECT
       COALESCE(c.course_name, '(Unnamed)') AS course_name,
       COUNT(c.id)::int AS units,
       COALESCE(SUM(c.amount_paid), 0)::numeric AS total_revenue,
       COALESCE(AVG(c.course_fee), 0)::numeric AS avg_fee,
       COALESCE(SUM(c.due_amount), 0)::numeric AS total_due
     ${baseWhere}
     GROUP BY c.course_name
     ORDER BY total_revenue DESC`,
    params
  );
  const revenue_by_course = (byCourseRes.rows || []).map((r) => ({
    course_name: r.course_name,
    units: Number(r.units) || 0,
    total_revenue: Number(r.total_revenue) || 0,
    avg_fee: Number(r.avg_fee) || 0,
    total_due: Number(r.total_due) || 0,
  }));

  let revenue_over_time = [];
  const timeParams = [...params];
  const dateCondition = [];
  if (dateFrom) {
    dateCondition.push(`c.created_at >= $${timeParams.length + 1}`);
    timeParams.push(dateFrom);
  }
  if (dateTo) {
    dateCondition.push(`c.created_at::date <= $${timeParams.length + 1}`);
    timeParams.push(dateTo);
  }
  const dateWhere = dateCondition.length ? ' AND ' + dateCondition.join(' AND ') : '';
  const timeRes = await pool.query(
    `SELECT c.created_at::date AS date, COALESCE(SUM(c.amount_paid), 0)::numeric AS revenue
     ${baseWhere} ${dateWhere}
     GROUP BY c.created_at::date
     ORDER BY date ASC`,
    timeParams
  );
  revenue_over_time = (timeRes.rows || []).map((r) => ({
    date: r.date,
    revenue: Number(r.revenue) || 0,
  }));

  return {
    total_revenue: totalRevenue,
    total_units: totalUnits,
    avg_revenue_per_unit: avgRevenuePerUnit,
    total_due: totalDue,
    revenue_by_course,
    revenue_over_time,
  };
}
