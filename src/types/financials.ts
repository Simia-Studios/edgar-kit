import type { CIK, DateInput } from "./common";
import type { SECFormType } from "./forms";
import type { SECXBRLTaxonomy } from "./xbrl";

/** Annual or quarterly SEC financial fact grouping. */
export type SECFinancialFrequency = "annual" | "quarterly";

/** High-level statement buckets supported by the financials client. */
export type SECFinancialStatement = "income" | "balance-sheet" | "cash-flow";

/** Normalized financial metric names mapped from common SEC XBRL concepts. */
export type SECFinancialMetric =
  | "revenue"
  | "costOfRevenue"
  | "grossProfit"
  | "operatingIncome"
  | "netIncome"
  | "epsBasic"
  | "epsDiluted"
  | "sharesBasic"
  | "sharesDiluted"
  | "assets"
  | "currentAssets"
  | "liabilities"
  | "currentLiabilities"
  | "equity"
  | "cashAndEquivalents"
  | "shortTermDebt"
  | "longTermDebt"
  | "operatingCashFlow"
  | "capitalExpenditures"
  | "dividendsPaid"
  | "commonSharesOutstanding";

/** XBRL concept candidate used to populate a normalized metric. */
export interface SECFinancialMetricConcept {
  taxonomy: SECXBRLTaxonomy;
  tag: string;
  units: readonly string[];
}

/** Definition that maps one normalized metric to one or more XBRL concepts. */
export interface SECFinancialMetricDefinition {
  metric: SECFinancialMetric;
  statement: SECFinancialStatement;
  label: string;
  concepts: readonly SECFinancialMetricConcept[];
}

/** One normalized value from a company filing period. */
export interface SECFinancialLineItem {
  metric: SECFinancialMetric;
  statement: SECFinancialStatement;
  label: string;
  taxonomy: string;
  tag: string;
  unit: string;
  value: number | string | null;
  fiscalYear: number | null;
  fiscalPeriod: string | null;
  form: SECFormType;
  filed: string;
  startDate?: string;
  endDate: string;
  accessionNumber: string;
  frame?: string;
}

export type SECFinancialLineItems = Partial<Record<SECFinancialMetric, SECFinancialLineItem>>;

/** A fiscal period containing normalized line items keyed by metric. */
export interface SECFinancialPeriod {
  fiscalYear: number | null;
  fiscalPeriod: string | null;
  form: SECFormType;
  filed: string;
  startDate?: string;
  endDate: string;
  accessionNumber: string;
  values: SECFinancialLineItems;
}

/** Normalized company financials built from SEC XBRL company facts. */
export interface SECCompanyFinancials {
  cik: number;
  entityName: string;
  frequency: SECFinancialFrequency;
  periods: SECFinancialPeriod[];
}

/** Shared filters for company financials requests. */
export interface SECFinancialsQuery {
  frequency?: SECFinancialFrequency;
  metrics?: SECFinancialMetric | readonly SECFinancialMetric[];
  startDate?: DateInput;
  endDate?: DateInput;
  limit?: number;
}

/**
 * Request normalized company financial periods by ticker or CIK.
 *
 * @example
 * ```ts
 * const financials = await sec.financials.company({
 *   ticker: "AAPL",
 *   frequency: "annual",
 *   limit: 5,
 * });
 * ```
 */
export type GetCompanyFinancialsInput = SECFinancialsQuery &
  ({ cik: CIK; ticker?: never } | { ticker: string; cik?: never });

/**
 * Request one normalized financial statement.
 *
 * @example
 * ```ts
 * const income = await sec.financials.statement({
 *   ticker: "AAPL",
 *   statement: "income",
 *   frequency: "quarterly",
 * });
 * ```
 */
export type GetFinancialStatementInput = SECFinancialsQuery &
  ({ cik: CIK; ticker?: never } | { ticker: string; cik?: never }) & {
    statement: SECFinancialStatement;
  };

/**
 * Request one normalized metric over time.
 *
 * @example
 * ```ts
 * const revenue = await sec.financials.metric({
 *   ticker: "AAPL",
 *   metric: "revenue",
 *   limit: 8,
 * });
 * ```
 */
export type GetFinancialMetricInput = Omit<SECFinancialsQuery, "metrics"> &
  ({ cik: CIK; ticker?: never } | { ticker: string; cik?: never }) & {
    metric: SECFinancialMetric;
  };
