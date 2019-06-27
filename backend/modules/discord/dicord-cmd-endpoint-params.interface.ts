import * as Joi from 'typesafe-joi';
import { Nullable } from "ts-typedefs";

import { DiscordUserRoleLimit } from './discord-user-role-limit.class';


export interface DiscordCmdEndpointParams {

    /**  Defines the roles that user must have/not have in order to user the command. */
    readonly userRoleLimit?: Nullable<DiscordUserRoleLimit>;

    /** 
     * Defines the command or an array of command names that will trigger the
     * decorated command handler method.
     * 
     * Pre: commands must not contain any `\W` (word break characters).
     */
    readonly cmd: string[];

    /**
     * Description that will be shown to the users when `help` command is triggered.
     */
    readonly description: string;

    /**
     * Number of milliseconds that the users should wait before triggering this
     * command second time. If none is specified, users may execute the command
     * as frequently as they wish.
     */
    readonly cooldownTime?: Nullable<number>;    

    /**
     * Tuple of string schemas that the parameters given by users must match to.
     * Beware that you may overload command handlers by arguments amount.
     * Thus you may define several command handlers for the same command, but 
     * with paramSchemas having different length.
     */
    readonly paramSchemas?: Nullable<Joi.StringSchema[]>;
}