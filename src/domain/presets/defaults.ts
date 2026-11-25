import { INSTITUTIONS } from "@/domain/disp/catalog";
import { OKRUG_ORGS } from "@/domain/okrug/catalog";
import {
  DEFAULT_DENOMINATOR,
  DEFAULT_NUMERATOR,
  DEFAULT_SUMMARY,
} from "@/domain/okrug/slide-chrome";
import { OKRUG_TEMPLATE_BY_ID } from "@/domain/okrug/templates";
import type {
  DispanserizationPayload,
  OkrugPayload,
  TerritoryPayload,
} from "@/domain/presets/schema";
import { newRecords } from "@/domain/territory/medical/scales.js";

export function defaultTerritoryPayload(): TerritoryPayload {
  return {
    version: 1,
    mode: "geo",
    medicalBase: "geo",
    scale: "traffic",
    districts: false,
    cities: false,
    outline: "#60745B",
    items: Array.from({ length: 9 }, (_, i) => ({
      number: String(i + 1),
      color: "#E5EEDB",
      value: null,
      manual: null,
    })),
    records: newRecords() as TerritoryPayload["records"],
    okrug: defaultOkrugPayload(),
  };
}

export function defaultDispanserizationPayload(): DispanserizationPayload {
  return {
    version: 5,
    project: "yugra-disp",
    view: "geo",
    medicalBase: "hex",
    palette: "traffic",
    labels: true,
    cityLabels: false,
    outline: "#FFFFFF",
    showDetails: true,
    onlyPlanned: true,
    records: Object.fromEntries(
      INSTITUTIONS.map((f) => [
        f.id,
        { plan: f.plan, fact: f.fact, color: null },
      ]),
    ),
    groupColors: {},
  };
}

export function defaultOkrugPayload(
  templateId: OkrugPayload["templateId"] = "salary-doctors",
): OkrugPayload {
  const template = OKRUG_TEMPLATE_BY_ID[templateId];
  return {
    version: 1,
    templateId,
    title: template.defaultTitle,
    outline: "#FFFFFF",
    records: Object.fromEntries(
      OKRUG_ORGS.map((org) => [
        org.id,
        { doctors: null, mid: null, junior: null, oms: null },
      ]),
    ),
    extras: {
      period: "",
      targetSalary: "",
      factSalary: "",
      numerator: DEFAULT_NUMERATOR,
      denominator: DEFAULT_DENOMINATOR,
      summary: DEFAULT_SUMMARY,
    },
  };
}
