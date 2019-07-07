import noop from 'lodash/noop';
import { Service } from "typedi";
import { Nullable, Obj } from 'ts-typedefs';

import { DerpibooruImg } from './derpibooru.interfaces';
import { ConfigService } from '@modules/config.service';

const Dinky = require('dinky.js');

@Service()
export class DerpibooruService {
    private readonly dinkyApi: Obj<any>;

    constructor(config: ConfigService) {
        this.dinkyApi = Dinky({ key: config.derpibooruApiKey });

    }

    /**
     * Fetches random pony based on the given tags (if there are any).
     * 
     * Pre: Each string in `tags` doesn't contain coma `,`.
     * @param tags 
     */
    async tryFetchRandomPony(tags: string[] = []): Promise<Nullable<DerpibooruImg>> {
        console.time('thePonyApi');
        const result = await this.dinkyApi.search(tags).random();
        return result == null 
            ? null 
            : this.dinkyApi
                .images()
                .id(result.id)
                .catch(noop)
                .finally(() => console.timeEnd('thePonyApi'));
    }


}
