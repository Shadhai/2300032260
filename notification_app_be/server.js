import express from 'express';
import cors from 'cors';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import { log, configureToken } from '../logging_middleware/logger.js';

const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiIyMzAwMDMyMjYwY3NlQGdtYWlsLmNvbSIsImV4cCI6MTc4MDEyODIxOCwiaWF0IjoxNzgwMTI3MzE4LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiYzNiMWM0MmQtNzM2Zi00MzBiLThmNDctNjY3YmY3MjZmNTA3IiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoicCBqb3NlcGgiLCJzdWIiOiI2MDEzN2Y0NS0wZDE4LTQxZTEtYTRlOS1lM2UyOTlkYWIyYzUifSwiZW1haWwiOiIyMzAwMDMyMjYwY3NlQGdtYWlsLmNvbSIsIm5hbWUiOiJwIGpvc2VwaCIsInJvbGxObyI6IjIzMDAwMzIyNjAiLCJhY2Nlc3NDb2RlIjoiQXZyQUFLIiwiY2xpZW50SUQiOiI2MDEzN2Y0NS0wZDE4LTQxZTEtYTRlOS1lM2UyOTlkYWIyYzUiLCJjbGllbnRTZWNyZXQiOiJRSHJFV1ZFSGZiY1JDSFJ1In0.pVOVFgQaB3zb1UoninTPHGuDz8f8EMA-XD0t7wYNbP8";
configureToken(AUTH_TOKEN);

const app = express();
const httpServer = http.createServer(app);

app.use(cors());
app.use(express.json());

const EXTERNAL_API = 'http://4.224.186.213/evaluation-service';

async function pullNotifications(kind = null) {
  log('backend', 'info', 'controller', `Fetching notifications type ${kind || 'all'}`);
  
  let targetUrl = `${EXTERNAL_API}/notifications`;
  if (kind && kind !== '') {
    targetUrl += `?notification_type=${kind}`;
  }

  const response = await fetch(targetUrl, {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
  });

  if (!response.ok) {
    log('backend', 'error', 'controller', `Fetch failed status ${response.status}`);
    throw new Error('Unable to fetch notifications');
  }

  const data = await response.json();
  return data;
}

function normalizeNotification(raw) {
  return {
    id: raw.ID || uuidv4(),
    type: raw.Type || 'Event',
    message: raw.Message || 'No message',
    timestamp: raw.Timestamp || new Date().toISOString(),
    isRead: false
  };
}

app.get('/api/notifications', async (req, res) => {
  try {
    log('backend', 'info', 'controller', 'GET /api/notifications');
    const { notification_type } = req.query;

    const data = await pullNotifications(notification_type);
    const notifications = (data.notifications || []).map(normalizeNotification);

    res.json({
      notifications,
      totalCount: notifications.length
    });

    log('backend', 'info', 'controller', `Returned ${notifications.length} notifications`);
  } catch (err) {
    log('backend', 'error', 'controller', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/notifications/priority', async (req, res) => {
  try {
    log('backend', 'info', 'controller', 'GET /api/notifications/priority');
    const { n = 10 } = req.query;

    const data = await pullNotifications();
    const allNotifications = data.notifications || [];

    const scored = allNotifications.map(n => {
      const type = n.Type || 'Event';
      const timestamp = n.Timestamp;
      const weights = { Placement: 3, Result: 2, Event: 1 };
      const weight = weights[type] || 0;
      const hours = Math.max(0, (new Date() - new Date(timestamp)) / (1000 * 60 * 60));
      const score = weight / (1 + hours);
      return { 
        id: n.ID,
        type: n.Type,
        message: n.Message,
        timestamp: n.Timestamp,
        relevanceScore: score 
      };
    });

    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const topN = scored.slice(0, Number(n));

    res.json({ notifications: topN });
    log('backend', 'info', 'controller', `Returned ${topN.length} priority notifications`);
  } catch (err) {
    log('backend', 'error', 'controller', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/notifications/:id/read', (req, res) => {
  log('backend', 'info', 'controller', `Mark read ${req.params.id}`);
  res.json({ id: req.params.id, isRead: true, updatedAt: new Date().toISOString() });
});

app.patch('/api/notifications/read-all', (req, res) => {
  log('backend', 'info', 'controller', 'Mark all read');
  res.json({ updatedCount: 50, timestamp: new Date().toISOString() });
});

app.get('/api/notifications/unread-count', (req, res) => {
  log('backend', 'info', 'controller', 'Get unread count');
  res.json({ total: 15, byType: { Placement: 5, Result: 7, Event: 3 } });
});

app.delete('/api/notifications/:id', (req, res) => {
  log('backend', 'info', 'controller', `Delete ${req.params.id}`);
  res.json({ id: req.params.id, deleted: true });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  log('backend', 'info', 'middleware', `Server started on port ${PORT}`);
  console.log(`Server active on port ${PORT}`);
});