import { useMemo, useState } from "react";
import { PESTICIDE_GROUPS, type Pesticide, type UsageUnit } from "../types";
import { formatChemicalAmount, formatDilution, formatNumber, joinItems } from "../utils/format";

type PesticideManagerProps = {
  pesticides: Pesticide[];
  onSave: (pesticide: Pesticide) => void;
  onDelete: (pesticideId: string) => void;
};

type PesticideFormState = {
  id: string | null;
  code: string;
  name: string;
  group: string;
  pests: string;
  dilution: string;
  usagePer10a: string;
  usageUnit: UsageUnit;
  liquidPer10a: string;
  preHarvestDays: string;
  note: string;
  isDefault: boolean;
};

const emptyForm: PesticideFormState = {
  id: null,
  code: "",
  name: "",
  group: "",
  pests: "",
  dilution: "",
  usagePer10a: "",
  usageUnit: "mL",
  liquidPer10a: "",
  preHarvestDays: "",
  note: "",
  isDefault: false,
};

const toFormState = (pesticide: Pesticide): PesticideFormState => ({
  id: pesticide.id,
  code: pesticide.code ?? "",
  name: pesticide.name,
  group: pesticide.group,
  pests: pesticide.pests.join(", "),
  dilution: pesticide.dilution !== undefined ? String(pesticide.dilution) : "",
  usagePer10a:
    pesticide.usagePer10a !== undefined ? String(pesticide.usagePer10a) : "",
  usageUnit: pesticide.usageUnit ?? "mL",
  liquidPer10a:
    pesticide.liquidPer10a !== undefined ? String(pesticide.liquidPer10a) : "",
  preHarvestDays:
    pesticide.preHarvestDays !== undefined ? String(pesticide.preHarvestDays) : "",
  note: pesticide.note ?? "",
  isDefault: pesticide.isDefault ?? false,
});

const toOptionalNumber = (value: string): number | undefined => {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizePests = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const buildId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `pesticide-${Date.now()}`;
};

export function PesticideManager({
  pesticides,
  onSave,
  onDelete,
}: PesticideManagerProps) {
  const [searchName, setSearchName] = useState("");
  const [pestFilter, setPestFilter] = useState("");
  const [form, setForm] = useState<PesticideFormState>(emptyForm);

  const pestOptions = useMemo(
    () =>
      Array.from(new Set(pesticides.flatMap((pesticide) => pesticide.pests))).sort(
        (left, right) => left.localeCompare(right, "ja"),
      ),
    [pesticides],
  );

  const filteredPesticides = useMemo(() => {
    const normalizedName = searchName.trim().toLowerCase();
    const normalizedPest = pestFilter.trim().toLowerCase();

    return pesticides.filter((pesticide) => {
      const matchesName =
        normalizedName.length === 0 ||
        pesticide.name.toLowerCase().includes(normalizedName);
      const matchesPest =
        normalizedPest.length === 0 ||
        pesticide.pests.some((pest) => pest.toLowerCase().includes(normalizedPest));

      return matchesName && matchesPest;
    });
  }, [pesticides, pestFilter, searchName]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    const group = form.group.trim();
    const pests = normalizePests(form.pests);

    if (!name || !group || pests.length === 0) {
      return;
    }

    onSave({
      id: form.id ?? buildId(),
      code: form.code.trim() || undefined,
      name,
      group,
      pests,
      dilution: toOptionalNumber(form.dilution),
      usagePer10a: toOptionalNumber(form.usagePer10a),
      usageUnit: form.usageUnit,
      liquidPer10a: toOptionalNumber(form.liquidPer10a),
      preHarvestDays: toOptionalNumber(form.preHarvestDays),
      note: form.note.trim() || undefined,
      isDefault: form.isDefault,
    });

    setForm(emptyForm);
  };

  const handleEdit = (pesticide: Pesticide) => {
    setForm(toFormState(pesticide));
  };

  const handleDelete = (pesticide: Pesticide) => {
    if (!window.confirm(`「${pesticide.name}」を削除しますか？`)) {
      return;
    }

    onDelete(pesticide.id);

    if (form.id === pesticide.id) {
      setForm(emptyForm);
    }
  };

  return (
    <section className="screen">
      <div className="section-header">
        <div>
          <h2>農薬一覧</h2>
          <p>登録済みの農薬を管理し、検索や基準値の確認ができます。</p>
        </div>
      </div>

      <div className="two-column-layout">
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-heading">
            <h3>{form.id ? "農薬を編集" : "農薬を新規登録"}</h3>
            <p>対象病害虫はカンマ区切りで複数入力します。</p>
          </div>
          <div className="form-grid">
            <label className="field">
              <span className="field-label">農薬コード</span>
              <input
                className="input"
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value }))
                }
                placeholder="例: 2200"
              />
            </label>
            <label className="field">
              <span className="field-label">農薬名</span>
              <input
                className="input"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="例: ダコニール1000"
                required
              />
            </label>
            <label className="field">
              <span className="field-label">グループ</span>
              <select
                className="input"
                value={form.group}
                onChange={(event) =>
                  setForm((current) => ({ ...current, group: event.target.value }))
                }
                required
              >
                <option value="">選択してください</option>
                {PESTICIDE_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </label>
            <label className="field field-full">
              <span className="field-label">対象病害虫</span>
              <input
                className="input"
                value={form.pests}
                onChange={(event) =>
                  setForm((current) => ({ ...current, pests: event.target.value }))
                }
                placeholder="例: べと病, 炭そ病"
                required
              />
            </label>
            <label className="field">
              <span className="field-label">希釈倍率</span>
              <input
                className="input"
                inputMode="decimal"
                value={form.dilution}
                onChange={(event) =>
                  setForm((current) => ({ ...current, dilution: event.target.value }))
                }
                placeholder="例: 1000"
              />
            </label>
            <label className="field">
              <span className="field-label">10aあたり使用量</span>
              <input
                className="input"
                inputMode="decimal"
                value={form.usagePer10a}
                onChange={(event) =>
                  setForm((current) => ({ ...current, usagePer10a: event.target.value }))
                }
                placeholder="例: 100"
              />
            </label>
            <label className="field">
              <span className="field-label">使用量単位</span>
              <select
                className="input"
                value={form.usageUnit}
                onChange={(event) =>
                  setForm((current) => ({
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
            <label className="field">
              <span className="field-label">10aあたり散布液量 L</span>
              <input
                className="input"
                inputMode="decimal"
                value={form.liquidPer10a}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    liquidPer10a: event.target.value,
                  }))
                }
                placeholder="例: 200"
              />
            </label>
            <label className="field">
              <span className="field-label">収穫前日数</span>
              <input
                className="input"
                inputMode="decimal"
                value={form.preHarvestDays}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    preHarvestDays: event.target.value,
                  }))
                }
                placeholder="例: 10"
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
                placeholder="補足があれば入力"
              />
            </label>
          </div>
          <div className="button-row">
            <button className="button" type="submit">
              {form.id ? "更新する" : "登録する"}
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
            <div className="form-grid compact-grid">
              <label className="field">
                <span className="field-label">農薬名検索</span>
                <input
                  className="input"
                  value={searchName}
                  onChange={(event) => setSearchName(event.target.value)}
                  placeholder="農薬名で検索"
                />
              </label>
              <label className="field">
                <span className="field-label">病害虫で絞り込み</span>
                <select
                  className="input"
                  value={pestFilter}
                  onChange={(event) => setPestFilter(event.target.value)}
                >
                  <option value="">すべて表示</option>
                  {pestOptions.map((pest) => (
                    <option key={pest} value={pest}>
                      {pest}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="button-row">
              <button
                className="button button-secondary"
                type="button"
                onClick={() => {
                  setSearchName("");
                  setPestFilter("");
                }}
              >
                検索条件をリセット
              </button>
            </div>
          </div>

          <div className="records-grid">
            {filteredPesticides.map((pesticide) => (
              <article key={pesticide.id} className="card list-card">
                <div className="card-heading">
                  <h3>{pesticide.name}</h3>
                  <p>{pesticide.group}</p>
                </div>
                <dl className="detail-list">
                  <div>
                    <dt>農薬コード</dt>
                    <dd>{pesticide.code || "-"}</dd>
                  </div>
                  <div>
                    <dt>対象病害虫</dt>
                    <dd>{joinItems(pesticide.pests)}</dd>
                  </div>
                  <div>
                    <dt>希釈倍率</dt>
                    <dd>{formatDilution(pesticide.dilution) || "-"}</dd>
                  </div>
                  <div>
                    <dt>10aあたり使用量</dt>
                    <dd>
                      {formatChemicalAmount(
                        pesticide.usagePer10a,
                        pesticide.usageUnit,
                      ) || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt>10aあたり散布液量</dt>
                    <dd>
                      {pesticide.liquidPer10a !== undefined
                        ? `${formatNumber(pesticide.liquidPer10a)} L`
                        : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt>収穫前日数</dt>
                    <dd>
                      {pesticide.preHarvestDays !== undefined
                        ? `${formatNumber(pesticide.preHarvestDays)}日前まで`
                        : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt>メモ</dt>
                    <dd>{pesticide.note || "-"}</dd>
                  </div>
                </dl>
                <div className="button-row">
                  <button className="button" onClick={() => handleEdit(pesticide)}>
                    編集
                  </button>
                  <button
                    className="button button-danger"
                    onClick={() => handleDelete(pesticide)}
                  >
                    削除
                  </button>
                </div>
              </article>
            ))}
            {filteredPesticides.length === 0 ? (
              <div className="card empty-card">該当する農薬はありません。</div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
