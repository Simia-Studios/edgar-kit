import { Effect } from "effect";
import { SECInputError } from "../errors";
import type { SECClientError } from "../errors";
import type {
  GetCompanyFinancialsInput,
  GetFinancialMetricInput,
  GetFinancialStatementInput,
  SECCompanyFinancials,
  SECFinancialFrequency,
  SECFinancialLineItem,
  SECFinancialMetric,
  SECFinancialMetricDefinition,
  SECFinancialPeriod,
  SECFinancialsQuery,
  SECFinancialStatement,
} from "../types/financials";
import type { SECCompanyFacts, SECXBRLFact } from "../types/xbrl";
import { formatSECDate, normalizeCik, normalizeList } from "../utils/format";
import type { TickersClient } from "./tickers";
import type { XBRLClient } from "./xbrl";

interface RankedFinancialLineItem extends SECFinancialLineItem {
  rank: number;
}

export const SEC_FINANCIAL_METRIC_DEFINITIONS = {
  revenue: {
    metric: "revenue",
    statement: "income",
    label: "Revenue",
    concepts: [
      {
        taxonomy: "us-gaap",
        tag: "RevenueFromContractWithCustomerExcludingAssessedTax",
        units: ["USD"],
      },
      {
        taxonomy: "us-gaap",
        tag: "Revenues",
        units: ["USD"],
      },
      {
        taxonomy: "us-gaap",
        tag: "SalesRevenueNet",
        units: ["USD"],
      },
    ],
  },
  costOfRevenue: {
    metric: "costOfRevenue",
    statement: "income",
    label: "Cost of revenue",
    concepts: [
      {
        taxonomy: "us-gaap",
        tag: "CostOfRevenue",
        units: ["USD"],
      },
      {
        taxonomy: "us-gaap",
        tag: "CostOfGoodsAndServicesSold",
        units: ["USD"],
      },
    ],
  },
  grossProfit: {
    metric: "grossProfit",
    statement: "income",
    label: "Gross profit",
    concepts: [
      {
        taxonomy: "us-gaap",
        tag: "GrossProfit",
        units: ["USD"],
      },
    ],
  },
  operatingIncome: {
    metric: "operatingIncome",
    statement: "income",
    label: "Operating income",
    concepts: [
      {
        taxonomy: "us-gaap",
        tag: "OperatingIncomeLoss",
        units: ["USD"],
      },
    ],
  },
  netIncome: {
    metric: "netIncome",
    statement: "income",
    label: "Net income",
    concepts: [
      {
        taxonomy: "us-gaap",
        tag: "NetIncomeLoss",
        units: ["USD"],
      },
      {
        taxonomy: "us-gaap",
        tag: "ProfitLoss",
        units: ["USD"],
      },
    ],
  },
  epsBasic: {
    metric: "epsBasic",
    statement: "income",
    label: "Basic EPS",
    concepts: [
      {
        taxonomy: "us-gaap",
        tag: "EarningsPerShareBasic",
        units: ["USD/shares", "USD-per-share"],
      },
    ],
  },
  epsDiluted: {
    metric: "epsDiluted",
    statement: "income",
    label: "Diluted EPS",
    concepts: [
      {
        taxonomy: "us-gaap",
        tag: "EarningsPerShareDiluted",
        units: ["USD/shares", "USD-per-share"],
      },
    ],
  },
  sharesBasic: {
    metric: "sharesBasic",
    statement: "income",
    label: "Weighted-average basic shares",
    concepts: [
      {
        taxonomy: "us-gaap",
        tag: "WeightedAverageNumberOfSharesOutstandingBasic",
        units: ["shares"],
      },
    ],
  },
  sharesDiluted: {
    metric: "sharesDiluted",
    statement: "income",
    label: "Weighted-average diluted shares",
    concepts: [
      {
        taxonomy: "us-gaap",
        tag: "WeightedAverageNumberOfDilutedSharesOutstanding",
        units: ["shares"],
      },
    ],
  },
  assets: {
    metric: "assets",
    statement: "balance-sheet",
    label: "Assets",
    concepts: [
      {
        taxonomy: "us-gaap",
        tag: "Assets",
        units: ["USD"],
      },
    ],
  },
  currentAssets: {
    metric: "currentAssets",
    statement: "balance-sheet",
    label: "Current assets",
    concepts: [
      {
        taxonomy: "us-gaap",
        tag: "AssetsCurrent",
        units: ["USD"],
      },
    ],
  },
  liabilities: {
    metric: "liabilities",
    statement: "balance-sheet",
    label: "Liabilities",
    concepts: [
      {
        taxonomy: "us-gaap",
        tag: "Liabilities",
        units: ["USD"],
      },
      {
        taxonomy: "us-gaap",
        tag: "LiabilitiesAndStockholdersEquity",
        units: ["USD"],
      },
    ],
  },
  currentLiabilities: {
    metric: "currentLiabilities",
    statement: "balance-sheet",
    label: "Current liabilities",
    concepts: [
      {
        taxonomy: "us-gaap",
        tag: "LiabilitiesCurrent",
        units: ["USD"],
      },
    ],
  },
  equity: {
    metric: "equity",
    statement: "balance-sheet",
    label: "Stockholders' equity",
    concepts: [
      {
        taxonomy: "us-gaap",
        tag: "StockholdersEquity",
        units: ["USD"],
      },
      {
        taxonomy: "us-gaap",
        tag: "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest",
        units: ["USD"],
      },
    ],
  },
  cashAndEquivalents: {
    metric: "cashAndEquivalents",
    statement: "balance-sheet",
    label: "Cash and equivalents",
    concepts: [
      {
        taxonomy: "us-gaap",
        tag: "CashAndCashEquivalentsAtCarryingValue",
        units: ["USD"],
      },
      {
        taxonomy: "us-gaap",
        tag: "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents",
        units: ["USD"],
      },
    ],
  },
  shortTermDebt: {
    metric: "shortTermDebt",
    statement: "balance-sheet",
    label: "Short-term debt",
    concepts: [
      {
        taxonomy: "us-gaap",
        tag: "ShortTermBorrowings",
        units: ["USD"],
      },
      {
        taxonomy: "us-gaap",
        tag: "ShortTermDebtCurrent",
        units: ["USD"],
      },
    ],
  },
  longTermDebt: {
    metric: "longTermDebt",
    statement: "balance-sheet",
    label: "Long-term debt",
    concepts: [
      {
        taxonomy: "us-gaap",
        tag: "LongTermDebtNoncurrent",
        units: ["USD"],
      },
      {
        taxonomy: "us-gaap",
        tag: "LongTermDebt",
        units: ["USD"],
      },
    ],
  },
  operatingCashFlow: {
    metric: "operatingCashFlow",
    statement: "cash-flow",
    label: "Operating cash flow",
    concepts: [
      {
        taxonomy: "us-gaap",
        tag: "NetCashProvidedByUsedInOperatingActivities",
        units: ["USD"],
      },
    ],
  },
  capitalExpenditures: {
    metric: "capitalExpenditures",
    statement: "cash-flow",
    label: "Capital expenditures",
    concepts: [
      {
        taxonomy: "us-gaap",
        tag: "PaymentsToAcquirePropertyPlantAndEquipment",
        units: ["USD"],
      },
      {
        taxonomy: "us-gaap",
        tag: "PaymentsToAcquireProductiveAssets",
        units: ["USD"],
      },
    ],
  },
  dividendsPaid: {
    metric: "dividendsPaid",
    statement: "cash-flow",
    label: "Dividends paid",
    concepts: [
      {
        taxonomy: "us-gaap",
        tag: "PaymentsOfDividends",
        units: ["USD"],
      },
      {
        taxonomy: "us-gaap",
        tag: "PaymentsOfDividendsCommonStock",
        units: ["USD"],
      },
    ],
  },
  commonSharesOutstanding: {
    metric: "commonSharesOutstanding",
    statement: "balance-sheet",
    label: "Common shares outstanding",
    concepts: [
      {
        taxonomy: "dei",
        tag: "EntityCommonStockSharesOutstanding",
        units: ["shares"],
      },
    ],
  },
} satisfies Record<SECFinancialMetric, SECFinancialMetricDefinition>;

export class FinancialsClient {
  constructor(
    private readonly xbrl: XBRLClient,
    private readonly tickers: TickersClient,
  ) {}

  company(input: GetCompanyFinancialsInput): Promise<SECCompanyFinancials> {
    return Effect.runPromise(this.companyEffect(input));
  }

  statement(input: GetFinancialStatementInput): Promise<SECCompanyFinancials> {
    return Effect.runPromise(this.statementEffect(input));
  }

  metric(input: GetFinancialMetricInput): Promise<SECFinancialLineItem[]> {
    return Effect.runPromise(this.metricEffect(input));
  }

  private companyEffect(input: GetCompanyFinancialsInput): Effect.Effect<SECCompanyFinancials, SECClientError> {
    return Effect.gen(this, function* () {
      const cik = yield* this.resolveCik(input);
      const facts = yield* this.xbrl.companyFacts({ cik });

      return yield* Effect.try({
        try: () => buildCompanyFinancials(facts, input),
        catch: toFinancialsInputError,
      });
    });
  }

  private statementEffect(input: GetFinancialStatementInput): Effect.Effect<SECCompanyFinancials, SECClientError> {
    return this.companyEffect({
      ...input,
      metrics: metricsForStatement(input.statement),
    });
  }

  private metricEffect(input: GetFinancialMetricInput): Effect.Effect<SECFinancialLineItem[], SECClientError> {
    return Effect.map(
      this.companyEffect({
        ...input,
        metrics: input.metric,
      }),
      (financials) =>
        financials.periods.flatMap((period) => {
          const value = period.values[input.metric];
          return value ? [value] : [];
        }),
    );
  }

  private resolveCik(input: GetCompanyFinancialsInput): Effect.Effect<number, SECClientError> {
    if ("cik" in input && input.cik !== undefined) {
      return Effect.try({
        try: () => Number(normalizeCik(input.cik)),
        catch: toFinancialsInputError,
      });
    }

    return Effect.flatMap(this.tickers.lookupTicker(input.ticker), (company) => {
      if (company) {
        return Effect.succeed(company.cik_str);
      }

      return Effect.fail(
        new SECInputError({
          message: `SEC ticker was not found: ${input.ticker}`,
          input: input.ticker,
        }),
      );
    });
  }
}

export const buildCompanyFinancials = (
  facts: SECCompanyFacts,
  query: SECFinancialsQuery = {},
): SECCompanyFinancials => {
  const frequency = query.frequency ?? "annual";
  const startDate = query.startDate ? formatSECDate(query.startDate) : undefined;
  const endDate = query.endDate ? formatSECDate(query.endDate) : undefined;
  const limit = normalizeLimit(query.limit);
  const definitions = financialMetricDefinitions(query.metrics);
  const selectedItems = new Map<string, RankedFinancialLineItem>();

  for (const definition of definitions) {
    for (const [conceptIndex, conceptInput] of definition.concepts.entries()) {
      const concept = facts.facts[conceptInput.taxonomy]?.[conceptInput.tag];

      if (!concept) {
        continue;
      }

      for (const [unitIndex, unit] of conceptInput.units.entries()) {
        const unitFacts = concept.units[unit];

        if (!unitFacts) {
          continue;
        }

        for (const fact of unitFacts) {
          if (!matchesFinancialFact(fact, frequency, startDate, endDate)) {
            continue;
          }

          const lineItem: RankedFinancialLineItem = {
            metric: definition.metric,
            statement: definition.statement,
            label: definition.label,
            taxonomy: conceptInput.taxonomy,
            tag: conceptInput.tag,
            unit,
            value: fact.val,
            fiscalYear: fact.fy,
            fiscalPeriod: fact.fp,
            form: fact.form,
            filed: fact.filed,
            startDate: fact.start,
            endDate: fact.end,
            accessionNumber: fact.accn,
            frame: fact.frame,
            rank: conceptIndex * 100 + unitIndex,
          };

          const key = lineItemKey(lineItem);
          const existing = selectedItems.get(key);

          if (!existing || shouldReplaceLineItem(lineItem, existing)) {
            selectedItems.set(key, lineItem);
          }
        }
      }
    }
  }

  const periods = [...selectedItems.values()]
    .sort(compareLineItems)
    .reduce<SECFinancialPeriod[]>((result, rankedItem) => {
      const lineItem = stripRank(rankedItem);
      const key = periodKey(lineItem);
      const period = result.find((item) => periodKey(item) === key);

      if (!period) {
        result.push({
          fiscalYear: lineItem.fiscalYear,
          fiscalPeriod: lineItem.fiscalPeriod,
          form: lineItem.form,
          filed: lineItem.filed,
          startDate: lineItem.startDate,
          endDate: lineItem.endDate,
          accessionNumber: lineItem.accessionNumber,
          values: {
            [lineItem.metric]: lineItem,
          },
        });
        return result;
      }

      period.values[lineItem.metric] = lineItem;

      if (lineItem.filed > period.filed) {
        period.form = lineItem.form;
        period.filed = lineItem.filed;
        period.startDate = lineItem.startDate;
        period.accessionNumber = lineItem.accessionNumber;
      }

      return result;
    }, [])
    .sort(comparePeriods);

  return {
    cik: facts.cik,
    entityName: facts.entityName,
    frequency,
    periods: limit === undefined ? periods : periods.slice(0, limit),
  };
};

export const metricsForStatement = (statement: SECFinancialStatement): SECFinancialMetric[] => {
  return allMetricDefinitions()
    .filter((definition) => definition.statement === statement)
    .map((definition) => definition.metric);
};

const financialMetricDefinitions = (
  metrics: SECFinancialMetric | readonly SECFinancialMetric[] | undefined,
): SECFinancialMetricDefinition[] => {
  const normalizedMetrics = normalizeList(metrics);

  if (normalizedMetrics.length === 0) {
    return allMetricDefinitions();
  }

  return normalizedMetrics.map((metric) => {
    const definition = SEC_FINANCIAL_METRIC_DEFINITIONS[metric];

    if (!definition) {
      throw new SECInputError({
        message: `Unknown financial metric: ${String(metric)}`,
        input: metric,
      });
    }

    return definition;
  });
};

const allMetricDefinitions = (): SECFinancialMetricDefinition[] => {
  return Object.values(SEC_FINANCIAL_METRIC_DEFINITIONS);
};

const normalizeLimit = (limit: number | undefined): number | undefined => {
  if (limit === undefined) {
    return undefined;
  }

  if (!Number.isInteger(limit) || limit < 0) {
    throw new SECInputError({
      message: "Financials limit must be a non-negative integer.",
      input: limit,
    });
  }

  return limit;
};

const matchesFinancialFact = (
  fact: SECXBRLFact,
  frequency: SECFinancialFrequency,
  startDate: string | undefined,
  endDate: string | undefined,
): boolean => {
  if (startDate && fact.end < startDate) {
    return false;
  }

  if (endDate && fact.end > endDate) {
    return false;
  }

  const fiscalPeriod = fact.fp?.toUpperCase();
  const form = fact.form.toUpperCase();

  if (frequency === "annual") {
    return (
      fiscalPeriod === "FY" || (!fiscalPeriod && ["10-K", "10-K/A", "20-F", "20-F/A", "40-F", "40-F/A"].includes(form))
    );
  }

  return (
    fiscalPeriod === "Q1" ||
    fiscalPeriod === "Q2" ||
    fiscalPeriod === "Q3" ||
    fiscalPeriod === "Q4" ||
    (!fiscalPeriod && ["10-Q", "10-Q/A"].includes(form))
  );
};

const lineItemKey = (lineItem: SECFinancialLineItem): string => {
  return [lineItem.metric, lineItem.fiscalYear ?? "", lineItem.fiscalPeriod ?? "", lineItem.endDate].join("|");
};

const periodKey = (period: Pick<SECFinancialPeriod, "fiscalYear" | "fiscalPeriod" | "endDate">): string => {
  return [period.fiscalYear ?? "", period.fiscalPeriod ?? "", period.endDate].join("|");
};

const shouldReplaceLineItem = (candidate: RankedFinancialLineItem, existing: RankedFinancialLineItem): boolean => {
  if (candidate.filed !== existing.filed) {
    return candidate.filed > existing.filed;
  }

  if (candidate.rank !== existing.rank) {
    return candidate.rank < existing.rank;
  }

  return candidate.accessionNumber > existing.accessionNumber;
};

const compareLineItems = (a: SECFinancialLineItem, b: SECFinancialLineItem): number => {
  return comparePeriods(a, b);
};

const comparePeriods = (
  a: Pick<SECFinancialPeriod, "endDate" | "filed" | "accessionNumber">,
  b: Pick<SECFinancialPeriod, "endDate" | "filed" | "accessionNumber">,
): number => {
  if (a.endDate !== b.endDate) {
    return b.endDate.localeCompare(a.endDate);
  }

  if (a.filed !== b.filed) {
    return b.filed.localeCompare(a.filed);
  }

  return b.accessionNumber.localeCompare(a.accessionNumber);
};

const stripRank = (lineItem: RankedFinancialLineItem): SECFinancialLineItem => {
  const { rank: _rank, ...item } = lineItem;
  return item;
};

const toFinancialsInputError = (cause: unknown): SECInputError => {
  if (cause instanceof SECInputError) {
    return cause;
  }

  return new SECInputError({
    message: "Unable to build SEC financials request.",
    input: cause,
  });
};
