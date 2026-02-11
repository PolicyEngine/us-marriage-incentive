import React, { useState } from "react";
import { US_STATES } from "../utils";
import { AVAILABLE_YEARS, DEFAULT_YEAR } from "../api";

export default function InputForm({ onCalculate, loading, initialValues }) {
  const iv = initialValues || {};
  const [stateCode, setStateCode] = useState(iv.stateCode || "CA");
  const [headIncome, setHeadIncome] = useState(iv.headIncome ?? 0);
  const [spouseIncome, setSpouseIncome] = useState(iv.spouseIncome ?? 0);
  const [headDisabled, setHeadDisabled] = useState(
    iv.disabilityStatus?.head || false,
  );
  const [spouseDisabled, setSpouseDisabled] = useState(
    iv.disabilityStatus?.spouse || false,
  );
  const [children, setChildren] = useState(iv.children || []);
  const [year, setYear] = useState(iv.year || DEFAULT_YEAR);

  function addChild() {
    setChildren([...children, { age: 0, isDisabled: false }]);
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
      headIncome,
      spouseIncome,
      children,
      disabilityStatus: {
        head: headDisabled,
        spouse: spouseDisabled,
      },
      year,
    });
  }

  function selectOnFocus(e) {
    e.target.select();
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
            value={headIncome}
            onFocus={selectOnFocus}
            onChange={(e) => setHeadIncome(Number(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>Spouse Employment Income</label>
          <input
            type="number"
            min="0"
            step="1000"
            value={spouseIncome}
            onFocus={selectOnFocus}
            onChange={(e) => setSpouseIncome(Number(e.target.value))}
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
              value={child.age}
              onFocus={selectOnFocus}
              onChange={(e) => updateChild(i, "age", Number(e.target.value))}
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
