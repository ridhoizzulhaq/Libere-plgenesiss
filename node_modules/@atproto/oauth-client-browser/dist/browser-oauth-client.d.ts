import { AuthorizeOptions, Fetch, OAuthClient, OAuthClientOptions, OAuthSession } from '@atproto/oauth-client';
import { OAuthClientMetadataInput, OAuthResponseMode } from '@atproto/oauth-types';
import { Simplify } from './util.js';
export type BrowserOAuthClientOptions = Simplify<{
    clientMetadata?: Readonly<OAuthClientMetadataInput>;
    responseMode?: Exclude<OAuthResponseMode, 'form_post'>;
    fetch?: Fetch;
} & Omit<OAuthClientOptions, 'clientMetadata' | 'responseMode' | 'keyset' | 'fetch' | 'runtimeImplementation' | 'sessionStore' | 'stateStore' | 'didCache' | 'handleCache' | 'dpopNonceCache' | 'authorizationServerMetadataCache' | 'protectedResourceMetadataCache'>>;
export type BrowserOAuthClientLoadOptions = Simplify<{
    clientId: string;
    signal?: AbortSignal;
} & Omit<BrowserOAuthClientOptions, 'clientMetadata'>>;
export declare class BrowserOAuthClient extends OAuthClient implements AsyncDisposable {
    static load({ clientId, ...options }: BrowserOAuthClientLoadOptions): Promise<BrowserOAuthClient>;
    private readonly ac;
    private readonly database;
    constructor({ clientMetadata, responseMode, ...options }: BrowserOAuthClientOptions);
    /**
     * This method will automatically restore any existing session, or attempt to
     * process login callback if the URL contains oauth parameters.
     *
     * Use {@link BrowserOAuthClient.initCallback} instead of this method if you
     * want to force a login callback. This can be esp. useful if you are using
     * this lib from a framework that has some kind of URL manipulation (like a
     * client side router).
     *
     * Use {@link BrowserOAuthClient.initRestore} instead of this method if you
     * want to only restore existing sessions, and bypass the automatic processing
     * of login callbacks.
     */
    init(refresh?: boolean): Promise<{
        session: OAuthSession;
        state?: never;
    } | {
        session: OAuthSession;
        state: string | null;
    } | undefined>;
    initRestore(refresh?: boolean): Promise<{
        session: OAuthSession;
    } | undefined>;
    restore(sub: string, refresh?: boolean): Promise<OAuthSession>;
    revoke(sub: string): Promise<void>;
    signIn(input: string, options?: AuthorizeOptions): Promise<OAuthSession>;
    signInRedirect(input: string, options?: AuthorizeOptions): Promise<never>;
    signInPopup(input: string, options?: Omit<AuthorizeOptions, 'state'>): Promise<OAuthSession>;
    findRedirectUrl(): `http://[::1]${string}` | "http://127.0.0.1" | `http://127.0.0.1#${string}` | `http://127.0.0.1?${string}` | `http://127.0.0.1/${string}` | `http://127.0.0.1:${string}` | `https://${string}` | `${string}.${string}:/${string}` | undefined;
    readCallbackParams(): URLSearchParams | null;
    initCallback(params?: URLSearchParams | null, redirectUri?: `http://[::1]${string}` | "http://127.0.0.1" | `http://127.0.0.1#${string}` | `http://127.0.0.1?${string}` | `http://127.0.0.1/${string}` | `http://127.0.0.1:${string}` | `https://${string}` | `${string}.${string}:/${string}` | undefined): Promise<{
        session: OAuthSession;
        state: string | null;
    }>;
    [Symbol.asyncDispose](): Promise<void>;
    dispose(): void;
}
//# sourceMappingURL=browser-oauth-client.d.ts.map