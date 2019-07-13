import Ds from 'discord.js';
import { Service } from "typedi";
import { Nullable } from 'ts-typedefs';

import { DsUtilsService } from '@modules/handlers/ds-utils.service';

import { LoggingService, LogType } from "./logging.service";
import { ConfigService } from '@modules/config/config.service';

/**
 * Production loggin service that sends log messages to discord development chat.
 */
@Service()
export class DsLoggingService extends LoggingService {
    
    logChannel: Nullable<Ds.TextChannel>;

    constructor(
        private readonly dsUtils: DsUtilsService,
        dsClient:   Ds.Client,
        {logGuild}: ConfigService
    ) {
        super();
        dsClient.once('ready', () => {
            const guild     = dsClient.guilds.find(({name}) => name === logGuild.name);
            this.logChannel = dsUtils.getGuildWritableTextChannelOrFail(guild, logGuild.channelName); 
        });
    }

    writeLog(logType: LogType, msg: string) {
        if (!this.logChannel) {
            super.writeLog(logType, msg);
            return;
        } 
        this.dsUtils
            .sendMsgInChunksToFit(
                this.logChannel, 
                `${'```'}${this.createMsgPrefix(logType)}${msg}${'```'}`
            )
            .catch(err => {
                console.warn(`Failed to log "${msg}"`);
                console.warn('Error: ');
                console.error(err);
            });
    }

}