import React, { useState, useEffect, useRef } from "react";
import InputForm from "./components/InputForm";
import ResultsDisplay from "./components/ResultsDisplay";
import { getCategorizedPrograms, getHeatmapData } from "./api";

// URL state helpers
function encodeToHash(formData) {
  const p = new URLSearchParams();
  p.set("state", formData.stateCode);
  p.set("head", formData.headIncome);
  p.set("spouse", formData.spouseIncome);
  if (formData.disabilityStatus.head) p.set("hd", "1");
  if (formData.disabilityStatus.spouse) p.set("sd", "1");
  if (formData.children.length > 0) {
    p.set(
      "c",
      formData.children
        .map((c) => `${c.age}:${c.isDisabled ? 1 : 0}`)
        .join(","),
    );
  }
  return p.toString();
}

function decodeFromHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return null;
  try {
    const p = new URLSearchParams(hash);
    if (!p.has("state") || !p.has("head")) return null;
    const children = p.has("c")
      ? p
          .get("c")
          .split(",")
          .map((s) => {
            const [age, dis] = s.split(":");
            return { age: Number(age), isDisabled: dis === "1" };
          })
      : [];
    return {
      stateCode: p.get("state"),
      headIncome: Number(p.get("head")),
      spouseIncome: Number(p.get("spouse") || 0),
      disabilityStatus: {
        head: p.get("hd") === "1",
        spouse: p.get("sd") === "1",
      },
      children,
    };
  } catch {
    return null;
  }
}

export default function App() {
  const [results, setResults] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(null);
  const initialValues = useRef(decodeFromHash());
  const didAutoCalc = useRef(false);

  async function handleCalculate(data) {
    setFormData(data);

    // Update URL
    window.history.replaceState(null, "", `#${encodeToHash(data)}`);

    const { stateCode, headIncome, spouseIncome, children, disabilityStatus } =
      data;

    setLoading(true);
    setError(null);
    setResults(null);
    setHeatmapData(null);

    try {
      const result = await getCategorizedPrograms(
        stateCode,
        headIncome,
        spouseIncome,
        children,
        disabilityStatus,
      );
      setResults(result);
      setLoading(false);

      // Load heatmap in the background
      setHeatmapLoading(true);
      try {
        const heatmap = await getHeatmapData(
          stateCode,
          children,
          disabilityStatus,
        );
        setHeatmapData(heatmap);
      } catch (e) {
        console.error("Heatmap error:", e);
      } finally {
        setHeatmapLoading(false);
      }
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  // Auto-calculate if URL has params on first load
  useEffect(() => {
    if (initialValues.current && !didAutoCalc.current) {
      didAutoCalc.current = true;
      handleCalculate(initialValues.current);
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Marriage Incentive Calculator</h1>
        <p>
          Evaluate marriage penalties and bonuses based on state and individual
          employment income.
        </p>
        <p>
          Powered by the{" "}
          <a
            href="https://github.com/policyengine/policyengine-us"
            target="_blank"
            rel="noreferrer"
          >
            policyengine-us
          </a>{" "}
          microsimulation model.
        </p>
      </header>

      <InputForm
        onCalculate={handleCalculate}
        loading={loading}
        initialValues={initialValues.current}
      />

      {error && <div className="error">{error}</div>}

      {results && (
        <ResultsDisplay
          results={results}
          heatmapData={heatmapData}
          heatmapLoading={heatmapLoading}
          headIncome={formData?.headIncome ?? 0}
          spouseIncome={formData?.spouseIncome ?? 0}
        />
      )}

      <p className="note">
        We attribute all dependents to the head of household when considering
        unmarried filers.
      </p>
    </div>
  );
}
