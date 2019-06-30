import Ds from 'discord.js';
import { Nullable } from 'ts-typedefs';

import { NotInVoiceChannelError, BotPermissionsError } from '@modules/discord/errors/errors';

export class VoiceMgr {
    private connection?: Nullable<Ds.VoiceConnection>;
    getConnection() {
        return this.connection;   
    }

    constructor(private readonly dsClient: Ds.Client) {}

    /**
     * Pre: client has permissions to join the given `voiceChannel`
     * 
     * Returns connection and a boolean.
     * If `.isNew === true` then connection was just establihed `.isNew === false` 
     * if active connection already binds to the given `voiceChannel`.
     * 
     * @param voiceChannel Ds.VoiceChannel to establish connection to.
     */
    async connectToChannelOrFail(voiceChannel: Nullable<Ds.VoiceChannel>) {
        if (voiceChannel == null) {
            throw new NotInVoiceChannelError(
                'You need to be in a voice channel before playing the music.'
            );
        }
        const permissions = voiceChannel.permissionsFor(this.dsClient.user)!;
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            throw new BotPermissionsError(
                'I need the permissions to join and speak in your voice channel.'
            );
        }
        await this.connectToChannel(voiceChannel);
        return this.connection!;
    }

    private async connectToChannel(voiceChannel: Ds.VoiceChannel){
        if (this.connection == null) {
            this.connection = await voiceChannel.join();
        }
        if (this.connection.channel.id === voiceChannel.id) return;  
        this.connection.disconnect();
        this.connection = await voiceChannel.join();
    }
    
}