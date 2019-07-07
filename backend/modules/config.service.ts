import Ds from 'discord.js';
import Container, { Service } from "typedi";

import { EnvService } from "@modules/env.service";
import { NoopIf     } from '@common/utils/noop-if.decorator';

import { InitParams as CmdHandlingInitParams } from './discord-cmd/cmd-handling.service';

@Service()
export class ConfigService {
    readonly isDevelopmentMode = this.env.readEnvOrFail('NODE_ENV') !== 'production';

    constructor(private readonly env: EnvService){
        if (this.isDevelopmentMode) env.loadDotenv();
    }
    readonly music = {
        defaultStreamOpts: {
            bitrate:  128, // kbps
            volume:   1,   // [0, 1] percentage of volume
            passes:   1,   // amount of times to send one audio packet
        },
        maxQueueSize:          20,
        activeTrackEmbedColor: 34047, // https://leovoel.github.io/embed-visualizer/
        emptyQueueEmbedColor:  16711733
    } as const;
    readonly evalUserId = "150684588841107457";
    readonly maxDsMessageLength = 2000;
    readonly derpibooruApiKey = this.env.readEnvOrFail('DERPIBOORU_API_KEY');
    readonly ytDataApiKey = this.env.readEnvOrFail('YT_DATA_API_KEY');
    readonly mainGuild = {
        mainChannelName:    this.env.readEnvOrFail('MAIN_GUILD_CHANNEL_NAME'),
        name:               this.env.readEnvOrFail('MAIN_GUILD_NAME'),
        initialMemberRoles: this.env.readEnvOrFail('MAIN_GUILD_INITIAL_ROLES').split(',')
    } as const;

    readonly cmdHandlingParams: CmdHandlingInitParams = {
        cmdPrefix: '!'
    };
    
    readonly discordBotToken = this.env.readEnvOrFail('DISCORD_BOT_TOKEN');
    readonly version = this.env.readEnvOrFail('BOT_VERSION');
    readonly errorRichEmbedDefaultOptions: Partial<Ds.RichEmbedOptions> = {
        color: 10948133,
        thumbnail: { url: `https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/f317c91e-d216-4cb4-92ad-a690a1792fba/d4qcyp5-ccd57935-27b2-4dcd-8da3-8796865be522.png/v1/fill/w_206,h_250,strp/i_just_don_t_know_what_went_wrong_by_toxickittycat_d4qcyp5-250t.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9OTg2IiwicGF0aCI6IlwvZlwvZjMxN2M5MWUtZDIxNi00Y2I0LTkyYWQtYTY5MGExNzkyZmJhXC9kNHFjeXA1LWNjZDU3OTM1LTI3YjItNGRjZC04ZGEzLTg3OTY4NjViZTUyMi5wbmciLCJ3aWR0aCI6Ijw9ODExIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmltYWdlLm9wZXJhdGlvbnMiXX0.jgu-An5VgiWIhLEUxo5u1pKujheBDx09mtmN7AwDFKU` }
    };
}

/** Decorator that should be used on methods to disable in production mode */
export const NoopInProduction = NoopIf(!Container.get(ConfigService).isDevelopmentMode);