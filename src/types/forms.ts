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

export type SECReviewOrOrderForm = "CORRESP" | "DOSLTR" | "DRSLTR" | "UPLOAD" | "40-APP" | "CT ORDER" | "EFFECT" | "QUALIF" | "REVOKED";

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

export type SECFilingCategory =
  | "all"
  | "custom"
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

export const SEC_FILING_CATEGORY_FORMS: Record<Exclude<SECFilingCategory, "all" | "custom">, readonly KnownSECFormType[]> = {
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
    "18-K",
    "20-F",
    "24F-2NT",
    "25",
    "25-NSE",
    "40-F",
    "6-K",
    "8-K",
    "8-K12G3",
    "8-K15D5",
    "ABS-15G",
    "ABS-EE",
    "N-30B-2",
    "N-30D",
    "N-CEN",
    "N-CSR",
    "N-CSRS",
    "N-MFP",
    "N-PX",
    "N-Q",
    "SD",
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
    "425",
    "485APOS",
    "485BPOS",
    "8-A12B",
    "8-A12G",
    "AW",
    "DRS",
    "F-1",
    "F-3",
    "F-3ASR",
    "F-4",
    "F-6",
    "F-10",
    "FWP",
    "N-2",
    "POS AM",
    "POSASR",
    "RW",
    "S-1",
    "S-3",
    "S-3ASR",
    "S-4",
    "S-6",
    "S-8",
    "S-8 POS",
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
    "PRE 14A",
    "PRE 14C",
    "PREC14A",
    "PREC14C",
    "PREM14A",
    "PX14A6G",
    "PX14A6N",
    "SC 14N",
  ],
  "tender-offers": ["CB", "SC 13E1", "SC 13E3", "SC 14D9", "SC 14F1", "SC TO-C", "SC TO-I", "SC TO-T", "SC13E4F", "SC14D9C", "SC14D9F", "SC14D1F"],
  "trust-indentures": ["305B2", "T-3"],
};
