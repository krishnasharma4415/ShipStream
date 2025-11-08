module.exports = {
  apps: [
    {
      name: 'auth-service',
      script: './auth-service/dist/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5501
      },
      error_file: './logs/auth-service-error.log',
      out_file: './logs/auth-service-out.log',
      log_file: './logs/auth-service-combined.log',
      time: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'upload-service',
      script: './upload-service/dist/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5500
      },
      error_file: './logs/upload-service-error.log',
      out_file: './logs/upload-service-out.log',
      log_file: './logs/upload-service-combined.log',
      time: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'deploy-service',
      script: './deploy-service/dist/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5502
      },
      error_file: './logs/deploy-service-error.log',
      out_file: './logs/deploy-service-out.log',
      log_file: './logs/deploy-service-combined.log',
      time: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'request-handler',
      script: './request-handler/dist/index.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/request-handler-error.log',
      out_file: './logs/request-handler-out.log',
      log_file: './logs/request-handler-combined.log',
      time: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};