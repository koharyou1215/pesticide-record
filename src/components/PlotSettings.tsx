import { useEffect, useState } from "react";
import type { PlotSetting } from "../types";

type PlotSettingsProps = {
  plotSettings: PlotSetting[];
  onSave: (plotSettings: PlotSetting[]) => void;
};

type PlotSettingFormRow = {
  plotNumber: string;
  areaA: string;
};

const toFormRows = (plotSettings: PlotSetting[]): PlotSettingFormRow[] =>
  plotSettings.length > 0
    ? plotSettings.map((plot) => ({
        plotNumber: plot.plotNumber,
        areaA: String(plot.areaA),
      }))
    : [{ plotNumber: "1", areaA: "" }];

const toNumber = (value: string): number | null => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export function PlotSettings({ plotSettings, onSave }: PlotSettingsProps) {
  const [rows, setRows] = useState<PlotSettingFormRow[]>(() =>
    toFormRows(plotSettings),
  );
  const [plotCount, setPlotCount] = useState(
    plotSettings.length > 0 ? String(plotSettings.length) : "6",
  );

  useEffect(() => {
    setRows(toFormRows(plotSettings));
    setPlotCount(plotSettings.length > 0 ? String(plotSettings.length) : "6");
  }, [plotSettings]);

  const handleBuildRows = () => {
    const count = Math.max(1, Math.floor(Number(plotCount) || 1));

    setRows((current) =>
      Array.from({ length: count }, (_, index) => {
        const plotNumber = String(index + 1);
        const existing = current.find((row) => row.plotNumber === plotNumber);

        return existing ?? { plotNumber, areaA: "" };
      }),
    );
  };

  const handleUpdateRow = (
    rowIndex: number,
    key: keyof PlotSettingFormRow,
    value: string,
  ) => {
    setRows((current) =>
      current.map((row, index) =>
        index === rowIndex ? { ...row, [key]: value } : row,
      ),
    );
  };

  const handleAddRow = () => {
    setRows((current) => [
      ...current,
      { plotNumber: String(current.length + 1), areaA: "" },
    ]);
  };

  const handleDeleteRow = (rowIndex: number) => {
    setRows((current) => current.filter((_, index) => index !== rowIndex));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedRows = rows
      .map((row) => ({
        plotNumber: row.plotNumber.trim(),
        areaA: toNumber(row.areaA),
      }))
      .filter(
        (row): row is PlotSetting =>
          row.plotNumber.length > 0 && row.areaA !== null,
      )
      .sort((left, right) =>
        left.plotNumber.localeCompare(right.plotNumber, "ja", {
          numeric: true,
        }),
      );

    onSave(normalizedRows);
  };

  return (
    <section className="screen">
      <div className="section-header">
        <div>
          <h2>設定</h2>
          <p>作付けしている補地番号と面積を登録します。</p>
        </div>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <div className="card-heading">
          <h3>補地番号・面積</h3>
          <p>記録画面で補地番号を入れると、面積が自動で合算されます。</p>
        </div>

        <div className="plot-count-row">
          <label className="field">
            <span className="field-label">筆数</span>
            <input
              className="input"
              inputMode="numeric"
              value={plotCount}
              onChange={(event) => setPlotCount(event.target.value)}
              placeholder="例: 6"
            />
          </label>
          <button
            className="button button-secondary"
            type="button"
            onClick={handleBuildRows}
          >
            番号を作成
          </button>
        </div>

        <div className="plot-settings-grid">
          {rows.map((row, index) => (
            <div className="plot-setting-row" key={`${row.plotNumber}-${index}`}>
              <label className="field">
                <span className="field-label">補地番号</span>
                <input
                  className="input"
                  value={row.plotNumber}
                  onChange={(event) =>
                    handleUpdateRow(index, "plotNumber", event.target.value)
                  }
                  placeholder="例: 1"
                />
              </label>
              <label className="field">
                <span className="field-label">面積 a</span>
                <input
                  className="input"
                  inputMode="decimal"
                  value={row.areaA}
                  onChange={(event) =>
                    handleUpdateRow(index, "areaA", event.target.value)
                  }
                  placeholder="例: 118.9"
                />
              </label>
              <button
                className="button button-danger compact-button"
                type="button"
                onClick={() => handleDeleteRow(index)}
              >
                削除
              </button>
            </div>
          ))}
        </div>

        <div className="button-row">
          <button className="button button-secondary" type="button" onClick={handleAddRow}>
            行を追加
          </button>
          <button className="button" type="submit">
            設定を保存
          </button>
        </div>
      </form>
    </section>
  );
}
