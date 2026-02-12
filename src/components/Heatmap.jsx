import React from "react";
import Plot from "react-plotly.js";

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

export default function Heatmap({ grid, headIncome, spouseIncome, valentine, maxIncome = 80000, count = 33, markerDelta = null, fullscreen = false }) {
  if (!grid || grid.length === 0) {
    return <p className="loading">No heatmap data available.</p>;
  }

  const allZero = grid.every((row) => row.every((v) => v === 0));
  if (allZero) {
    return <p className="loading">No changes in the net income data.</p>;
  }

  const step = maxIncome / (count - 1);
  const tickLabels = Array.from({ length: count }, (_, i) => {
    const val = i * step;
    if (val === 0) return "$0";
    return `$${val / 1000}k`;
  });
  // Show every 4th tick for 33-point grids, every 2nd for smaller
  const tickInterval = count > 20 ? 4 : 2;
  const visibleTicks = tickLabels.filter((_, i) => i % tickInterval === 0);

  const flatValues = grid.flat();
  const absMax = Math.max(...flatValues.map(Math.abs));
  const zMin = -absMax;
  const zMax = absMax;

  const accentColor = valentine ? "#BE185D" : "#285E61";

  // "You are here" marker — snap to nearest grid cell
  const xi = Math.min(count - 1, Math.max(0, Math.round(headIncome / step)));
  const yi = Math.min(count - 1, Math.max(0, Math.round(spouseIncome / step)));
  const markerX = tickLabels[xi];
  const markerY = tickLabels[yi];
  // Use exact calculated delta when available (grid snapping can be inaccurate)
  const markerVal = markerDelta !== null ? markerDelta : (grid[yi]?.[xi] ?? 0);

  return (
    <div className="heatmap-section">
      <h3>Situation with varying head and spouse income:</h3>
      <Plot
        data={[
          {
            z: grid,
            x: tickLabels,
            y: tickLabels,
            type: "heatmap",
            colorscale: valentine ? VALENTINE_SCALE : TEAL_SCALE,
            zmin: zMin,
            zmax: zMax,
            xgap: 1,
            ygap: 1,
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
              size: 16,
              color: "rgba(0,0,0,0)",
              line: { width: 2.5, color: accentColor },
              symbol: valentine ? "heart" : "diamond",
            },
            text: [valentine ? "You \u2764" : "You"],
            textposition: "top center",
            textfont: { size: 11, color: accentColor, family: "-apple-system, BlinkMacSystemFont, sans-serif" },
            name: "Your situation",
            hovertemplate: `Your situation<br>Change: $${Math.round(markerVal).toLocaleString()}<extra></extra>`,
            showlegend: false,
          },
        ]}
        layout={{
          xaxis: {
            title: { text: "Head Employment Income", standoff: 10 },
            side: "bottom",
            tickangle: 0,
            tickvals: visibleTicks,
            ticktext: visibleTicks,
          },
          yaxis: {
            title: { text: "Spouse Employment Income", standoff: 10 },
            tickvals: visibleTicks,
            ticktext: visibleTicks,
          },
          height: fullscreen ? window.innerHeight - 80 : 600,
          margin: { l: 80, r: 80, t: 10, b: 60 },
          plot_bgcolor: "#FFFFFF",
          paper_bgcolor: "transparent",
          font: { family: "-apple-system, BlinkMacSystemFont, sans-serif" },
        }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: "100%" }}
      />
    </div>
  );
}
