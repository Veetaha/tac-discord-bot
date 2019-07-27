import { Func, AsyncFunc } from "ts-typedefs";

/**
 * Defines the type of function executes synchronously which return value is discarded.
 */
export type Routine<TParams extends any[] = [], TThis = unknown> = 
Func<TParams, void, TThis>;

/**
 * Defines the type of function executes asynchronously which return value is discarded.
 */
export type AsyncRoutine<TParams extends any[] = [], TThis = unknown> = 
AsyncFunc<TParams, unknown, TThis>;
/**
 * Defines the type of function that executes synchronously or asynchronously 
 * which return value is discarded.
 */
export type MaybeAsyncRoutine<TParams extends any[] = [], TThis = unknown> = 
Func<TParams, void | Promise<unknown>, TThis>;

/**
 * Defines the type of function that may return value syncronously or asyncronously.
 */
export type SyncOrAsyncFunc<
    TParams extends any[] = any,
    TRetval = unknown,
    TThis = any
> = Func<TParams, TRetval | Promise<TRetval>, TThis>;


/** TODO: move to ts-typedefs */
export type MapTupleItems<TTuple extends any[], TNewItemType> = {
    [TKey in keyof TTuple]: TNewItemType;
};

export type WrapIntoPromise<T> = T extends Promise<any> ? T : Promise<T>;