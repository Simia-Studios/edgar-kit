import type { CIK, DateInput } from "./common";
import type { SECFormType } from "./forms";
import type { SECXBRLTaxonomy } from "./xbrl";

export type SECFinancialFrequency = "annual" | "quarterly";

export type SECFinancialStatement = "income" | "balance-sheet" | "cash-flow";

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

export interface SECFinancialMetricConcept {
  taxonomy: SECXBRLTaxonomy;
  tag: string;
  units: readonly string[];
}

export interface SECFinancialMetricDefinition {
  metric: SECFinancialMetric;
  statement: SECFinancialStatement;
  label: string;
  concepts: readonly SECFinancialMetricConcept[];
}

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

export interface SECCompanyFinancials {
  cik: number;
  entityName: string;
  frequency: SECFinancialFrequency;
  periods: SECFinancialPeriod[];
}

export interface SECFinancialsQuery {
  frequency?: SECFinancialFrequency;
  metrics?: SECFinancialMetric | readonly SECFinancialMetric[];
  startDate?: DateInput;
  endDate?: DateInput;
  limit?: number;
}

export type GetCompanyFinancialsInput = SECFinancialsQuery &
  ({ cik: CIK; ticker?: never } | { ticker: string; cik?: never });

export type GetFinancialStatementInput = SECFinancialsQuery &
  ({ cik: CIK; ticker?: never } | { ticker: string; cik?: never }) & {
    statement: SECFinancialStatement;
  };

export type GetFinancialMetricInput = Omit<SECFinancialsQuery, "metrics"> &
  ({ cik: CIK; ticker?: never } | { ticker: string; cik?: never }) & {
    metric: SECFinancialMetric;
  };
