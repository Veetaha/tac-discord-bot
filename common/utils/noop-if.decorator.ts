import { MethodDecorator } from 'ts-typedefs';

const noopFn = () => {};
const replaceWithNoop: MethodDecorator = (_protoOrClass, _methodName, descriptor) => {
    descriptor.value = noopFn;
    return descriptor;
};

/**
 * Decorator that replaces decorated method with noop function if `shouldBeNoop` is `true`.
 */
export const NoopIf = (shouldBeNoop: boolean) => shouldBeNoop ? replaceWithNoop : noopFn;