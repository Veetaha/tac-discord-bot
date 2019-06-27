import Joi from 'typesafe-joi';
import Dotenv from 'dotenv';
import { Service } from 'typedi';

@Service() 
export class EnvService {

    /**
     * Initializes current `process.env` with the key-value pairs from env file at `path`.
     * Uses `.env` file path by default.
     * @param path Path
     */
    loadDotenv(path?: string) {
        Dotenv.config(path != null ? {path}: void 0);
    }

    /**
     * Tries to read environmental variable from `process.env` and returns its value.
     * @param varId Environmental variable name.
     * 
     * @throws Error if `process.env[varId] == null`.
     */
    readEnvOrFail(varId: string) {
        const envValue = process.env[varId];
        if (envValue == null) {
            throw new Error(`failed to read '${varId}' environment variable`);
        }
        return envValue;
    }

    /**
     * Tries to read port number from `process.env` and returns its numberic value.
     * 
     * @param varId Environmental variable name.
     * 
     * @throws Error if `process.env[varId] == null` or failed to parse valid port number.
     * 
     */
    readPortFromEnvOrFail(varId: string) {
        return Joi.attempt(
            parseInt(this.readEnvOrFail(varId), 10),
            Joi.number().integer().min(0).max(65535).required(),
        );
    }
}