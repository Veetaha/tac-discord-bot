import { Service } from "typedi";

@Service()
export class IteratorService {

    /**
     * Efficiently joins all the strings emitted by the given `iterator` into
     * one string separated with `separator`.
     *
     * @param separator String is inserted between successive elements.
     */
    join(iterator: Iterator<string>, separator = ', '): string {
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

    /**
     * Returns the maximum element that was emitted by `iterator`, if iterator
     * didn't emit any value, returns `undefined`.
     *
     * @param iterator     Iterator to emit values for search of maximum.
     * @param valueToNumFn Function that transforms `value` to its number equivalent.
     */
    max<TValue>(
        iterator: Iterator<TValue>,
        valueToNumFn: (value: TValue) => number
    ): TValue | undefined {
        let maxValue: TValue | undefined;
        let maxValueNum = -Infinity;
        let value: TValue;
        while (!({value} = iterator.next()).done) {
            const valueNum = valueToNumFn(value);
            if (valueNum > maxValueNum) {
                maxValue    = value;
                maxValueNum = valueNum;
            }
        }
        return maxValue;
    }

    /**
     * Returns an iterator over only unique elements emitted by `iterator`.
     * Items comparison is made via `sameValueZero` algorithm.
     *
     * @param iterator Iterator to get unique items from.
     */
    *uniq<TValue>(iterator: Iterator<TValue>) {
        const metValues = new Set<TValue>();
        let value: TValue;
        while (!({value} = iterator.next()).done) {
            if (!metValues.has(value)) {
                metValues.add(value);
                yield value;
            }
        }
    }
}
