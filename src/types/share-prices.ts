import type { CIK, DateInput } from "./common";

export type SECSharePriceInterval = "daily" | "weekly" | "monthly";

export interface SECSharePriceBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose?: number;
  volume?: number;
}

export interface GetHistoricalSharePricesInput {
  ticker?: string;
  cik?: CIK;
  startDate?: DateInput;
  endDate?: DateInput;
  interval?: SECSharePriceInterval;
}

export interface ResolvedHistoricalSharePricesInput {
  ticker: string;
  cik?: number;
  startDate?: string;
  endDate?: string;
  interval: SECSharePriceInterval;
}

export interface SECSharePriceProvider {
  historicalPrices(
    input: ResolvedHistoricalSharePricesInput,
  ): readonly SECSharePriceBar[] | Promise<readonly SECSharePriceBar[]>;
}
