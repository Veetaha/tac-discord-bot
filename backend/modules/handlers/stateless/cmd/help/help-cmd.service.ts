import Fs from 'fs';
import Path from 'path';
import Ds from 'discord.js';
import { Service } from "typedi";
import { Nullable } from 'ts-typedefs';
import humanizeDuration from 'humanize-duration';

import { CmdEndpoint        } from "@modules/discord-cmd/meta/cmd-endpoint.decorator";
import { CmdHandlerFnCtx    } from "@modules/discord-cmd/cmd.interfaces";
import { MetadataStorage    } from '@modules/discord-cmd/meta/metadata-storage.class';
import { CmdHandlerWrapper  } from '@modules/discord-cmd/cmd-handler-wrapper.class';

import { UnknownCmdError } from '../../stateless.errors';
import { ConfigService } from '@modules/config.service';

@Service()
export class HelpCmdService {
    private readonly cmdSyntaxRefference: string;

    constructor(
        private readonly metadataStorage: MetadataStorage,
        private readonly config:          ConfigService
    ) {
        this.cmdSyntaxRefference = Fs
            .readFileSync(Path.join(__dirname, 'command-syntax.md'), 'utf8')
            .replace(/\$\{cmdPrefix\}/g, config.cmdHandlingParams.cmdPrefix);
    }

    @CmdEndpoint({
        cmd: ['help', 'h'],
        description: 'Displays command help box.',
        params: {
            minRequiredAmount: 0,
            definition: [{
                name: 'cmd',
                description: "Command name to display help for."
            }]
        }
    })
    async onHelp({msg, params: [cmd]}: CmdHandlerFnCtx<[Nullable<string>]>) {
        return cmd != null 
            ?  msg.channel.send(this.createHelpEmbed(this.getCommandHelpMd(
                this.tryGetHandlerOrFail(cmd)
            )))
            :  Promise.all([
                msg.channel.send(this.createHelpEmbed(this.getAllCommandsHelpMd())),
                this.sendSyntaxRefference(msg), 
            ]);
    }
    private createHelpEmbed(description: string) {
        return new Ds.RichEmbed({
            title: 'Bot command refference',
            footer: { text: 'All rights are not reserved.' },
            description
        });
    }
    private async sendSyntaxRefference(msg: Ds.Message) {
        const opts: Ds.RichEmbedOptions = {
            title: 'Bot syntax refference',
            footer: { text: 'All rights are not reserved.' },
            description: this.cmdSyntaxRefference
        };
        await msg.channel.send(new Ds.RichEmbed(opts));
    }

    private tryGetHandlerOrFail(cmd: string) {
        const handler = this.metadataStorage.getHandlerForCmd(cmd);
        if (handler == null) {
            throw new UnknownCmdError(`Command ${'`'}${cmd}${'`'} was not found.`);
        }
        return handler;
    }

    private getAllCommandsHelpMd() {
        let commands = '';
        for (const handler of this.metadataStorage.getHandlers()) {
            commands += `${handler.getUsageTemplate()}\n`;
        }
        const {cmdPrefix} = this.config.cmdHandlingParams;
        return `Use ${'`'}${cmdPrefix}help <cmd>${'`'} in order to view detailed ` +
            `command desription.\n **${'```'}${commands}${'```'}**`;
    }
    private getCommandHelpMd(cmdHandler: CmdHandlerWrapper) {
        const top     = `**${'```'}${cmdHandler.getUsageTemplate()}${'```'}**\n`;
        const aliases = `**❯ Aliases:** *${cmdHandler.cmd.join('*, *')}*\n`;
        const cooldown  = cmdHandler.cooldownTime == null ? '' 
            : `**❯ Cooldown**: ${'`'}${humanizeDuration(cmdHandler.cooldownTime)}${'`'}\n`;
        const params  = cmdHandler.params == null ? '' 
            : `**❯ Parameters:**:\n` + cmdHandler.params.definition
                .reduce((pstr, param, i) => pstr + 
                    ` ${'`'}${cmdHandler.params!.getParamUsageTemplate(i)}${'`'} ${param.description}\n`,
                    ''
                );
        return `${top}${cmdHandler.description}\n${aliases}${cooldown}${params}`;   
    }
}