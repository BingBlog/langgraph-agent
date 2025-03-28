// This file is created by egg-ts-helper@1.35.2
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportWorkflow = require('../../../app/controller/workflow');

declare module 'egg' {
  interface IController {
    workflow: ExportWorkflow;
  }
}
