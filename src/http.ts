import { Effect } from "effect";
import { SECRequestError } from "./errors";

export interface SECHttpClientOptions {
  userAgent: string;
  fetch?: typeof globalThis.fetch;
  maxRequestsPerSecond?: number;
  headers?: HeadersInit;
}

export interface SECRequestOptions extends RequestInit {
  headers?: HeadersInit;
}

export class SECHttpClient {
  readonly userAgent: string;
  readonly fetch: typeof globalThis.fetch;

  private readonly headers: HeadersInit;
  private readonly requestIntervalMs: number;
  private rateLimitQueue: Promise<void> = Promise.resolve();
  private lastRequestAt = 0;

  constructor(options: SECHttpClientOptions) {
    if (!options.userAgent.trim()) {
      throw new TypeError("SECClient requires a User-Agent that identifies your application and contact email.");
    }

    this.userAgent = options.userAgent;
    this.fetch = options.fetch ?? globalThis.fetch;
    this.headers = options.headers ?? {};
    this.requestIntervalMs = 1_000 / Math.max(1, options.maxRequestsPerSecond ?? 10);
  }

  requestJson<T>(url: string, options: SECRequestOptions = {}): Effect.Effect<T, SECRequestError> {
    return this.request(url, options, async (response) => (await response.json()) as T);
  }

  requestText(url: string, options: SECRequestOptions = {}): Effect.Effect<string, SECRequestError> {
    return this.request(url, options, (response) => response.text());
  }

  requestArrayBuffer(url: string, options: SECRequestOptions = {}): Effect.Effect<ArrayBuffer, SECRequestError> {
    return this.request(url, options, (response) => response.arrayBuffer());
  }

  private request<T>(
    url: string,
    options: SECRequestOptions,
    read: (response: Response) => Promise<T>,
  ): Effect.Effect<T, SECRequestError> {
    const method = options.method ?? "GET";

    return Effect.tryPromise({
      try: async () => {
        await this.acquireRequestSlot();

        const response = await this.fetch(url, {
          ...options,
          headers: this.createHeaders(options.headers),
        });

        if (!response.ok) {
          throw new SECRequestError({
            message: `SEC request failed with ${response.status} ${response.statusText}`,
            url,
            method,
            status: response.status,
            statusText: response.statusText,
            responseBody: await readErrorBody(response),
          });
        }

        return read(response);
      },
      catch: (cause) => {
        if (cause instanceof SECRequestError) {
          return cause;
        }

        return new SECRequestError({
          message: "SEC request failed before a response was received.",
          url,
          method,
          cause,
        });
      },
    });
  }

  private createHeaders(requestHeaders: HeadersInit | undefined): Headers {
    const headers = new Headers(this.headers);

    headers.set("User-Agent", this.userAgent);
    headers.set("Accept-Encoding", "gzip, deflate");

    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json, text/plain, */*");
    }

    for (const [key, value] of new Headers(requestHeaders)) {
      headers.set(key, value);
    }

    return headers;
  }

  private acquireRequestSlot(): Promise<void> {
    const nextSlot = this.rateLimitQueue.then(async () => {
      const now = Date.now();
      const waitMs = Math.max(0, this.lastRequestAt + this.requestIntervalMs - now);

      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }

      this.lastRequestAt = Date.now();
    });

    this.rateLimitQueue = nextSlot.catch(() => undefined);

    return nextSlot;
  }
}

const readErrorBody = async (response: Response): Promise<string | undefined> => {
  try {
    const body = await response.text();
    return body.slice(0, 2_000);
  } catch {
    return undefined;
  }
};
