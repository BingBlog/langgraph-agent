// This file is created by egg-ts-helper@1.35.2
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportLangfuseTracing = require('../../../app/middleware/langfuseTracing');

declare module 'egg' {
  interface IMiddleware {
    langfuseTracing: typeof ExportLangfuseTracing;
  }
}
