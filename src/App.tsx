import { useState } from "react";
import "./App.css";
import { Calculator } from "./components/Calculator";
import { Notice } from "./components/Notice";
import { PesticideManager } from "./components/PesticideManager";
import { PlotSettings } from "./components/PlotSettings";
import { UsageRecords } from "./components/UsageRecords";
import type { Pesticide, PesticideUsageRecord, PlotSetting, Screen } from "./types";
import {
  getPlotSettings,
  getRegisteredPesticides,
  getUsageRecords,
  savePlotSettings,
  saveRegisteredPesticides,
  saveUsageRecords,
} from "./utils/storage";

const navigationItems: Array<{ id: Screen; label: string }> = [
  { id: "calculator", label: "計算" },
  { id: "pesticides", label: "農薬" },
  { id: "records", label: "記録" },
  { id: "settings", label: "設定" },
];

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>("calculator");
  const [pesticides, setPesticides] = useState<Pesticide[]>(() =>
    getRegisteredPesticides(),
  );
  const [records, setRecords] = useState<PesticideUsageRecord[]>(() =>
    getUsageRecords(),
  );
  const [plotSettings, setPlotSettings] = useState<PlotSetting[]>(() =>
    getPlotSettings(),
  );

  const handleSavePesticide = (pesticide: Pesticide) => {
    setPesticides((current) => {
      const next = current.some((item) => item.id === pesticide.id)
        ? current.map((item) => (item.id === pesticide.id ? pesticide : item))
        : [pesticide, ...current];

      saveRegisteredPesticides(next);

      return next;
    });
  };

  const handleDeletePesticide = (pesticideId: string) => {
    setPesticides((current) => {
      const next = current.filter((item) => item.id !== pesticideId);
      saveRegisteredPesticides(next);
      return next;
    });
  };

  const handleSaveRecord = (record: PesticideUsageRecord) => {
    setRecords((current) => {
      const next = current.some((item) => item.id === record.id)
        ? current.map((item) => (item.id === record.id ? record : item))
        : [record, ...current];

      saveUsageRecords(next);

      return next;
    });
  };

  const handleDeleteRecord = (recordId: string) => {
    setRecords((current) => {
      const next = current.filter((item) => item.id !== recordId);
      saveUsageRecords(next);
      return next;
    });
  };

  const handleSavePlotSettings = (nextPlotSettings: PlotSetting[]) => {
    setPlotSettings(nextPlotSettings);
    savePlotSettings(nextPlotSettings);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <nav className="top-nav" aria-label="主要ナビゲーション">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`nav-button ${
                activeScreen === item.id ? "nav-button-active" : ""
              }`}
              type="button"
              onClick={() => setActiveScreen(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        <Notice />
        {activeScreen === "calculator" ? <Calculator pesticides={pesticides} /> : null}
        {activeScreen === "pesticides" ? (
          <PesticideManager
            pesticides={pesticides}
            onSave={handleSavePesticide}
            onDelete={handleDeletePesticide}
          />
        ) : null}
        {activeScreen === "records" ? (
          <UsageRecords
            pesticides={pesticides}
            records={records}
            plotSettings={plotSettings}
            onSave={handleSaveRecord}
            onDelete={handleDeleteRecord}
          />
        ) : null}
        {activeScreen === "settings" ? (
          <PlotSettings
            plotSettings={plotSettings}
            onSave={handleSavePlotSettings}
          />
        ) : null}
      </main>
    </div>
  );
}
