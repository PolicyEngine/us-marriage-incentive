import React, { useState, useEffect } from "react";
import { US_STATES } from "../utils";
import { AVAILABLE_YEARS, DEFAULT_YEAR } from "../api";

function formatIncome(value) {
  const num = typeof value === "number" ? value : parseNumber(value);
  if (num === 0 && value === "") return "";
  return num.toLocaleString("en-US");
}

function parseNumber(str) {
  const cleaned = String(str).replace(/[$,]/g, "");
  const n = Number(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

const DEFAULT_INCOME = 45000;

export default function InputForm({ onCalculate, loading, initialValues, externalIncomes }) {
  const iv = initialValues || {};
  const [stateCode, setStateCode] = useState(iv.stateCode || "CA");
  const [headIncome, setHeadIncome] = useState(
    formatIncome(iv.headIncome != null ? iv.headIncome : DEFAULT_INCOME),
  );
  const [spouseIncome, setSpouseIncome] = useState(
    formatIncome(iv.spouseIncome != null ? iv.spouseIncome : DEFAULT_INCOME),
  );
  const [headDisabled, setHeadDisabled] = useState(iv.disabilityStatus?.head || false);
  const [spouseDisabled, setSpouseDisabled] = useState(iv.disabilityStatus?.spouse || false);
  const [headAge, setHeadAge] = useState(iv.headAge ? String(iv.headAge) : "40");
  const [spouseAge, setSpouseAge] = useState(iv.spouseAge ? String(iv.spouseAge) : "40");
  const [headPregnant, setHeadPregnant] = useState(iv.pregnancyStatus?.head || false);
  const [spousePregnant, setSpousePregnant] = useState(iv.pregnancyStatus?.spouse || false);
  const [children, setChildren] = useState(
    (iv.children || []).map((c) => ({ ...c, age: String(c.age) })),
  );
  const [year, setYear] = useState(iv.year || DEFAULT_YEAR);
  const [errors, setErrors] = useState({});

  // Sync income fields when heatmap cell is clicked
  useEffect(() => {
    if (externalIncomes) {
      setHeadIncome(formatIncome(externalIncomes.headIncome));
      setSpouseIncome(formatIncome(externalIncomes.spouseIncome));
    }
  }, [externalIncomes]);

  function setError(field, msg) {
    setErrors((prev) => ({ ...prev, [field]: msg }));
    setTimeout(() => setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; }), 3000);
  }

  function handleIncomeChange(setter, value) {
    const cleaned = value.replace(/[$,]/g, "");
    if (cleaned === "" || /^\d*$/.test(cleaned)) setter(value);
  }

  function handleIncomeBlur(setter, value, field) {
    const num = parseNumber(value);
    setter(formatIncome(Math.max(0, num)));
    if (num < 0) setError(field, "Set to $0");
  }

  function handleAgeBlur(setter, value, field) {
    let num = Number(value);
    if (Number.isNaN(num) || value === "") num = 40;
    const clamped = clamp(Math.round(num), 18, 100);
    setter(String(clamped));
    if (num < 18 || num > 100) setError(field, "18–100");
  }

  function handleChildAgeBlur(index, value) {
    let num = Number(value);
    if (Number.isNaN(num) || value === "") num = 0;
    const clamped = clamp(Math.round(num), 0, 18);
    const updated = [...children];
    updated[index] = { ...updated[index], age: String(clamped) };
    setChildren(updated);
    if (num < 0 || num > 18) setError(`childAge${index}`, "0–18");
  }

  function updateChild(index, field, value) {
    const updated = [...children];
    updated[index] = { ...updated[index], [field]: value };
    setChildren(updated);
  }

  function handleSubmit(e) {
    e.preventDefault();
    onCalculate({
      stateCode,
      headIncome: parseNumber(headIncome),
      spouseIncome: parseNumber(spouseIncome),
      headAge: Number(headAge) || 40,
      spouseAge: Number(spouseAge) || 40,
      children: children.map((c) => ({ ...c, age: Number(c.age) || 0 })),
      disabilityStatus: { head: headDisabled, spouse: spouseDisabled },
      pregnancyStatus: { head: headPregnant, spouse: spousePregnant },
      year,
    });
  }

  return (
    <form className="sidebar-form" onSubmit={handleSubmit}>
      <div className="sf-row">
        <div className="sf-field sf-half">
          <label>State</label>
          <select value={stateCode} onChange={(e) => setStateCode(e.target.value)}>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="sf-field sf-half">
          <label>Year</label>
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            {AVAILABLE_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <PersonSection
        title="You"
        accent="teal"
        income={headIncome}
        onIncomeChange={(v) => handleIncomeChange(setHeadIncome, v)}
        onIncomeBlur={() => handleIncomeBlur(setHeadIncome, headIncome, "headIncome")}
        incomeError={errors.headIncome}
        age={headAge}
        onAgeChange={setHeadAge}
        onAgeBlur={() => handleAgeBlur(setHeadAge, headAge, "headAge")}
        ageError={errors.headAge}
        disabled={headDisabled}
        onDisabledChange={setHeadDisabled}
        pregnant={headPregnant}
        onPregnantChange={setHeadPregnant}
      />

      <PersonSection
        title="Your Partner"
        accent="slate"
        income={spouseIncome}
        onIncomeChange={(v) => handleIncomeChange(setSpouseIncome, v)}
        onIncomeBlur={() => handleIncomeBlur(setSpouseIncome, spouseIncome, "spouseIncome")}
        incomeError={errors.spouseIncome}
        age={spouseAge}
        onAgeChange={setSpouseAge}
        onAgeBlur={() => handleAgeBlur(setSpouseAge, spouseAge, "spouseAge")}
        ageError={errors.spouseAge}
        disabled={spouseDisabled}
        onDisabledChange={setSpouseDisabled}
        pregnant={spousePregnant}
        onPregnantChange={setSpousePregnant}
      />

      <div className="sf-children">
        <div className="sf-children-header">
          <span className="sf-children-label">Children</span>
          <button
            type="button"
            className="btn-add-child"
            onClick={() => setChildren([...children, { age: "", isDisabled: false }])}
          >+</button>
        </div>
        {children.map((child, i) => (
          <div className="sf-child" key={i}>
            <input
              type="number"
              min="0"
              max="18"
              placeholder="Age"
              value={child.age}
              className={errors[`childAge${i}`] ? "input-error" : ""}
              onChange={(e) => updateChild(i, "age", e.target.value)}
              onBlur={() => handleChildAgeBlur(i, child.age)}
            />
            <label className="sf-ck">
              <input
                type="checkbox"
                checked={child.isDisabled}
                onChange={(e) => updateChild(i, "isDisabled", e.target.checked)}
              />
              Dis.
            </label>
            <button
              type="button"
              className="sf-child-rm"
              onClick={() => setChildren(children.filter((_, j) => j !== i))}
            >&times;</button>
          </div>
        ))}
      </div>

      <button type="submit" className="btn-calc" disabled={loading}>
        {loading ? <><span className="spinner" /> Calculating...</> : "Calculate"}
      </button>
    </form>
  );
}

function PersonSection({
  title, accent, income, onIncomeChange, onIncomeBlur, incomeError,
  age, onAgeChange, onAgeBlur, ageError,
  disabled, onDisabledChange, pregnant, onPregnantChange,
}) {
  return (
    <div className={`sf-person sf-person--${accent}`}>
      <div className="sf-person-title">{title}</div>
      <div className="sf-row">
        <div className="sf-field sf-grow">
          <label>Income</label>
          <div className="sf-income-wrap">
            <span className="sf-dollar">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={income}
              className={incomeError ? "input-error" : ""}
              onChange={(e) => onIncomeChange(e.target.value)}
              onBlur={onIncomeBlur}
            />
          </div>
          {incomeError && <span className="sf-error">{incomeError}</span>}
        </div>
        <div className="sf-field sf-age">
          <label>Age</label>
          <input
            type="number"
            min="18"
            max="100"
            value={age}
            className={ageError ? "input-error" : ""}
            onChange={(e) => onAgeChange(e.target.value)}
            onBlur={onAgeBlur}
          />
          {ageError && <span className="sf-error">{ageError}</span>}
        </div>
      </div>
      <div className="sf-checks">
        <label className="sf-ck">
          <input type="checkbox" checked={disabled} onChange={(e) => onDisabledChange(e.target.checked)} />
          Disabled
        </label>
        <label className="sf-ck">
          <input type="checkbox" checked={pregnant} onChange={(e) => onPregnantChange(e.target.checked)} />
          Pregnant
        </label>
      </div>
    </div>
  );
}
