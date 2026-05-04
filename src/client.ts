import { Effect } from "effect";
import { DEFAULT_SEC_BASE_URLS } from "./endpoints";
import type { SECBaseUrls } from "./endpoints";
import { SECHttpClient } from "./http";
import type { SECHttpClientOptions } from "./http";
import { ArchivesClient } from "./resources/archives";
import { CompaniesClient } from "./resources/companies";
import { FinancialsClient } from "./resources/financials";
import { IndexesClient } from "./resources/indexes";
import { SearchClient } from "./resources/search";
import { SharePricesClient } from "./resources/share-prices";
import { SubmissionsClient } from "./resources/submissions";
import { TickersClient } from "./resources/tickers";
import { XBRLClient } from "./resources/xbrl";
import type { SECSharePriceProvider } from "./types/share-prices";

export interface SECClientOptions extends SECHttpClientOptions {
  /** Override SEC endpoint bases for testing or controlled environments. */
  baseUrls?: Partial<SECBaseUrls>;
  /**
   * Client-side request rate limit. Defaults to 10 requests per second.
   * Set to `null` to disable the SDK rate limiter.
   */
  maxRps?: number | null;
  /**
   * Market-data adapter used by `sharePrices`.
   *
   * @example
   * ```ts
   * const sec = new SECClient({
   *   userAgent: "Acme Corp data@example.com",
   *   sharePriceProvider: {
   *     historicalPrices: async ({ ticker }) => fetchPrices(ticker),
   *   },
   * });
   * ```
   */
  sharePriceProvider?: SECSharePriceProvider;
}

/** Main SDK entry point. */
export class SECClient {
  readonly http: SECHttpClient;
  readonly baseUrls: SECBaseUrls;

  readonly archives: ArchivesClient;
  readonly companies: CompaniesClient;
  readonly financials: FinancialsClient;
  readonly indexes: IndexesClient;
  readonly search: SearchClient;
  readonly sharePrices: SharePricesClient;
  readonly submissions: SubmissionsClient;
  readonly tickers: TickersClient;
  readonly xbrl: XBRLClient;

  constructor(options: SECClientOptions) {
    this.baseUrls = {
      ...DEFAULT_SEC_BASE_URLS,
      ...options.baseUrls,
    };

    this.http = new SECHttpClient(options);
    this.archives = new ArchivesClient(this.http, this.baseUrls);
    this.indexes = new IndexesClient(this.http, this.baseUrls);
    this.search = new SearchClient(this.http, this.baseUrls);
    this.submissions = new SubmissionsClient(this.http, this.baseUrls, this.baseUrls.sec);
    this.tickers = new TickersClient(this.http, this.baseUrls);
    this.xbrl = new XBRLClient(this.http, this.baseUrls);
    this.companies = new CompaniesClient(this.tickers, this.submissions);
    this.financials = new FinancialsClient(this.xbrl, this.tickers, this.baseUrls.sec);
    this.sharePrices = new SharePricesClient(this.tickers, options.sharePriceProvider);
  }

  run<A, E>(effect: Effect.Effect<A, E, never>): Promise<A> {
    return Effect.runPromise(effect);
  }
}
