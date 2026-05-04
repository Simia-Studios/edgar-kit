export { SECClient } from "./client";
export type { SECClientOptions } from "./client";

export { ArchivesClient } from "./resources/archives";
export { CompaniesClient } from "./resources/companies";
export {
  FinancialsClient,
  SEC_FINANCIAL_METRIC_DEFINITIONS,
  buildCompanyFinancials,
  metricsForStatement,
} from "./resources/financials";
export { IndexesClient } from "./resources/indexes";
export { SearchClient } from "./resources/search";
export { SharePricesClient } from "./resources/share-prices";
export { SubmissionsClient } from "./resources/submissions";
export { TickersClient } from "./resources/tickers";
export { XBRLClient } from "./resources/xbrl";

export { SECInputError, SECProviderError, SECRequestError, isSECClientError } from "./errors";
export type { SECClientError } from "./errors";

export {
  SEC_ANNUAL_REPORT_FORMS,
  SEC_CURRENT_REPORT_FORMS,
  SEC_EARNINGS_RELEASE_ITEM,
  SEC_FILING_CATEGORY_FORMS,
  SEC_QUARTERLY_REPORT_FORMS,
  describeSECForm,
  isSECEarningsRelease,
} from "./types/forms";
export type {
  SECAnnualReportForm,
  KnownSECFormType,
  SECAnnualQuarterlyCurrentReportForm,
  SECBeneficialOwnershipForm,
  SECCurrentReportForm,
  SECFormDetails,
  SECFilingCategory,
  SECFormType,
  SECOwnershipForm,
  SECProxyForm,
  SECQuarterlyReportForm,
  SECRegistrationStatementForm,
  SECReviewOrOrderForm,
  SECTenderOfferForm,
} from "./types/forms";

export type {
  AccessionNumber,
  CIK,
  DateInput,
  SECAddress,
  SECBucket,
  SECDirectoryItem,
  SECDirectoryResponse,
  SECQuarter,
  SECTermsAggregation,
} from "./types/common";

export type {
  SECCompanyTicker,
  SECCompanyTickerExchange,
  SECCompanyTickersExchangeResponse,
  SECCompanyTickersResponse,
  SECMutualFundTicker,
  SECMutualFundTickersResponse,
} from "./types/tickers";

export type {
  GetSubmissionFileInput,
  GetSubmissionsInput,
  ListFilingsInput,
  SECFiling,
  SECFormerName,
  SECRecentFilings,
  SECSubmission,
  SECSubmissionFile,
  SECSubmissionFileReference,
} from "./types/submissions";

export type {
  GetCompanyConceptInput,
  GetCompanyFactsInput,
  GetFrameInput,
  SECCompanyConcept,
  SECCompanyFactConcept,
  SECCompanyFacts,
  SECFrame,
  SECFrameFact,
  SECFramePeriod,
  SECXBRLFact,
  SECXBRLTaxonomy,
  SECXBRLUnit,
} from "./types/xbrl";

export type {
  GetCompanyFinancialsInput,
  GetFinancialMetricInput,
  GetFinancialStatementInput,
  SECCompanyFinancials,
  SECFinancialFactPeriod,
  SECFinancialFactPeriodType,
  SECFinancialFilingDetails,
  SECFinancialFrequency,
  SECFinancialLineItem,
  SECFinancialLineItems,
  SECFinancialMetric,
  SECFinancialMetricConcept,
  SECFinancialMetricDefinition,
  SECFinancialPeriod,
  SECFinancialStatement,
  SECFinancialsQuery,
} from "./types/financials";

export type {
  GetHistoricalSharePricesInput,
  GetLatestSharePriceInput,
  ResolvedHistoricalSharePricesInput,
  SECSharePriceBar,
  SECSharePriceInterval,
  SECSharePriceProvider,
} from "./types/share-prices";

export type {
  SECSearchFiling,
  SECSearchFilingsResponse,
  SECSearchHit,
  SECSearchHitSource,
  SECSearchLocationType,
  SECSearchResponseTotal,
  SECSearchSort,
  SearchFilingsInput,
} from "./types/search";

export type {
  FilingDocumentUrlInput,
  FilingUrlInput,
  GetFilingDirectoryInput,
  GetFilingDocumentInput,
} from "./types/archives";

export type {
  GetIndexDirectoryInput,
  GetIndexFileInput,
  SECIndexDirectory,
  SECIndexFormat,
  SECIndexRecord,
  SECIndexType,
} from "./types/indexes";

export { parseMasterIndex } from "./resources/indexes";
export { flattenFilings } from "./resources/submissions";
export { searchHitToFiling } from "./resources/search";
export { formatFramePeriod, formatFrameUnit } from "./resources/xbrl";
export {
  createUrl,
  formatAccessionDirectory,
  formatArchiveCik,
  formatCik,
  formatCompactSECDate,
  formatSECDate,
  joinCommaList,
  normalizeCik,
  normalizeList,
} from "./utils/format";
