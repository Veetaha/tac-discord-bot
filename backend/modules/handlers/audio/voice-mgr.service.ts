import Ds from 'discord.js';
import { Nullable } from 'ts-typedefs';
import { Service } from 'typedi';

import { NotInVoiceChannelError, BotPermissionsError } from '@modules/discord-cmd/errors/cmd.errors';
import { DsClientService } from '@modules/ds-client.service';
import { LogPerformance } from '@modules/utils/log-performance.decorator';


@Service()
export class VoiceMgrService {
    private connection?: Nullable<Ds.VoiceConnection>;
    /** Returns currently established voice connection. */
    getConnection() { return this.connection; }

    constructor(private readonly dsClient: DsClientService) {}

    /**
     * Returns connection that was established with `voiceChannel`. Reuses previous
     * connection if that one already binds this bot to `voiceChannel`.
     * 
     * Throws `UserError` if client doesn't have permissions to join to `voiceChannel`.
     * 
     * @param voiceChannel `Ds.VoiceChannel` to establish connection to.
     */
    @LogPerformance
    async connectToChannelOrFail(voiceChannel: Nullable<Ds.VoiceChannel>) {
        if (voiceChannel == null) {
            throw new NotInVoiceChannelError(
                'You need to be in a voice channel before playing the music.'
            );
        }
        const permissions = voiceChannel.permissionsFor(this.dsClient.client.user)!;
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            throw new BotPermissionsError(
                'I need the permissions to join and speak in your voice channel.'
            );
        }
        await this.connectToChannelOrFailImpl(voiceChannel);
        return this.connection!;
    }
    private async connectToChannelOrFailImpl(voiceChannel: Ds.VoiceChannel){
        if (this.connection == null) {
            this.connection = await voiceChannel.join();
            return;
        }
        if (this.connection.channel.id === voiceChannel.id) return;  
        this.connection.disconnect();
        this.connection = await voiceChannel.join();
    }
    
}