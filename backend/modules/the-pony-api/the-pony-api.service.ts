import _ from 'lodash';
import Axios from 'axios';
import { Service } from "typedi";


import { RandomPonyResult } from './the-pony-api.interfaces';
import { URLSearchParams } from 'url';

@Service()
export class ThePonyApiService {
    private readonly apiPrefix = `https://theponyapi.com/api/v1`;

    /**
     * Fetches random pony based on the given tags (if there are any).
     * 
     * Pre: Each string in `tags` doesn't contain coma `,`.
     * @param tags 
     */
    async fetchRandomPony(tags: string[] = []) {
        return Axios
            .get<RandomPonyResult>(`${this.apiPrefix}/pony/random`, {
                params: new URLSearchParams({ q: tags })
            })
            .then(res => res.data.pony, _.noop);
    }


}