import { useEffect, useState } from "react";
import type { ChemicalInputUnit, LiquidUnit, Pesticide, UsageUnit } from "../types";
import {
  calculateChemicalAmountFromSpray,
  calculateFromArea,
  calculateSprayFromChemical,
} from "../utils/calculation";
import { formatChemicalAmount, formatVolumeFromMl } from "../utils/format";
import { PesticideSelector } from "./PesticideSelector";

type CalculatorProps = {
  pesticides: Pesticide[];
};

type SprayToChemicalForm = {
  sprayAmount: string;
  sprayUnit: LiquidUnit;
};

type ChemicalToSprayForm = {
  chemicalAmount: string;
  chemicalUnit: ChemicalInputUnit;
};

type AreaForm = {
  areaA: string;
  liquidPer10a: string;
  usagePer10a: string;
  usageUnit: UsageUnit;
};

type KeypadTarget =
  | "dilution"
  | "sprayAmount"
  | "chemicalAmount"
  | "areaA"
  | "liquidPer10a"
  | "usagePer10a";

const initialSprayToChemicalForm: SprayToChemicalForm = {
  sprayAmount: "",
  sprayUnit: "L",
};

const initialChemicalToSprayForm: ChemicalToSprayForm = {
  chemicalAmount: "",
  chemicalUnit: "mL",
};

const initialAreaForm: AreaForm = {
  areaA: "",
  liquidPer10a: "",
  usagePer10a: "",
  usageUnit: "mL",
};

const keypadNumbers = ["7", "8", "9", "4", "5", "6", "1", "2", "3"];

const toOptionalNumber = (value: string): number | null => {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
};

export function Calculator({ pesticides }: CalculatorProps) {
  const [selectedPesticideId, setSelectedPesticideId] = useState("");
  const [dilution, setDilution] = useState("");
  const [sprayToChemicalForm, setSprayToChemicalForm] = useState(
    initialSprayToChemicalForm,
  );
  const [chemicalToSprayForm, setChemicalToSprayForm] = useState(
    initialChemicalToSprayForm,
  );
  const [areaForm, setAreaForm] = useState(initialAreaForm);
  const [keypadTarget, setKeypadTarget] = useState<KeypadTarget | null>(null);

  const selectedPesticide =
    pesticides.find((pesticide) => pesticide.id === selectedPesticideId) ?? null;

  useEffect(() => {
    if (!selectedPesticide) {
      return;
    }

    setDilution(
      selectedPesticide.dilution !== undefined
        ? String(selectedPesticide.dilution)
        : "",
    );
    setAreaForm((current) => ({
      ...current,
      liquidPer10a:
        selectedPesticide.liquidPer10a !== undefined
          ? String(selectedPesticide.liquidPer10a)
          : "",
      usagePer10a:
        selectedPesticide.usagePer10a !== undefined
          ? String(selectedPesticide.usagePer10a)
          : "",
      usageUnit: selectedPesticide.usageUnit ?? current.usageUnit,
    }));
    setChemicalToSprayForm((current) => ({
      ...current,
      chemicalUnit: selectedPesticide.usageUnit ?? current.chemicalUnit,
    }));
  }, [selectedPesticide]);

  const dilutionNumber = toOptionalNumber(dilution);

  const sprayToChemicalResult =
    dilutionNumber !== null && sprayToChemicalForm.sprayAmount.trim()
      ? calculateChemicalAmountFromSpray({
          sprayAmount: Number(sprayToChemicalForm.sprayAmount),
          sprayUnit: sprayToChemicalForm.sprayUnit,
          dilution: dilutionNumber,
        })
      : null;

  const chemicalToSprayResult =
    dilutionNumber !== null && chemicalToSprayForm.chemicalAmount.trim()
      ? calculateSprayFromChemical({
          chemicalAmount: Number(chemicalToSprayForm.chemicalAmount),
          chemicalUnit: chemicalToSprayForm.chemicalUnit,
          dilution: dilutionNumber,
        })
      : null;

  const areaUsageAmount = toOptionalNumber(areaForm.usagePer10a);
  const areaLiquidAmount = toOptionalNumber(areaForm.liquidPer10a);
  const areaA = toOptionalNumber(areaForm.areaA);
  const areaResult =
    areaUsageAmount !== null && areaLiquidAmount !== null && areaA !== null
      ? calculateFromArea({
          areaA,
          liquidPer10a: areaLiquidAmount,
          usagePer10a: areaUsageAmount,
          usageUnit: areaForm.usageUnit,
        })
      : null;

  const handleReset = () => {
    setSelectedPesticideId("");
    setDilution("");
    setSprayToChemicalForm(initialSprayToChemicalForm);
    setChemicalToSprayForm(initialChemicalToSprayForm);
    setAreaForm(initialAreaForm);
    setKeypadTarget(null);
  };

  const getKeypadValue = (target: KeypadTarget): string => {
    switch (target) {
      case "dilution":
        return dilution;
      case "sprayAmount":
        return sprayToChemicalForm.sprayAmount;
      case "chemicalAmount":
        return chemicalToSprayForm.chemicalAmount;
      case "areaA":
        return areaForm.areaA;
      case "liquidPer10a":
        return areaForm.liquidPer10a;
      case "usagePer10a":
        return areaForm.usagePer10a;
    }
  };

  const setKeypadValue = (target: KeypadTarget, value: string) => {
    switch (target) {
      case "dilution":
        setDilution(value);
        return;
      case "sprayAmount":
        setSprayToChemicalForm((current) => ({
          ...current,
          sprayAmount: value,
        }));
        return;
      case "chemicalAmount":
        setChemicalToSprayForm((current) => ({
          ...current,
          chemicalAmount: value,
        }));
        return;
      case "areaA":
        setAreaForm((current) => ({
          ...current,
          areaA: value,
        }));
        return;
      case "liquidPer10a":
        setAreaForm((current) => ({
          ...current,
          liquidPer10a: value,
        }));
        return;
      case "usagePer10a":
        setAreaForm((current) => ({
          ...current,
          usagePer10a: value,
        }));
        return;
    }
  };

  const getKeypadMeta = (
    target: KeypadTarget,
  ): { title: string; unit: string; presets: string[]; tone: "green" | "blue" } => {
    switch (target) {
      case "dilution":
        return {
          title: "希釈倍数",
          unit: "倍",
          presets: ["500", "1000", "2000"],
          tone: "green",
        };
      case "sprayAmount":
        return {
          title: "散布液量",
          unit: sprayToChemicalForm.sprayUnit,
          presets: ["10", "50", "100"],
          tone: "blue",
        };
      case "chemicalAmount":
        return {
          title: "使用薬量",
          unit: chemicalToSprayForm.chemicalUnit,
          presets: ["10", "50", "100"],
          tone: "blue",
        };
      case "areaA":
        return {
          title: "散布面積",
          unit: "a",
          presets: ["1", "5", "10"],
          tone: "blue",
        };
      case "liquidPer10a":
        return {
          title: "10a散布液量",
          unit: "L",
          presets: ["100", "150", "200"],
          tone: "blue",
        };
      case "usagePer10a":
        return {
          title: "10a使用薬量",
          unit: areaForm.usageUnit,
          presets: ["50", "100", "200"],
          tone: "blue",
        };
    }
  };

  const appendKeypadValue = (input: string) => {
    if (!keypadTarget) {
      return;
    }

    const currentValue = getKeypadValue(keypadTarget);

    if (input === "." && currentValue.includes(".")) {
      return;
    }

    setKeypadValue(keypadTarget, `${currentValue}${input}`);
  };

  const clearKeypadValue = () => {
    if (!keypadTarget) {
      return;
    }

    setKeypadValue(keypadTarget, "");
  };

  const keypadMeta = keypadTarget ? getKeypadMeta(keypadTarget) : null;

  return (
    <section className="screen calculator-screen">
      <div className="card calculator-card">
        <PesticideSelector
          pesticides={pesticides}
          selectedId={selectedPesticideId}
          onChange={setSelectedPesticideId}
          label="農薬を選ぶ"
        />

        <label className="field">
          <span className="sr-only">希釈倍数</span>
          <span className="with-unit compact-with-unit">
            <input
              className="input keypad-input"
              inputMode="decimal"
              readOnly
              value={dilution}
              onClick={() => setKeypadTarget("dilution")}
              onFocus={() => setKeypadTarget("dilution")}
              placeholder="希釈倍数"
            />
            <span className="unit-text">倍</span>
          </span>
        </label>

        <section className="calc-section">
          <h2 className="calc-section-title">面積から液量・薬量を算出</h2>
          <div className="calc-fields">
            <label className="field">
              <span className="sr-only">散布面積</span>
              <input
                className="input keypad-input"
                inputMode="decimal"
                readOnly
                value={areaForm.areaA}
                onClick={() => setKeypadTarget("areaA")}
                onFocus={() => setKeypadTarget("areaA")}
                placeholder="散布面積"
              />
            </label>
            <label className="field">
              <span className="sr-only">10aあたり散布量</span>
              <input
                className="input keypad-input"
                inputMode="decimal"
                readOnly
                value={areaForm.liquidPer10a}
                onClick={() => setKeypadTarget("liquidPer10a")}
                onFocus={() => setKeypadTarget("liquidPer10a")}
                placeholder="10aあたり散布量"
              />
            </label>
            <div className="calc-input-row">
              <label className="field">
                <span className="sr-only">10aあたり使用薬量</span>
                <input
                  className="input keypad-input"
                  inputMode="decimal"
                  readOnly
                  value={areaForm.usagePer10a}
                  onClick={() => setKeypadTarget("usagePer10a")}
                  onFocus={() => setKeypadTarget("usagePer10a")}
                  placeholder="使用薬量"
                />
              </label>
              <label className="field">
                <span className="sr-only">単位</span>
                <select
                  className="input unit-select"
                  value={areaForm.usageUnit}
                  onChange={(event) =>
                    setAreaForm((current) => ({
                      ...current,
                      usageUnit: event.target.value as UsageUnit,
                    }))
                  }
                >
                  <option value="mL">mL</option>
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                </select>
              </label>
            </div>

            {areaResult ? (
              <div className="compact-result-grid">
                <div className="plain-result compact-result">
                  <span>必要な液量</span>
                  <strong>{formatVolumeFromMl(areaResult.sprayAmountMl)}</strong>
                </div>
                <div className="plain-result compact-result">
                  <span>必要な薬量</span>
                  <strong>
                    {formatChemicalAmount(areaResult.chemicalAmount, areaResult.usageUnit)}
                  </strong>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="calc-section">
          <h2 className="calc-section-title">液量から薬量を算出</h2>
          <div className="calc-fields">
            <div className="calc-input-row">
              <label className="field">
                <span className="sr-only">散布液量</span>
                <input
                  className="input keypad-input"
                  inputMode="decimal"
                  readOnly
                  value={sprayToChemicalForm.sprayAmount}
                  onClick={() => setKeypadTarget("sprayAmount")}
                  onFocus={() => setKeypadTarget("sprayAmount")}
                  placeholder="散布液量"
                />
              </label>
              <label className="field">
                <span className="sr-only">単位</span>
                <select
                  className="input unit-select"
                  value={sprayToChemicalForm.sprayUnit}
                  onChange={(event) =>
                    setSprayToChemicalForm((current) => ({
                      ...current,
                      sprayUnit: event.target.value as LiquidUnit,
                    }))
                  }
                >
                  <option value="L">L</option>
                  <option value="mL">mL</option>
                </select>
              </label>
            </div>

            {sprayToChemicalResult ? (
              <div className="plain-result compact-result">
                <span>必要な薬量</span>
                <strong>{formatVolumeFromMl(sprayToChemicalResult.chemicalAmountMl)}</strong>
              </div>
            ) : null}
          </div>
        </section>

        <section className="calc-section">
          <h2 className="calc-section-title">薬量から液量を算出</h2>
          <div className="calc-fields">
            <div className="calc-input-row">
              <label className="field">
                <span className="sr-only">使用薬量</span>
                <input
                  className="input keypad-input"
                  inputMode="decimal"
                  readOnly
                  value={chemicalToSprayForm.chemicalAmount}
                  onClick={() => setKeypadTarget("chemicalAmount")}
                  onFocus={() => setKeypadTarget("chemicalAmount")}
                  placeholder="使用薬量"
                />
              </label>
              <label className="field">
                <span className="sr-only">単位</span>
                <select
                  className="input unit-select"
                  value={chemicalToSprayForm.chemicalUnit}
                  onChange={(event) =>
                    setChemicalToSprayForm((current) => ({
                      ...current,
                      chemicalUnit: event.target.value as ChemicalInputUnit,
                    }))
                  }
                >
                  <option value="mL">mL</option>
                  <option value="g">g</option>
                  <option value="L">L</option>
                  <option value="kg">kg</option>
                </select>
              </label>
            </div>

            {chemicalToSprayResult ? (
              <div className="compact-result-grid">
                <div className="plain-result compact-result">
                  <span>作れる液量</span>
                  <strong>{formatVolumeFromMl(chemicalToSprayResult.sprayAmountMl)}</strong>
                </div>
                <div className="plain-result compact-result">
                  <span>必要な水量</span>
                  <strong>{formatVolumeFromMl(chemicalToSprayResult.waterAmountMl)}</strong>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <button className="button button-secondary" type="button" onClick={handleReset}>
        入力を消す
      </button>

      {keypadTarget && keypadMeta ? (
        <div className="keypad-backdrop" role="dialog" aria-modal="true">
          <div className={`keypad-panel keypad-panel-${keypadMeta.tone}`}>
            <div className="keypad-header">
              <button
                className="keypad-close"
                type="button"
                onClick={() => setKeypadTarget(null)}
                aria-label="閉じる"
              >
                ×
              </button>
              <span>キャンセル</span>
            </div>

            <div className="keypad-display">
              <span>{keypadMeta.title}</span>
              <strong>{getKeypadValue(keypadTarget) || "0"}</strong>
              <em>{keypadMeta.unit}</em>
            </div>

            <div className="keypad-presets">
              {keypadMeta.presets.map((preset) => (
                <button
                  key={preset}
                  className="keypad-preset"
                  type="button"
                  onClick={() => setKeypadValue(keypadTarget, preset)}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="keypad-grid">
              {keypadNumbers.map((number) => (
                <button
                  key={number}
                  className="keypad-key"
                  type="button"
                  onClick={() => appendKeypadValue(number)}
                >
                  {number}
                </button>
              ))}
              <button
                className="keypad-key keypad-clear"
                type="button"
                onClick={clearKeypadValue}
              >
                C
              </button>
              <button
                className="keypad-key"
                type="button"
                onClick={() => appendKeypadValue("0")}
              >
                0
              </button>
              <button
                className="keypad-key"
                type="button"
                onClick={() => appendKeypadValue(".")}
              >
                .
              </button>
            </div>

            <button
              className="keypad-enter"
              type="button"
              onClick={() => setKeypadTarget(null)}
            >
              入力
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
