// This file is created by egg-ts-helper@1.35.2
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
type AnyClass = new (...args: any[]) => any;
type AnyFunc<T = any> = (...args: any[]) => T;
type CanExportFunc = AnyFunc<Promise<any>> | AnyFunc<IterableIterator<any>>;
type AutoInstanceType<T, U = T extends CanExportFunc ? T : T extends AnyFunc ? ReturnType<T> : T> = U extends AnyClass ? InstanceType<U> : U;
import ExportLangfuse = require('../../../app/service/langfuse');
import ExportWorkflow = require('../../../app/service/workflow');

declare module 'egg' {
  interface IService {
    langfuse: AutoInstanceType<typeof ExportLangfuse>;
    workflow: AutoInstanceType<typeof ExportWorkflow>;
  }
}
