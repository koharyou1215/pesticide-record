import type { ChemicalInputUnit, LiquidUnit, UsageUnit } from "../types";

type VolumeFromSprayInput = {
  sprayAmount: number;
  sprayUnit: LiquidUnit;
  dilution: number;
};

type SprayFromChemicalInput = {
  chemicalAmount: number;
  chemicalUnit: ChemicalInputUnit;
  dilution: number;
};

type AreaCalculationInput = {
  areaA: number;
  liquidPer10a: number;
  usagePer10a: number;
  usageUnit: UsageUnit;
};

export type VolumeFromSprayResult = {
  chemicalAmountMl: number;
};

export type SprayFromChemicalResult = {
  sprayAmountMl: number;
  waterAmountMl: number;
};

export type AreaCalculationResult = {
  sprayAmountL: number;
  sprayAmountMl: number;
  chemicalAmount: number;
  usageUnit: UsageUnit;
};

const isPositiveNumber = (value: number): boolean =>
  Number.isFinite(value) && value > 0;

export const toMilliliters = (amount: number, unit: LiquidUnit): number =>
  unit === "L" ? amount * 1000 : amount;

export const chemicalInputToBaseAmount = (
  amount: number,
  unit: ChemicalInputUnit,
): number => {
  if (unit === "L") {
    return amount * 1000;
  }

  if (unit === "kg") {
    return amount * 1000;
  }

  return amount;
};

export const calculateChemicalAmountFromSpray = (
  input: VolumeFromSprayInput,
): VolumeFromSprayResult | null => {
  if (
    !isPositiveNumber(input.sprayAmount) ||
    !isPositiveNumber(input.dilution)
  ) {
    return null;
  }

  const sprayAmountMl = toMilliliters(input.sprayAmount, input.sprayUnit);

  return {
    chemicalAmountMl: sprayAmountMl / input.dilution,
  };
};

export const calculateSprayFromChemical = (
  input: SprayFromChemicalInput,
): SprayFromChemicalResult | null => {
  if (
    !isPositiveNumber(input.chemicalAmount) ||
    !isPositiveNumber(input.dilution)
  ) {
    return null;
  }

  const chemicalBaseAmount = chemicalInputToBaseAmount(
    input.chemicalAmount,
    input.chemicalUnit,
  );
  const sprayAmountMl = chemicalBaseAmount * input.dilution;
  const waterAmountMl = sprayAmountMl - chemicalBaseAmount;

  if (!Number.isFinite(sprayAmountMl) || waterAmountMl < 0) {
    return null;
  }

  return {
    sprayAmountMl,
    waterAmountMl,
  };
};

export const calculateFromArea = (
  input: AreaCalculationInput,
): AreaCalculationResult | null => {
  if (
    !isPositiveNumber(input.areaA) ||
    !isPositiveNumber(input.liquidPer10a) ||
    !isPositiveNumber(input.usagePer10a)
  ) {
    return null;
  }

  const sprayAmountL = (input.liquidPer10a * input.areaA) / 10;
  const sprayAmountMl = sprayAmountL * 1000;
  const chemicalAmount = (input.usagePer10a * input.areaA) / 10;

  return {
    sprayAmountL,
    sprayAmountMl,
    chemicalAmount,
    usageUnit: input.usageUnit,
  };
};
