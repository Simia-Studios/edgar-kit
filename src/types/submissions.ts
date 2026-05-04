import type { SECAddress, CIK, DateInput } from "./common";
import type { SECFormType } from "./forms";

export interface SECFormerName {
  name: string;
  from: string | null;
  to: string | null;
}

export interface SECSubmissionFileReference {
  name: string;
  filingCount: number;
  filingFrom: string;
  filingTo: string;
}

export interface SECRecentFilings {
  accessionNumber: string[];
  filingDate: string[];
  reportDate: string[];
  acceptanceDateTime: string[];
  act: string[];
  form: SECFormType[];
  fileNumber: string[];
  filmNumber: string[];
  items: string[];
  size: number[];
  isXBRL: Array<number | boolean>;
  isInlineXBRL: Array<number | boolean>;
  primaryDocument: string[];
  primaryDocDescription: string[];
}

export type SECSubmissionFile = SECRecentFilings;

export interface SECSubmission {
  cik: string;
  entityType: string | null;
  sic: string | null;
  sicDescription: string | null;
  ownerOrg: string | null;
  insiderTransactionForOwnerExists: number | boolean;
  insiderTransactionForIssuerExists: number | boolean;
  name: string;
  tickers: string[];
  exchanges: string[];
  ein: string | null;
  lei: string | null;
  description: string;
  website: string;
  investorWebsite: string;
  category: string | null;
  fiscalYearEnd: string | null;
  stateOfIncorporation: string | null;
  stateOfIncorporationDescription: string | null;
  addresses: {
    mailing: SECAddress;
    business: SECAddress;
  };
  phone: string | null;
  flags: string;
  formerNames: SECFormerName[];
  filings: {
    recent: SECRecentFilings;
    files?: SECSubmissionFileReference[];
  };
}

export interface SECFiling {
  index: number;
  accessionNumber: string;
  accessionNumberNoDashes: string;
  filingDate?: string;
  reportDate?: string;
  acceptanceDateTime?: string;
  act?: string;
  form?: SECFormType;
  reportName?: string;
  isAmendment?: boolean;
  isQuarterlyReport?: boolean;
  isAnnualReport?: boolean;
  isCurrentReport?: boolean;
  isEarningsRelease?: boolean;
  fileNumber?: string;
  filmNumber?: string;
  items?: string;
  size?: number;
  isXBRL?: boolean;
  isInlineXBRL?: boolean;
  primaryDocument?: string;
  primaryDocDescription?: string;
  cik?: string;
  documentUrl?: string;
  filingDirectoryUrl?: string;
  filingIndexUrl?: string;
}

export interface GetSubmissionsInput {
  cik: CIK;
}

export interface GetSubmissionFileInput {
  fileName: string;
}

export interface ListFilingsInput {
  cik: CIK;
  forms?: SECFormType | readonly SECFormType[];
  startDate?: DateInput;
  endDate?: DateInput;
  includeAdditionalFiles?: boolean;
  limit?: number;
}
