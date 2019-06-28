import _ from 'lodash';
import Joi from 'typesafe-joi';
import Discord from 'discord.js';
import Container from 'typedi';
import Moment from 'moment';
import { Nullable } from 'ts-typedefs';

import { DebugService } from '@services/debug.service';

import { DiscordUserRoleLimit } from './discord-user-role-limit.class';
import { DiscordCmdEndpointMetadataItem } from './discord-cmd-endpoint-metadata.interface';
import { DiscordCmdHandlerFn, DiscordCmdHandlerFnCtx } from "./discord-handler.interfaces";

export class DiscordCmdEndpointHandler implements DiscordCmdEndpointMetadataItem {
    private static readonly debug = Container.get(DebugService);

    /** 
     * Contains timestamp when this command was last time invoked by user. 
     * Entries get removed when the cooldown expires.
     */
    private readonly userIdToLastInvokeTimeMap?: Nullable<Map<string, number>>; 

    // The following props are copies of `DiscordCmdEndpointMetadata` props.
    readonly handlerFn!:     DiscordCmdHandlerFn;
    readonly userRoleLimit?: Nullable<DiscordUserRoleLimit>;
    readonly cmd!:           Set<string>;
    readonly description!:   string;
    readonly cooldownTime?:  Nullable<number>;    
    readonly paramSchemas?:  Nullable<Joi.StringSchema[]>;

    /**
     * Constructs DiscordCmdHandler from the given paramters.
     * Beware that `handlerFn`'s `this` context must be formerly bound to it.
     * 
     * @param handlerFn Handler function that implements command logic.
     * @param endpointParams Metadata parameters that describe this command handler.
     */
    constructor(endpointMetadata: DiscordCmdEndpointMetadataItem) {
        Object.assign(this, endpointMetadata);
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
    async tryHandleMsgOrFail({msg, cmd, params}: DiscordCmdHandlerFnCtx) {
        DiscordCmdEndpointHandler.debug.assert(this.cmd.has(cmd));
        if (this.userRoleLimit != null) {
            this.ensureSenderObeysRoleLimitOrFail(msg.member.roles, cmd);  
        }
        if (this.paramSchemas != null) {
            this.ensureParamsAreValidOrFail(cmd, params);
        }
        if (this.cooldownTime != null) {
            this.trySetCooldownOrFail(msg.member.id, cmd);
        }
        await this.handlerFn({ msg, cmd, params });        
    }


    /** 
     * Pre: `.userRoleLimit != null` 
     */
    private ensureSenderObeysRoleLimitOrFail(
        memberRoles: Discord.GuildMember['roles'], 
        cmd: string
    ) {
        const {matches, determinativeRole} = this.userRoleLimit!
            .matchToRoleLimit(memberRoles);

        if (matches) return;

        throw new Error(`${determinativeRole == null 
                ? `only users with one of "${this.userRoleLimit!.stringifyRoles()}" roles are`
                : `users with "${determinativeRole}" role are not`
            } allowed to execute "${cmd}".`
        );
    }

    /** 
     * Pre: `cooldown != null` 
     */
    private trySetCooldownOrFail(memberId: string, cmd: string) {
        const lastInvokeTime = this.userIdToLastInvokeTimeMap!.get(memberId);
        if (lastInvokeTime == null) {
            return this.setCooldownForMemberWithId(memberId);
        }
        throw new Error(
            `you will be able to call "${cmd}" ${Moment().to(lastInvokeTime + this.cooldownTime!)}`
        );
    }

    /** 
     * Pre: `cooldown != null` 
     */
    private setCooldownForMemberWithId(memberId: string) {
        this.userIdToLastInvokeTimeMap!.set(memberId, Date.now());
        setTimeout(
            () => this.userIdToLastInvokeTimeMap!.delete(memberId), 
            this.cooldownTime!
        );
    }

    private ensureParamsAreValidOrFail(cmd: string, params: string[]) {
        if (params.length !== this.paramSchemas!.length) {
            throw new Error(
                `command "${cmd}" expects ${this.paramSchemas!.length} paramers.`
            );
        }
        this.paramSchemas!.forEach((schema, i) => Joi.attempt(params[i], schema));
    }

}