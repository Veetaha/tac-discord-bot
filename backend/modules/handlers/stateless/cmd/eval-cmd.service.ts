import Joi from 'typesafe-joi';
import Util from 'util';
import { Service } from "typedi";
import { Nullable } from "ts-typedefs";

import { CmdEndpoint } from "@modules/discord-cmd/meta/cmd-endpoint.decorator";
import { CmdHandlerFnCtx } from "@modules/discord-cmd/cmd.interfaces";
import { ConfigService } from '@modules/config/config.service';
import { DsUtilsService } from '@modules/handlers/ds-utils.service';

import { EvalPermissionError } from "../stateless.errors";

@Service()
export class EvalCmdService {
    constructor(
        private readonly config:  ConfigService,
        private readonly dsUtils: DsUtilsService
    ) {}

    @CmdEndpoint({
        cmd: ['eval'],
        description: 
            'Evaluate JavaScript and return the result. Only lead developer (Veetaha) ' +
            'has access to this command.',
        params: { 
            minRequiredAmount: 1,
            definition: [
                {
                    name: 'script', 
                    description: "JavaScript source code to evaluate at runtime."
                }, {
                    name: 'obj_depth',
                    description: "Defines the depth of objects traversal to display.",
                    schema: Joi.number()
                }
            ]
        }
    })
    async onEval({msg, params: [script, depth = 1]}: CmdHandlerFnCtx<[string, Nullable<number>]>) {
        if (this.config.evalUserId !== msg.member.id) {
            throw new EvalPermissionError('Hackers have no rights to call eval.');
        }
        const inspected = Util.inspect(await eval(script), { 
            showHidden: true, sorted: true, getters: true, depth
        });
        await this.dsUtils.sendMsgInChunksToFit(msg.channel, inspected);
    }
}