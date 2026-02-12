import React, { useState, useEffect, Suspense, lazy } from "react";
import { computeTableData, formatCurrency, PROGRAM_DESCRIPTIONS } from "../utils";

const Heatmap = lazy(() => import("./Heatmap"));

const TABS = [
  { key: "summary", label: "Summary", heatmapKey: "Net Income" },
  { key: "benefits", label: "Benefits", heatmapKey: "Benefits" },
  { key: "healthcare", label: "Healthcare", heatmapKey: "Net Income" },
  { key: "credits", label: "Credits", heatmapKey: "Refundable Tax Credits" },
  {
    key: "taxes",
    label: "Taxes",
    heatmapKey: "Tax Before Refundable Credits",
  },
  { key: "state", label: "State", heatmapKey: "Net Income" },
];

function DataTable({ rows }) {
  if (rows.length === 0) {
    return <p className="loading">No data to display.</p>;
  }

  const showIndividual = rows.some((r) => r.headSingle !== null);

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Program</th>
            {showIndividual && <th>Head (Single)</th>}
            {showIndividual && <th>Spouse (Single)</th>}
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
                    <span className="tooltip">
                      {PROGRAM_DESCRIPTIONS[row.program]}
                    </span>
                  </span>
                ) : (
                  row.program
                )}
              </td>
              {showIndividual && <td>{row.headSingle}</td>}
              {showIndividual && <td>{row.spouseSingle}</td>}
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

function HeadlineBanner({ results, showHealth, onToggleHealth }) {
  const [copied, setCopied] = useState(false);
  const { married, headSingle, spouseSingle } = results;

  const aggKey = showHealth ? "householdNetIncomeWithHealth" : "householdNetIncome";
  const marriedNet = married.aggregates[aggKey];
  const separateNet = headSingle.aggregates[aggKey] + spouseSingle.aggregates[aggKey];
  const delta = marriedNet - separateNet;

  const isBonus = delta > 0;
  const isPenalty = delta < 0;
  const label = isBonus
    ? "Marriage bonus"
    : isPenalty
      ? "Marriage penalty"
      : "No marriage incentive effect";

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className={`headline-banner ${isBonus ? "bonus" : isPenalty ? "penalty" : ""}`}
    >
      <div className="headline-text">
        <span className="headline-label">{label}</span>
        {delta !== 0 && (
          <span className="headline-amount">
            {formatCurrency(Math.abs(delta))}/yr
          </span>
        )}
      </div>
      <div className="headline-actions">
        <label className="health-toggle" title="Include the estimated cash value of healthcare coverage (Medicaid, CHIP, ACA subsidies). These are not cash benefits but represent the value of coverage you would otherwise need to purchase.">
          <input
            type="checkbox"
            checked={showHealth}
            onChange={(e) => onToggleHealth(e.target.checked)}
          />
          Include healthcare
        </label>
        <button
          className="share-btn"
          onClick={handleShare}
          title="Copy link to clipboard"
        >
          {copied ? "Copied!" : "Share"}
        </button>
      </div>
    </div>
  );
}

export default function ResultsDisplay({
  results,
  heatmapData,
  heatmapLoading,
  headIncome,
  spouseIncome,
  valentine,
}) {
  const [activeTab, setActiveTab] = useState("summary");
  const [showHealth, setShowHealth] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!fullscreen) return;
    function handleEsc(e) {
      if (e.key === "Escape") setFullscreen(false);
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [fullscreen]);

  const currentTab = TABS.find((t) => t.key === activeTab);
  const rows = computeTableData(results, activeTab);

  // When healthcare toggle is on, use health-inclusive heatmap for summary/healthcare tabs
  let heatmapKey = currentTab.heatmapKey;
  if (showHealth && (activeTab === "summary" || activeTab === "healthcare")) {
    heatmapKey = "Net Income (with Healthcare)";
  }
  const heatmapGrid = heatmapData?.grids?.[heatmapKey] || null;

  // Compute exact delta for the "You" marker (grid snapping can be inaccurate)
  const HEATMAP_AGG = {
    "Net Income": "householdNetIncome",
    "Net Income (with Healthcare)": "householdNetIncomeWithHealth",
    "Benefits": "householdBenefits",
    "Refundable Tax Credits": "householdRefundableCredits",
    "Tax Before Refundable Credits": "householdTaxBeforeCredits",
  };
  const aggKey = HEATMAP_AGG[heatmapKey];
  let markerDelta = null;
  if (aggKey) {
    const m = results.married.aggregates[aggKey] || 0;
    const h = results.headSingle.aggregates[aggKey] || 0;
    const s = results.spouseSingle.aggregates[aggKey] || 0;
    markerDelta = m - (h + s);
    if (heatmapKey === "Tax Before Refundable Credits") {
      markerDelta = -markerDelta;
    }
  }

  const heatmapContent = heatmapLoading ? (
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
        valentine={valentine}
        maxIncome={heatmapData?.maxIncome || 80000}
        count={heatmapData?.count || 33}
        markerDelta={markerDelta}
        fullscreen={fullscreen}
      />
    </Suspense>
  ) : null;

  return (
    <div className="results">
      <HeadlineBanner
        results={results}
        showHealth={showHealth}
        onToggleHealth={setShowHealth}
      />
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

        {heatmapContent && (
          <div className="heatmap-wrapper">
            <button
              className="fullscreen-btn"
              onClick={() => setFullscreen(true)}
              title="View heatmap fullscreen"
            >
              Expand
            </button>
            {heatmapContent}
          </div>
        )}
      </div>

      {fullscreen && heatmapGrid && (
        <div className="fullscreen-overlay" onClick={() => setFullscreen(false)}>
          <div className="fullscreen-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="fullscreen-close"
              onClick={() => setFullscreen(false)}
            >
              Close
            </button>
            <Suspense fallback={null}>
              <Heatmap
                grid={heatmapGrid}
                headIncome={headIncome}
                spouseIncome={spouseIncome}
                valentine={valentine}
                maxIncome={heatmapData?.maxIncome || 80000}
                count={heatmapData?.count || 33}
                markerDelta={markerDelta}
                fullscreen
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
