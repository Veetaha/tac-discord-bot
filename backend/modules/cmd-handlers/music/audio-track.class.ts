import Ds from 'discord.js';
import Ytdl from 'ytdl-core';
import { Nullable } from 'ts-typedefs';
import { YtVidOrder } from './interfaces';
import { FetchYtInfoError } from './errors';

export class AudioTrack {

    constructor(
        /** Youtube video info fetched via `Ytdl`. */
        private readonly vidInfo: Ytdl.videoInfo,
        /** Message that ordered this audio track to play. */
        readonly msg: Ds.Message
    ) {}

    /**
     * Fetches yt video metadata and associates it with the returned `AudioTrack`.
     * @param ytUrl    Youtube video url to get audio from.
     * @param customer Disord guild member that ordered this track.
     */
    static async createFromYtVidOrderOrFail(order: YtVidOrder) {
        return Ytdl.getInfo(order.ytUrl).then(
            info => new AudioTrack(info, order.msg),
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
        const opts: Ytdl.downloadOptions = { quality: 'highestaudio' };
        const stream = Ytdl.downloadFromInfo(this.vidInfo, opts);
        return voiceConnection.playStream(stream, { bitrate: 192000 }); 
        // https://stackoverflow.com/questions/51344574/improvring-discord-js-audio-quailty-for-my-bot
    }

    getVoiceChannel(): Nullable<Ds.VoiceChannel> {
        return this.msg.member.voiceChannel;
    }

}