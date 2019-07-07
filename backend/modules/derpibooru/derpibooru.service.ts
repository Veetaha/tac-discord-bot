import { Service } from "typedi";
import { Nullable, Obj } from 'ts-typedefs';

import { LoggingService } from '@modules/logging.service';
import { ConfigService  } from '@modules/config.service';
import { LogPerformance } from '@modules/utils/log-performance.decorator';

import { DerpibooruImg } from './derpibooru.interfaces';

@Service()
export class DerpibooruService {
    private readonly dinkyApi: Obj<any>;

    constructor(config: ConfigService, private readonly log: LoggingService) {
        this.dinkyApi = require('dinky.js')({ key: config.derpibooruApiKey });
    }

    /**
     * Fetches random pony media (image or video) based on the given tags (if there are any).
     * 
     * Pre: Each string in `tags` doesn't contain coma `,`.
     * @param tags Array of tags to search pony media with.
     */
    @LogPerformance
    async tryFetchRandomPonyMedia(tags: readonly string[]): Promise<Nullable<DerpibooruImg>> {
        return this.dinkyApi.search(tags).random().catch(this.log.error);
    }

    /**
     * Fetches random pony image (only image, no videos e.g. `video/webm`)
     * 
     * @param tags Array of tags to search pony image with.
     */
    async fetchRandomPonyImageOrFail(tags: readonly string[]): Promise<DerpibooruImg> {
        const image = await this.tryFetchRandomPonyMedia(['-original_format:webm', ...tags]);
        if (image == null)  {
            throw new Error(`Failed to fetch pony image with tags "${tags.join(', ')}" (not found)`);
        }
        if (!image.mimeType.startsWith('image')) {
            throw new Error(`Failed to fetch pony image, got ${image.mimeType} (not an image)`);
        }
        return image;
    }
}
