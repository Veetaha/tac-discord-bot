import { Service } from "typedi";

import { CmdEndpoint } from "@modules/discord-cmd/meta/cmd-endpoint.decorator";
import { CmdHandlerFnCtx } from "@modules/discord-cmd/cmd.interfaces";

@Service()
export class PinkCmdService {
    @CmdEndpoint({
        cmd:         ['pink'],
        description: `Just replies with "Ponk", used for health check.`
    })
    async onPink({msg}: CmdHandlerFnCtx) {
        return msg.reply('Ponk');
    }
}