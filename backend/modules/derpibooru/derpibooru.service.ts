import { Service } from "typedi";
import { Nullable, Obj } from 'ts-typedefs';

import { LoggingService } from '@modules/logging/logging.service';
import { ConfigService  } from '@modules/config/config.service';
import { AppFreezeGuard } from "@modules/config/app-freeze-guard.decorator";

import { DerpibooruImg } from './derpibooru.interfaces';

@Service()
export class DerpibooruService {
    private readonly dinkyApi: Obj<any>;

    constructor(private readonly config: ConfigService, private readonly log: LoggingService) {
        this.dinkyApi = require('dinky.js')({
            key: config.derpibooru.apiKey,
            filter:  config.derpibooru.filter,
        });
    }

    /**
     * Fetches random pony media (image or video) based on the given tags (if there are any).
     *
     * Pre: Each string in `tags` doesn't contain coma `,`.
     * @param tags Array of tags to search pony media with.
     */
    @AppFreezeGuard
    async tryFetchRandomPonyMedia(tags: readonly string[]): Promise<Nullable<DerpibooruImg>> {
        const tagsWithAlwaysOnOnes = [...new Set([...this.config.derpibooru.alwaysOnTags, ...tags]).values()];

        return this.dinkyApi
            .search(tagsWithAlwaysOnOnes)
            .random()
            .limit(1)
            .then((res: any) => res.images[0], this.log.error);
    }

    /**
     * Fetches random pony image (only image, no videos e.g. `video/webm`)
     *
     * @param tags Array of tags to search pony image with.
     */
    async fetchRandomPonyImageOrFail(tags: readonly string[]): Promise<DerpibooruImg> {
        const image = await this.tryFetchRandomPonyMedia(['-original_format:webm', ...tags]);
        if (image == null) {
            throw new Error(`Failed to fetch pony image with tags "${tags.join(', ')}" (not found)`);
        }
        if (!image.mimeType.startsWith('image')) {
            throw new Error(`Failed to fetch pony image, got ${image.mimeType} (not an image)`);
        }
        return image;
    }
}
