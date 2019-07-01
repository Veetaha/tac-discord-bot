import Ds from 'discord.js';
import { Service } from "typedi";

import { LoggingService } from './logging.service';
import { ConfigService  } from './config.service';
import { CmdHandlingService, HandlingResult } from './discord/cmd-handling.service';

@Service()
export class DsClientService {
    readonly client = new Ds.Client();

    constructor(
        private readonly log:    LoggingService,
        private readonly config: ConfigService,
        private readonly cmds:   CmdHandlingService,
    ) {}

    init() {
        this.cmds.init(this.config.cmdHandlingParams);

        if (this.config.isDevelopmentMode) {
            this.client.on('debug', info => this.log.info(info));
        }

        this.client
            .on('message', async msg => {
                const result = await this.cmds.tryHandleCmd(msg);
                if (result === HandlingResult.UnknownCommand) {
                    await msg.reply(`Unknown command "${msg.content}".`);
                }
            })
            .on('ready', () => this.log.info(`🚀  Discord bot is listening.`));
        return this;
    }

    run() {
        this.client.login(this.config.discordBotToken).catch(err => this.log.error(
            err, `bootstrapping error, discord bot failed to log in`
        ));
        // const exitEvents = 
        ([`exit`, `SIGINT`, `uncaughtException`, `SIGTERM`] as const).forEach((eventType) => {
            process.on(eventType as any, () => this.client.destroy());
        });
        return this;
    }
} 