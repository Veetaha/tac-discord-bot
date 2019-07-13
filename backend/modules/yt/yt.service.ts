import { Service } from "typedi";
import Axios from 'axios';

import { ConfigService } from "@modules/config/config.service";
import { YtVidSearchError } from "@modules/handlers/audio/audio.errors";

import { YtFindVideoResponse } from "./yt.interfaces";

@Service()
export class YtService {

    constructor(private readonly config: ConfigService) {}

    /**
     * Tries to find yotube video by given `query` string.
     * Returns `null` or found first found youtube video id.
     * 
     * @param query Search query to find video for.
     * 
     * @see https://developers.google.com/youtube/v3/docs/search/list?apix_params=%7B%22part%22%3A%22snippet%22%2C%22relatedToVideoId%22%3A%22Ks-_Mh1QhMc%22%2C%22type%22%3A%22video%22%7D#usage
     */ 
    async findVideoUrlOrFail(query: string) {
        return Axios.get<YtFindVideoResponse>(
            'https://www.googleapis.com/youtube/v3/search', {
            params: new URLSearchParams({
                maxResults: '1',
                type: 'video',
                part: 'id',
                q: query,
                key: this.config.ytDataApiKey
            })
        }).then(
            ({data:{items: [video]}}) => {
                if (video == null) throw new YtVidSearchError(
                    `Failed to find youtube video for "${query}" query.`
                );
                return `https://www.youtube.com/watch?v=${video.id.videoId}`;
            },
            err => Promise.reject(new YtVidSearchError(
                `Failed to do search request for "${query}" (${err.message})`
            ))
        );
        
    }

}