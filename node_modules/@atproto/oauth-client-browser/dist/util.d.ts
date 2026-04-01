export type Simplify<T> = {
    [K in keyof T]: T[K];
} & NonNullable<unknown>;
export type TupleUnion<U extends string, R extends any[] = []> = {
    [S in U]: Exclude<U, S> extends never ? [...R, S] : TupleUnion<Exclude<U, S>, [...R, S]>;
}[U];
/**
 * @example
 * ```ts
 * const clientId = buildLoopbackClientId(window.location)
 * ```
 */
export declare function buildLoopbackClientId(location: {
    hostname: string;
    pathname: string;
    port: string;
}, localhost?: string): string;
//# sourceMappingURL=util.d.ts.map