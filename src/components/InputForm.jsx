import React, { useState } from "react";
import { US_STATES } from "../utils";
import { AVAILABLE_YEARS, DEFAULT_YEAR } from "../api";

export default function InputForm({ onCalculate, loading, initialValues }) {
  const iv = initialValues || {};
  const [stateCode, setStateCode] = useState(iv.stateCode || "CA");
  const [headIncome, setHeadIncome] = useState(
    iv.headIncome ? String(iv.headIncome) : "",
  );
  const [spouseIncome, setSpouseIncome] = useState(
    iv.spouseIncome ? String(iv.spouseIncome) : "",
  );
  const [headDisabled, setHeadDisabled] = useState(
    iv.disabilityStatus?.head || false,
  );
  const [spouseDisabled, setSpouseDisabled] = useState(
    iv.disabilityStatus?.spouse || false,
  );
  const [children, setChildren] = useState(
    (iv.children || []).map((c) => ({ ...c, age: String(c.age) })),
  );
  const [year, setYear] = useState(iv.year || DEFAULT_YEAR);

  function toNum(str) {
    const n = Number(str);
    return Number.isNaN(n) ? 0 : n;
  }

  function addChild() {
    setChildren([...children, { age: "", isDisabled: false }]);
  }

  function removeChild() {
    if (children.length > 0) setChildren(children.slice(0, -1));
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
      headIncome: toNum(headIncome),
      spouseIncome: toNum(spouseIncome),
      children: children.map((c) => ({ ...c, age: toNum(c.age) })),
      disabilityStatus: {
        head: headDisabled,
        spouse: spouseDisabled,
      },
      year,
    });
  }

  return (
    <form className="input-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label>State</label>
          <select
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
          >
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Year</label>
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            {AVAILABLE_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Head Employment Income</label>
          <input
            type="number"
            min="0"
            step="1000"
            placeholder="0"
            value={headIncome}
            onChange={(e) => setHeadIncome(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Spouse Employment Income</label>
          <input
            type="number"
            min="0"
            step="1000"
            placeholder="0"
            value={spouseIncome}
            onChange={(e) => setSpouseIncome(e.target.value)}
          />
        </div>
      </div>

      <div className="checkbox-row">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={headDisabled}
            onChange={(e) => setHeadDisabled(e.target.checked)}
          />
          Head is disabled
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={spouseDisabled}
            onChange={(e) => setSpouseDisabled(e.target.checked)}
          />
          Spouse is disabled
        </label>
      </div>

      <div className="children-section">
        <div className="children-header">
          <label>Children: {children.length}</label>
          <button
            type="button"
            onClick={addChild}
            className="btn-calculate"
            style={{ padding: "0.3rem 0.75rem", fontSize: "0.85rem" }}
          >
            + Add
          </button>
          {children.length > 0 && (
            <button
              type="button"
              onClick={removeChild}
              className="btn-calculate"
              style={{
                padding: "0.3rem 0.75rem",
                fontSize: "0.85rem",
                background: "#6B7280",
              }}
            >
              - Remove
            </button>
          )}
        </div>
        {children.map((child, i) => (
          <div className="child-row" key={i}>
            <label>Child {i + 1}</label>
            <label>Age:</label>
            <input
              type="number"
              min="0"
              max="18"
              placeholder="0"
              value={child.age}
              onChange={(e) => updateChild(i, "age", e.target.value)}
            />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={child.isDisabled}
                onChange={(e) =>
                  updateChild(i, "isDisabled", e.target.checked)
                }
              />
              Disabled
            </label>
          </div>
        ))}
      </div>

      <button type="submit" className="btn-calculate" disabled={loading}>
        {loading ? (
          <>
            <span className="spinner" />
            Calculating...
          </>
        ) : (
          "Calculate"
        )}
      </button>
    </form>
  );
}
