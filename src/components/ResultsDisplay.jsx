import React, { useState, Suspense, lazy } from "react";
import { computeTableData, formatCurrency, PROGRAM_DESCRIPTIONS } from "../utils";

const Heatmap = lazy(() => import("./Heatmap"));

const TABS = [
  { key: "summary", label: "Summary", heatmapKey: "Net Income" },
  { key: "benefits", label: "Benefits Breakdown", heatmapKey: "Benefits" },
  {
    key: "credits",
    label: "Refundable Credits",
    heatmapKey: "Refundable Tax Credits",
  },
  {
    key: "taxes",
    label: "Taxes Before Refundable Credits",
    heatmapKey: "Tax Before Refundable Credits",
  },
];

function DataTable({ rows }) {
  if (rows.length === 0) {
    return <p className="loading">No data to display.</p>;
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Program</th>
            <th>Not Married</th>
            <th>Married</th>
            <th>Delta</th>
            <th>Delta %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td>
                {PROGRAM_DESCRIPTIONS[row.program] ? (
                  <span className="program-name-tip">
                    {row.program}
                    <span className="tooltip">{PROGRAM_DESCRIPTIONS[row.program]}</span>
                  </span>
                ) : (
                  row.program
                )}
              </td>
              <td>{row.notMarried}</td>
              <td>{row.married}</td>
              <td
                className={
                  row.rawDelta > 0
                    ? "positive"
                    : row.rawDelta < 0
                      ? "negative"
                      : ""
                }
              >
                {row.delta}
              </td>
              <td
                className={
                  row.rawDelta > 0
                    ? "positive"
                    : row.rawDelta < 0
                      ? "negative"
                      : ""
                }
              >
                {row.deltaPct}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HeadlineBanner({ results }) {
  const [copied, setCopied] = useState(false);
  const { married, headSingle, spouseSingle } = results;
  const marriedNet = married.aggregates.householdNetIncome;
  const separateNet =
    headSingle.aggregates.householdNetIncome +
    spouseSingle.aggregates.householdNetIncome;
  const delta = marriedNet - separateNet;

  const isBonus = delta > 0;
  const isPenalty = delta < 0;
  const label = isBonus ? "Marriage bonus" : isPenalty ? "Marriage penalty" : "No marriage incentive effect";

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className={`headline-banner ${isBonus ? "bonus" : isPenalty ? "penalty" : ""}`}>
      <div className="headline-text">
        <span className="headline-label">{label}</span>
        {delta !== 0 && (
          <span className="headline-amount">{formatCurrency(Math.abs(delta))}/yr</span>
        )}
      </div>
      <button className="share-btn" onClick={handleShare} title="Copy link to clipboard">
        {copied ? "Copied!" : "Share"}
      </button>
    </div>
  );
}

export default function ResultsDisplay({
  results,
  heatmapData,
  heatmapLoading,
  headIncome,
  spouseIncome,
}) {
  const [activeTab, setActiveTab] = useState("summary");

  const currentTab = TABS.find((t) => t.key === activeTab);
  const rows = computeTableData(results, activeTab);
  const heatmapGrid = heatmapData?.[currentTab.heatmapKey] || null;

  return (
    <div className="results">
      <HeadlineBanner results={results} />
      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        <h3 style={{ marginBottom: "1rem" }}>Current situation:</h3>
        <DataTable rows={rows} />

        {heatmapLoading ? (
          <p className="loading">
            <span className="spinner" />
            Loading heatmap...
          </p>
        ) : heatmapGrid ? (
          <Suspense
            fallback={
              <p className="loading">
                <span className="spinner" />
                Loading chart...
              </p>
            }
          >
            <Heatmap
              grid={heatmapGrid}
              headIncome={headIncome}
              spouseIncome={spouseIncome}
            />
          </Suspense>
        ) : null}
      </div>
    </div>
  );
}
