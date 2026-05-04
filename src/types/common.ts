export type CIK = number | string;

export type DateInput = Date | string;

export type SECQuarter = 1 | 2 | 3 | 4;

export type AccessionNumber = string;

export type EmptyObject = Record<PropertyKey, never>;

export interface SECAddress {
  street1: string | null;
  street2: string | null;
  city: string | null;
  stateOrCountry: string | null;
  zipCode: string | null;
  stateOrCountryDescription: string | null;
  isForeignLocation: number | boolean | null;
  foreignStateTerritory: string | null;
  country: string | null;
  countryCode: string | null;
}

export interface SECDirectoryItem {
  "last-modified": string;
  name: string;
  type: string;
  href?: string;
  size: string;
}

export interface SECDirectoryResponse {
  directory: {
    item: SECDirectoryItem[];
    name: string;
    "parent-dir": string;
  };
}

export interface SECBucket {
  key: string;
  doc_count: number;
}

export interface SECTermsAggregation {
  doc_count_error_upper_bound?: number;
  sum_other_doc_count?: number;
  buckets: SECBucket[];
}
