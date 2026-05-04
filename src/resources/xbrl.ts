import { Effect } from "effect";
import { SECInputError } from "../errors";
import type { SECClientError } from "../errors";
import type { SECBaseUrls } from "../endpoints";
import type { SECHttpClient } from "../http";
import type {
  GetCompanyConceptInput,
  GetCompanyFactsInput,
  GetFrameInput,
  SECCompanyConcept,
  SECCompanyFacts,
  SECFrame,
  SECFramePeriod,
} from "../types/xbrl";
import { createUrl, formatCik } from "../utils/format";

export class XBRLClient {
  constructor(
    private readonly http: SECHttpClient,
    private readonly baseUrls: SECBaseUrls,
  ) {}

  companyConcept(input: GetCompanyConceptInput): Effect.Effect<SECCompanyConcept, SECClientError> {
    return Effect.flatMap(Effect.try({ try: () => this.companyConceptUrl(input), catch: toInputError }), (url) =>
      this.http.requestJson<SECCompanyConcept>(url),
    );
  }

  companyFacts(input: GetCompanyFactsInput): Effect.Effect<SECCompanyFacts, SECClientError> {
    return Effect.flatMap(Effect.try({ try: () => this.companyFactsUrl(input), catch: toInputError }), (url) =>
      this.http.requestJson<SECCompanyFacts>(url),
    );
  }

  frame(input: GetFrameInput): Effect.Effect<SECFrame, SECClientError> {
    return Effect.flatMap(Effect.try({ try: () => this.frameUrl(input), catch: toInputError }), (url) =>
      this.http.requestJson<SECFrame>(url),
    );
  }

  companyConceptUrl(input: GetCompanyConceptInput): string {
    return createUrl(
      this.baseUrls.data,
      `/api/xbrl/companyconcept/CIK${formatCik(input.cik)}/${input.taxonomy}/${input.tag}.json`,
    );
  }

  companyFactsUrl(input: GetCompanyFactsInput): string {
    return createUrl(this.baseUrls.data, `/api/xbrl/companyfacts/CIK${formatCik(input.cik)}.json`);
  }

  frameUrl(input: GetFrameInput): string {
    return createUrl(
      this.baseUrls.data,
      `/api/xbrl/frames/${input.taxonomy}/${input.tag}/${formatFrameUnit(input.unit)}/${formatFramePeriod(input.period)}.json`,
    );
  }
}

export const formatFramePeriod = (period: SECFramePeriod): string => {
  if (typeof period === "string") {
    return period;
  }

  if (!Number.isInteger(period.year) || period.year < 1900) {
    throw new SECInputError({
      message: "Frame period year must be a four-digit calendar year.",
      input: period,
    });
  }

  if (period.quarter === undefined) {
    return `CY${period.year}`;
  }

  return `CY${period.year}Q${period.quarter}${period.instant ? "I" : ""}`;
};

export const formatFrameUnit = (unit: string): string => {
  return unit.replace("/", "-per-");
};

const toInputError = (cause: unknown): SECInputError => {
  if (cause instanceof SECInputError) {
    return cause;
  }

  return new SECInputError({
    message: "Unable to build SEC XBRL request URL.",
    input: cause,
  });
};
