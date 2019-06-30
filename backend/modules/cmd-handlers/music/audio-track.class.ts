import Ds from 'discord.js';
import Ytdl from 'ytdl-core';
import { Nullable } from 'ts-typedefs';
import { YtVidOrder } from './interfaces';
import { FetchYtInfoError } from './errors';

export class AudioTrack {

    constructor(
        /** Youtube video info fetched via `Ytdl`. */
        private readonly vidInfo: Ytdl.videoInfo,
        /** User that ordered this audio track to play. */
        readonly customer: Ds.GuildMember
    ) {}

    /**
     * Fetches yt video metadata and associates it with the returned `AudioTrack`.
     * @param ytUrl    Youtube video url to get audio from.
     * @param customer Disord guild member that ordered this track.
     */
    static async createFromYtVidOrderOrFail(order: YtVidOrder) {
        return Ytdl.getInfo(order.ytUrl).then(
            info => new AudioTrack(info, order.customer),
            err  => Promise.reject(new FetchYtInfoError(
                `Failed to fetch info for '${order.ytUrl} (${err.message}).'`
            ))
        );
    }

    getTitleMd() {
        return `[**"${this.vidInfo.title}"**](${this.vidInfo.video_url})`;
    }

    getThumbnailMd() {
        return `[![Video thumbnail]${this.vidInfo.thumbnail_url}](${this.vidInfo.video_url})`;
    }

    getAuthorMd() {
        return `**[${this.vidInfo.author.name}](${this.vidInfo.author.channel_url})**`;
    }

    /**
     * Attempts to create youtube stream and pipe it to discord voice channel.
     * Returns `.dispatcher` instance that manages stream transmission.
     * 
     * Pre: client has `SPEAK` permissions.
     * @param vidInfo         Youtube video info to play audio from.
     * @param voiceConnection Voice connection to use for playing.
     */
    streamTo(voiceConnection: Ds.VoiceConnection) {
        return voiceConnection.playStream(Ytdl.downloadFromInfo(this.vidInfo, { 
            filter: 'audioonly', quality: 'highestaudio'
        }));
    }

    getVoiceChannel(): Nullable<Ds.VoiceChannel> {
        return this.customer.voiceChannel;
    }

}