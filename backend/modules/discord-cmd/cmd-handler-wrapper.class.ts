import { Container } from 'typedi';
import humanizeDuration from 'humanize-duration';
import { Nullable, Merge } from 'ts-typedefs';

import { MaybeAsyncRoutine } from '@common/interfaces';

import { CmdParamsMetadata  } from './meta/cmd-params-metadata.class';
import { UserRoleLimit      } from './user-role-limit.class';
import { CmdHandlingService } from './cmd-handling.service';
import { CmdMetadataApi, CmdHandlerFnCtx } from './cmd.interfaces';
import { CmdInvalidParamsError, CmdAccessError, CmdCooldownError } from './errors/cmd.errors';


/*
 * Defines the type of function that implements the command buisness logic.
 */
export type CmdHandlerFn<TThis = unknown> = MaybeAsyncRoutine<[CmdHandlerFnCtx], TThis>;

export type CmdMetadata = Merge<CmdMetadataApi, {
    params?: Nullable<CmdParamsMetadata>;

    /**
     * Defines a function that is not yet bound to its service class.
     */
    handlerFn: CmdHandlerFn;
}>;

export type TryHandleMsgCtx = Merge<CmdHandlerFnCtx, {
    /** Parameters that are not yet transformed and validated. */
    params: string[]
}>;

export class CmdHandlerWrapper implements CmdMetadata {

    /**
     * Contains timestamp when this command was last time invoked by user.
     * Entries get removed when the cooldown expires.
     */
    private readonly userIdToLastInvokeTimeMap?: Nullable<Map<string, number>>;

    // The following props are copies of `Discord3CmdEndpointMetadata` props.
    readonly handlerFn!:     CmdHandlerFn;
    readonly userRoleLimit?: Nullable<UserRoleLimit>;
    readonly cmd!:           string[];
    readonly description!:   string;
    readonly cooldownTime?:  Nullable<number>;
    readonly params?:        Nullable<CmdParamsMetadata>;

    /**
     * Constructs DiscordCmdHandler from the given paramters.
     * Beware that `handlerFn`'s `this` context must be formerly bound to it.
     *
     * @param handlerFn Handler function that implements command logic.
     * @param endpointParams Metadata parameters that describe this command handler.
     */
    constructor(metadata: CmdMetadata) {
        Object.assign(this, metadata);
        if (this.cooldownTime != null) {
            this.userIdToLastInvokeTimeMap = new Map;
        }
    }

    /**
     * Returns a string that shows a template usage of this command to fill in.
     */
    getUsageTemplate() {
        const { cmdPrefix } = Container.get(CmdHandlingService);
        const [cmd] = this.cmd;

        const params = this.params == null
            ? ''
            : this.params.definition.reduce((str, _param, i) =>
                `${str} ${this.params!.getParamUsageTemplate(i)}`, ''
            );
        return `${cmdPrefix}${cmd}${params}`;
    }

    /**
     * Invokes `handlerFn` for the given `msg`. Throws if `handlerFn` throws or
     * if client has no permissions to invoke this command due to some role limitations,
     * active cooldown or invalid command parameters.
     *                                        V~~~ any amount of whitespace chacracters
     * Pre: `msg.content === (prefix + cmd + ' ' + params).trim()`
     */
    async handleMsgOrFail(ctx: TryHandleMsgCtx) {
        this.ensureSenderObeysRoleLimitOrFail(ctx);
        this.ensureCooldownIsNotActive(ctx);
        const params = this.transformValidateParamsOrFail(ctx);
        this.trySetCooldownForInvoker(ctx);
        return this.handlerFn({ ...ctx, params});
    }

    private ensureCooldownIsNotActive(ctx: TryHandleMsgCtx) {
        const lastInvokeTime = this.tryGetLastInvokeTime(ctx);
        if (lastInvokeTime != null) {
            const durationUntilNextCall = humanizeDuration(
                lastInvokeTime + this.cooldownTime! - Date.now(),
                { maxDecimalPoints: 0}
            );
            throw new CmdCooldownError(
                `You have to wait ${'`'}${durationUntilNextCall}${'`'} untill ` +
                `the next call to ${'`'}${ctx.cmd}${'`'}.`
            );
        }
    }

    private ensureSenderObeysRoleLimitOrFail({msg: {member}, cmd}: TryHandleMsgCtx) {
        if (this.userRoleLimit == null) return;
        const {matches, determinativeRole} = this.userRoleLimit
            .matchToRoleLimit(member!.roles);

        if (matches) return;
        const errPrefix = determinativeRole == null
            ? `Only users with one of "${this.userRoleLimit.stringifyRoles()}" roles are`
            : `Users with "${determinativeRole}" role are not`;
        throw new CmdAccessError(`${errPrefix} allowed to execute "${cmd}".`);
    }

    private tryGetLastInvokeTime({msg: {member}}: TryHandleMsgCtx) {
        return this.userIdToLastInvokeTimeMap == null
            ? null
            : this.userIdToLastInvokeTimeMap.get(member!.id);
    }

    private trySetCooldownForInvoker({msg: {member}}: TryHandleMsgCtx) {
        const map = this.userIdToLastInvokeTimeMap;
        if (map == null) return;
        map.set(member!.id, Date.now());
        setTimeout(() => map.delete(member!.id), this.cooldownTime!);
    }

    private transformValidateParamsOrFail({cmd, params}: TryHandleMsgCtx) {
        if (this.params == null) {
            if (params.length > 0) throw new CmdInvalidParamsError(
                `Command **"${cmd}"** expects ${'`'}0${'`'} parameters.\n` +
                `*Usage:* ${'```'}${this.getUsageTemplate()}${'```'}`
            );
            return [];
        }
        try {
            return this.params.transformValidateOrFail(params);
        } catch (err) {
            throw new CmdInvalidParamsError(
                err.message as string + `\n*Usage:* ${'```'}${this.getUsageTemplate()}${'```'}`
            );
        }
    }
}
