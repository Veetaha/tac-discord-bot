import * as Joi from 'typesafe-joi';
import { Service } from 'typedi';

import { LoggingService } from './logging.service';
import { NoopInProduction } from './config.service';

@Service()
export class DebugService {

    constructor(private readonly log: LoggingService) {}

    /**
     * Aborts current program execution workflow after invoking `error(payload, description)`.
     * 
     * @param payload       `Error` or vanilla object, which state needs to be logged.
     * @param description   Additional info message to be logged before `payload`.
     */
    shutdown(payload: unknown = 'undefined behaviour', description = ''): never {
        this.log.error(payload, description);
        return process.exit(1);
    }

    /**
     * Checks that `Boolean(truthy) === true`, otherwise shutdowns and logs `truthy`.
     * 
     * @param getSuspect Function that returns suspect to be checked for truthiness.
     */
    @NoopInProduction
    assert(getSuspect: () =>unknown) {
        const suspect = getSuspect();
        if (!suspect) {
            this.shutdown(suspect, `assertion failure`);
        }
    }

    /**
     * Checks that `Boolean(truthy) === false`, otherwise shutdowns and logs `falsy`.
     * 
     * @param getSuspect Function that returns suspect to be checked for truthiness.
     */
    @NoopInProduction
    assertFalsy(getSuspect: () => unknown) {
        const suspect = getSuspect();
        if (suspect) {
            this.shutdown(suspect, `assertion failure`);
        }
    }

    /**
     * Asserts that `Joi.validate(suspect, schema).error == null`, otherwise shutdowns
     * and logs returned `Joi.ValidateError` object.
     * 
     * @param suspect   Value of to be checked for type conformance.
     * @param schema `Joi.Schema` that `suspect` will be checked to match to.
     */
    @NoopInProduction
    assertMatches(suspect: unknown, schema: Joi.Schema) {
        const { error } = Joi.validate(suspect, schema);
        if (error) {
            this.shutdown(error, 'type mismatch assertion failure');
        }
    }
}
