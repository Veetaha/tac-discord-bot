import Discord from 'discord.js';
import Container, { Service } from "typedi";

import { EnvService } from "@services/env.service";
import { NoopIf } from '@common/utils/noop-if.decorator';

@Service()
export class ConfigService {
    readonly isDevelopmentMode = this.env.readEnvOrFail('NODE_ENV') !== 'production';

    constructor(private readonly env: EnvService){
        if (this.isDevelopmentMode) env.loadDotenv();
    }

    readonly discordBotToken = this.env.readEnvOrFail('DISCORD_BOT_TOKEN');
    readonly version = this.env.readEnvOrFail('BOT_VERSION');
    readonly errorRichEmbedDefaultOptions: Partial<Discord.RichEmbedOptions> = {
        color: 16085570,
        image: {
            url: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/ea6ec953-ee02-48e4-9a61-2fd2cfcc37f4/d51gqbt-b08875e6-0aef-4281-a17f-a8545405995d.png/v1/fill/w_272,h_250,strp/derpys_der_di_durp_by_regnbogsrus_d51gqbt-250t.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9ODI3IiwicGF0aCI6IlwvZlwvZWE2ZWM5NTMtZWUwMi00OGU0LTlhNjEtMmZkMmNmY2MzN2Y0XC9kNTFncWJ0LWIwODg3NWU2LTBhZWYtNDI4MS1hMTdmLWE4NTQ1NDA1OTk1ZC5wbmciLCJ3aWR0aCI6Ijw9OTAwIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmltYWdlLm9wZXJhdGlvbnMiXX0.gMxUIP4554TK77ux9q170jEw34QGGGU1eXrdLXP2Bqk'
            // TODO: height and width properties don't work (discord.js bug)
        },
        footer: {
            text: "Cracked by Veetaha",
            icon_url: 'https://images-ext-2.discordapp.net/external/lSfD3_Ncd5ph2ml1JXVoGdaPijjKCUzd3CCCEeCaIfw/%3Fsize%3D2048/https/cdn.discordapp.com/avatars/150684588841107457/eb72b6ef113143b602e0b2af9acd0663.png?width=585&height=585'
        }
    };
}

/** Decorator that is should be used on methods to disable in production mode */
export const NoopInProduction = NoopIf(!Container.get(ConfigService).isDevelopmentMode);