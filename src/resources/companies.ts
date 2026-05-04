import { Effect } from "effect";
import { SECInputError } from "../errors";
import type { SECClientError } from "../errors";
import type { SECFiling, SECSubmission } from "../types/submissions";
import type { SECCompanyTicker } from "../types/tickers";
import type { SECFormType } from "../types/forms";
import type { DateInput } from "../types/common";
import type { SubmissionsClient } from "./submissions";
import type { TickersClient } from "./tickers";

export interface GetCompanyByTickerInput {
  ticker: string;
}

export interface ListCompanyFilingsByTickerInput {
  ticker: string;
  forms?: SECFormType | readonly SECFormType[];
  startDate?: DateInput;
  endDate?: DateInput;
  includeAdditionalFiles?: boolean;
  limit?: number;
}

export class CompaniesClient {
  constructor(
    private readonly tickers: TickersClient,
    private readonly submissions: SubmissionsClient,
  ) {}

  byTicker(input: GetCompanyByTickerInput | string): Effect.Effect<SECCompanyTicker | undefined, SECClientError> {
    const ticker = typeof input === "string" ? input : input.ticker;
    return this.tickers.lookupTicker(ticker);
  }

  submissionsByTicker(input: GetCompanyByTickerInput | string): Effect.Effect<SECSubmission, SECClientError> {
    const ticker = typeof input === "string" ? input : input.ticker;

    return Effect.flatMap(this.requireTicker(ticker), (company) =>
      this.submissions.get({
        cik: company.cik_str,
      }),
    );
  }

  filingsByTicker(input: ListCompanyFilingsByTickerInput): Effect.Effect<SECFiling[], SECClientError> {
    return Effect.flatMap(this.requireTicker(input.ticker), (company) =>
      this.submissions.listFilings({
        ...input,
        cik: company.cik_str,
      }),
    );
  }

  private requireTicker(ticker: string): Effect.Effect<SECCompanyTicker, SECClientError> {
    return Effect.flatMap(this.tickers.lookupTicker(ticker), (company) => {
      if (company) {
        return Effect.succeed(company);
      }

      return Effect.fail(
        new SECInputError({
          message: `SEC ticker was not found: ${ticker}`,
          input: ticker,
        }),
      );
    });
  }
}
