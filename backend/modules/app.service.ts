import Ds from 'discord.js';
import once from 'lodash/once';
import { Service } from "typedi";

import { LoggingService     } from './logging/logging.service';
import { ConfigService      } from './config/config.service';
import { DsUtilsService     } from './handlers/ds-utils.service';
import { CmdHandlingService } from './discord-cmd/cmd-handling.service';
import { DebugService       } from './debug.service';
import { DerpibooruService  } from './derpibooru/derpibooru.service';

@Service()
export class AppService {
    private mainGuild!:       Ds.Guild;
    private mainTextChannel!: Ds.TextChannel;

    constructor(
        private readonly log:           LoggingService,
        private readonly debug:         DebugService,
        private readonly config:        ConfigService,
        private readonly dsUtils:       DsUtilsService,
        private readonly cmdHandling:   CmdHandlingService,
        private readonly derpibooruApi: DerpibooruService,
        private readonly dsClient:      Ds.Client
    ) {}

    getMainGuild() {
        return this.mainGuild;
    }
    getMainTextChannel() {
        return this.mainTextChannel;
    }

    init() {
        const { config, dsClient, log, debug, cmdHandling } = this;
        dsClient.once('ready', () => {
            cmdHandling.init(config.cmdHandlingParams);
            
            debug.shutdownIfThrows(() => this.setMainGuildOrFail());
            void debug.shutdownIfThrows(() => this.setDefaultBotActivityOrFail())
                .then(() => log.info(`🚀  Discord bot is listening.`));

            dsClient.setInterval(
                () => this.tryUpdateBotAvatarOrFail().catch(log.error), 
                config.botUser.avatar.updateInterval
            );
        });
        dsClient.on('message', async msg => {
            if (msg.member.user.id === this.dsClient.user.id) return;
            log.info(msg.content, 'Received Message: ');
            void await cmdHandling.tryHandleCmd(msg);
        });
        
        return this;
    }
    private setMainGuildOrFail() {
        const { dsClient, config: {mainGuild}, dsUtils } = this;
        this.mainGuild = dsClient.guilds.find(guild => guild.name === mainGuild.name);
        this.mainTextChannel = dsUtils.getGuildWritableTextChannelOrFail(
            this.mainGuild, mainGuild.mainChannelName
        );
    }
    private async setDefaultBotActivityOrFail() {
        await this.dsClient.user.setPresence(this.config.botUser.presence);        
    }
    private async tryUpdateBotAvatarOrFail() {
        const {representations:{full}} = await this.derpibooruApi
            .fetchRandomPonyImageOrFail(this.config.botUser.avatar.tags);
        return this.dsClient.user.setAvatar(`https:${full}`);
    }

    async run() {
        ([`exit`, `SIGINT`, `uncaughtException`, `SIGTERM`] as const)
            .forEach(eventType => process.on(eventType as any, this.onExit));

        return this.dsClient.login(this.config.discordBotToken);
    }

    private readonly onExit = once(() => {
        // DISCONNECTED https://discord.js.org/#/docs/main/stable/typedef/Status
        if (this.dsClient.status === 5) process.exit(0);
        void this.dsClient.destroy()
            .then(
                () => this.log.info('Bot was successfully shutdown'),
                this.log.createErrback(`Shutdown error`)
            )
            .finally(() => process.exit(0));
    });
} 
