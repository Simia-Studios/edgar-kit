import { Effect } from "effect";
import type { SECClientError } from "../errors";
import type { SECBaseUrls } from "../endpoints";
import type { SECHttpClient } from "../http";
import type {
  SECCompanyTicker,
  SECCompanyTickerExchange,
  SECCompanyTickersExchangeResponse,
  SECCompanyTickersResponse,
  SECMutualFundTicker,
  SECMutualFundTickersResponse,
} from "../types/tickers";
import { createUrl } from "../utils/format";

export class TickersClient {
  constructor(
    private readonly http: SECHttpClient,
    private readonly baseUrls: SECBaseUrls,
  ) {}

  rawCompanyTickers(): Effect.Effect<SECCompanyTickersResponse, SECClientError> {
    return this.http.requestJson<SECCompanyTickersResponse>(
      createUrl(this.baseUrls.sec, "/files/company_tickers.json"),
    );
  }

  companies(): Effect.Effect<SECCompanyTicker[], SECClientError> {
    return Effect.map(this.rawCompanyTickers(), (response) => Object.values(response));
  }

  companyTickersWithExchanges(): Effect.Effect<SECCompanyTickerExchange[], SECClientError> {
    return Effect.map(
      this.http.requestJson<SECCompanyTickersExchangeResponse>(
        createUrl(this.baseUrls.sec, "/files/company_tickers_exchange.json"),
      ),
      (response) =>
        response.data.map(([cik, name, ticker, exchange]) => ({
          cik,
          name,
          ticker,
          exchange,
        })),
    );
  }

  mutualFundTickers(): Effect.Effect<SECMutualFundTicker[], SECClientError> {
    return Effect.map(
      this.http.requestJson<SECMutualFundTickersResponse>(
        createUrl(this.baseUrls.sec, "/files/company_tickers_mf.json"),
      ),
      (response) =>
        response.data.map(([cik, seriesId, classId, symbol]) => ({
          cik,
          seriesId,
          classId,
          symbol,
        })),
    );
  }

  lookupTicker(ticker: string): Effect.Effect<SECCompanyTicker | undefined, SECClientError> {
    const normalizedTicker = ticker.trim().toUpperCase();

    return Effect.map(this.companies(), (companies) =>
      companies.find((company) => company.ticker.toUpperCase() === normalizedTicker),
    );
  }
}
