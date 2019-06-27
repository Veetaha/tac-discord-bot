import { Service } from "typedi";

@Service()
export class IteratorService {

    /** 
     * Efficiently joins all the strings emitted by the given `iterator` into
     * one string separated with `separator`.
     * 
     * @param separator String is inserted between successive elements.
     */
    join(iterator: Iterator<string>, separator = ', ') {
        let value: string; 
        if (({value} = iterator.next()).done) {
            return ''; // edge case when the string is empty
        }

        let result = value;
        while (!({value} = iterator.next()).done) {
            result += `${separator}${value}`;
        }
        return result;
    }

}