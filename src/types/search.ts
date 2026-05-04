import type { CIK, DateInput, SECTermsAggregation } from "./common";
import type { SECFilingCategory, SECFormType } from "./forms";

export type SECSearchSort = "asc" | "desc";

export type SECSearchLocationType = "located" | "incorporated";

export interface SearchFilingsInput {
  query?: string;
  ciks?: CIK | readonly CIK[];
  entityName?: string;
  forms?: SECFormType | readonly SECFormType[];
  category?: SECFilingCategory;
  startDate?: DateInput;
  endDate?: DateInput;
  locationType?: SECSearchLocationType;
  locationCode?: string;
  sics?: string | number | readonly (string | number)[];
  fileType?: string;
  items?: string | readonly string[];
  page?: number;
  from?: number;
  sort?: SECSearchSort;
}

export interface SECSearchResponseTotal {
  value: number;
  relation: string;
}

export interface SECSearchHitSource {
  ciks: string[];
  period_ending: string | null;
  file_num: string[];
  display_names: string[];
  xsl: string | null;
  sequence: number | string;
  root_forms: string[];
  root_form?: string;
  file_date: string;
  biz_states: string[];
  sics: string[];
  form: string;
  adsh: string;
  film_num: string[];
  biz_locations: string[];
  file_type: string;
  file_description: string | null;
  inc_states: string[];
  items: string[];
  schema_version?: string;
}

export interface SECSearchHit {
  _index: string;
  _id: string;
  _score: number;
  _source: SECSearchHitSource;
}

export interface SECSearchFilingsResponse {
  took: number;
  timed_out: boolean;
  _shards: {
    total: number;
    successful: number;
    skipped: number;
    failed: number;
  };
  hits: {
    total: SECSearchResponseTotal;
    max_score: number | null;
    hits: SECSearchHit[];
  };
  aggregations?: {
    entity_filter?: SECTermsAggregation;
    sic_filter?: SECTermsAggregation;
    biz_states_filter?: SECTermsAggregation;
    inc_states_filter?: SECTermsAggregation;
    form_filter?: SECTermsAggregation;
  };
  query?: unknown;
}

export interface SECSearchFiling {
  id: string;
  accessionNumber: string;
  accessionNumberNoDashes: string;
  cik: string;
  form: string;
  filedAt: string;
  reportDate: string | null;
  fileName: string;
  fileType: string;
  fileDescription: string | null;
  entities: string[];
  documentUrl: string;
  filingDirectoryUrl: string;
  filingIndexUrl: string;
  source: SECSearchHitSource;
}
