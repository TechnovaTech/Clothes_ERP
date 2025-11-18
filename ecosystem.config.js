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
      script: './start-with-display.sh',
      cwd: '/var/www/clothes-erp/whatsapp-service',
      env: {
        NODE_ENV: 'production',
        PORT: 1112,
        DISPLAY: ':99'
      }
    }
  ]
}