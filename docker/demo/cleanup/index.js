/**
 * NodePress Demo Cleanup Service
 * Runs on a schedule to clean up expired demos
 */

const { Pool } = require('pg');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'nodepress',
  password: process.env.POSTGRES_PASSWORD,
  database: 'nodepress',
});

const CLEANUP_INTERVAL = parseInt(process.env.CLEANUP_INTERVAL || '300') * 1000; // Default: 5 minutes

async function cleanupExpiredDemos() {
  console.log(`[${new Date().toISOString()}] Starting cleanup cycle...`);

  try {
    // Find expired demos that are still running
    const expiredDemos = await pool.query(`
      SELECT id, subdomain, database_name 
      FROM demo_instances 
      WHERE status = 'RUNNING' AND expires_at < NOW()
    `);

    console.log(`[${new Date().toISOString()}] Found ${expiredDemos.rows.length} expired demos`);

    for (const demo of expiredDemos.rows) {
      try {
        console.log(`[${new Date().toISOString()}] Cleaning up: ${demo.subdomain}`);

        const containerName = `nodepress-demo-${demo.subdomain}`;
        const dbName = demo.database_name || `demo_${demo.subdomain.replace(/-/g, '_')}`;

        // Stop and remove container
        await execAsync(`docker stop ${containerName} 2>/dev/null || true`);
        await execAsync(`docker rm ${containerName} 2>/dev/null || true`);

        // Terminate connections and drop database
        try {
          await pool.query(`
            SELECT pg_terminate_backend(pid) 
            FROM pg_stat_activity 
            WHERE datname = $1
          `, [dbName]);
          await pool.query(`DROP DATABASE IF EXISTS ${dbName}`);
        } catch (dbErr) {
          console.error(`[${new Date().toISOString()}] Database cleanup error for ${dbName}:`, dbErr.message);
        }

        // Update status in main database
        await pool.query(`
          UPDATE demo_instances 
          SET status = 'EXPIRED', terminated_at = NOW() 
          WHERE id = $1
        `, [demo.id]);

        console.log(`[${new Date().toISOString()}] Cleaned up: ${demo.subdomain}`);
      } catch (demoErr) {
        console.error(`[${new Date().toISOString()}] Error cleaning up ${demo.subdomain}:`, demoErr.message);
      }
    }

    // Cleanup orphaned containers
    await cleanupOrphanedContainers();

    // Prune old images
    await pruneOldImages();

    console.log(`[${new Date().toISOString()}] Cleanup cycle complete`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Cleanup error:`, err.message);
  }
}

async function cleanupOrphanedContainers() {
  console.log(`[${new Date().toISOString()}] Checking for orphaned containers...`);

  try {
    const { stdout } = await execAsync(
      'docker ps --filter "name=nodepress-demo-" --format "{{.Names}}" 2>/dev/null || true'
    );

    const containers = stdout.split('\n').filter(Boolean);

    for (const container of containers) {
      const subdomain = container.replace('nodepress-demo-', '');
      const result = await pool.query(`
        SELECT COUNT(*) as count 
        FROM demo_instances 
        WHERE subdomain = $1 AND status = 'RUNNING'
      `, [subdomain]);

      if (parseInt(result.rows[0].count) === 0) {
        console.log(`[${new Date().toISOString()}] Removing orphaned container: ${container}`);
        await execAsync(`docker stop ${container} 2>/dev/null || true`);
        await execAsync(`docker rm ${container} 2>/dev/null || true`);
      }
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Orphan cleanup error:`, err.message);
  }
}

async function pruneOldImages() {
  console.log(`[${new Date().toISOString()}] Pruning old images...`);
  try {
    await execAsync('docker image prune -a --force --filter "until=168h" 2>/dev/null || true');
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Image prune error:`, err.message);
  }
}

// Main loop
async function main() {
  console.log(`[${new Date().toISOString()}] Demo cleanup service starting...`);
  console.log(`[${new Date().toISOString()}] Cleanup interval: ${CLEANUP_INTERVAL / 1000}s`);

  // Run immediately on start
  await cleanupExpiredDemos();

  // Schedule regular cleanups
  setInterval(cleanupExpiredDemos, CLEANUP_INTERVAL);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

