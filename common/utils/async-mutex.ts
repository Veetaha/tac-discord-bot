import Queue from 'typescript-collections/dist/lib/Queue';
import { SyncOrAsyncFunc } from '../interfaces';

export type ReleaseFn = () => void;

export class AsyncMutex {
    private readonly resolveQueue = new Queue<(release: ReleaseFn) => void>();
    private isAquired = false;
    constructor() {
        this.resolveQueue.enqueue = this.resolveQueue.enqueue.bind(this.resolveQueue);
    }
    /**
     * Returns `true` if this mutex is currently locked (some routine is currently
     * executing the critical section guarded by this mutex).
     */
    isLocked() {
        return this.isAquired;
    }
    /**
     * A simple wrapper for `.aquire()` that automatically releases the mutex
     * when `callbackFn()` finished executing. If `callbackFn()` returns `Promise`,
     * it will await that `Promise` and release the mutex afterwards.
     * `callbackFn` may throw exceptions or reject `Promise`, the mutex will be
     * released in either case.
     * 
     * @param callbackFn Function that contains a critical section to run exclusively.
     */
    runExclusive<T>(callbackFn: SyncOrAsyncFunc<[], T>) {
        return this.acquire().then(release => {
            let result;
            try {
                return result = callbackFn();
            } finally {
                if (result instanceof Promise) return result.finally(release);
                release();
            }
        });
    }
    /**
     * Returns a promise for release function that needs to be invoked when
     * the critical section of code finished executing in order to let other
     * routines execute it if those routines tried to enter the critical section
     * while some other routine hasn't finished executing it.
     * 
     * Returned promise will be resolved once the mutex will be released or
     * if it is already not `.isLocked()`.
     * 
     * Pre: returned release function may be called only once, otherwise: undefined behaviour.
     */
    acquire() {
        const releaseFnPromise = new Promise<ReleaseFn>(this.resolveQueue.enqueue);
        if (!this.isAquired) this.resolveHead();
        return releaseFnPromise;
    }
    /**
     * Resolves head promise and removes it from `.resolveQueue`.
     */
    private readonly resolveHead = () => {
        this.isAquired = !this.resolveQueue.isEmpty();
        if (this.isAquired) {
            this.resolveQueue.dequeue()!(this.resolveHead);
        }
    }
}