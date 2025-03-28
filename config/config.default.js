'use strict';

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  const config = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1712533214567_7890';

  // middleware configuration
  config.middleware = ['langfuseTracing'];
  
  // customize your middleware config
  config.langfuseTracing = {
    enable: true,
    match: ['/api'],
  };
  
  // CORS configuration
  config.cors = {
    origin: '*',
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
  };
  
  // Security settings
  config.security = {
    csrf: {
      enable: false,
    },
  };
  
  // Body parser
  config.bodyParser = {
    jsonLimit: '5mb',
  };
  
  // Static file serving
  config.static = {
    prefix: '/',
    dir: path.join(appInfo.baseDir, 'app/public'),
  };
  
  // Langfuse configuration
  config.langfuse = {
    secretKey: process.env.LANGFUSE_SECRET_KEY || "sk-lf-2@workflow.ts 933d111-fadb-4be8-8a3c-c85ddf356234",
    publicKey: process.env.LANGFUSE_PUBLIC_KEY || "pk-lf-04061322-762b-46a1-b5bf-b606b436554b",
    baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com"
  };
  
  return config;
}; 