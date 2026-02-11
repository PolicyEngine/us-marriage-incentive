import React from "react";
import Plot from "react-plotly.js";

const TICK_LABELS = Array.from({ length: 9 }, (_, i) => `$${i * 10}k`);

const TEAL_SCALE = [
  [0, "#1D4044"],
  [0.3, "#6B7280"],
  [0.5, "#F2F4F7"],
  [0.7, "#81E6D9"],
  [1, "#285E61"],
];

const VALENTINE_SCALE = [
  [0, "#881337"],
  [0.3, "#9CA3AF"],
  [0.5, "#FFF1F2"],
  [0.7, "#F9A8D4"],
  [1, "#BE185D"],
];

export default function Heatmap({ grid, headIncome, spouseIncome, valentine }) {
  if (!grid || grid.length === 0) {
    return <p className="loading">No heatmap data available.</p>;
  }

  const allZero = grid.every((row) => row.every((v) => v === 0));
  if (allZero) {
    return <p className="loading">No changes in the net income data.</p>;
  }

  const flatValues = grid.flat();
  const absMax = Math.max(...flatValues.map(Math.abs));
  const zMin = -absMax;
  const zMax = absMax;

  const accentColor = valentine ? "#BE185D" : "#285E61";

  // "You are here" marker — snap to nearest grid cell
  const markerX =
    TICK_LABELS[Math.min(8, Math.max(0, Math.round(headIncome / 10000)))];
  const markerY =
    TICK_LABELS[Math.min(8, Math.max(0, Math.round(spouseIncome / 10000)))];

  return (
    <div className="heatmap-section">
      <h3>Situation with varying head and spouse income:</h3>
      <Plot
        data={[
          {
            z: grid,
            x: TICK_LABELS,
            y: TICK_LABELS,
            type: "heatmap",
            colorscale: valentine ? VALENTINE_SCALE : TEAL_SCALE,
            zmin: zMin,
            zmax: zMax,
            xgap: 2,
            ygap: 2,
            colorbar: {
              title: { text: "Net Change", side: "right" },
              tickprefix: "$",
              thickness: 15,
              len: 0.9,
              outlinewidth: 0,
            },
            hovertemplate:
              "Head: %{x}<br>Spouse: %{y}<br>Change: %{z:$,.0f}<extra></extra>",
          },
          {
            x: [markerX],
            y: [markerY],
            type: "scatter",
            mode: "markers+text",
            marker: {
              size: 18,
              color: "rgba(0,0,0,0)",
              line: { width: 2.5, color: accentColor },
              symbol: valentine ? "heart" : "diamond",
            },
            text: [valentine ? "You \u2764" : "You"],
            textposition: "top center",
            textfont: { size: 11, color: accentColor, family: "-apple-system, BlinkMacSystemFont, sans-serif" },
            name: "Your situation",
            hovertemplate: "Your situation<extra></extra>",
            showlegend: false,
          },
        ]}
        layout={{
          xaxis: {
            title: { text: "Head Employment Income", standoff: 10 },
            side: "bottom",
            tickangle: 0,
          },
          yaxis: {
            title: { text: "Spouse Employment Income", standoff: 10 },
          },
          height: 520,
          margin: { l: 100, r: 80, t: 10, b: 60 },
          plot_bgcolor: "#FFFFFF",
          paper_bgcolor: "transparent",
          font: { family: "-apple-system, BlinkMacSystemFont, sans-serif" },
        }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: "100%", maxWidth: 620 }}
      />
    </div>
  );
}
