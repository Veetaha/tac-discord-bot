import * as Joi from 'typesafe-joi';
import { Service } from 'typedi';
import { LoggingService } from './logging.service';

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
     * @param truthy Suspect to be checked for truthiness.
     */
    assert(truthy: unknown) {
        if (!truthy) {
            this.shutdown(truthy, `assertion failure`);
        }
    }

    /**
     * Checks that `Boolean(truthy) === false`, otherwise shutdowns and logs `falsy`.
     * 
     * @param falsy Suspect to be checked for truthiness.
     */
    assertFalsy(falsy: unknown) {
        if (falsy) {
            this.shutdown(falsy, `assertion failure`);
        }
    }

    /**
     * Asserts that `Joi.validate(suspect, schema).error == null`, otherwise shutdowns
     * and logs returned `Joi.ValidateError` object.
     * 
     * @param suspect   Value of to be checked for type conformance.
     * @param typeDescr `Joi.Schema` that `suspect` will be checked to match to.
     */
    assertMatches(suspect: unknown, schema: Joi.Schema) {
        const { error } = Joi.validate(suspect, schema);
        if (error) {
            this.shutdown(error, 'type mismatch assertion failure');
        }
    }
}