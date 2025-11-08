interface EnvConfig {
  [key: string]: {
    required: boolean;
    type: 'string' | 'number' | 'boolean';
    default?: string | number | boolean;
    validate?: (value: string) => boolean;
  };
}

const commonConfig: EnvConfig = {
  NODE_ENV: {
    required: true,
    type: 'string',
    default: 'development',
    validate: (value) => ['development', 'production', 'test'].includes(value)
  },
  JWT_SECRET: {
    required: true,
    type: 'string',
    validate: (value) => value.length >= 32
  },
  REDIS_URL: {
    required: true,
    type: 'string',
    validate: (value) => value.startsWith('redis://') || value.startsWith('rediss://')
  }
};

const authServiceConfig: EnvConfig = {
  ...commonConfig,
  AUTH_SERVICE_PORT: {
    required: false,
    type: 'number',
    default: 5501
  },
  GITHUB_CLIENT_ID: {
    required: true,
    type: 'string'
  },
  GITHUB_CLIENT_SECRET: {
    required: true,
    type: 'string'
  },
  GITHUB_REDIRECT_URI: {
    required: true,
    type: 'string',
    validate: (value) => value.startsWith('http')
  },
  ENCRYPTION_KEY: {
    required: true,
    type: 'string',
    validate: (value) => value.length === 32
  },
  FRONTEND_URL: {
    required: true,
    type: 'string',
    validate: (value) => value.startsWith('http')
  }
};

const uploadServiceConfig: EnvConfig = {
  ...commonConfig,
  UPLOAD_SERVICE_PORT: {
    required: false,
    type: 'number',
    default: 5500
  },
  R2_ACCESS_KEY_ID: {
    required: true,
    type: 'string'
  },
  R2_SECRET_ACCESS_KEY: {
    required: true,
    type: 'string'
  },
  R2_ENDPOINT: {
    required: true,
    type: 'string',
    validate: (value) => value.startsWith('https://')
  },
  R2_BUCKET_NAME: {
    required: true,
    type: 'string'
  },
  AUTH_SERVICE_URL: {
    required: true,
    type: 'string',
    validate: (value) => value.startsWith('http')
  },
  DEPLOY_SERVICE_URL: {
    required: true,
    type: 'string',
    validate: (value) => value.startsWith('http')
  },
  FRONTEND_URL: {
    required: true,
    type: 'string',
    validate: (value) => value.startsWith('http')
  }
};

const deployServiceConfig: EnvConfig = {
  ...commonConfig,
  DEPLOY_SERVICE_PORT: {
    required: false,
    type: 'number',
    default: 5502
  },
  R2_ACCESS_KEY_ID: {
    required: true,
    type: 'string'
  },
  R2_SECRET_ACCESS_KEY: {
    required: true,
    type: 'string'
  },
  R2_ENDPOINT: {
    required: true,
    type: 'string',
    validate: (value) => value.startsWith('https://')
  },
  R2_BUCKET_NAME: {
    required: true,
    type: 'string'
  }
};

const requestHandlerConfig: EnvConfig = {
  REQUEST_HANDLER_PORT: {
    required: false,
    type: 'number',
    default: 3000
  },
  R2_ACCESS_KEY_ID: {
    required: true,
    type: 'string'
  },
  R2_SECRET_ACCESS_KEY: {
    required: true,
    type: 'string'
  },
  R2_ENDPOINT: {
    required: true,
    type: 'string',
    validate: (value) => value.startsWith('https://')
  },
  R2_BUCKET_NAME: {
    required: true,
    type: 'string'
  }
};

export function validateEnvironment(serviceName: 'auth' | 'upload' | 'deploy' | 'request-handler'): void {
  let config: EnvConfig;
  
  switch (serviceName) {
    case 'auth':
      config = authServiceConfig;
      break;
    case 'upload':
      config = uploadServiceConfig;
      break;
    case 'deploy':
      config = deployServiceConfig;
      break;
    case 'request-handler':
      config = requestHandlerConfig;
      break;
    default:
      throw new Error(`Unknown service: ${serviceName}`);
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [key, spec] of Object.entries(config)) {
    const value = process.env[key];

    if (!value) {
      if (spec.required) {
        errors.push(`Missing required environment variable: ${key}`);
      } else if (spec.default !== undefined) {
        process.env[key] = String(spec.default);
        warnings.push(`Using default value for ${key}: ${spec.default}`);
      }
      continue;
    }

    // Type validation
    if (spec.type === 'number' && isNaN(Number(value))) {
      errors.push(`Environment variable ${key} must be a number, got: ${value}`);
      continue;
    }

    if (spec.type === 'boolean' && !['true', 'false'].includes(value.toLowerCase())) {
      errors.push(`Environment variable ${key} must be true or false, got: ${value}`);
      continue;
    }

    // Custom validation
    if (spec.validate && !spec.validate(value)) {
      errors.push(`Environment variable ${key} failed validation: ${value}`);
    }
  }

  if (warnings.length > 0) {
    console.warn('Environment warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (errors.length > 0) {
    console.error('Environment validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }

  console.log(`✅ Environment validation passed for ${serviceName} service`);
}

export const configs = {
  auth: authServiceConfig,
  upload: uploadServiceConfig,
  deploy: deployServiceConfig,
  'request-handler': requestHandlerConfig
};