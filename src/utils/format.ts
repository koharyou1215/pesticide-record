import type { LiquidUnit, UsageUnit } from "../types";

export const formatNumber = (value: number): string => {
  if (!Number.isFinite(value)) {
    return "";
  }

  const rounded = Math.round(value * 100) / 100;

  return rounded.toLocaleString("ja-JP", {
    maximumFractionDigits: 2,
  });
};

export const formatVolumeFromMl = (valueMl: number): string => {
  if (!Number.isFinite(valueMl) || valueMl < 0) {
    return "";
  }

  if (valueMl < 1000) {
    return `${formatNumber(valueMl)} mL`;
  }

  const liters = Math.floor(valueMl / 1000);
  const remainMl = Math.round((valueMl - liters * 1000) * 100) / 100;

  if (remainMl === 0) {
    return `${formatNumber(liters)} L`;
  }

  return `${formatNumber(liters)} L ${formatNumber(remainMl)} mL`;
};

export const formatLiquidAmount = (
  value: number | undefined,
  unit: LiquidUnit | undefined,
): string => {
  if (value === undefined || unit === undefined || !Number.isFinite(value)) {
    return "";
  }

  return unit === "L"
    ? formatVolumeFromMl(value * 1000)
    : `${formatNumber(value)} mL`;
};

export const formatChemicalAmount = (
  value: number | undefined,
  unit: UsageUnit | undefined,
): string => {
  if (value === undefined || unit === undefined || !Number.isFinite(value)) {
    return "";
  }

  return `${formatNumber(value)} ${unit}`;
};

export const formatDilution = (value: number | undefined): string =>
  value && Number.isFinite(value) ? `${formatNumber(value)}倍` : "";

export const joinItems = (items: string[] | undefined): string =>
  items && items.length > 0 ? items.join(" / ") : "";
