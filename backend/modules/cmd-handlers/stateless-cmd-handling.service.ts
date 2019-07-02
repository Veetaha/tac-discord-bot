import Joi from 'typesafe-joi';
import Fs from 'fs';
import Path from 'path';
import Ds from 'discord.js';
import Util from 'util';
import { Service } from "typedi";
import { Nullable } from 'ts-typedefs';

import { CmdEndpoint       } from "@modules/discord/meta/cmd-endpoint.decorator";
import { CmdHandlerFnCtx   } from "@modules/discord/interfaces";
import { ThePonyApiService } from "@modules/the-pony-api/the-pony-api.service";
import { MetadataStorage   } from '@modules/discord/meta/metadata-storage.class';
import { CmdHandlerWrapper } from '@modules/discord/cmd-handler-wrapper.class';

import { UnknownCmdError, EvalPermissionError } from './errors';
import { CmdHandlingService } from '@modules/discord/cmd-handling.service';
import { config } from 'dotenv';
import { ConfigService } from '@modules/config.service';


@Service()
export class TacStatelessCmdHandlingService {
    readonly cmdSyntaxRefference = Fs
        .readFileSync(Path.join(__dirname, 'command-syntax.md'), 'utf8')
        .replace(/\${cmdPrefix}/g, this.cmdHandling.cmdPrefix);

    constructor(
        private readonly thePonyApi:      ThePonyApiService,
        private readonly metadataStorage: MetadataStorage,
        private readonly cmdHandling:     CmdHandlingService,
        private readonly config:          ConfigService
    ) {}

    @CmdEndpoint({
        cmd:         ['pink'],
        description: `Just replies with "Ponk", used for health check.`
    })
    async onPink({msg}: CmdHandlerFnCtx) {
        return msg.reply('Ponk');
    }
    
    @CmdEndpoint({
        cmd:         ['pony'],
        description: `Replies with a random pony image.`,
        cooldownTime: 1000 * 3, // 3 seconds,
        params: {
            definition: [{
                name:        "tags",
                description: "Tags to filter random pony by.",
                schema:      Joi.array().items(Joi.string().regex(/^[^,]+$/))
            }]
        }
    })
    async onPony({msg, params: tags}: CmdHandlerFnCtx<string[]>){
        const pony = await this.thePonyApi.fetchRandomPony(tags);
        const footer = { text: 'Powered by theponyapi.com (cracked by Veetaha)' };

        return msg.reply(new Ds.RichEmbed(pony == null 
            ? {
                title:       `Pony was not found.`,
                description: `Failed to fetch pony with tags ${'`'}[${tags.join(', ')}]${'`'}.`,
                footer
            } : {
                title:       `Random pony for ${msg.member.displayName}`,
                description: `**Tags:** *${'```'}${pony.tags.join(', ')}${'```'}*`,
                image:       { url: pony.representations.full },
                footer
            }));
    } 

    @CmdEndpoint({
        cmd: ['eval'],
        description: 
            'Evaluate JavaScript and return the result. Only lead developer (Veetaha) ' +
            'has access to this command.',
        params: { 
            minRequiredAmount: 0,
            definition: [
                {
                    name: 'script', 
                    description: "JavaScript source code to evaluate at runtime."
                }, {
                    name: 'obj_depth',
                    description: "Defines the depth of objects traversal to display."
                }
            ]
        }
    })
    async onEval({msg, params: [script, depth = 2]}: CmdHandlerFnCtx<[string, Nullable<number>]>) {
        if (this.config.evalUserId !== msg.member.id) {
            throw new EvalPermissionError('Hackers have no rights to call eval.');
        }
        await msg.channel.send(Util.inspect(await eval(script), { 
            showHidden: true, sorted: true, getters: true, depth
        }));
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
        const description = cmd != null 
            ? this.getCommandHelpMd(this.tryGetHandlerOrFail(cmd))
            : this.getAllCommandsHelpMd();

        const opts: Ds.RichEmbedOptions = {
            title: 'Bot command refference',
            footer: { text: 'All rights are not reserved.' },
            description
        };
        await Promise.all([
            this.sendSyntaxRefference(msg),
            msg.channel.send(new Ds.RichEmbed(opts))
        ]);
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
        return `Use ${'`'}--help <cmd>${'`'} in order to view detailed command desription.\n` + 
            `**${'```'}${commands}${'```'}**`;
    }
    private getCommandHelpMd(cmdHandler: CmdHandlerWrapper) {
        const top     = `**${'```'}${cmdHandler.getUsageTemplate()}${'```'}**\n`;
        const aliases = `**Aliases:** *${cmdHandler.cmd.join('*, *')}*\n`;
        const params  = cmdHandler.params == null 
            ? '' 
            : `**Parameters:**:\n` + cmdHandler.params.definition
                .reduce((pstr, param, i) => pstr + 
                    ` ${'`'}${cmdHandler.params!.getParamUsageTemplate(i)}${'`'} ${param.description}\n`,
                    ''
                );
        return `${top}${cmdHandler.description}\n${aliases}${params}`;   
    }
}