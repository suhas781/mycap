import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import leadRoutes from './routes/leads.js';
import syncRoutes from './routes/sync.js';
import userRoutes from './routes/users.js';
import leadSourceRoutes from './routes/leadSources.js';
import campaignRoutes from './routes/campaigns.js';
import collegeRoutes from './routes/colleges.js';
import analyticsRoutes from './routes/analytics.js';
import courseRoutes from './routes/courses.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/leads', leadRoutes);
app.use('/sync-leads', syncRoutes);
app.use('/lead-sources', leadSourceRoutes);
app.use('/users', userRoutes);
app.use('/campaigns', campaignRoutes);
app.use('/colleges', collegeRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/courses', courseRoutes);

app.get('/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
