/**
 * PM2 — run on the server from the project root (no Docker)
 *   pm2 start ecosystem.config.cjs
 *   pm2 save && pm2 startup
 */
module.exports = {
  apps: [
    {
      name: 'rkellite-api',
      script: 'backend/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
      },
    },
  ],
};
