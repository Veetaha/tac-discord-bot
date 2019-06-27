import fetch from 'node-fetch';
import { Service } from "typedi";

import { RandomPonyResult } from './the-pony-api.interfaces';

@Service()
export class ThePonyApiService {
    private readonly apiPrefix = `https://theponyapi.com/api/v1`;

    async fetchRanomPonyImgUrl() {
        const {pony}: RandomPonyResult = await (await fetch(
            `${this.apiPrefix}/pony/random`, { method: 'GET' })
        ).json();
        return pony.representations.full;
    }


}