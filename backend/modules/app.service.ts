import ds from 'discord.js';
import once from 'lodash/once';
import { Service } from "typedi";

import { LoggingService     } from './logging/logging.service';
import { DsUtilsService     } from './handlers/ds-utils.service';
import { CmdHandlingService } from './discord-cmd/cmd-handling.service';
import { DebugService       } from './debug.service';
import { ConfigService, MainGuildConfig } from './config/config.service';
import { unwrapNotNil } from 'ts-not-nil';

@Service()
export class AppService {
    private mainGuilds = new Map<string, [ds.Guild, ds.TextChannel, MainGuildConfig]>();

    constructor(
        private readonly log:           LoggingService,
        private readonly debug:         DebugService,
        private readonly config:        ConfigService,
        private readonly dsUtils:       DsUtilsService,
        private readonly cmdHandling:   CmdHandlingService,
        private readonly dsClient:      ds.Client
    ) {}

    getMainGuilds() {
        return this.mainGuilds;
    }

    getMainTextChannel(guildName: string) {
        const [, channel] = unwrapNotNil(this.mainGuilds.get(guildName));
        return channel;
    }

    init() {
        const { config, dsClient, log, debug, cmdHandling } = this;
        dsClient.once('ready', () => {
            cmdHandling.init(config.cmdHandlingParams);

            debug.shutdownIfThrows(() => this.setMainsGuildsOrFail());

            void debug.shutdownIfThrows(() => this.setDefaultBotActivityOrFail())
                .then(() => log.info(`🚀  Discord bot is listening.`));
        });
        dsClient.on('message', async msg => {
            // Skip messages from our bot itself
            if (msg.member!.user.id === this.dsClient.user!.id) return;

            log.info(msg.content, 'Received Message: ');
            void await cmdHandling.tryHandleCmd(msg);
        });

        return this;
    }
    private setMainsGuildsOrFail() {
        this.dsClient.guilds.cache.forEach(guild => {
            const guildConfig = this.config.mainGuilds.find(it => it.name == guild.name);
            if (!guildConfig) {
                throw new Error(
                    `Main guild config was not found for guild '${guild}'.` +
                    `Did you add it to MAIN_GUILDS env var?`
                );
            }
            const textChannel = this.dsUtils.getGuildWritableTextChannelOrFail(
                guild, guildConfig.mainChannelName
            );
            this.mainGuilds.set(guild.name, [guild, textChannel, guildConfig]);
        });
    }

    private async setDefaultBotActivityOrFail(): Promise<void> {
        await this.dsClient.user!.setPresence(this.config.botUser.presence);
    }

    async run() {
        ([`exit`, `SIGINT`, `uncaughtException`, `SIGTERM`] as const)
            .forEach(eventType => process.on(eventType as any, this.onExit));

        return this.dsClient.login(this.config.discordBotToken);
    }

    private readonly onExit = once(() => {
        // DISCONNECTED https://discord.js.org/#/docs/main/stable/typedef/Status
        if (this.dsClient.ws.status === 5) process.exit(0);
            try {
                this.dsClient.destroy();
                this.log.info('Bot was successfully shutdown');
            } catch (err) {
                this.log.error(err, "Shutdown error");
            } finally {
                process.exit(0)
            }
    });
}
