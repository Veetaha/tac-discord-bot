import Joi from 'typesafe-joi';
import Ds from 'discord.js';
import Ytdl from 'ytdl-core';
import { Nullable } from 'ts-typedefs';
import Container from 'typedi';

import { YtService } from '@modules/yt/yt.service';
import { LogPerformance } from '@modules/utils/log-performance.decorator';


import { YtVidOrder } from './audio.interfaces';
import { YtVidSearchError } from './audio.errors';


export class AudioTrack {  
    private static readonly yt = Container.get(YtService);

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
    @LogPerformance
    static async createFromYtVidOrderOrFail({msg, ytUrlOrQuery}: YtVidOrder) {
        if (Joi.string().uri().validate(ytUrlOrQuery).error != null) {
            ytUrlOrQuery = await AudioTrack.yt.findVideoUrlOrFail(ytUrlOrQuery);
        }
        return Ytdl.getInfo(ytUrlOrQuery).then(
            info => new AudioTrack(info, msg),
            err  => Promise.reject(new YtVidSearchError(
                `Failed to fetch info for "${ytUrlOrQuery}" (${err.message})`
            ))
        );
    }

    /** Returns a simple one-line markdown-formated representation of this track. */
    toMd() {
        const title = `[**"${this.vidInfo.title}"**](${this.vidInfo.video_url})`;
        const author = `**[${this.vidInfo.author.name}](${this.vidInfo.author.channel_url})**`;
        return `${author} - ${title}`;
    }

    /** Retuns total track duration in milliseconds */
    getDuration() {
        return parseInt(this.vidInfo.length_seconds) * 1000;
    }

    getThumbnailUrl() {
        return `https://i.ytimg.com/vi/${this.vidInfo.video_id}/default.jpg`;
    }

    private static readonly ytdlDownloadOpts: Ytdl.downloadOptions = { quality: 'highestaudio' };
    getOriginalBitrateOrFail() {
        const format = Ytdl.chooseFormat(this.vidInfo.formats, AudioTrack.ytdlDownloadOpts);
        if (format instanceof Error) throw format;
        return format.audioBitrate;
    }
    /**
     * Attempts to create youtube stream and pipe it to discord voice channel.
     * Returns `.dispatcher` instance that manages stream transmission.
     * 
     * Pre: client has `SPEAK` permissions.
     * @param vidInfo         Youtube video info to play audio from.
     * @param voiceConnection Voice connection to use for playing.
     */
    streamOrFail(voiceConnection: Ds.VoiceConnection, dsStreamOpts: Ds.StreamOptions = {}) {
        const stream = Ytdl.downloadFromInfo(this.vidInfo, AudioTrack.ytdlDownloadOpts);
        return voiceConnection.playStream(stream, dsStreamOpts); 
        // https://stackoverflow.com/questions/51344574/improvring-discord-js-audio-quailty-for-my-bot
    }

    getVoiceChannel(): Nullable<Ds.VoiceChannel> {
        return this.msg.member.voiceChannel;
    }

}