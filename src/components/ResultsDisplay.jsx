import React, { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { computeTableData, formatCurrency, PROGRAM_DESCRIPTIONS } from "../utils";
import { buildCellResults } from "../api";

const Heatmap = lazy(() => import("./Heatmap"));

const TABS = [
  { key: "summary", label: "Summary", heatmapKey: "Net Income" },
  { key: "taxes", label: "Taxes", heatmapKey: "Tax Before Refundable Credits" },
  { key: "benefits", label: "Benefits", heatmapKey: "Benefits" },
  { key: "healthcare", label: "Healthcare", heatmapKey: "Healthcare Benefits" },
  { key: "credits", label: "Federal Credits", heatmapKey: "Federal Credits" },
  { key: "state", label: "State Credits", heatmapKey: "State Credits" },
];

function DataTable({ rows }) {
  if (rows.length === 0) {
    return <p className="loading">No data to display.</p>;
  }

  const showIndividual = rows.some((r) => r.headSingle !== null);

  const scenarioCols = [
    ...(showIndividual ? [
      { label: "You (Single)", key: "headSingle" },
      { label: "Partner (Single)", key: "spouseSingle" },
    ] : []),
    { label: "Not Married", key: "notMarried" },
    { label: "Married", key: "married" },
    { label: "Delta", key: "delta", colored: true },
    { label: "Delta %", key: "deltaPct", colored: true },
  ];

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th></th>
            {scenarioCols.map((col) => (
              <th key={col.label}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="row-label">
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
              {scenarioCols.map((col) => (
                <td
                  key={col.label}
                  className={
                    col.colored
                      ? row.rawDelta > 0
                        ? "positive"
                        : row.rawDelta < 0
                          ? "negative"
                          : ""
                      : ""
                  }
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HeadlineBanner({ results, showHealth }) {
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
      : "No marriage incentive or penalty";

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
  onCellClick: onCellClickProp,
}) {
  const [activeTab, setActiveTab] = useState("summary");
  const [showHealth, setShowHealth] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [cellSelection, setCellSelection] = useState(null);

  useEffect(() => {
    if (!fullscreen) return;
    function handleEsc(e) {
      if (e.key === "Escape") setFullscreen(false);
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [fullscreen]);

  // Build virtual results from clicked heatmap cell
  const cellResults = useMemo(() => {
    if (!cellSelection || !heatmapData?.programData) return null;
    return buildCellResults(
      heatmapData.programData,
      cellSelection.headIdx,
      cellSelection.spouseIdx,
      heatmapData.count || 33,
      heatmapData.stateCreditEntries,
    );
  }, [cellSelection, heatmapData]);

  const activeResults = cellResults || results;

  const effectiveTab = (!showHealth && activeTab === "healthcare") ? "summary" : activeTab;
  const currentTab = TABS.find((t) => t.key === effectiveTab);
  const rows = computeTableData(activeResults, effectiveTab, { showHealth });

  let heatmapKey = currentTab.heatmapKey;
  if (showHealth && activeTab === "summary") {
    heatmapKey = "Net Income (with Healthcare)";
  }
  const heatmapGrid = heatmapData?.grids?.[heatmapKey] || null;

  const HEATMAP_AGG = {
    "Net Income": "householdNetIncome",
    "Net Income (with Healthcare)": "householdNetIncomeWithHealth",
    "Benefits": "householdBenefits",
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

  function handleCellClick(headIdx, spouseIdx) {
    setCellSelection({ headIdx, spouseIdx });
    if (onCellClickProp && heatmapData) {
      const step = heatmapData.maxIncome / (heatmapData.count - 1);
      onCellClickProp(Math.round(headIdx * step), Math.round(spouseIdx * step));
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
        onCellClick={heatmapData?.programData ? handleCellClick : undefined}
        selectedCell={cellSelection}
        label={heatmapKey}
      />
    </Suspense>
  ) : null;

  return (
    <div className="results">
      <HeadlineBanner
        results={activeResults}
        showHealth={showHealth}
      />
      <div className="tab-bar">
        {TABS.filter((tab) => tab.key !== "healthcare" || showHealth).map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${effectiveTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content-split">
        <div className="split-table">
          <DataTable rows={rows} />
          <label className="health-toggle" title="Include the estimated cash value of healthcare coverage (Medicaid, CHIP, ACA subsidies). These are not cash benefits but represent the value of coverage you would otherwise need to purchase.">
            <input
              type="checkbox"
              checked={showHealth}
              onChange={(e) => setShowHealth(e.target.checked)}
            />
            Include healthcare
          </label>
        </div>

        {heatmapContent && (
          <div className="split-heatmap">
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
                onCellClick={heatmapData?.programData ? handleCellClick : undefined}
                selectedCell={cellSelection}
                label={heatmapKey}
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
