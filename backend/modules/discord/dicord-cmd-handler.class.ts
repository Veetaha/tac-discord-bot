import _         from 'lodash';
import Container from 'typedi';
import humanizeDuration from 'humanize-duration';
import { Nullable, Merge } from 'ts-typedefs';

import { DebugService } from '@services/debug.service';

import { DiscordMemberError } from './errors/discord-member-error.class';
import { DiscordUserRoleLimit } from './discord-user-role-limit.class';
import { DiscordCmdMetadataApi, DiscordCmdHandlerFnCtx } from './discord.interfaces';
import { DiscordCmdParamsMetadata } from './meta/discord-cmd-params-metadata.class';
import { DiscordCmdHandlingManager } from './discord-cmd-handling-manager.class';


/*
 * Defines the type of function that implements the command buisness logic.
 */
export type DiscordCmdHandlerFn<TThis = unknown> = 
(this: TThis, ctx: DiscordCmdHandlerFnCtx) => void | Promise<unknown>;

export type DiscordCmdMetadata = Merge<DiscordCmdMetadataApi, {
    params?: Nullable<DiscordCmdParamsMetadata>;

    /** Command name array mapped to set of case-insensitive strings. */
    cmd: Set<string>;
    /**
     * Defines a function that is not yet bound to its service class.
     */
    handlerFn: DiscordCmdHandlerFn;
}>;

export type DiscordCmdHandlerTryHandleMsgCtx = Merge<DiscordCmdHandlerFnCtx, {
    /** Parameters that are not yet transformed and validated. */
    params: string[]
}>;

export class DiscordCmdHandler implements DiscordCmdMetadata {
    private static readonly debug = Container.get(DebugService);


    /** 
     * Contains timestamp when this command was last time invoked by user. 
     * Entries get removed when the cooldown expires.
     */
    private readonly userIdToLastInvokeTimeMap?: Nullable<Map<string, number>>; 

    // The following props are copies of `Discord3CmdEndpointMetadata` props.
    readonly handlerFn!:     DiscordCmdHandlerFn;
    readonly userRoleLimit?: Nullable<DiscordUserRoleLimit>;
    readonly cmd!:           Set<string>;
    readonly description!:   string;
    readonly cooldownTime?:  Nullable<number>;    
    readonly params?:        Nullable<DiscordCmdParamsMetadata>;

    /**
     * Constructs DiscordCmdHandler from the given paramters.
     * Beware that `handlerFn`'s `this` context must be formerly bound to it.
     * 
     * @param handlerFn Handler function that implements command logic.
     * @param endpointParams Metadata parameters that describe this command handler.
     */
    constructor(metadata: DiscordCmdMetadata) {
        Object.assign(this, metadata);
        if (this.cooldownTime != null) {
            this.userIdToLastInvokeTimeMap = new Map;
        }
    }

    /**
     * Invokes `handlerFn` for the given `msg`. Throws if `handlerFn` throws or
     * if client has no permissions to invoke this command due to some role limitations,
     * active cooldown or invalid command parameters.
     *                                        V~~~ any amount of whitespace chacracters
     * Pre: `msg.content === (prefix + cmd + ' ' + params).trim()` 
     */
    async tryHandleMsgOrFail(ctx: DiscordCmdHandlerTryHandleMsgCtx) {
        DiscordCmdHandler.debug.assert(() => this.cmd.has(ctx.cmd));
        this.ensureSenderObeysRoleLimitOrFail(ctx);  
        this.ensureCooldownIsNotActive(ctx);
        const params = this.tryTransformValidateParamsOrFail(ctx);
        this.trySetCooldownForInvoker(ctx);
        return this.handlerFn({ ...ctx, params});        
    }

    private ensureCooldownIsNotActive(ctx: DiscordCmdHandlerTryHandleMsgCtx) {
        const lastInvokeTime = this.tryGetLastInvokeTime(ctx);
        if (lastInvokeTime != null) {
            throw new DiscordMemberError({
                title:       "Command cooldown violation",
                description: `You have to wait ${humanizeDuration(
                    lastInvokeTime + this.cooldownTime! - Date.now(),
                    { maxDecimalPoints: 0}
                )} before the next call "${ctx.cmd}"`,
                violator: ctx.msg.member
            });
        }
    }

    private ensureSenderObeysRoleLimitOrFail({msg: {member}, cmd}: DiscordCmdHandlerTryHandleMsgCtx) {
        if (this.userRoleLimit == null) return;
        const {matches, determinativeRole} = this.userRoleLimit
            .matchToRoleLimit(member.roles);

        if (matches) return;

        throw new DiscordMemberError({
            title:  "Role access violation.",
            description: `${determinativeRole == null 
                ? `Only users with one of "${this.userRoleLimit.stringifyRoles()}" roles are`
                : `Users with "${determinativeRole}" role are not`
            } allowed to execute "${cmd}".`,
            violator: member
        });
    }

    private tryGetLastInvokeTime({msg: {member}}: DiscordCmdHandlerTryHandleMsgCtx) {
        return this.userIdToLastInvokeTimeMap == null 
            ? null 
            : this.userIdToLastInvokeTimeMap.get(member.id);
    }

    private trySetCooldownForInvoker({msg: {member:{id}}}: DiscordCmdHandlerTryHandleMsgCtx) {
        const map = this.userIdToLastInvokeTimeMap;
        if (map == null) return;
        map.set(id, Date.now());
        setTimeout(() => map.delete(id), this.cooldownTime!);
    }

    private tryTransformValidateParamsOrFail({cmd, params, msg:{member}}: DiscordCmdHandlerTryHandleMsgCtx) {
        if (this.params == null) {
            if (params.length > 0) throw new DiscordMemberError({
                title: "Unexpected parameters",
                description: 
                `Command "${cmd}" expects ${'`'}0${'`'} parameters.` + '\n' +
                `Usage: ${this.getUsageTemplate()}`,
                violator: member
            }); 
            return [];
        }
        try { 
            return this.params.tryTransformValidateOrFail(params); 
        } catch (err) {
            throw new DiscordMemberError({
                title: `Invalid input parameters for "${cmd}".`,
                description: err.message + '\n' + `Usage: ${this.getUsageTemplate()}`,
                violator: member
            });
        }
    }
    
    getUsageTemplate() {
        const { cmdPrefix } = Container.get(DiscordCmdHandlingManager);
        const cmd = this.cmd.values().next().value;
        const params = this.params == null 
            ? '' 
            : this.params.definition.reduce((str, _param, i) => 
                `${str} ${this.params!.getParamUsageTemplate(i)}`, ''
            );

        return `${'`'}${cmdPrefix}${cmd}${params}${'`'}`;
    }

}