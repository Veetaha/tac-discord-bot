import Ds from 'discord.js';
import Joi from 'typesafe-joi';
import { Nullable } from "ts-typedefs";

import { UserRoleLimit } from "./user-role-limit.class";

export interface CmdHandlerFnCtx<TParams extends Nullable<CmdScalarParam>[] = Nullable<CmdScalarParam>[]> {
    /** Command that this handler was invoked with. */
    readonly cmd: string;      
    
    /** Original discord message that was received. */
    readonly msg: Ds.Message;
    /** 
     * Array of positional parameters that were forwarded to the handler by the user. 
     */
    readonly params: TParams;
}

export interface CmdMetadataApi {

    /**  Defines the roles that user must have/not have in order to user the command. */
    readonly userRoleLimit?: Nullable<UserRoleLimit>;

    /** 
     * Defines the command or an array of command names that will trigger the
     * decorated command handler method. First command name will be used as a
     * helpful reference usage template.
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
     * The length of the schema array defines the minimum amount of parameters
     * that the command handler expects.
     * Excess parameters are not checked, but get also forwarded to the handler.
     */
    readonly params?: Nullable<CmdParamsMetadataApi>;
}

export interface CmdParamsMetadataApi {
    /**
     * Minimum amount of positional parameters that are required to be passed.
     * Equals to `.definition.length` without optional array param at the end
     * by default.
     */
    minRequiredAmount?: Nullable<number>;

    /**
     * Maximum amount of positional parameters that may be passed to the command.
     * By default equals to `.definition.length` if there is no rest parameters
     * defined (`Joi.ArraySchema` at the end of `.definition`), `65535` otherwise.
     * 
     * Pre: `max >= minRequired`
     */
    maxAmount?: Nullable<number>;
    
    /**
     * Defines the tuple of arguments that the given command handler accepts.
     * Pre: `.definition.length > 0`.
     */
    definition: CmdParamMetadataApi[];
}

export interface CmdParamMetadataApi {
    /**
     * Descriptive and short name of the parameter to display in help message.
     */
    readonly name: string;

    /**
     * Short explanation what this paramter is used for.
     */
    readonly description: string;

    /** 
     * Defines type limitations of the parameter, if it is anything other than
     * `Joi.StringSchema`, it gets transformed to the expected type before passing it
     * to the command handler.
     * If schema is not specified, no type checks are performed and paramter gets
     * forwarded as a simple string to the handler. However parameter is considered to
     * be required if only if it is not positioned after other not required parameters.
     * 
     * Pre: If schema is not `.required()` all parameters that appear after this
     * one must not be `.required()` too.
     * 
     * Pre: If it is `Joi.ArraySchema` it must be the last paramter in the param list.
     */
    readonly schema?: Nullable<CmdParamSchema>;
}
export type CmdScalarParam = boolean | number | string;

export type CmdParamSchema = 
    | Joi.StringSchema 
    | Joi.NumberSchema 
    | Joi.BooleanSchema
    | Joi.ArraySchema<any>;
