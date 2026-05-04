import { Effect } from "effect";
import { DEFAULT_SEC_BASE_URLS } from "./endpoints";
import type { SECBaseUrls } from "./endpoints";
import { SECHttpClient } from "./http";
import type { SECHttpClientOptions } from "./http";
import { ArchivesClient } from "./resources/archives";
import { CompaniesClient } from "./resources/companies";
import { IndexesClient } from "./resources/indexes";
import { SearchClient } from "./resources/search";
import { SubmissionsClient } from "./resources/submissions";
import { TickersClient } from "./resources/tickers";
import { XBRLClient } from "./resources/xbrl";

export interface SECClientOptions extends SECHttpClientOptions {
  baseUrls?: Partial<SECBaseUrls>;
}

export class SECClient {
  readonly http: SECHttpClient;
  readonly baseUrls: SECBaseUrls;

  readonly archives: ArchivesClient;
  readonly companies: CompaniesClient;
  readonly indexes: IndexesClient;
  readonly search: SearchClient;
  readonly submissions: SubmissionsClient;
  readonly tickers: TickersClient;
  readonly xbrl: XBRLClient;

  constructor(options: SECClientOptions = {}) {
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
  }

  run<A, E>(effect: Effect.Effect<A, E, never>): Promise<A> {
    return Effect.runPromise(effect);
  }
}
