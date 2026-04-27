import { defaultPesticides } from "../data/defaultPesticides";
import type { Pesticide, PesticideUsageRecord, PlotSetting } from "../types";

export const REGISTERED_PESTICIDES_KEY = "registeredPesticides";
export const PESTICIDE_USAGE_RECORDS_KEY = "pesticideUsageRecords";
export const PESTICIDE_DATA_VERSION_KEY = "registeredPesticidesDataVersion";
export const PLOT_SETTINGS_KEY = "plotSettings";

const DEFAULT_PESTICIDE_DATA_VERSION = "2026-04-27-jt-record-v1";

const canUseStorage = (): boolean => typeof window !== "undefined";

const readArray = <T,>(key: string): T[] | null => {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
};

export const saveRegisteredPesticides = (pesticides: Pesticide[]): void => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    REGISTERED_PESTICIDES_KEY,
    JSON.stringify(pesticides),
  );
};

const savePesticideDataVersion = (): void => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    PESTICIDE_DATA_VERSION_KEY,
    DEFAULT_PESTICIDE_DATA_VERSION,
  );
};

const mergeDefaultPesticideFields = (pesticide: Pesticide): Pesticide => {
  const defaultPesticide = defaultPesticides.find(
    (candidate: Pesticide) => candidate.id === pesticide.id,
  );

  if (!defaultPesticide || !pesticide.isDefault) {
    return pesticide;
  }

  return {
    ...pesticide,
    code: pesticide.code ?? defaultPesticide.code,
    group:
      pesticide.group === "植物成長調整剤"
        ? defaultPesticide.group
        : pesticide.group || defaultPesticide.group,
    pests: pesticide.pests.length > 0 ? pesticide.pests : defaultPesticide.pests,
    dilution: pesticide.dilution ?? defaultPesticide.dilution,
    usagePer10a: pesticide.usagePer10a ?? defaultPesticide.usagePer10a,
    usageUnit: pesticide.usageUnit ?? defaultPesticide.usageUnit,
    liquidPer10a: pesticide.liquidPer10a ?? defaultPesticide.liquidPer10a,
    preHarvestDays: pesticide.preHarvestDays ?? defaultPesticide.preHarvestDays,
    note: pesticide.note ?? defaultPesticide.note,
  };
};

const mergeDefaultPesticides = (pesticides: Pesticide[]): Pesticide[] => {
  const mergedPesticides = pesticides.map(mergeDefaultPesticideFields);
  const currentIds = new Set(mergedPesticides.map((pesticide: Pesticide) => pesticide.id));
  const missingDefaults = defaultPesticides.filter(
    (pesticide: Pesticide) => !currentIds.has(pesticide.id),
  );

  return missingDefaults.length > 0
    ? [...mergedPesticides, ...missingDefaults]
    : mergedPesticides;
};

export const getRegisteredPesticides = (): Pesticide[] => {
  const pesticides = readArray<Pesticide>(REGISTERED_PESTICIDES_KEY);

  if (!pesticides || pesticides.length === 0) {
    saveRegisteredPesticides(defaultPesticides);
    savePesticideDataVersion();
    return defaultPesticides;
  }

  const storedVersion = canUseStorage()
    ? window.localStorage.getItem(PESTICIDE_DATA_VERSION_KEY)
    : DEFAULT_PESTICIDE_DATA_VERSION;

  if (storedVersion !== DEFAULT_PESTICIDE_DATA_VERSION) {
    const mergedPesticides = mergeDefaultPesticides(pesticides);
    saveRegisteredPesticides(mergedPesticides);
    savePesticideDataVersion();
    return mergedPesticides;
  }

  return pesticides;
};

export const savePlotSettings = (plotSettings: PlotSetting[]): void => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(PLOT_SETTINGS_KEY, JSON.stringify(plotSettings));
};

export const getPlotSettings = (): PlotSetting[] => {
  const plotSettings = readArray<PlotSetting>(PLOT_SETTINGS_KEY);

  return plotSettings ?? [];
};

export const saveUsageRecords = (records: PesticideUsageRecord[]): void => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    PESTICIDE_USAGE_RECORDS_KEY,
    JSON.stringify(records),
  );
};

export const getUsageRecords = (): PesticideUsageRecord[] => {
  const records = readArray<PesticideUsageRecord>(PESTICIDE_USAGE_RECORDS_KEY);

  if (!records) {
    return [];
  }

  return records;
};
