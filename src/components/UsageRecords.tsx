import { useMemo, useState } from "react";
import type {
  LiquidUnit,
  Pesticide,
  PesticideUsageRecord,
  PlotSetting,
  UsageUnit,
} from "../types";
import {
  formatChemicalAmount,
  formatDilution,
  formatLiquidAmount,
  formatNumber,
  joinItems,
} from "../utils/format";
import { PesticideSelector } from "./PesticideSelector";

type UsageRecordsProps = {
  pesticides: Pesticide[];
  records: PesticideUsageRecord[];
  plotSettings: PlotSetting[];
  onSave: (record: PesticideUsageRecord) => void;
  onDelete: (recordId: string) => void;
};

type UsageRecordFormState = {
  id: string | null;
  date: string;
  harvestDate: string;
  fieldName: string;
  cropName: string;
  pesticideId: string;
  pesticideCode: string;
  pesticideName: string;
  pesticideGroup: string;
  dilution: string;
  liquidAmount: string;
  liquidUnit: LiquidUnit;
  chemicalAmount: string;
  chemicalUnit: UsageUnit;
  areaA: string;
  plotNumbers: string;
  targetPests: string;
  note: string;
  createdAt: string | null;
};

type RecordFilters = {
  date: string;
  fieldName: string;
  cropName: string;
  pesticideName: string;
};

const emptyFilters: RecordFilters = {
  date: "",
  fieldName: "",
  cropName: "",
  pesticideName: "",
};

const emptyForm: UsageRecordFormState = {
  id: null,
  date: "",
  harvestDate: "",
  fieldName: "",
  cropName: "",
  pesticideId: "",
  pesticideCode: "",
  pesticideName: "",
  pesticideGroup: "",
  dilution: "",
  liquidAmount: "",
  liquidUnit: "L",
  chemicalAmount: "",
  chemicalUnit: "mL",
  areaA: "",
  plotNumbers: "",
  targetPests: "",
  note: "",
  createdAt: null,
};

const toOptionalNumber = (value: string): number | undefined => {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
};

const buildId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `record-${Date.now()}`;
};

const parseTargets = (value: string): string[] | undefined => {
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items : undefined;
};

const formatInputNumber = (value: number): string => {
  const rounded = Math.round(value * 10) / 10;

  return String(rounded);
};

const expandPlotRange = (start: number, end: number): string[] => {
  const step = start <= end ? 1 : -1;
  const result: string[] = [];

  for (let value = start; value !== end + step; value += step) {
    result.push(String(value));
  }

  return result;
};

const parsePlotNumbers = (value: string): string[] => {
  const normalizedValue = value
    .replace(/から/g, "-")
    .replace(/[〜～]/g, "-")
    .replace(/[、，]/g, ",");
  const items = normalizedValue
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .flatMap((item) => {
      const rangeMatch = item.match(/^(\d+)-(\d+)$/);

      if (!rangeMatch) {
        return [item];
      }

      return expandPlotRange(Number(rangeMatch[1]), Number(rangeMatch[2]));
    });

  return Array.from(new Set(items)).sort((left, right) =>
    left.localeCompare(right, "ja", { numeric: true }),
  );
};

const joinPlotNumbers = (plotNumbers: string[]): string => plotNumbers.join(",");

const calculateAreaFromPlots = (
  plotNumbers: string[],
  plotSettings: PlotSetting[],
): number | undefined => {
  const area = plotNumbers.reduce((total, plotNumber) => {
    const plot = plotSettings.find((candidate) => candidate.plotNumber === plotNumber);

    return plot ? total + plot.areaA : total;
  }, 0);

  return area > 0 ? Math.round(area * 10) / 10 : undefined;
};

const calculateLiquidAmount = (
  pesticide: Pesticide,
  areaA: number | undefined,
): string => {
  if (pesticide.liquidPer10a === undefined) {
    return "";
  }

  if (areaA === undefined) {
    return String(pesticide.liquidPer10a);
  }

  return formatInputNumber((pesticide.liquidPer10a * areaA) / 10);
};

const calculateChemicalAmount = (
  pesticide: Pesticide,
  areaA: number | undefined,
): string => {
  if (
    areaA !== undefined &&
    pesticide.liquidPer10a !== undefined &&
    pesticide.dilution !== undefined &&
    pesticide.dilution > 0
  ) {
    return formatInputNumber((pesticide.liquidPer10a * areaA * 100) / pesticide.dilution);
  }

  if (pesticide.usagePer10a === undefined) {
    return "";
  }

  return areaA === undefined
    ? String(pesticide.usagePer10a)
    : formatInputNumber((pesticide.usagePer10a * areaA) / 10);
};

const formatPrintDate = (value: string | undefined): string => {
  if (!value) {
    return "";
  }

  const match = value.match(/^\d{4}-(\d{2})-(\d{2})$/);

  return match ? `${match[1]}/${match[2]}` : value;
};

const toDateTime = (value: string | undefined): number | null => {
  if (!value) {
    return null;
  }

  const time = new Date(`${value}T00:00:00`).getTime();

  return Number.isFinite(time) ? time : null;
};

const diffDays = (left: string | undefined, right: string | undefined): number | null => {
  const leftTime = toDateTime(left);
  const rightTime = toDateTime(right);

  if (leftTime === null || rightTime === null) {
    return null;
  }

  return Math.abs(rightTime - leftTime) / 86_400_000;
};

type IntervalRole = "designated" | "target";

type IntervalRule = {
  designatedName: string;
  designatedKeywords: string[];
  targetGroup: string;
  targetLabel: string;
};

type IntervalRequirement = {
  days: number;
  reason: string;
};

const intervalRules: IntervalRule[] = [
  {
    designatedName: "カリグリーン",
    designatedKeywords: ["カリグリーン"],
    targetGroup: "殺虫剤",
    targetLabel: "殺虫剤",
  },
  {
    designatedName: "エコショット",
    designatedKeywords: ["エコショット"],
    targetGroup: "殺虫剤",
    targetLabel: "殺虫剤",
  },
  {
    designatedName: "トアローCT",
    designatedKeywords: ["トアローCT", "トアローＣＴ"],
    targetGroup: "殺菌剤",
    targetLabel: "殺菌剤",
  },
];

const normalizePesticideName = (value: string): string =>
  value.replace(/[ 　]/g, "").toUpperCase();

const getPesticideForRecord = (
  record: PesticideUsageRecord,
  pesticides: Pesticide[],
): Pesticide | null =>
  pesticides.find((pesticide) => pesticide.id === record.pesticideId) ??
  pesticides.find((pesticide) => pesticide.name === record.pesticideName) ??
  null;

const getRecordGroup = (
  record: PesticideUsageRecord,
  pesticides: Pesticide[],
): string => record.pesticideGroup ?? getPesticideForRecord(record, pesticides)?.group ?? "";

const getIntervalRole = (
  record: PesticideUsageRecord,
  pesticides: Pesticide[],
  rule: IntervalRule,
): IntervalRole | null => {
  const normalizedName = normalizePesticideName(record.pesticideName);

  if (
    rule.designatedKeywords.some((keyword) =>
      normalizedName.includes(normalizePesticideName(keyword)),
    )
  ) {
    return "designated";
  }

  return getRecordGroup(record, pesticides) === rule.targetGroup ? "target" : null;
};

const getRuleRequirement = (
  left: PesticideUsageRecord,
  right: PesticideUsageRecord,
  pesticides: Pesticide[],
  rule: IntervalRule,
): IntervalRequirement | null => {
  const leftRole = getIntervalRole(left, pesticides, rule);
  const rightRole = getIntervalRole(right, pesticides, rule);

  if (!leftRole || !rightRole) {
    return null;
  }

  if (leftRole !== rightRole) {
    return {
      days: 1,
      reason: `${rule.designatedName}と${rule.targetLabel}の組み合わせ`,
    };
  }

  return {
    days: 7,
    reason:
      leftRole === "designated"
        ? `${rule.designatedName}など指定剤の連続使用`
        : `${rule.targetLabel}の連続使用`,
  };
};

const getRequiredIntervalDays = (
  left: PesticideUsageRecord,
  right: PesticideUsageRecord,
  pesticides: Pesticide[],
): IntervalRequirement | null =>
  intervalRules.reduce<IntervalRequirement | null>((currentRequirement, rule) => {
    const requirement = getRuleRequirement(left, right, pesticides, rule);

    if (!requirement) {
      return currentRequirement;
    }

    if (!currentRequirement || requirement.days > currentRequirement.days) {
      return requirement;
    }

    return currentRequirement;
  }, null);

const recordsSharePlot = (
  left: PesticideUsageRecord,
  right: PesticideUsageRecord,
): boolean => {
  const leftPlotNumbers = left.plotNumbers ?? [];
  const rightPlotNumbers = right.plotNumbers ?? [];

  if (leftPlotNumbers.length > 0 && rightPlotNumbers.length > 0) {
    return leftPlotNumbers.some((plotNumber) =>
      rightPlotNumbers.includes(plotNumber),
    );
  }

  if (left.fieldName && right.fieldName) {
    return left.fieldName === right.fieldName;
  }

  return true;
};

const compareRecordsByDate = (
  left: PesticideUsageRecord,
  right: PesticideUsageRecord,
): number => {
  if (left.date !== right.date) {
    return left.date.localeCompare(right.date);
  }

  return left.createdAt.localeCompare(right.createdAt);
};

const getAdjacentRecords = (
  record: PesticideUsageRecord,
  records: PesticideUsageRecord[],
): PesticideUsageRecord[] => {
  const relatedRecords = records
    .filter(
      (candidate) =>
        candidate.id === record.id || recordsSharePlot(candidate, record),
    )
    .sort(compareRecordsByDate);
  const recordIndex = relatedRecords.findIndex(
    (candidate) => candidate.id === record.id,
  );

  if (recordIndex < 0) {
    return [];
  }

  return [relatedRecords[recordIndex - 1], relatedRecords[recordIndex + 1]].filter(
    (candidate): candidate is PesticideUsageRecord => candidate !== undefined,
  );
};

const toFormState = (record: PesticideUsageRecord): UsageRecordFormState => ({
  id: record.id,
  date: record.date,
  harvestDate: record.harvestDate ?? "",
  fieldName: record.fieldName,
  cropName: record.cropName ?? "",
  pesticideId: record.pesticideId ?? "",
  pesticideCode: record.pesticideCode ?? "",
  pesticideName: record.pesticideName,
  pesticideGroup: record.pesticideGroup ?? "",
  dilution: record.dilution !== undefined ? String(record.dilution) : "",
  liquidAmount:
    record.liquidAmount !== undefined ? String(record.liquidAmount) : "",
  liquidUnit: record.liquidUnit ?? "L",
  chemicalAmount:
    record.chemicalAmount !== undefined ? String(record.chemicalAmount) : "",
  chemicalUnit: record.chemicalUnit ?? "mL",
  areaA: record.areaA !== undefined ? String(record.areaA) : "",
  plotNumbers: record.plotNumbers?.join(",") ?? "",
  targetPests: record.targetPests?.join(", ") ?? "",
  note: record.note ?? "",
  createdAt: record.createdAt,
});

export function UsageRecords({
  pesticides,
  records,
  plotSettings,
  onSave,
  onDelete,
}: UsageRecordsProps) {
  const [filters, setFilters] = useState<RecordFilters>(emptyFilters);
  const [form, setForm] = useState<UsageRecordFormState>(emptyForm);

  const filteredRecords = useMemo(() => {
    const normalizedFieldName = filters.fieldName.trim().toLowerCase();
    const normalizedCropName = filters.cropName.trim().toLowerCase();
    const normalizedPesticideName = filters.pesticideName.trim().toLowerCase();

    return [...records]
      .sort((left, right) => {
        if (left.date === right.date) {
          return right.createdAt.localeCompare(left.createdAt);
        }

        return right.date.localeCompare(left.date);
      })
      .filter((record) => {
        const matchesDate = !filters.date || record.date.includes(filters.date);
        const matchesFieldName =
          normalizedFieldName.length === 0 ||
          record.fieldName.toLowerCase().includes(normalizedFieldName);
        const matchesCropName =
          normalizedCropName.length === 0 ||
          (record.cropName ?? "").toLowerCase().includes(normalizedCropName);
        const matchesPesticideName =
          normalizedPesticideName.length === 0 ||
          record.pesticideName.toLowerCase().includes(normalizedPesticideName);

        return (
          matchesDate &&
          matchesFieldName &&
          matchesCropName &&
          matchesPesticideName
        );
      });
  }, [filters, records]);

  const handleSelectedPesticide = (pesticideId: string) => {
    const pesticide =
      pesticides.find((candidate) => candidate.id === pesticideId) ?? null;

    if (!pesticide) {
      setForm((current) => ({
        ...current,
        pesticideId,
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      pesticideId,
      pesticideCode: pesticide.code ?? "",
      pesticideName: pesticide.name,
      pesticideGroup: pesticide.group,
      dilution:
        pesticide.dilution !== undefined
          ? String(pesticide.dilution)
          : "",
      liquidAmount: calculateLiquidAmount(
        pesticide,
        toOptionalNumber(current.areaA),
      ),
      liquidUnit: pesticide.liquidPer10a !== undefined ? "L" : current.liquidUnit,
      chemicalAmount: calculateChemicalAmount(
        pesticide,
        toOptionalNumber(current.areaA),
      ),
      chemicalUnit: pesticide.usageUnit ?? current.chemicalUnit,
      targetPests: pesticide.pests.join(", "),
    }));
  };

  const handlePlotNumbersChange = (value: string) => {
    setForm((current) => {
      const plotNumbers = parsePlotNumbers(value);
      const areaA = calculateAreaFromPlots(plotNumbers, plotSettings);
      const pesticide =
        pesticides.find((candidate) => candidate.id === current.pesticideId) ?? null;
      const nextAreaA = areaA !== undefined ? formatInputNumber(areaA) : current.areaA;
      const areaNumber = areaA ?? toOptionalNumber(nextAreaA);

      return {
        ...current,
        plotNumbers: value,
        areaA: nextAreaA,
        liquidAmount: pesticide
          ? calculateLiquidAmount(pesticide, areaNumber)
          : current.liquidAmount,
        chemicalAmount: pesticide
          ? calculateChemicalAmount(pesticide, areaNumber)
          : current.chemicalAmount,
      };
    });
  };

  const handleTogglePlotNumber = (plotNumber: string) => {
    const currentPlotNumbers = parsePlotNumbers(form.plotNumbers);
    const nextPlotNumbers = currentPlotNumbers.includes(plotNumber)
      ? currentPlotNumbers.filter((candidate) => candidate !== plotNumber)
      : [...currentPlotNumbers, plotNumber];

    handlePlotNumbersChange(joinPlotNumbers(nextPlotNumbers));
  };

  const handleAreaChange = (value: string) => {
    setForm((current) => {
      const pesticide =
        pesticides.find((candidate) => candidate.id === current.pesticideId) ?? null;
      const areaA = toOptionalNumber(value);

      return {
        ...current,
        areaA: value,
        liquidAmount: pesticide
          ? calculateLiquidAmount(pesticide, areaA)
          : current.liquidAmount,
        chemicalAmount: pesticide
          ? calculateChemicalAmount(pesticide, areaA)
          : current.chemicalAmount,
      };
    });
  };

  const hasHarvestWarning = (record: PesticideUsageRecord): boolean => {
    const pesticide = getPesticideForRecord(record, pesticides);
    const requiredDays = pesticide?.preHarvestDays;
    const days = diffDays(record.date, record.harvestDate);

    return requiredDays !== undefined && days !== null && days < requiredDays;
  };

  const getIntervalWarningMessages = (
    record: PesticideUsageRecord,
  ): string[] =>
    getAdjacentRecords(record, records)
      .map((otherRecord) => {
        const requirement = getRequiredIntervalDays(
          record,
          otherRecord,
          pesticides,
        );
        const days = diffDays(record.date, otherRecord.date);

        if (!requirement || days === null || days >= requirement.days) {
          return null;
        }

        return `${otherRecord.pesticideName}との使用間隔が不足（${requirement.reason}: ${requirement.days}日以上）`;
      })
      .filter((message): message is string => message !== null);

  const hasPestUseCountWarning = (record: PesticideUsageRecord): boolean => {
    const pesticide = getPesticideForRecord(record, pesticides);
    const targets = record.targetPests ?? pesticide?.pests ?? [];

    return targets.some((target) => {
      const count = records.filter((candidate) => {
        const candidatePesticide = getPesticideForRecord(candidate, pesticides);
        const candidateTargets = candidate.targetPests ?? candidatePesticide?.pests ?? [];

        return candidateTargets.includes(target);
      }).length;

      return count >= 3;
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const date = form.date.trim();
    const plotNumbers = parsePlotNumbers(form.plotNumbers);
    const fieldName =
      form.fieldName.trim() ||
      (plotNumbers.length > 0 ? `補地 ${joinPlotNumbers(plotNumbers)}` : "未設定");
    const pesticideName = form.pesticideName.trim();

    if (!date || !pesticideName) {
      return;
    }

    const now = new Date().toISOString();

    onSave({
      id: form.id ?? buildId(),
      date,
      harvestDate: form.harvestDate.trim() || undefined,
      fieldName,
      cropName: form.cropName.trim() || undefined,
      pesticideId: form.pesticideId || undefined,
      pesticideCode: form.pesticideCode.trim() || undefined,
      pesticideName,
      pesticideGroup: form.pesticideGroup.trim() || undefined,
      dilution: toOptionalNumber(form.dilution),
      liquidAmount: toOptionalNumber(form.liquidAmount),
      liquidUnit: form.liquidUnit,
      chemicalAmount: toOptionalNumber(form.chemicalAmount),
      chemicalUnit: form.chemicalUnit,
      areaA: toOptionalNumber(form.areaA),
      plotNumbers: plotNumbers.length > 0 ? plotNumbers : undefined,
      targetPests: parseTargets(form.targetPests),
      note: form.note.trim() || undefined,
      createdAt: form.createdAt ?? now,
      updatedAt: now,
    });

    setForm(emptyForm);
  };

  const handleEdit = (record: PesticideUsageRecord) => {
    setForm(toFormState(record));
  };

  const handleDelete = (record: PesticideUsageRecord) => {
    if (!window.confirm(`使用記録「${record.pesticideName}」を削除しますか？`)) {
      return;
    }

    onDelete(record.id);

    if (form.id === record.id) {
      setForm(emptyForm);
    }
  };

  return (
    <section className="screen">
      <div className="section-header">
        <div>
          <h2>使用記録</h2>
          <p>使用日と圃場を軸に、農薬の使用履歴を記録します。</p>
        </div>
      </div>

      <div className="two-column-layout">
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-heading">
            <h3>{form.id ? "使用記録を編集" : "使用記録を追加"}</h3>
            <p>対象病害虫はカンマ区切りで複数入力できます。</p>
          </div>

          <div className="form-grid">
            <label className="field">
              <span className="field-label">使用日</span>
              <input
                className="input"
                type="date"
                value={form.date}
                onChange={(event) =>
                  setForm((current) => ({ ...current, date: event.target.value }))
                }
                required
              />
            </label>
            <label className="field">
              <span className="field-label">使用後収穫月日</span>
              <input
                className="input"
                type="date"
                value={form.harvestDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    harvestDate: event.target.value,
                  }))
                }
              />
            </label>
            <label className="field">
              <span className="field-label">圃場名</span>
              <input
                className="input"
                value={form.fieldName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fieldName: event.target.value,
                  }))
                }
                placeholder="未入力なら補地番号から自動設定"
              />
            </label>
            <label className="field">
              <span className="field-label">作物名</span>
              <input
                className="input"
                value={form.cropName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    cropName: event.target.value,
                  }))
                }
                placeholder="例: トマト"
              />
            </label>
            <label className="field field-full">
              <span className="field-label">散布補地番号</span>
              <input
                className="input"
                value={form.plotNumbers}
                onChange={(event) => handlePlotNumbersChange(event.target.value)}
                placeholder="例: 1,2,3 または 1-6"
              />
            </label>
            {plotSettings.length > 0 ? (
              <div className="plot-button-grid field-full">
                {plotSettings.map((plot) => {
                  const selected = parsePlotNumbers(form.plotNumbers).includes(
                    plot.plotNumber,
                  );

                  return (
                    <button
                      key={plot.plotNumber}
                      className={`plot-number-button ${
                        selected ? "plot-number-button-active" : ""
                      }`}
                      type="button"
                      onClick={() => handleTogglePlotNumber(plot.plotNumber)}
                    >
                      {plot.plotNumber}
                    </button>
                  );
                })}
              </div>
            ) : null}
            <PesticideSelector
              pesticides={pesticides}
              selectedId={form.pesticideId}
              onChange={handleSelectedPesticide}
              label="農薬選択"
              emptyLabel="手入力のみの場合は未選択"
            />
            <label className="field">
              <span className="field-label">農薬コード</span>
              <input
                className="input"
                value={form.pesticideCode}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    pesticideCode: event.target.value,
                  }))
                }
                placeholder="例: 2200"
              />
            </label>
            <label className="field field-full">
              <span className="field-label">農薬名</span>
              <input
                className="input"
                value={form.pesticideName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    pesticideName: event.target.value,
                  }))
                }
                placeholder="例: ダコニール1000"
                required
              />
            </label>
            <label className="field">
              <span className="field-label">希釈倍数</span>
              <input
                className="input"
                inputMode="decimal"
                value={form.dilution}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    dilution: event.target.value,
                  }))
                }
                placeholder="例: 1000"
              />
            </label>
            <label className="field">
              <span className="field-label">散布液量</span>
              <input
                className="input"
                inputMode="decimal"
                value={form.liquidAmount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    liquidAmount: event.target.value,
                  }))
                }
                placeholder="例: 50"
              />
            </label>
            <label className="field">
              <span className="field-label">散布液量単位</span>
              <select
                className="input"
                value={form.liquidUnit}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    liquidUnit: event.target.value as LiquidUnit,
                  }))
                }
              >
                <option value="L">L</option>
                <option value="mL">mL</option>
              </select>
            </label>
            <label className="field">
              <span className="field-label">使用薬剤量</span>
              <input
                className="input"
                inputMode="decimal"
                value={form.chemicalAmount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    chemicalAmount: event.target.value,
                  }))
                }
                placeholder="例: 100"
              />
            </label>
            <label className="field">
              <span className="field-label">使用薬量単位</span>
              <select
                className="input"
                value={form.chemicalUnit}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    chemicalUnit: event.target.value as UsageUnit,
                  }))
                }
              >
                <option value="mL">mL</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
              </select>
            </label>
            <label className="field">
              <span className="field-label">散布面積 a</span>
              <input
                className="input"
                inputMode="decimal"
                value={form.areaA}
                onChange={(event) => handleAreaChange(event.target.value)}
                placeholder="例: 8"
              />
            </label>
            <label className="field field-full">
              <span className="field-label">対象病害虫</span>
              <input
                className="input"
                value={form.targetPests}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    targetPests: event.target.value,
                  }))
                }
                placeholder="例: べと病, 灰色かび病"
              />
            </label>
            <label className="field field-full">
              <span className="field-label">メモ</span>
              <textarea
                className="input textarea"
                value={form.note}
                onChange={(event) =>
                  setForm((current) => ({ ...current, note: event.target.value }))
                }
                placeholder="作業メモ"
              />
            </label>
          </div>

          <div className="button-row">
            <button className="button" type="submit">
              {form.id ? "更新する" : "記録する"}
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => setForm(emptyForm)}
            >
              フォームをリセット
            </button>
          </div>
        </form>

        <div className="stack">
          <div className="card">
            <div className="card-heading">
              <h3>検索・絞り込み</h3>
            </div>
            <div className="form-grid">
              <label className="field">
                <span className="field-label">使用日</span>
                <input
                  className="input"
                  type="date"
                  value={filters.date}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, date: event.target.value }))
                  }
                />
              </label>
              <label className="field">
                <span className="field-label">圃場名</span>
                <input
                  className="input"
                  value={filters.fieldName}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      fieldName: event.target.value,
                    }))
                  }
                  placeholder="圃場名で検索"
                />
              </label>
              <label className="field">
                <span className="field-label">作物名</span>
                <input
                  className="input"
                  value={filters.cropName}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      cropName: event.target.value,
                    }))
                  }
                  placeholder="作物名で検索"
                />
              </label>
              <label className="field">
                <span className="field-label">農薬名</span>
                <input
                  className="input"
                  value={filters.pesticideName}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      pesticideName: event.target.value,
                    }))
                  }
                  placeholder="農薬名で検索"
                />
              </label>
            </div>
            <div className="button-row">
              <button
                className="button button-secondary"
                type="button"
                onClick={() => setFilters(emptyFilters)}
              >
                検索条件をリセット
              </button>
            </div>
          </div>

          <div className="records-grid">
            {filteredRecords.map((record) => {
              const harvestWarning = hasHarvestWarning(record);
              const intervalWarningMessages = getIntervalWarningMessages(record);
              const intervalWarning = intervalWarningMessages.length > 0;
              const pestUseCountWarning = hasPestUseCountWarning(record);

              return (
              <article key={record.id} className="card list-card">
                <div className="card-heading">
                  <h3 className={pestUseCountWarning ? "warning-text" : ""}>
                    {record.pesticideName}
                  </h3>
                  <p>
                    <span className={harvestWarning || intervalWarning ? "warning-text" : ""}>
                      {record.date}
                    </span>{" "}
                    / {record.fieldName}
                  </p>
                </div>
                <dl className="detail-list">
                  <div>
                    <dt>農薬コード</dt>
                    <dd>{record.pesticideCode || "-"}</dd>
                  </div>
                  <div>
                    <dt>使用後収穫月日</dt>
                    <dd className={harvestWarning ? "warning-text" : ""}>
                      {record.harvestDate || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt>散布補地番号</dt>
                    <dd>{joinItems(record.plotNumbers) || "-"}</dd>
                  </div>
                  <div>
                    <dt>作物名</dt>
                    <dd>{record.cropName || "-"}</dd>
                  </div>
                  <div>
                    <dt>希釈倍率</dt>
                    <dd>{formatDilution(record.dilution) || "-"}</dd>
                  </div>
                  <div>
                    <dt>散布液量</dt>
                    <dd>{formatLiquidAmount(record.liquidAmount, record.liquidUnit) || "-"}</dd>
                  </div>
                  <div>
                    <dt>使用薬剤量</dt>
                    <dd>
                      {formatChemicalAmount(record.chemicalAmount, record.chemicalUnit) ||
                        "-"}
                    </dd>
                  </div>
                  <div>
                    <dt>散布面積</dt>
                    <dd>
                      {record.areaA !== undefined ? `${formatNumber(record.areaA)} a` : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt>対象病害虫</dt>
                    <dd>{joinItems(record.targetPests) || "-"}</dd>
                  </div>
                  <div>
                    <dt>メモ</dt>
                    <dd>{record.note || "-"}</dd>
                  </div>
                  {intervalWarning ? (
                    <div>
                      <dt>使用間隔警告</dt>
                      <dd className="warning-text">
                        {intervalWarningMessages.join(" / ")}
                      </dd>
                    </div>
                  ) : null}
                </dl>
                <div className="button-row">
                  <button className="button" onClick={() => handleEdit(record)}>
                    編集
                  </button>
                  <button
                    className="button button-danger"
                    onClick={() => handleDelete(record)}
                  >
                    削除
                  </button>
                </div>
              </article>
              );
            })}
            {filteredRecords.length === 0 ? (
              <div className="card empty-card">該当する使用記録はありません。</div>
            ) : null}
          </div>

          <div className="card print-table-card">
            <div className="card-heading">
              <h3>提出用一覧</h3>
              <p>印刷時はこの一覧を作業日誌形式で出力します。</p>
            </div>
            <div className="button-row no-print">
              <button
                className="button button-secondary"
                type="button"
                onClick={() => window.print()}
              >
                印刷する
              </button>
            </div>
            <div className="jt-table-wrap">
              <table className="jt-table">
                <thead>
                  <tr>
                    <th>使用年月日</th>
                    <th>農薬コード</th>
                    <th>農薬名称</th>
                    <th>使用面積（a）</th>
                    <th>使用薬剤量</th>
                    <th>単位</th>
                    <th>希釈倍数</th>
                    <th>使用後収穫月日</th>
                    <th>散布補地番号</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => {
                    const harvestWarning = hasHarvestWarning(record);
                    const intervalWarning =
                      getIntervalWarningMessages(record).length > 0;
                    const pestUseCountWarning = hasPestUseCountWarning(record);

                    return (
                      <tr key={record.id}>
                        <td
                          className={
                            harvestWarning || intervalWarning ? "warning-text" : ""
                          }
                        >
                          {formatPrintDate(record.date)}
                        </td>
                        <td>{record.pesticideCode || ""}</td>
                        <td className={pestUseCountWarning ? "warning-text" : ""}>
                          {record.pesticideName}
                        </td>
                        <td>
                          {record.areaA !== undefined
                            ? formatNumber(record.areaA)
                            : ""}
                        </td>
                        <td>
                          {record.chemicalAmount !== undefined
                            ? formatNumber(record.chemicalAmount)
                            : ""}
                        </td>
                        <td>{record.chemicalUnit ?? ""}</td>
                        <td>
                          {record.dilution !== undefined
                            ? formatNumber(record.dilution)
                            : ""}
                        </td>
                        <td className={harvestWarning ? "warning-text" : ""}>
                          {formatPrintDate(record.harvestDate)}
                        </td>
                        <td>{record.plotNumbers?.join(",") ?? ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
