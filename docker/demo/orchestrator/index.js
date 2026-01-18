/**
 * NodePress Demo Orchestrator
 * Manages demo instance lifecycle
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const app = express();
app.use(express.json());

// Apply rate limiting using express-rate-limit (recognized by CodeQL)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'nodepress',
  password: process.env.POSTGRES_PASSWORD,
  database: 'nodepress',
});

// Constants
const MAX_CONCURRENT_DEMOS = parseInt(process.env.MAX_CONCURRENT_DEMOS || '20');
const BASE_PORT = 4000;
const DEMO_IMAGE = 'nodepress/demo:latest';

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Get orchestrator stats
app.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'RUNNING') as running,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
        COUNT(*) FILTER (WHERE status = 'PROVISIONING') as provisioning
      FROM demo_instances
    `);
    res.json({
      ...result.rows[0],
      maxConcurrent: MAX_CONCURRENT_DEMOS,
      available: MAX_CONCURRENT_DEMOS - parseInt(result.rows[0].running || 0),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Provision a new demo
app.post('/provision', async (req, res) => {
  const { demoId } = req.body;
  
  try {
    // Get demo from database
    const demo = await pool.query(
      'SELECT * FROM demo_instances WHERE id = $1',
      [demoId]
    );
    
    if (!demo.rows[0]) {
      return res.status(404).json({ error: 'Demo not found' });
    }
    
    const demoData = demo.rows[0];
    const containerName = `nodepress-demo-${demoData.subdomain}`;
    const port = demoData.port || (BASE_PORT + parseInt(demoData.id.slice(-4), 16) % 1000);
    
    // Update status to provisioning
    await pool.query(
      'UPDATE demo_instances SET status = $1 WHERE id = $2',
      ['PROVISIONING', demoId]
    );
    
    // Create demo database
    const dbName = `demo_${demoData.subdomain.replace(/-/g, '_')}`;
    await pool.query(`CREATE DATABASE ${dbName}`);
    
    // Start container
    const cmd = `docker run -d --name ${containerName} \
      --network nodepress-demo-network \
      -e DATABASE_URL=postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@postgres:5432/${dbName} \
      -e REDIS_URL=redis://redis:6379 \
      -e DEMO_MODE=true \
      -e DEMO_SUBDOMAIN=${demoData.subdomain} \
      -e ADMIN_PASSWORD=${demoData.admin_password} \
      -p ${port}:3000 \
      ${DEMO_IMAGE}`;
    
    await execAsync(cmd);
    
    // Wait for container to be healthy
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Update status to running
    await pool.query(
      'UPDATE demo_instances SET status = $1, port = $2, provisioned_at = NOW() WHERE id = $3',
      ['RUNNING', port, demoId]
    );
    
    res.json({ success: true, containerName, port });
  } catch (error) {
    console.error('Provisioning failed:', error);
    await pool.query(
      'UPDATE demo_instances SET status = $1 WHERE id = $2',
      ['FAILED', demoId]
    );
    res.status(500).json({ error: error.message });
  }
});

// Terminate a demo
app.post('/terminate', async (req, res) => {
  const { demoId } = req.body;
  
  try {
    const demo = await pool.query(
      'SELECT * FROM demo_instances WHERE id = $1',
      [demoId]
    );
    
    if (!demo.rows[0]) {
      return res.status(404).json({ error: 'Demo not found' });
    }
    
    const demoData = demo.rows[0];
    const containerName = `nodepress-demo-${demoData.subdomain}`;
    const dbName = `demo_${demoData.subdomain.replace(/-/g, '_')}`;
    
    // Stop and remove container
    await execAsync(`docker stop ${containerName} || true`);
    await execAsync(`docker rm ${containerName} || true`);
    
    // Drop database
    await pool.query(`DROP DATABASE IF EXISTS ${dbName}`);
    
    // Update status
    await pool.query(
      'UPDATE demo_instances SET status = $1, terminated_at = NOW() WHERE id = $2',
      ['TERMINATED', demoId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Termination failed:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Demo orchestrator running on port ${PORT}`);
});

