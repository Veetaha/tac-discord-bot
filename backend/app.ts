import '@app/polyfills';
import * as Joi from 'typesafe-joi';
import { Log, assert } from '@modules/debug';

assert.matches(true, Joi.bool());
Log.info('Hello world!!');
