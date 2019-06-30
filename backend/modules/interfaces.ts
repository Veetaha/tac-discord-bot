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