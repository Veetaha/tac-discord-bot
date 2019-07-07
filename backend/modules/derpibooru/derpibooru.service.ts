import { Service } from "typedi";
import { Nullable, Obj } from 'ts-typedefs';

import { LoggingService } from '@modules/logging.service';
import { ConfigService  } from '@modules/config.service';
import { LogPerformance } from '@modules/utils/log-performance.decorator';

import { DerpibooruImg } from './derpibooru.interfaces';

const Dinky = require('dinky.js');

@Service()
export class DerpibooruService {
    private readonly dinkyApi: Obj<any>;

    constructor(config: ConfigService, private readonly log: LoggingService) {
        this.dinkyApi = Dinky({ key: config.derpibooruApiKey });
    }

    /**
     * Fetches random pony based on the given tags (if there are any).
     * 
     * Pre: Each string in `tags` doesn't contain coma `,`.
     * @param tags 
     */
    @LogPerformance
    async tryFetchRandomPony(tags: string[]): Promise<Nullable<DerpibooruImg>> {
        return this.dinkyApi.search(tags).random().catch(this.log.error);
    }
}
