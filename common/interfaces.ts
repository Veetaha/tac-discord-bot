/** TODO: move to ts-typedefs */
export type MapTupleItems<TTuple extends any[], TNewItemType> = {
    [TKey in keyof TTuple]: TNewItemType;
};