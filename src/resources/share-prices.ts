import { Effect } from "effect";
import { SECInputError, SECProviderError } from "../errors";
import type { SECClientError } from "../errors";
import type {
  GetHistoricalSharePricesInput,
  GetLatestSharePriceInput,
  ResolvedHistoricalSharePricesInput,
  SECSharePriceBar,
  SECSharePriceProvider,
} from "../types/share-prices";
import { formatSECDate, normalizeCik } from "../utils/format";
import type { TickersClient } from "./tickers";

export class SharePricesClient {
  constructor(
    private readonly tickers: TickersClient,
    private readonly provider?: SECSharePriceProvider,
  ) {}

  /**
   * Get normalized historical price bars from the configured provider.
   *
   * @example
   * ```ts
   * const prices = await sec.sharePrices.history({
   *   ticker: "SHOP",
   *   startDate: "2025-01-01",
   *   endDate: "2025-12-31",
   * });
   * ```
   */
  history(input: GetHistoricalSharePricesInput): Promise<SECSharePriceBar[]> {
    return Effect.runPromise(this.historyEffect(input));
  }

  /**
   * Get the latest available price bar from the configured provider.
   *
   * @example
   * ```ts
   * const latest = await sec.sharePrices.latest({ ticker: "SHOP" });
   * console.log(latest?.close, latest?.timestamp);
   * ```
   */
  latest(input: GetLatestSharePriceInput): Promise<SECSharePriceBar | undefined> {
    return Effect.runPromise(
      Effect.map(
        this.historyEffect({
          ...input,
          interval: "daily",
        }),
        latestSharePriceBar,
      ),
    );
  }

  private historyEffect(input: GetHistoricalSharePricesInput): Effect.Effect<SECSharePriceBar[], SECClientError> {
    return Effect.gen(this, function* () {
      const provider = this.provider;

      if (!provider) {
        return yield* Effect.fail(
          new SECInputError({
            message:
              "Historical share prices require a sharePriceProvider. SEC EDGAR does not provide historical market prices.",
            input,
          }),
        );
      }

      const resolved = yield* this.resolveInput(input);

      return yield* Effect.tryPromise({
        try: async () => [...(await provider.historicalPrices(resolved))],
        catch: (cause) =>
          new SECProviderError({
            message: "Historical share price provider failed.",
            provider: "sharePriceProvider",
            cause,
          }),
      });
    });
  }

  private resolveInput(
    input: GetHistoricalSharePricesInput,
  ): Effect.Effect<ResolvedHistoricalSharePricesInput, SECClientError> {
    return Effect.gen(this, function* () {
      const ticker = input.ticker?.trim().toUpperCase();
      const cik = input.cik === undefined ? undefined : yield* normalizeCikEffect(input.cik);

      if (ticker) {
        return {
          ticker,
          cik,
          startDate: input.startDate ? yield* formatDateEffect(input.startDate) : undefined,
          endDate: input.endDate ? yield* formatDateEffect(input.endDate) : undefined,
          interval: input.interval ?? "daily",
        };
      }

      if (cik === undefined) {
        return yield* Effect.fail(
          new SECInputError({
            message: "Historical share prices require a ticker or CIK.",
            input,
          }),
        );
      }

      const companies = yield* this.tickers.companies();
      const company = companies.find((item) => item.cik_str === cik);

      if (!company) {
        return yield* Effect.fail(
          new SECInputError({
            message: `SEC CIK was not found in company tickers: ${cik}`,
            input,
          }),
        );
      }

      return {
        ticker: company.ticker.toUpperCase(),
        cik,
        startDate: input.startDate ? yield* formatDateEffect(input.startDate) : undefined,
        endDate: input.endDate ? yield* formatDateEffect(input.endDate) : undefined,
        interval: input.interval ?? "daily",
      };
    }).pipe(
      Effect.flatMap((resolved) => {
        if (resolved.startDate && resolved.endDate && resolved.startDate > resolved.endDate) {
          return Effect.fail(
            new SECInputError({
              message: "Historical share price startDate must be on or before endDate.",
              input,
            }),
          );
        }

        return Effect.succeed(resolved);
      }),
    );
  }
}

const normalizeCikEffect = (cik: GetHistoricalSharePricesInput["cik"]): Effect.Effect<number, SECInputError> => {
  return Effect.try({
    try: () => Number(normalizeCik(cik ?? "")),
    catch: toSharePriceInputError,
  });
};

const latestSharePriceBar = (bars: readonly SECSharePriceBar[]): SECSharePriceBar | undefined => {
  return [...bars].sort((a, b) => sharePriceBarTime(b).localeCompare(sharePriceBarTime(a)))[0];
};

const sharePriceBarTime = (bar: SECSharePriceBar): string => {
  return bar.timestamp ?? bar.date;
};

const formatDateEffect = (
  date: NonNullable<GetHistoricalSharePricesInput["startDate"]>,
): Effect.Effect<string, SECInputError> => {
  return Effect.try({
    try: () => formatSECDate(date),
    catch: toSharePriceInputError,
  });
};

const toSharePriceInputError = (cause: unknown): SECInputError => {
  if (cause instanceof SECInputError) {
    return cause;
  }

  return new SECInputError({
    message: "Unable to build historical share price request.",
    input: cause,
  });
};
