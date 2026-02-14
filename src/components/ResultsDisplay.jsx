import React, { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { computeTableData, formatCurrency, PROGRAM_DESCRIPTIONS } from "../utils";
import { buildCellResults } from "../api";

const Heatmap = lazy(() => import("./Heatmap"));

const TABS = [
  { key: "summary", label: "Summary", heatmapKey: "Net Income" },
  { key: "taxes", label: "Taxes", heatmapKey: "Tax Before Refundable Credits" },
  { key: "benefits", label: "Benefits", heatmapKey: "Benefits" },
  { key: "credits", label: "Federal Credits", heatmapKey: "Federal Credits" },
  { key: "state", label: "State Credits", heatmapKey: "State Credits" },
];

function DataTable({ rows, emptyMessage }) {
  if (rows.length === 0) {
    return <p className="loading">{emptyMessage || "No data to display."}</p>;
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

const TAB_HEADLINE = {
  summary: {
    agg: (r, health) => r.aggregates[health ? "householdNetIncomeWithHealth" : "householdNetIncome"],
    desc: (m, s) => `Net income: married (${formatCurrency(m)}) vs. not married (${formatCurrency(s)})`,
    invertSign: false,
  },
  taxes: {
    agg: (r) => r.aggregates.householdTaxBeforeCredits,
    desc: (m, s) => `Total taxes: married (${formatCurrency(m)}) vs. not married (${formatCurrency(s)})`,
    invertSign: true,
  },
  benefits: {
    agg: (r, health) => r.aggregates.householdBenefits + (health ? r.aggregates.healthcareBenefitValue : 0),
    desc: (m, s) => `Benefits: married (${formatCurrency(m)}) vs. not married (${formatCurrency(s)})`,
    invertSign: false,
  },
  credits: {
    agg: (r) => r.aggregates.householdRefundableCredits - r.aggregates.householdRefundableStateCredits,
    desc: (m, s) => `Federal credits: married (${formatCurrency(m)}) vs. not married (${formatCurrency(s)})`,
    invertSign: false,
  },
  state: {
    agg: (r) => r.aggregates.householdRefundableStateCredits,
    desc: (m, s) => `State credits: married (${formatCurrency(m)}) vs. not married (${formatCurrency(s)})`,
    invertSign: false,
  },
};

function HeadlineBanner({ results, showHealth, activeTab }) {
  const [copied, setCopied] = useState(false);
  const { married, headSingle, spouseSingle } = results;

  const tabInfo = TAB_HEADLINE[activeTab] || TAB_HEADLINE.summary;
  const marriedVal = tabInfo.agg(married, showHealth);
  const separateVal = tabInfo.agg(headSingle, showHealth) + tabInfo.agg(spouseSingle, showHealth);
  let delta = marriedVal - separateVal;
  if (tabInfo.invertSign) delta = -delta;

  const isBonus = delta > 0;
  const isPenalty = delta < 0;
  const label = isBonus
    ? "Marriage bonus"
    : isPenalty
      ? "Marriage penalty"
      : "No marriage incentive or penalty";

  function handleShare() {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={`headline-banner ${isBonus ? "bonus" : isPenalty ? "penalty" : ""}`}
    >
      <div className="headline-text">
        <span className="headline-label">{label}</span>
        {delta !== 0 && (
          <span className="headline-amount">
            {formatCurrency(delta, true)}/yr
          </span>
        )}
        <span className="headline-desc">{tabInfo.desc(marriedVal, separateVal)}</span>
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
  esiStatus,
}) {
  const showHealth = !esiStatus?.head && !esiStatus?.spouse;
  const [activeTab, setActiveTab] = useState("summary");
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

  const currentTab = TABS.find((t) => t.key === activeTab);
  const rows = computeTableData(activeResults, activeTab, { showHealth });

  const EMPTY_MESSAGES = {
    summary: "No data available for this scenario.",
    taxes: "No tax liability at these income levels.",
    benefits: "Not eligible for benefit programs at these income levels.",
    credits: "No federal refundable credits at these income levels.",
    state: "No state credits available for this state or income level.",
  };

  let heatmapKey = currentTab.heatmapKey;
  if (showHealth && activeTab === "summary") {
    heatmapKey = "Net Income (with Healthcare)";
  }

  // For benefits tab with healthcare, combine grids element-wise
  let heatmapGrid = heatmapData?.grids?.[heatmapKey] || null;
  let combinedHeadLine = heatmapData?.headLines?.[heatmapKey];
  let combinedSpouseLine = heatmapData?.spouseLines?.[heatmapKey];

  if (showHealth && activeTab === "benefits" && heatmapData?.grids) {
    const benefitsGrid = heatmapData.grids["Benefits"];
    const healthGrid = heatmapData.grids["Healthcare Benefits"];
    if (benefitsGrid && healthGrid) {
      heatmapGrid = benefitsGrid.map((row, i) =>
        row.map((val, j) => val + (healthGrid[i]?.[j] || 0)),
      );
    }
    const bHead = heatmapData.headLines?.["Benefits"];
    const hHead = heatmapData.headLines?.["Healthcare Benefits"];
    if (bHead && hHead) combinedHeadLine = bHead.map((v, i) => v + (hHead[i] || 0));
    const bSpouse = heatmapData.spouseLines?.["Benefits"];
    const hSpouse = heatmapData.spouseLines?.["Healthcare Benefits"];
    if (bSpouse && hSpouse) combinedSpouseLine = bSpouse.map((v, i) => v + (hSpouse[i] || 0));
  }

  const HEATMAP_AGG = {
    "Net Income": "householdNetIncome",
    "Net Income (with Healthcare)": "householdNetIncomeWithHealth",
    "Benefits": "householdBenefits",
    "Tax Before Refundable Credits": "householdTaxBeforeCredits",
  };
  const aggKey = HEATMAP_AGG[heatmapKey];
  let markerDelta = null;
  if (activeTab === "benefits" && showHealth) {
    const m = (results.married.aggregates.householdBenefits || 0) + (results.married.aggregates.healthcareBenefitValue || 0);
    const h = (results.headSingle.aggregates.householdBenefits || 0) + (results.headSingle.aggregates.healthcareBenefitValue || 0);
    const s = (results.spouseSingle.aggregates.householdBenefits || 0) + (results.spouseSingle.aggregates.healthcareBenefitValue || 0);
    markerDelta = m - (h + s);
  } else if (aggKey) {
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

  const heatmapProps = heatmapGrid ? {
    grid: heatmapGrid,
    headIncome,
    spouseIncome,
    valentine,
    maxIncome: heatmapData?.maxIncome || 80000,
    count: heatmapData?.count || 33,
    markerDelta,
    onCellClick: heatmapData?.programData ? handleCellClick : undefined,
    selectedCell: cellSelection,
    label: (showHealth && activeTab === "benefits") ? "Benefits (incl. Healthcare)" : heatmapKey,
    headLine: combinedHeadLine,
    spouseLine: combinedSpouseLine,
  } : null;

  const heatmapContent = heatmapLoading ? (
    <p className="loading">
      <span className="spinner" />
      Loading heatmap...
    </p>
  ) : heatmapProps ? (
    <Suspense
      fallback={
        <p className="loading">
          <span className="spinner" />
          Loading chart...
        </p>
      }
    >
      <Heatmap {...heatmapProps} fullscreen={fullscreen} />
    </Suspense>
  ) : null;

  return (
    <div className="results">
      <HeadlineBanner
        results={activeResults}
        showHealth={showHealth}
        activeTab={activeTab}
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

      <div className="tab-content-split">
        <div className="split-table">
          <DataTable rows={rows} emptyMessage={EMPTY_MESSAGES[activeTab]} />
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

      {fullscreen && heatmapProps && (
        <div className="fullscreen-overlay" onClick={() => setFullscreen(false)}>
          <div className="fullscreen-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="fullscreen-close"
              onClick={() => setFullscreen(false)}
            >
              Close
            </button>
            <Suspense fallback={null}>
              <Heatmap {...heatmapProps} fullscreen />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
