import Ds from 'discord.js';
import once from 'lodash/once';
import { Service } from "typedi";

import { LoggingService      } from './logging.service';
import { ConfigService       } from './config.service';
import { DsUtilsService      } from './handlers/ds-utils.service';
import { CmdHandlingService } from './discord-cmd/cmd-handling.service';
import { DebugService       } from './debug.service';
import { DerpibooruService  } from './derpibooru/derpibooru.service';

@Service()
export class DsClientService {
    readonly client = new Ds.Client();
    private mainGuild!: Ds.Guild;
    private mainTextChannel!: Ds.TextChannel;

    constructor(
        private readonly log:           LoggingService,
        private readonly debug:         DebugService,
        private readonly config:        ConfigService,
        private readonly dsUtils:       DsUtilsService,
        private readonly cmdHandling:   CmdHandlingService,
        private readonly derpibooruApi: DerpibooruService
    ) {}

    getMainGuild() {
        return this.mainGuild;
    }
    getMainTextChannel() {
        return this.mainTextChannel;
    }

    init() {
        const { config, client, log, debug, cmdHandling } = this;
        client.once('ready', () => {
            cmdHandling.init(config.cmdHandlingParams);
            try { 
                this.setMainGuildOrFail(); 
            } catch (err) { 
                debug.shutdown(err); 
            }
            this.setDefaultBotActivityOrFail().catch(debug.shutdown);
            client.setInterval(
                () => this.tryUpdateBotAvatarOrFail().catch(log.error), 
                config.botUser.avatar.updateInterval
            );
        });
        client.on('message', async msg => {
            log.info(msg.content, 'Received Message: ');
            void await cmdHandling.tryHandleCmd(msg);
        });
        client.on('debug', info => log.info(info, `Discord debug`));
        
        return this;
    }
    private setMainGuildOrFail() {
        const { client, config: {mainGuild}, dsUtils } = this;
        this.mainGuild = client.guilds.find(guild => guild.name === mainGuild.name);
        this.mainTextChannel = dsUtils.getGuildWritableTextChannelOrFail(
            this.mainGuild, mainGuild.mainChannelName
        );
    }
    private async setDefaultBotActivityOrFail() {
        await this.client.user.setPresence(this.config.botUser.presence);        
        this.log.info(`🚀  Discord bot is listening.`);
    }
    private async tryUpdateBotAvatarOrFail() {
        const {representations:{full}} = await this.derpibooruApi
            .fetchRandomPonyImageOrFail(this.config.botUser.avatar.tags);
        return this.client.user.setAvatar(`https:${full}`);
    }

    async run() {
        ([`exit`, `SIGINT`, `uncaughtException`, `SIGTERM`] as const)
            .forEach(eventType => process.on(eventType as any, this.onExit));

        return this.client.login(this.config.discordBotToken);
    }

    private readonly onExit = once(() => {
        // DISCONNECTED https://discord.js.org/#/docs/main/stable/typedef/Status
        if (this.client.status === 5) process.exit(0);
        void this.client.destroy()
            .then(
                () => this.log.info('Bot was successfully shutdown'),
                err => this.log.error(`Shutdown error: ${err}`)
            )
            .finally(() => process.exit(0));
    });
} 