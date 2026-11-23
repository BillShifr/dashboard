/** Seven presentation slides: salary achievement, spread, OMS residuals. */

export const OKRUG_COLORS = {
  green: "#116348",
  yellow: "#FFC000",
  orange: "#ED7D31",
  red: "#960000",
  cyan: "#00B0F0",
  white: "#FFFFFF",
  empty: "#D9D9D9",
  omsLow: "#960000",
  omsMidLow: "#ED7D31",
  omsMid: "#92D050",
  omsMidHigh: "#FF7C80",
  omsHigh: "#7030A0",
  omsOverflow: "#FF0000",
} as const;

export type OkrugMetric = "doctors" | "mid" | "junior" | "oms";

export type OkrugBand = {
  id: string;
  label: string;
  color: string;
  /** Inclusive lower bound; null = −∞ / missing handled separately. */
  min: number | null;
  /** Exclusive upper bound except the last finite band when `maxInclusive`. */
  max: number | null;
  maxInclusive?: boolean;
  missing?: boolean;
  zeroMissing?: boolean;
};

export type OkrugTemplate = {
  id:
    | "salary-doctors"
    | "salary-mid"
    | "salary-junior"
    | "spread-doctors"
    | "spread-mid"
    | "spread-junior"
    | "oms-residuals";
  slide: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  group: "achievement" | "spread" | "oms";
  metric: OkrugMetric;
  shortName: string;
  defaultTitle: string;
  unit: "%" | "мес.";
  bands: readonly OkrugBand[];
  showKpi: boolean;
  targetPercent: number | null;
};

const ACHIEVE_DOCTORS: OkrugBand[] = [
  {
    id: "ok",
    label: "Выполнен (более 200%)",
    color: OKRUG_COLORS.green,
    min: 200,
    max: null,
  },
  {
    id: "y190",
    label: "Не выполнен (190%–199,9%)",
    color: OKRUG_COLORS.yellow,
    min: 190,
    max: 200,
  },
  {
    id: "y180",
    label: "Не выполнен (180%–189,9%)",
    color: OKRUG_COLORS.orange,
    min: 180,
    max: 190,
  },
  {
    id: "low",
    label: "Не выполнен (менее 180%)",
    color: OKRUG_COLORS.red,
    min: 0,
    max: 180,
  },
];

const ACHIEVE_STAFF: OkrugBand[] = [
  {
    id: "ok",
    label: "Выполнен (более 100%)",
    color: OKRUG_COLORS.green,
    min: 100,
    max: null,
  },
  {
    id: "y90",
    label: "Не выполнен (90%–99,9%)",
    color: OKRUG_COLORS.yellow,
    min: 90,
    max: 100,
  },
  {
    id: "y80",
    label: "Не выполнен (80%–89,9%)",
    color: OKRUG_COLORS.orange,
    min: 80,
    max: 90,
  },
  {
    id: "low",
    label: "Не выполнен (менее 80%)",
    color: OKRUG_COLORS.red,
    min: 0,
    max: 80,
  },
];

export const OKRUG_TEMPLATES: readonly OkrugTemplate[] = [
  {
    id: "salary-doctors",
    slide: 1,
    group: "achievement",
    metric: "doctors",
    shortName: "ЗП врачей",
    defaultTitle:
      "Достижение целевых уровней заработной платы (за счет всех источников финансирования) по врачам, %",
    unit: "%",
    bands: ACHIEVE_DOCTORS,
    showKpi: false,
    targetPercent: 200,
  },
  {
    id: "salary-mid",
    slide: 2,
    group: "achievement",
    metric: "mid",
    shortName: "ЗП средний персонал",
    defaultTitle:
      "Достижение целевых уровней заработной платы (за счет всех источников финансирования) по среднему мед. персоналу, %",
    unit: "%",
    bands: ACHIEVE_STAFF,
    showKpi: false,
    targetPercent: 100,
  },
  {
    id: "salary-junior",
    slide: 3,
    group: "achievement",
    metric: "junior",
    shortName: "ЗП младший персонал",
    defaultTitle:
      "Достижение целевых уровней заработной платы (за счет всех источников финансирования) по младшему мед. персоналу, %",
    unit: "%",
    bands: [
      ...ACHIEVE_STAFF,
      {
        id: "none",
        label: "Не участвуют в мониторинге",
        color: OKRUG_COLORS.white,
        min: null,
        max: null,
        missing: true,
        zeroMissing: true,
      },
    ],
    showKpi: false,
    targetPercent: 100,
  },
  {
    id: "spread-doctors",
    slide: 4,
    group: "spread",
    metric: "doctors",
    shortName: "Разброс ЗП врачей",
    defaultTitle:
      "Разброс в достижении целевого уровня заработной платы (за счет всех источников финансирования) врачей",
    unit: "%",
    bands: [
      {
        id: "in",
        label: "Попали в диапазон 180%–220%",
        color: OKRUG_COLORS.green,
        min: 180,
        max: 220,
      },
      {
        id: "below",
        label: "Не попали в диапазон 180%–220%",
        color: OKRUG_COLORS.red,
        min: 0,
        max: 180,
      },
      {
        id: "above",
        label: "Превысили диапазон 180%–220%",
        color: OKRUG_COLORS.cyan,
        min: 220,
        max: null,
        maxInclusive: true,
      },
    ],
    showKpi: true,
    targetPercent: 200,
  },
  {
    id: "spread-mid",
    slide: 5,
    group: "spread",
    metric: "mid",
    shortName: "Разброс ЗП средний персонал",
    defaultTitle:
      "Разброс в достижении целевого уровня заработной платы (за счет всех источников финансирования) среднего мед. персонала",
    unit: "%",
    bands: [
      {
        id: "in",
        label: "Попали в диапазон 90%–110%",
        color: OKRUG_COLORS.green,
        min: 90,
        max: 110,
        maxInclusive: true,
      },
      {
        id: "below",
        label: "Не попали в диапазон 90%–110%",
        color: OKRUG_COLORS.red,
        min: 0,
        max: 90,
      },
      {
        id: "above",
        label: "Превысили диапазон 90%–110%",
        color: OKRUG_COLORS.cyan,
        min: 110,
        max: null,
        maxInclusive: false,
      },
    ],
    showKpi: true,
    targetPercent: 100,
  },
  {
    id: "spread-junior",
    slide: 6,
    group: "spread",
    metric: "junior",
    shortName: "Разброс ЗП младший персонал",
    defaultTitle:
      "Разброс в достижении целевого уровня заработной платы младшего персонала",
    unit: "%",
    bands: [
      {
        id: "in",
        label: "Попали в диапазон 90%–110%",
        color: OKRUG_COLORS.green,
        min: 90,
        max: 110,
        maxInclusive: true,
      },
      {
        id: "below",
        label: "Не попали в диапазон 90%–110%",
        color: OKRUG_COLORS.red,
        min: 0,
        max: 90,
      },
      {
        id: "above",
        label: "Превысили диапазон 90%–110%",
        color: OKRUG_COLORS.cyan,
        min: 110,
        max: null,
      },
      {
        id: "none",
        label: "Не участвуют в мониторинге",
        color: OKRUG_COLORS.white,
        min: null,
        max: null,
        missing: true,
        zeroMissing: true,
      },
    ],
    showKpi: true,
    targetPercent: 100,
  },
  {
    id: "oms-residuals",
    slide: 7,
    group: "oms",
    metric: "oms",
    shortName: "Остатки ОМС",
    defaultTitle:
      "Остатки средств ОМС на счетах МО из расчета среднемесячных расходов",
    unit: "мес.",
    bands: [
      {
        id: "zero",
        label: "0",
        color: OKRUG_COLORS.white,
        min: 0,
        max: 0,
        maxInclusive: true,
        zeroMissing: true,
      },
      {
        id: "a",
        label: "От 0,01 до 0,5",
        color: OKRUG_COLORS.omsLow,
        min: 0,
        max: 0.5,
        maxInclusive: true,
      },
      {
        id: "b",
        label: "От 0,5 до 1,0",
        color: OKRUG_COLORS.omsMidLow,
        min: 0.5,
        max: 1,
        maxInclusive: true,
      },
      {
        id: "c",
        label: "От 1,0 до 1,5",
        color: OKRUG_COLORS.omsMid,
        min: 1,
        max: 1.5,
        maxInclusive: true,
      },
      {
        id: "d",
        label: "От 1,5 до 2,0",
        color: OKRUG_COLORS.omsMidHigh,
        min: 1.5,
        max: 2,
        maxInclusive: true,
      },
      {
        id: "e",
        label: "От 2 до 4,6",
        color: OKRUG_COLORS.omsHigh,
        min: 2,
        max: 4.6,
        maxInclusive: true,
      },
      {
        id: "f",
        label: "Более 4,6",
        color: OKRUG_COLORS.omsOverflow,
        min: 4.6,
        max: null,
      },
    ],
    showKpi: false,
    targetPercent: null,
  },
];

export const OKRUG_TEMPLATE_BY_ID: Readonly<
  Record<OkrugTemplate["id"], OkrugTemplate>
> = Object.fromEntries(OKRUG_TEMPLATES.map((t) => [t.id, t])) as Record<
  OkrugTemplate["id"],
  OkrugTemplate
>;
