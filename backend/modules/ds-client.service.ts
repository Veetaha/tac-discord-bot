import Ds from 'discord.js';
import once from 'lodash/once';
import { Service } from "typedi";

import { LoggingService } from './logging.service';
import { ConfigService  } from './config.service';
import { DsUtilsService } from './handlers/ds-utils.service';
import { CmdHandlingService } from './discord-cmd/cmd-handling.service';
import { DebugService } from './debug.service';

@Service()
export class DsClientService {
    readonly client = new Ds.Client();
    private mainGuild!: Ds.Guild;
    private mainTextChannel!: Ds.TextChannel;

    constructor(
        private readonly log:         LoggingService,
        private readonly debug:       DebugService,
        private readonly config:      ConfigService,
        private readonly dsUtils:     DsUtilsService,
        private readonly cmdHandling: CmdHandlingService
    ) {}

    getMainGuild() {
        return this.mainGuild;
    }
    getMainTextChannel() {
        return this.mainTextChannel;
    }

    init() {
        const { config, client, log, dsUtils, debug } = this;
        client.once('ready', () => {
            this.cmdHandling.init(this.config.cmdHandlingParams);
            try {
                this.mainGuild = client.guilds.find(guild => guild.name === config.mainGuild.name);
                this.mainTextChannel = dsUtils.getGuildWritableTextChannelOrFail(
                    this.mainGuild, config.mainGuild.mainChannelName
                );
            } catch (err) {
                debug.shutdown(err, 'Failed to setup main guild and text channel.');
                return; // why not :D
            }
            log.info(`🚀  Discord bot is listening.`);
        });
        client.on('message', async msg => {
            log.info(msg.content, 'Received Message: ');
            void await this.cmdHandling.tryHandleCmd(msg);
        });
        if (config.isDevelopmentMode) {    
            client.on('debug', this.log.info);
        }
        return this;
    }

    async run() {
        ([`exit`, `SIGINT`, `uncaughtException`, `SIGTERM`] as const)
            .forEach(eventType => process.on(eventType as any, this.onExit));

        return this.client.login(this.config.discordBotToken);
    }

    private readonly onExit = once(() => {
        if (this.client.status === 5 ) return; // DISCONNECTED https://discord.js.org/#/docs/main/stable/typedef/Status
        void this.client.destroy()
            .then(
                () => this.log.info('Bot was successfully shutdown'),
                err => this.log.error(`Shutdown error: ${err}`),
            )
            .finally(() => process.exit(0));
    });
} 