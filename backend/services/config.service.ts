import { Service } from "typedi";

import { EnvService } from "@services/env.service";

@Service()
export class ConfigService {
    readonly isDevelopmentMode = true;

    constructor(private readonly env: EnvService){
        if (this.isDevelopmentMode) env.loadDotenv();
    }

    readonly discordBotToken = this.env.readEnvOrFail('DISCORD_BOT_TOKEN');
    readonly version = this.env.readEnvOrFail('BOT_VERSION');
}