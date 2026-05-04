import type { CIK } from "./common";
import type { SECFormType } from "./forms";

export type SECXBRLTaxonomy = "us-gaap" | "ifrs-full" | "dei" | "srt" | (string & {});

export type SECXBRLUnit = "USD" | "shares" | "USD-per-share" | "pure" | (string & {});

export type SECFramePeriod =
  | `CY${number}`
  | `CY${number}Q${1 | 2 | 3 | 4}`
  | `CY${number}Q${1 | 2 | 3 | 4}I`
  | {
      year: number;
      quarter?: 1 | 2 | 3 | 4;
      instant?: boolean;
    };

export interface SECXBRLFact {
  start?: string;
  end: string;
  val: number | string | null;
  accn: string;
  fy: number | null;
  fp: string | null;
  form: SECFormType;
  filed: string;
  frame?: string;
}

export interface SECCompanyConcept {
  cik: number;
  taxonomy: string;
  tag: string;
  label: string;
  description: string;
  entityName: string;
  units: Record<string, SECXBRLFact[]>;
}

export interface SECCompanyFactConcept {
  label: string;
  description: string;
  units: Record<string, SECXBRLFact[]>;
}

export interface SECCompanyFacts {
  cik: number;
  entityName: string;
  facts: Record<string, Record<string, SECCompanyFactConcept>>;
}

export interface SECFrameFact {
  accn: string;
  cik: number;
  entityName: string;
  loc?: string;
  end: string;
  val: number | string | null;
}

export interface SECFrame {
  taxonomy: string;
  tag: string;
  ccp: string;
  uom: string;
  label: string;
  description: string;
  pts: number;
  data: SECFrameFact[];
}

export interface GetCompanyConceptInput {
  cik: CIK;
  taxonomy: SECXBRLTaxonomy;
  tag: string;
}

export interface GetCompanyFactsInput {
  cik: CIK;
}

export interface GetFrameInput {
  taxonomy: SECXBRLTaxonomy;
  tag: string;
  unit: SECXBRLUnit;
  period: SECFramePeriod;
}
