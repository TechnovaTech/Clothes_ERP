module.exports = {
  apps: [
    {
      name: 'clothes-erp',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/clothes-erp',
      env: {
        NODE_ENV: 'production',
        PORT: 1111
      }
    },
    {
      name: 'clothes-erp-whatsapp',
      script: 'simple-server.js',
      cwd: '/var/www/clothes-erp/whatsapp-service',
      env: {
        NODE_ENV: 'production',
        PORT: 1112
      }
    }
  ]
}