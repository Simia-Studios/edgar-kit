import type { CIK, DateInput } from "./common";

/** Time bucket requested from a share-price provider. */
export type SECSharePriceInterval = "daily" | "weekly" | "monthly";

/** Normalized OHLCV bar returned by a share-price provider. */
export interface SECSharePriceBar {
  /** Trading date in YYYY-MM-DD format. */
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  /** Provider timestamp for the measurement, when available. */
  timestamp?: string;
  adjustedClose?: number;
  volume?: number;
}

/**
 * Request historical prices by ticker or CIK.
 *
 * @example
 * ```ts
 * const bars = await sec.sharePrices.history({
 *   ticker: "SHOP",
 *   startDate: "2025-01-01",
 *   endDate: "2025-12-31",
 * });
 * ```
 */
export interface GetHistoricalSharePricesInput {
  ticker?: string;
  cik?: CIK;
  startDate?: DateInput;
  endDate?: DateInput;
  interval?: SECSharePriceInterval;
}

/**
 * Request the most recent price by ticker or CIK.
 *
 * @example
 * ```ts
 * const latest = await sec.sharePrices.latest({ ticker: "SHOP" });
 * ```
 */
export interface GetLatestSharePriceInput {
  ticker?: string;
  cik?: CIK;
}

/** Provider input after SEC ticker/CIK resolution and date normalization. */
export interface ResolvedHistoricalSharePricesInput {
  ticker: string;
  cik?: number;
  startDate?: string;
  endDate?: string;
  interval: SECSharePriceInterval;
}

/**
 * Adapter for market-data providers.
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
export interface SECSharePriceProvider {
  historicalPrices(
    input: ResolvedHistoricalSharePricesInput,
  ): readonly SECSharePriceBar[] | Promise<readonly SECSharePriceBar[]>;
}
