import pool from '../config/db.js';

async function getTeamBoeIds(teamLeadId) {
  const r = await pool.query(
    'SELECT id FROM users WHERE role = $1 AND reports_to_id = $2',
    ['boe', teamLeadId]
  );
  return r.rows.map((row) => row.id);
}

/** BOE creates a campaign. Accepts college_id; resolves college_name from college_list. */
export async function createBoeCampaign(boeId, { college_id, college_name, branch, city, stream, campaign_date }) {
  let name = college_name || '';
  if (college_id) {
    const row = await pool.query('SELECT college_name FROM college_list WHERE id = $1', [college_id]);
    if (row.rows[0]) name = row.rows[0].college_name;
  }
  const r = await pool.query(
    `INSERT INTO boe_campaigns (boe_id, college_name, branch, city, stream, campaign_date)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [boeId, name || '', branch || null, city || null, stream || null, campaign_date || null]
  );
  return r.rows[0];
}

/** BOE lists their own campaigns. */
export async function listBoeCampaigns(boeId) {
  const r = await pool.query(
    'SELECT * FROM boe_campaigns WHERE boe_id = $1 ORDER BY created_at DESC',
    [boeId]
  );
  return r.rows;
}

/** Team Lead lists campaigns of BOEs under them. */
export async function listTeamCampaigns(teamLeadId) {
  const boeIds = await getTeamBoeIds(teamLeadId);
  if (boeIds.length === 0) return [];
  const r = await pool.query(
    `SELECT bc.*, u.name AS boe_name
     FROM boe_campaigns bc
     JOIN users u ON u.id = bc.boe_id
     WHERE bc.boe_id = ANY($1::int[]) ORDER BY bc.created_at DESC`,
    [boeIds]
  );
  return r.rows;
}

/** Get one campaign by id. BOE: own only. Team Lead: team BOEs only. */
export async function getBoeCampaignById(campaignId, userId, role) {
  const r = await pool.query(
    `SELECT bc.*, u.name AS boe_name FROM boe_campaigns bc
     LEFT JOIN users u ON u.id = bc.boe_id WHERE bc.id = $1`,
    [campaignId]
  );
  const row = r.rows[0];
  if (!row) return null;
  if (role === 'boe') return row.boe_id === userId ? row : null;
  if (role === 'team_lead') {
    const boeIds = await getTeamBoeIds(userId);
    return boeIds.includes(row.boe_id) ? row : null;
  }
  return null;
}

/** BOE adds leads to their campaign. */
export async function addCampaignLeads(campaignId, boeId, leads) {
  const campaign = await pool.query('SELECT id, boe_id FROM boe_campaigns WHERE id = $1', [campaignId]);
  if (!campaign.rows[0] || campaign.rows[0].boe_id !== boeId) return null;
  const inserted = [];
  for (const lead of leads) {
    const r = await pool.query(
      `INSERT INTO campaign_leads (campaign_id, student_name, phone, email, course_selected, reason)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        campaignId,
        lead.student_name || '',
        lead.phone || null,
        lead.email || null,
        lead.course_selected || null,
        lead.reason || null,
      ]
    );
    inserted.push(r.rows[0]);
  }
  return inserted;
}

/** Get leads for a campaign. BOE: own campaign. Team Lead: team BOE campaigns. */
export async function getCampaignLeads(campaignId, userId, role) {
  const campaign = await getBoeCampaignById(campaignId, userId, role);
  if (!campaign) return null;
  const r = await pool.query(
    'SELECT * FROM campaign_leads WHERE campaign_id = $1 ORDER BY created_at',
    [campaignId]
  );
  return r.rows;
}

/** Team Lead analytics: campaigns per BOE, leads per BOE, DNR/Callback/Follow-up from leads table. */
export async function getTeamCampaignAnalytics(teamLeadId) {
  const boeIds = await getTeamBoeIds(teamLeadId);
  if (boeIds.length === 0) {
    return {
      boes: [],
      totalCampaigns: 0,
      campaignsByCity: [],
      campaignsByCollege: [],
      campaignsByStream: [],
      leadStatusByBoe: [],
    };
  }

  const [campaignsRes, campaignLeadsRes, leadStatusRes] = await Promise.all([
    pool.query(
      `SELECT bc.id, bc.boe_id, bc.college_name, bc.branch, bc.city, bc.stream, bc.campaign_date, u.name AS boe_name
       FROM boe_campaigns bc JOIN users u ON u.id = bc.boe_id WHERE bc.boe_id = ANY($1::int[])`,
      [boeIds]
    ),
    pool.query(
      'SELECT campaign_id FROM campaign_leads WHERE campaign_id IN (SELECT id FROM boe_campaigns WHERE boe_id = ANY($1::int[]))',
      [boeIds]
    ),
    pool.query(
      `SELECT assigned_boe_id AS boe_id, status, COUNT(*) AS cnt
       FROM leads WHERE assigned_boe_id = ANY($1::int[]) AND is_active = true
       GROUP BY assigned_boe_id, status`,
      [boeIds]
    ),
  ]);

  const campaigns = campaignsRes.rows;
  const leadCountByCampaign = {};
  campaignLeadsRes.rows.forEach((row) => {
    leadCountByCampaign[row.campaign_id] = (leadCountByCampaign[row.campaign_id] || 0) + 1;
  });

  const boeNames = await pool.query('SELECT id, name FROM users WHERE id = ANY($1::int[])', [boeIds]);
  const nameMap = {};
  boeNames.rows.forEach((r) => { nameMap[r.id] = r.name; });
  const boeStats = {};
  boeIds.forEach((id) => {
    boeStats[id] = { boe_id: id, campaign_count: 0, lead_count: 0, boe_name: nameMap[id] || '' };
  });
  campaigns.forEach((c) => {
    boeStats[c.boe_id].campaign_count += 1;
    boeStats[c.boe_id].lead_count = (boeStats[c.boe_id].lead_count || 0) + (leadCountByCampaign[c.id] || 0);
    boeStats[c.boe_id].boe_name = c.boe_name;
  });

  const statusByBoe = {};
  boeIds.forEach((bid) => {
    statusByBoe[bid] = { boe_id: bid, NEW: 0, DNR1: 0, DNR2: 0, DNR3: 0, DNR4: 0, 'Call Back': 0, 'Cut Call': 0, follow_up_due: 0, Converted: 0, Terminated: 0 };
  });
  leadStatusRes.rows.forEach((row) => {
    const bid = row.boe_id;
    if (!statusByBoe[bid]) statusByBoe[bid] = { boe_id: bid, NEW: 0, DNR1: 0, DNR2: 0, DNR3: 0, DNR4: 0, 'Call Back': 0, 'Cut Call': 0, follow_up_due: 0, Converted: 0, Terminated: 0 };
    const status = row.status || 'NEW';
    if (['DNR1', 'DNR2', 'DNR3', 'DNR4'].includes(status)) statusByBoe[bid][status] = Number(row.cnt);
    else if (status === 'Call Back') statusByBoe[bid]['Call Back'] = Number(row.cnt);
    else if (status === 'Cut Call') statusByBoe[bid]['Cut Call'] = Number(row.cnt);
    else if (status === 'NEW') statusByBoe[bid].NEW = Number(row.cnt);
    else if (status === 'Converted') statusByBoe[bid].Converted = Number(row.cnt);
    else if (['Not Interested', 'Denied'].includes(status)) statusByBoe[bid].Terminated = (statusByBoe[bid].Terminated || 0) + Number(row.cnt);
    else statusByBoe[bid][status] = (statusByBoe[bid][status] || 0) + Number(row.cnt);
  });
  const followUpRes = await pool.query(
    `SELECT assigned_boe_id AS boe_id, COUNT(*) AS cnt FROM leads
     WHERE assigned_boe_id = ANY($1::int[]) AND is_active = true AND next_followup_at IS NOT NULL AND next_followup_at <= NOW()
     GROUP BY assigned_boe_id`,
    [boeIds]
  );
  followUpRes.rows.forEach((row) => {
    if (!statusByBoe[row.boe_id]) statusByBoe[row.boe_id] = { boe_id: row.boe_id, NEW: 0, DNR1: 0, DNR2: 0, DNR3: 0, DNR4: 0, 'Call Back': 0, 'Cut Call': 0, follow_up_due: 0, Converted: 0, Terminated: 0 };
    statusByBoe[row.boe_id].follow_up_due = Number(row.cnt);
  });

  const byCity = {};
  const byCollege = {};
  const byStream = {};
  campaigns.forEach((c) => {
    if (c.city) byCity[c.city] = (byCity[c.city] || 0) + 1;
    if (c.college_name) byCollege[c.college_name] = (byCollege[c.college_name] || 0) + 1;
    if (c.stream) byStream[c.stream] = (byStream[c.stream] || 0) + 1;
  });

  const leadStatusByBoe = Object.values(statusByBoe).map((s) => ({
    ...s,
    boe_name: boeStats[s.boe_id]?.boe_name || '',
  }));

  return {
    boes: Object.values(boeStats),
    totalCampaigns: campaigns.length,
    campaignsByCity: Object.entries(byCity).map(([name, count]) => ({ name, count })),
    campaignsByCollege: Object.entries(byCollege).map(([name, count]) => ({ name, count })),
    campaignsByStream: Object.entries(byStream).map(([name, count]) => ({ name, count })),
    leadStatusByBoe,
  };
}

/** Admin: campaign performance per team. teamLeadId optional = filter to one team. */
export async function getAdminCampaignPerformance(teamLeadId = null) {
  const r = await pool.query(
    "SELECT id, name FROM users WHERE role = 'team_lead' ORDER BY name"
  );
  let teamLeads = r.rows;
  if (teamLeadId != null) {
    teamLeads = teamLeads.filter((t) => t.id === teamLeadId);
  }
  const teams = [];
  for (const tl of teamLeads) {
    const boeIds = await getTeamBoeIds(tl.id);
    if (boeIds.length === 0) {
      teams.push({
        team_lead_id: tl.id,
        team_lead_name: tl.name,
        boe_count: 0,
        campaign_count: 0,
        total_campaign_leads: 0,
        boes: [],
      });
      continue;
    }
    const [campaignsRes, leadsRes] = await Promise.all([
      pool.query(
        'SELECT id, boe_id FROM boe_campaigns WHERE boe_id = ANY($1::int[])',
        [boeIds]
      ),
      pool.query(
        'SELECT campaign_id FROM campaign_leads WHERE campaign_id IN (SELECT id FROM boe_campaigns WHERE boe_id = ANY($1::int[]))',
        [boeIds]
      ),
    ]);
    const campaigns = campaignsRes.rows;
    const leadCountByCampaign = {};
    leadsRes.rows.forEach((row) => {
      leadCountByCampaign[row.campaign_id] = (leadCountByCampaign[row.campaign_id] || 0) + 1;
    });
    const boeNames = await pool.query('SELECT id, name FROM users WHERE id = ANY($1::int[])', [boeIds]);
    const nameMap = {};
    boeNames.rows.forEach((r) => { nameMap[r.id] = r.name; });
    const boeStats = {};
    boeIds.forEach((id) => {
      boeStats[id] = { boe_id: id, boe_name: nameMap[id] || '', campaign_count: 0, lead_count: 0 };
    });
    campaigns.forEach((c) => {
      boeStats[c.boe_id].campaign_count += 1;
      boeStats[c.boe_id].lead_count = (boeStats[c.boe_id].lead_count || 0) + (leadCountByCampaign[c.id] || 0);
    });
    const totalLeads = Object.values(boeStats).reduce((s, b) => s + b.lead_count, 0);
    teams.push({
      team_lead_id: tl.id,
      team_lead_name: tl.name,
      boe_count: boeIds.length,
      campaign_count: campaigns.length,
      total_campaign_leads: totalLeads,
      boes: Object.values(boeStats),
    });
  }
  return { teams };
}

/** Admin: full team performance (leads + campaigns + status). Optional team_lead_id, dateFrom, dateTo. */
export async function getAdminTeamPerformance(teamLeadId = null, dateFrom = null, dateTo = null) {
  const r = await pool.query(
    "SELECT id, name FROM users WHERE role = 'team_lead' ORDER BY name"
  );
  let teamLeads = r.rows;
  if (teamLeadId != null) {
    teamLeads = teamLeads.filter((t) => t.id === teamLeadId);
  }
  const teams = [];
  for (const tl of teamLeads) {
    const [sourceIdsRes, boeIds] = await Promise.all([
      pool.query('SELECT id FROM lead_sources WHERE team_lead_id = $1', [tl.id]),
      getTeamBoeIds(tl.id),
    ]);
    const sourceIds = sourceIdsRes.rows.map((row) => row.id);
    const leadConditions = ['l.source_id = ANY($1::int[])'];
    const leadParams = [sourceIds.length ? sourceIds : [-1]];
    if (dateFrom) {
      leadParams.push(dateFrom);
      leadConditions.push(`l.created_at >= $${leadParams.length}::date`);
    }
    if (dateTo) {
      leadParams.push(dateTo);
      leadConditions.push(`l.created_at < ($${leadParams.length}::date + interval '1 day')`);
    }
    const leadWhere = leadParams.length ? ' WHERE ' + leadConditions.join(' AND ') : '';
    const [leadCountRes, statusRes, unassignedRes, campaignRes, campaignLeadsRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS cnt FROM leads l ${leadWhere}`, leadParams),
      pool.query(
        `SELECT l.status, COUNT(*) AS cnt FROM leads l ${leadWhere} GROUP BY l.status`,
        leadParams
      ),
      pool.query(
        `SELECT COUNT(*) AS cnt FROM leads l ${leadWhere} AND l.assigned_boe_id IS NULL`,
        leadParams
      ),
      pool.query(
        'SELECT id FROM boe_campaigns WHERE boe_id = ANY($1::int[])',
        [boeIds.length ? boeIds : [-1]]
      ),
      boeIds.length === 0 ? { rows: [] } : pool.query(
        'SELECT campaign_id FROM campaign_leads WHERE campaign_id IN (SELECT id FROM boe_campaigns WHERE boe_id = ANY($1::int[]))',
        [boeIds]
      ),
    ]);
    const lead_count = parseInt(leadCountRes.rows[0]?.cnt || '0', 10);
    const unassigned_count = parseInt(unassignedRes.rows[0]?.cnt || '0', 10);
    const status_breakdown = {};
    statusRes.rows.forEach((row) => {
      status_breakdown[row.status || 'NEW'] = parseInt(row.cnt, 10);
    });
    const campaign_count = campaignRes.rows.length;
    let total_campaign_leads = 0;
    const byCampaign = {};
    campaignLeadsRes.rows.forEach((row) => {
      byCampaign[row.campaign_id] = (byCampaign[row.campaign_id] || 0) + 1;
      total_campaign_leads += 1;
    });
    teams.push({
      team_lead_id: tl.id,
      team_lead_name: tl.name,
      boe_count: boeIds.length,
      source_count: sourceIds.length,
      lead_count,
      unassigned_count,
      campaign_count,
      total_campaign_leads,
      status_breakdown: status_breakdown,
      converted: status_breakdown['Converted'] || 0,
      new: status_breakdown['NEW'] || 0,
      call_back: status_breakdown['Call Back'] || 0,
    });
  }
  return { teams };
}
