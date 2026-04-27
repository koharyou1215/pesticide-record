export const PESTICIDE_GROUPS = [
  "除草剤",
  "殺菌剤",
  "殺虫剤",
  "成長抑制剤",
] as const;

export type UsageUnit = "mL" | "g" | "kg";
export type LiquidUnit = "L" | "mL";
export type ChemicalInputUnit = "mL" | "g" | "L" | "kg";
export type Screen = "calculator" | "pesticides" | "records" | "settings";

export type Pesticide = {
  id: string;
  code?: string;
  name: string;
  group: string;
  pests: string[];
  dilution?: number;
  usagePer10a?: number;
  usageUnit?: UsageUnit;
  liquidPer10a?: number;
  preHarvestDays?: number;
  note?: string;
  isDefault?: boolean;
};

export type PlotSetting = {
  plotNumber: string;
  areaA: number;
};

export type PesticideUsageRecord = {
  id: string;
  date: string;
  harvestDate?: string;
  fieldName: string;
  cropName?: string;
  pesticideId?: string;
  pesticideCode?: string;
  pesticideName: string;
  pesticideGroup?: string;
  dilution?: number;
  liquidAmount?: number;
  liquidUnit?: LiquidUnit;
  chemicalAmount?: number;
  chemicalUnit?: UsageUnit;
  areaA?: number;
  plotNumbers?: string[];
  targetPests?: string[];
  note?: string;
  createdAt: string;
  updatedAt: string;
};
