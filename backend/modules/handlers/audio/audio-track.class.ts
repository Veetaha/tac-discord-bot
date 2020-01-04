import joi from 'typesafe-joi';
import ds from 'discord.js';
import ytdl from 'ytdl-core';
import { Nullable } from 'ts-typedefs';
import { Container } from 'typedi';

import { YtService } from '@modules/yt/yt.service';
import { AppFreezeGuard } from '@modules/config/app-freeze-guard.decorator';


import { YtVidOrder } from './audio.interfaces';
import { YtVidSearchError } from './audio.errors';


export class AudioTrack {
    private static readonly yt = Container.get(YtService);

    constructor(
        /** Youtube video info fetched via `Ytdl`. */
        private readonly vidInfo: ytdl.videoInfo,
        /** Message that ordered this audio track to play. */
        readonly msg: ds.Message
    ) {}

    /**
     * Fetches yt video metadata and associates it with the returned `AudioTrack`.
     * @param ytUrl    Youtube video url to get audio from.
     * @param customer Disord guild member that ordered this track.
     */
    @AppFreezeGuard
    static async createFromYtVidOrderOrFail({msg, ytUrlOrQuery}: YtVidOrder) {
        if (joi.string().uri().validate(ytUrlOrQuery).error != null) {
            ytUrlOrQuery = await AudioTrack.yt.findVideoUrlOrFail(ytUrlOrQuery);
        }
        return ytdl.getInfo(ytUrlOrQuery).then(
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
    getDuration(): number {
        return parseInt(this.vidInfo.length_seconds) * 1000;
    }

    getThumbnailUrl(): string {
        return `https://i.ytimg.com/vi/${this.vidInfo.video_id}/default.jpg`;
    }

    private static readonly ytdlDownloadOpts: ytdl.downloadOptions = { quality: 'highestaudio' };
    getOriginalBitrateOrFail(): number {
        const format = ytdl.chooseFormat(this.vidInfo.formats, AudioTrack.ytdlDownloadOpts);
        if (format instanceof Error) throw format;
        return Number(format.bitrate) / 1000;
    }
    /**
     * Attempts to create youtube stream and pipe it to discord voice channel.
     * Returns `.dispatcher` instance that manages stream transmission.
     *
     * Pre: client has `SPEAK` permissions.
     * @param vidInfo         Youtube video info to play audio from.
     * @param voiceConnection Voice connection to use for playing.
     */
    streamOrFail(voiceConnection: ds.VoiceConnection, dsStreamOpts: ds.StreamOptions = {}) {
        const stream = ytdl.downloadFromInfo(this.vidInfo, AudioTrack.ytdlDownloadOpts);
        return voiceConnection.playStream(stream, dsStreamOpts);
        // https://stackoverflow.com/questions/51344574/improvring-discord-js-audio-quailty-for-my-bot
    }

    getVoiceChannel(): Nullable<ds.VoiceChannel> {
        return this.msg.member.voiceChannel;
    }

}
