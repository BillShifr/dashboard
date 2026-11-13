import { INSTITUTIONS } from "@/domain/disp/catalog";
import type {
  DispanserizationPayload,
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
