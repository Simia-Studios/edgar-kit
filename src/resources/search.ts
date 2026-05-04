import { Effect } from "effect";
import { SECInputError } from "../errors";
import { SEC_FILING_CATEGORY_FORMS, describeSECForm, isSECEarningsRelease } from "../types/forms";
import type { SECClientError } from "../errors";
import type { SECBaseUrls } from "../endpoints";
import type { SECHttpClient } from "../http";
import type { SECFormType } from "../types/forms";
import type { SECSearchFiling, SECSearchFilingsResponse, SECSearchHit, SearchFilingsInput } from "../types/search";
import {
  createUrl,
  formatAccessionDirectory,
  formatArchiveCik,
  formatCik,
  formatSECDate,
  joinCommaList,
  normalizeList,
} from "../utils/format";

const resultsPerPage = 100;

export class SearchClient {
  constructor(
    private readonly http: SECHttpClient,
    private readonly baseUrls: SECBaseUrls,
  ) {}

  filings(input: SearchFilingsInput): Effect.Effect<SECSearchFilingsResponse, SECClientError> {
    return Effect.flatMap(Effect.try({ try: () => this.filingsSearchUrl(input), catch: toInputError }), (url) =>
      this.http.requestJson<SECSearchFilingsResponse>(url),
    );
  }

  filingResults(input: SearchFilingsInput): Effect.Effect<SECSearchFiling[], SECClientError> {
    return Effect.map(this.filings(input), (response) =>
      response.hits.hits.map((hit) => searchHitToFiling(hit, this.baseUrls.sec)),
    );
  }

  filingsSearchUrl(input: SearchFilingsInput): string {
    const forms = searchForms(input);
    const from = input.from ?? (input.page === undefined ? undefined : (input.page - 1) * resultsPerPage);
    const locationCode = input.locationCode && input.locationCode !== "all" ? input.locationCode : undefined;

    return createUrl(this.baseUrls.search, "/LATEST/search-index", {
      q: input.query,
      ciks: joinCommaList(normalizeList(input.ciks).map(formatCik)),
      entityName: input.entityName,
      forms: forms.length > 0 ? forms.join(",") : undefined,
      startdt: input.startDate ? formatSECDate(input.startDate) : undefined,
      enddt: input.endDate ? formatSECDate(input.endDate) : undefined,
      locationType: input.locationType,
      locationCode,
      locationCodes: locationCode,
      sics: joinCommaList(input.sics),
      fileType: input.fileType,
      items: joinCommaList(input.items),
      from,
      sort: input.sort,
    });
  }
}

export const searchHitToFiling = (hit: SECSearchHit, secBaseUrl = "https://www.sec.gov"): SECSearchFiling => {
  const source = hit._source;
  const [accessionNumber, rawFileName = ""] = hit._id.split(":");
  const fileName =
    source.xsl && rawFileName.toUpperCase().endsWith(".XML") ? `${source.xsl}/${rawFileName}` : rawFileName;
  const cik = formatArchiveCik(source.ciks[0] ?? "");
  const accessionNumberNoDashes = formatAccessionDirectory(source.adsh || accessionNumber || "");
  const filingDirectoryUrl = createUrl(secBaseUrl, `/Archives/edgar/data/${cik}/${accessionNumberNoDashes}`);
  const documentUrl = createUrl(filingDirectoryUrl, fileName);
  const formDetails = describeSECForm(source.form);

  return {
    id: hit._id,
    score: hit._score,
    accessionNumber: source.adsh,
    accessionNumberNoDashes,
    cik,
    form: source.form,
    reportName: formDetails.reportName,
    isAmendment: formDetails.isAmendment,
    isQuarterlyReport: formDetails.isQuarterlyReport,
    isAnnualReport: formDetails.isAnnualReport,
    isCurrentReport: formDetails.isCurrentReport,
    isEarningsRelease: isSECEarningsRelease(source.form, source.items),
    filedAt: source.file_date,
    reportDate: source.period_ending,
    fileName,
    fileType: source.file_type,
    fileDescription: source.file_description,
    fileNumbers: source.file_num,
    filmNumbers: source.film_num,
    items: source.items,
    rootForms: source.root_forms,
    sequence: source.sequence,
    sics: source.sics,
    businessStates: source.biz_states,
    businessLocations: source.biz_locations,
    incorporationStates: source.inc_states,
    schemaVersion: source.schema_version,
    entities: source.display_names,
    documentUrl,
    filingDirectoryUrl,
    filingIndexUrl: createUrl(filingDirectoryUrl, `${source.adsh}-index.html`),
    source,
  };
};

const searchForms = (input: SearchFilingsInput): string[] => {
  const explicitForms = normalizeList(input.forms).map(formatFormForSearch);

  if (explicitForms.length > 0) {
    return explicitForms;
  }

  if (!input.category || input.category === "all" || input.category === "custom") {
    return [];
  }

  return (SEC_FILING_CATEGORY_FORMS[input.category] ?? []).map(formatFormForSearch);
};

const formatFormForSearch = (form: SECFormType): string => {
  return form.trim().toUpperCase();
};

const toInputError = (cause: unknown): SECInputError => {
  if (cause instanceof SECInputError) {
    return cause;
  }

  return new SECInputError({
    message: "Unable to build SEC search request URL.",
    input: cause,
  });
};
