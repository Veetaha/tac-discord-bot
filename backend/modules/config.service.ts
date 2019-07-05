import Ds from 'discord.js';
import Container, { Service } from "typedi";

import { EnvService } from "@modules/env.service";
import { NoopIf     } from '@common/utils/noop-if.decorator';
import { InitParams as CmdHandlingInitParams } from './discord/cmd-handling.service';

@Service()
export class ConfigService {
    readonly isDevelopmentMode = this.env.readEnvOrFail('NODE_ENV') !== 'production';

    constructor(private readonly env: EnvService){
        if (this.isDevelopmentMode) env.loadDotenv();
    }
    readonly music = {
        maxQueueSize:          20,
        defaultBitrate:        128, // kbps
        defaultVolume:         1,
        defaultPacketPasses:   1,
        activeTrackEmbedColor: 34047, // https://leovoel.github.io/embed-visualizer/
        emptyQueueEmbedColor:  16711733
    } as const;
    readonly evalUserId = "150684588841107457";
    readonly maxDsMessageLength = 2000;
    readonly mainGuild = {
        mainChannelName:    this.env.readEnvOrFail('MAIN_GUILD_CHANNEL_NAME'),
        name:               this.env.readEnvOrFail('MAIN_GUILD_NAME'),
        initialMemberRoles: this.env.readEnvOrFail('MAIN_GUILD_INITIAL_ROLES').split(',')
    } as const;
    readonly welcomeImg = {
        userAva: {
            x: 650, 
            y: 400, 
            radius: 200
        },
        bg: {
            width: 1700,
            height: 900
        }
    } as const;

    readonly cmdHandlingParams: CmdHandlingInitParams = {
        cmdPrefix: '--'
    };
    
    readonly discordBotToken = this.env.readEnvOrFail('DISCORD_BOT_TOKEN');
    readonly version = this.env.readEnvOrFail('BOT_VERSION');
    readonly errorRichEmbedDefaultOptions: Partial<Ds.RichEmbedOptions> = {
        color: 10948133,
        footer: {
            text: "Cracked by Veetaha",
            icon_url: 'https://images-ext-2.discordapp.net/external/lSfD3_Ncd5ph2ml1JXVoGdaPijjKCUzd3CCCEeCaIfw/%3Fsize%3D2048/https/cdn.discordapp.com/avatars/150684588841107457/eb72b6ef113143b602e0b2af9acd0663.png?width=585&height=585'
        }
    };
}

/** Decorator that should be used on methods to disable in production mode */
export const NoopInProduction = NoopIf(!Container.get(ConfigService).isDevelopmentMode);