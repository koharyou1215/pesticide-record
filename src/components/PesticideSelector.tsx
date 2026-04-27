import { PESTICIDE_GROUPS, type Pesticide } from "../types";

type PesticideSelectorProps = {
  pesticides: Pesticide[];
  selectedId: string;
  onChange: (pesticideId: string) => void;
  label?: string;
  includeEmptyOption?: boolean;
  emptyLabel?: string;
};

const isPesticideInGroup = (pesticide: Pesticide, group: string): boolean =>
  pesticide.group === group ||
  (group === "成長抑制剤" && pesticide.group === "植物成長調整剤");

export function PesticideSelector({
  pesticides,
  selectedId,
  onChange,
  label = "農薬を選択",
  includeEmptyOption = true,
  emptyLabel = "選択してください",
}: PesticideSelectorProps) {
  const sortedPesticides = [...pesticides].sort((left, right) =>
    left.name.localeCompare(right.name, "ja"),
  );
  const groupedPesticides = PESTICIDE_GROUPS.map((group) => ({
    group,
    pesticides: sortedPesticides.filter((pesticide) =>
      isPesticideInGroup(pesticide, group),
    ),
  })).filter((grouped) => grouped.pesticides.length > 0);
  const ungroupedPesticides = sortedPesticides.filter(
    (pesticide) =>
      !PESTICIDE_GROUPS.some((group) => isPesticideInGroup(pesticide, group)),
  );

  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <select
        className="input"
        value={selectedId}
        onChange={(event) => onChange(event.target.value)}
      >
        {includeEmptyOption ? <option value="">{emptyLabel}</option> : null}
        {groupedPesticides.map((grouped) => (
          <optgroup key={grouped.group} label={grouped.group}>
            {grouped.pesticides.map((pesticide) => (
              <option key={pesticide.id} value={pesticide.id}>
                {pesticide.name}
              </option>
            ))}
          </optgroup>
        ))}
        {ungroupedPesticides.length > 0 ? (
          <optgroup label="その他">
            {ungroupedPesticides.map((pesticide) => (
              <option key={pesticide.id} value={pesticide.id}>
                {pesticide.name}
              </option>
            ))}
          </optgroup>
        ) : null}
      </select>
    </label>
  );
}
