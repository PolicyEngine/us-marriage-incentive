import React, { useState, useEffect, useRef } from "react";
import InputForm from "./components/InputForm";
import ResultsDisplay from "./components/ResultsDisplay";
import { getCategorizedPrograms, getHeatmapData, DEFAULT_YEAR } from "./api";

// URL state helpers
function encodeToHash(formData) {
  const p = new URLSearchParams();
  p.set("state", formData.stateCode);
  p.set("head", formData.headIncome);
  p.set("spouse", formData.spouseIncome);
  if (formData.headAge && formData.headAge !== 40) p.set("ha", formData.headAge);
  if (formData.spouseAge && formData.spouseAge !== 40) p.set("sa", formData.spouseAge);
  if (formData.disabilityStatus.head) p.set("hd", "1");
  if (formData.disabilityStatus.spouse) p.set("sd", "1");
  if (formData.pregnancyStatus?.head) p.set("hp", "1");
  if (formData.pregnancyStatus?.spouse) p.set("sp", "1");
  if (formData.children.length > 0) {
    p.set(
      "c",
      formData.children
        .map((c) => `${c.age}:${c.isDisabled ? 1 : 0}`)
        .join(","),
    );
  }
  if (formData.year && formData.year !== DEFAULT_YEAR) {
    p.set("year", formData.year);
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
      headAge: Number(p.get("ha") || 40),
      spouseAge: Number(p.get("sa") || 40),
      disabilityStatus: {
        head: p.get("hd") === "1",
        spouse: p.get("sd") === "1",
      },
      pregnancyStatus: {
        head: p.get("hp") === "1",
        spouse: p.get("sp") === "1",
      },
      children,
      year: p.get("year") || DEFAULT_YEAR,
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
  const [valentine, setValentine] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const initialValues = useRef(decodeFromHash());
  const didAutoCalc = useRef(false);

  // Swap favicon for valentine mode
  useEffect(() => {
    const link = document.querySelector('link[rel="icon"]');
    if (!link) return;
    if (valentine) {
      link.href = "data:image/svg+xml," + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">'
        + '<circle cx="24" cy="32" r="14" stroke="#DB2777" stroke-width="4" fill="none"/>'
        + '<circle cx="40" cy="32" r="14" stroke="#BE185D" stroke-width="4" fill="none"/>'
        + '<text x="32" y="38" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#EC4899">$</text>'
        + '</svg>'
      );
    } else {
      link.href = import.meta.env.BASE_URL + "favicon.svg";
    }
  }, [valentine]);

  // Valentine mode toggle on "v" key (ignore when typing in inputs)
  useEffect(() => {
    function handleKey(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "v" || e.key === "V") {
        setValentine((prev) => {
          if (!prev) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 2500);
          }
          return !prev;
        });
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  async function handleCalculate(data) {
    setFormData(data);

    // Update URL
    window.history.replaceState(null, "", `#${encodeToHash(data)}`);

    const {
      stateCode,
      headIncome,
      spouseIncome,
      headAge,
      spouseAge,
      children,
      disabilityStatus,
      pregnancyStatus,
      year,
    } = data;

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
        year,
        pregnancyStatus,
        headAge,
        spouseAge,
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
          year,
          pregnancyStatus,
          headIncome,
          spouseIncome,
          headAge,
          spouseAge,
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
    <div className={`app ${valentine ? "valentine" : ""}`}>
      {valentine && <div className="hearts-bg" aria-hidden="true" />}
      {showConfetti && (
        <div className="heart-confetti" aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => (
            <span key={i} className="confetti-heart" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 0.5}s`,
              animationDuration: `${1.5 + Math.random() * 1.5}s`,
              fontSize: `${14 + Math.random() * 18}px`,
              opacity: 0.7 + Math.random() * 0.3,
            }} />
          ))}
        </div>
      )}
      <header className="app-header">
        <h1>{valentine ? "Love & Taxes Calculator" : "Marriage Incentive Calculator"}</h1>
        <p>
          {valentine
            ? "Will tying the knot cost you? Find out this Valentine's Day."
            : "Evaluate marriage penalties and bonuses based on state and individual employment income."}
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
          valentine={valentine}
        />
      )}

      <p className="note">
        We attribute all dependents to the head of household when considering
        unmarried filers.
      </p>
    </div>
  );
}
