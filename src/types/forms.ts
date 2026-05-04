export type SECAnnualQuarterlyCurrentReportForm =
  | "1-K"
  | "1-SA"
  | "1-U"
  | "1-Z"
  | "1-Z-W"
  | "10-D"
  | "10-K"
  | "10-K/A"
  | "10-KT"
  | "10-Q"
  | "10-Q/A"
  | "10-QT"
  | "11-K"
  | "11-KT"
  | "13F-HR"
  | "13F-NT"
  | "18-K"
  | "20-F"
  | "24F-2NT"
  | "25"
  | "25-NSE"
  | "40-F"
  | "6-K"
  | "8-K"
  | "8-K/A"
  | "8-K12G3"
  | "8-K15D5"
  | "ABS-15G"
  | "ABS-EE"
  | "N-30B-2"
  | "N-30D"
  | "N-CEN"
  | "N-CSR"
  | "N-CSRS"
  | "N-MFP"
  | "N-PX"
  | "N-Q"
  | "SD";

export type SECQuarterlyReportForm = "10-Q" | "10-Q/A" | "10-QT";

export type SECAnnualReportForm = "10-K" | "10-K/A" | "10-KT" | "20-F" | "20-F/A" | "40-F" | "40-F/A";

export type SECCurrentReportForm = "8-K" | "8-K/A" | "8-K12G3" | "8-K15D5";

export type SECRegistrationStatementForm =
  | "10-12B"
  | "10-12G"
  | "18-12B"
  | "20FR12B"
  | "20FR12G"
  | "40FR12B"
  | "40FR12G"
  | "424A"
  | "424B1"
  | "424B2"
  | "424B3"
  | "424B4"
  | "424B5"
  | "424B7"
  | "424B8"
  | "425"
  | "485APOS"
  | "485BPOS"
  | "8-A12B"
  | "8-A12G"
  | "AW"
  | "DRS"
  | "F-1"
  | "F-3"
  | "F-3ASR"
  | "F-4"
  | "F-6"
  | "F-10"
  | "FWP"
  | "N-2"
  | "POS AM"
  | "POSASR"
  | "RW"
  | "S-1"
  | "S-3"
  | "S-3ASR"
  | "S-4"
  | "S-6"
  | "S-8"
  | "S-8 POS";

export type SECOwnershipForm = "3" | "3/A" | "4" | "4/A" | "5" | "5/A";

export type SECBeneficialOwnershipForm =
  | "SC 13D"
  | "SC 13D/A"
  | "SCHEDULE 13D"
  | "SC 13G"
  | "SC 13G/A"
  | "SCHEDULE 13G";

export type SECProxyForm =
  | "ARS"
  | "DEF 14A"
  | "DEF 14C"
  | "DEFA14A"
  | "DEFA14C"
  | "DEFC14A"
  | "DEFC14C"
  | "DEFM14A"
  | "DEFM14C"
  | "DEFN14A"
  | "DEFR14A"
  | "PRE 14A"
  | "PRE 14C"
  | "PREC14A"
  | "PREC14C"
  | "PREM14A"
  | "PX14A6G"
  | "PX14A6N"
  | "SC 14N";

export type SECTenderOfferForm =
  | "CB"
  | "SC 13E1"
  | "SC 13E3"
  | "SC 14D9"
  | "SC 14F1"
  | "SC TO-C"
  | "SC TO-I"
  | "SC TO-T"
  | "SC13E4F"
  | "SC14D9C"
  | "SC14D9F"
  | "SC14D1F";

export type SECReviewOrOrderForm =
  | "CORRESP"
  | "DOSLTR"
  | "DRSLTR"
  | "UPLOAD"
  | "40-APP"
  | "CT ORDER"
  | "EFFECT"
  | "QUALIF"
  | "REVOKED";

export type KnownSECFormType =
  | SECAnnualQuarterlyCurrentReportForm
  | SECRegistrationStatementForm
  | SECOwnershipForm
  | SECBeneficialOwnershipForm
  | SECProxyForm
  | SECTenderOfferForm
  | SECReviewOrOrderForm
  | "1-A"
  | "1-A POS"
  | "1-A-W"
  | "253G1"
  | "253G2"
  | "253G3"
  | "253G4"
  | "305B2"
  | "C"
  | "D"
  | "DOS"
  | "T-3";

export type SECFormType = KnownSECFormType | (string & {});

export interface SECFormDetails {
  form: SECFormType;
  reportName: string;
  isAmendment: boolean;
  isQuarterlyReport: boolean;
  isAnnualReport: boolean;
  isCurrentReport: boolean;
}

export const SEC_QUARTERLY_REPORT_FORMS: readonly SECQuarterlyReportForm[] = ["10-Q", "10-Q/A", "10-QT"];

export const SEC_ANNUAL_REPORT_FORMS: readonly SECAnnualReportForm[] = [
  "10-K",
  "10-K/A",
  "10-KT",
  "20-F",
  "20-F/A",
  "40-F",
  "40-F/A",
];

export const SEC_CURRENT_REPORT_FORMS: readonly SECCurrentReportForm[] = ["8-K", "8-K/A", "8-K12G3", "8-K15D5"];

export const SEC_EARNINGS_RELEASE_ITEM = "2.02";

export const describeSECForm = (form: SECFormType): SECFormDetails => {
  const normalizedForm = normalizeForm(form);
  const reportName = SEC_FORM_REPORT_NAMES[normalizedForm] ?? `Form ${normalizedForm}`;

  return {
    form: normalizedForm,
    reportName,
    isAmendment: normalizedForm.endsWith("/A"),
    isQuarterlyReport: isFormInList(normalizedForm, SEC_QUARTERLY_REPORT_FORMS),
    isAnnualReport: isFormInList(normalizedForm, SEC_ANNUAL_REPORT_FORMS),
    isCurrentReport: isFormInList(normalizedForm, SEC_CURRENT_REPORT_FORMS),
  };
};

export const isSECEarningsRelease = (
  form: SECFormType | undefined,
  items: string | readonly string[] | undefined,
): boolean => {
  if (!form || !isFormInList(normalizeForm(form), SEC_CURRENT_REPORT_FORMS)) {
    return false;
  }

  const itemList = typeof items === "string" ? items.split(",") : items;

  return itemList?.some((item: string) => item.trim() === SEC_EARNINGS_RELEASE_ITEM) ?? false;
};

export type SECFilingCategory =
  | "all"
  | "custom"
  | "exclude-ownership"
  | "annual-quarterly-current"
  | "ownership"
  | "beneficial-ownership"
  | "exempt-offerings"
  | "registration-statements"
  | "filing-review"
  | "orders-notices"
  | "proxy-materials"
  | "tender-offers"
  | "trust-indentures";

export const SEC_FILING_CATEGORY_FORMS: Record<Exclude<SECFilingCategory, "all" | "custom">, readonly SECFormType[]> = {
  "exclude-ownership": ["-3", "-4", "-5"],
  "annual-quarterly-current": [
    "1-K",
    "1-SA",
    "1-U",
    "1-Z",
    "1-Z-W",
    "10-D",
    "10-K",
    "10-KT",
    "10-Q",
    "10-QT",
    "11-K",
    "11-KT",
    "13F-HR",
    "13F-NT",
    "15-12B",
    "15-12G",
    "15-15D",
    "15F-12B",
    "15F-12G",
    "15F-15D",
    "18-K",
    "20-F",
    "24F-2NT",
    "25",
    "25-NSE",
    "40-17F2",
    "40-17G",
    "40-F",
    "6-K",
    "8-K",
    "8-K12G3",
    "8-K15D5",
    "ABS-15G",
    "ABS-EE",
    "ANNLRPT",
    "DSTRBRPT",
    "IRANNOTICE",
    "N-30B-2",
    "N-30D",
    "N-CEN",
    "N-CSR",
    "N-CSRS",
    "N-MFP",
    "N-MFP1",
    "N-MFP2",
    "N-PX",
    "N-Q",
    "NPORT-EX",
    "NSAR-A",
    "NSAR-B",
    "NSAR-U",
    "NT 10-D",
    "NT 10-K",
    "NT 10-Q",
    "NT 11-K",
    "NT 20-F",
    "QRTLYRPT",
    "SD",
    "SP 15D2",
  ],
  ownership: ["3", "4", "5"],
  "beneficial-ownership": ["SC 13D", "SCHEDULE 13D", "SC 13G", "SCHEDULE 13G"],
  "exempt-offerings": ["1-A", "1-A POS", "1-A-W", "253G1", "253G2", "253G3", "253G4", "C", "D", "DOS"],
  "registration-statements": [
    "10-12B",
    "10-12G",
    "18-12B",
    "20FR12B",
    "20FR12G",
    "40-24B2",
    "40FR12B",
    "40FR12G",
    "424A",
    "424B1",
    "424B2",
    "424B3",
    "424B4",
    "424B5",
    "424B7",
    "424B8",
    "424H",
    "425",
    "485APOS",
    "485BPOS",
    "485BXT",
    "487",
    "497",
    "497J",
    "497K",
    "8-A12B",
    "8-A12G",
    "AW",
    "AW WD",
    "DEL AM",
    "DRS",
    "F-1",
    "F-10",
    "F-10EF",
    "F-10POS",
    "F-3",
    "F-3ASR",
    "F-3D",
    "F-3DPOS",
    "F-3MEF",
    "F-4",
    "F-4 POS",
    "F-4EF",
    "F-4MEF",
    "F-6",
    "F-6 POS",
    "F-6EF",
    "F-7",
    "F-7 POS",
    "F-8",
    "F-8 POS",
    "F-80",
    "F-80POS",
    "F-9",
    "F-9 POS",
    "F-N",
    "F-X",
    "FWP",
    "N-2",
    "POS AM",
    "POS EX",
    "POS462B",
    "POS462C",
    "POSASR",
    "RW",
    "RW WD",
    "S-1",
    "S-11",
    "S-11MEF",
    "S-1MEF",
    "S-20",
    "S-3",
    "S-3ASR",
    "S-3D",
    "S-3DPOS",
    "S-3MEF",
    "S-4",
    "S-4 POS",
    "S-4EF",
    "S-4MEF",
    "S-6",
    "S-8",
    "S-8 POS",
    "S-B",
    "S-BMEF",
    "SF-1",
    "SF-3",
    "SUPPL",
    "UNDER",
  ],
  "filing-review": ["CORRESP", "DOSLTR", "DRSLTR", "UPLOAD"],
  "orders-notices": ["40-APP", "CT ORDER", "EFFECT", "QUALIF", "REVOKED"],
  "proxy-materials": [
    "ARS",
    "DEF 14A",
    "DEF 14C",
    "DEFA14A",
    "DEFA14C",
    "DEFC14A",
    "DEFC14C",
    "DEFM14A",
    "DEFM14C",
    "DEFN14A",
    "DEFR14A",
    "DEFR14C",
    "DFAN14A",
    "DFRN14A",
    "PRE 14A",
    "PRE 14C",
    "PREC14A",
    "PREC14C",
    "PREM14A",
    "PREM14C",
    "PREN14A",
    "PRER14A",
    "PRER14C",
    "PRRN14A",
    "PX14A6G",
    "PX14A6N",
    "SC 14N",
  ],
  "tender-offers": [
    "CB",
    "SC 13E1",
    "SC 13E3",
    "SC 14D9",
    "SC 14F1",
    "SC TO-C",
    "SC TO-I",
    "SC TO-T",
    "SC13E4F",
    "SC14D9C",
    "SC14D9F",
    "SC14D1F",
  ],
  "trust-indentures": ["305B2", "T-3"],
};

const SEC_FORM_REPORT_NAMES: Partial<Record<string, string>> = {
  "10-Q": "Quarterly Report on Form 10-Q",
  "10-Q/A": "Amended Quarterly Report on Form 10-Q/A",
  "10-QT": "Transition Quarterly Report on Form 10-QT",
  "10-K": "Annual Report on Form 10-K",
  "10-K/A": "Amended Annual Report on Form 10-K/A",
  "10-KT": "Transition Annual Report on Form 10-KT",
  "20-F": "Annual Report on Form 20-F",
  "20-F/A": "Amended Annual Report on Form 20-F/A",
  "40-F": "Annual Report on Form 40-F",
  "40-F/A": "Amended Annual Report on Form 40-F/A",
  "8-K": "Current Report on Form 8-K",
  "8-K/A": "Amended Current Report on Form 8-K/A",
  "8-K12G3": "Current Report on Form 8-K12G3",
  "8-K15D5": "Current Report on Form 8-K15D5",
};

const normalizeForm = (form: SECFormType): SECFormType => {
  return form.trim().toUpperCase() as SECFormType;
};

const isFormInList = <T extends SECFormType>(form: SECFormType, forms: readonly T[]): form is T => {
  return forms.includes(form as T);
};
