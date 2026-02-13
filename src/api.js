import metadata from "./metadata.json";

const API_BASE = "https://api.policyengine.org";
export const DEFAULT_YEAR = "2026";
export const AVAILABLE_YEARS = ["2024", "2025", "2026", "2027", "2028"];
export const DEFAULT_AGE = 40;

// ---------- entity-aware helpers for metadata groups ----------

// Container names used in the situation / response for each entity type
const ENTITY_CONTAINERS = {
  household: { key: "households", name: "your household" },
  tax_unit: { key: "tax_units", name: "your tax unit" },
  spm_unit: { key: "spm_units", name: "your spm_unit" },
};

/**
 * All detail variable entries from metadata (every category except aggregates).
 */
const ALL_DETAIL_VARS = [
  ...metadata.benefits,
  ...metadata.credits,
  ...metadata.taxes,
  ...metadata.healthcare,
  ...metadata.stateCredits,
  ...metadata.stateTaxes,
];

/**
 * All variables (detail + aggregates) — used when building heatmap programData.
 */
const ALL_VARS = [...ALL_DETAIL_VARS, ...metadata.aggregates];

// Group detail vars by entity for efficient iteration
function groupByEntity(vars) {
  const groups = { household: [], tax_unit: [], spm_unit: [], person: [] };
  for (const v of vars) {
    (groups[v.entity] || []).push(v.variable);
  }
  return groups;
}

const DETAIL_BY_ENTITY = groupByEntity(ALL_DETAIL_VARS);

/**
 * Get per-state credit entries for a given state code.
 * NYC credits are included when stateCode is "NY".
 */
function getStateCreditEntries(stateCode) {
  const entries = metadata.stateCreditsByState[stateCode] || [];
  // NYC credits are nested under NY
  if (stateCode === "NY" && metadata.stateCreditsByState.NYC) {
    return [...entries, ...metadata.stateCreditsByState.NYC];
  }
  return entries;
}

// ---------- situation construction ----------

export function createSituation(
  stateCode,
  headIncome,
  disabilityStatus,
  spouseIncome = null,
  children = [],
  year = DEFAULT_YEAR,
  pregnancyStatus = {},
  headAge = DEFAULT_AGE,
  spouseAge = DEFAULT_AGE,
) {
  const members = ["you"];
  const maritalUnitMembers = ["you"];

  const people = {
    you: {
      age: { [year]: headAge },
      employment_income: { [year]: headIncome },
      is_disabled: { [year]: disabilityStatus.head || false },
      is_pregnant: { [year]: pregnancyStatus.head || false },
    },
  };

  if (spouseIncome !== null) {
    people["your partner"] = {
      age: { [year]: spouseAge },
      employment_income: { [year]: spouseIncome },
      is_disabled: { [year]: disabilityStatus.spouse || false },
      is_pregnant: { [year]: pregnancyStatus.spouse || false },
    };
    members.push("your partner");
    maritalUnitMembers.push("your partner");
  }

  const maritalUnits = {
    "your marital unit": { members: [...maritalUnitMembers] },
  };

  children.forEach((child, i) => {
    const childId = `child_${i + 1}`;
    people[childId] = {
      age: { [year]: child.age },
      employment_income: { [year]: 0 },
      is_disabled: { [year]: child.isDisabled || false },
    };
    members.push(childId);
    maritalUnits[`${childId} marital unit`] = {
      marital_unit_id: { [year]: i + 1 },
      members: [childId],
    };
  });

  return {
    people,
    families: { "your family": { members: [...members] } },
    marital_units: maritalUnits,
    tax_units: { "your tax unit": { members: [...members] } },
    spm_units: { "your spm_unit": { members: [...members] } },
    households: {
      "your household": {
        members: [...members],
        state_name: { [year]: stateCode },
      },
    },
  };
}

function addOutputVariables(situation, year, stateCode) {
  // Aggregates — all are household-level
  const hh = situation.households["your household"];
  for (const v of metadata.aggregates) {
    hh[v.variable] = { [year]: null };
  }

  // Detail variables — placed at their correct entity container
  for (const v of DETAIL_BY_ENTITY.household) {
    hh[v] = { [year]: null };
  }

  const tu = situation.tax_units["your tax unit"];
  for (const v of DETAIL_BY_ENTITY.tax_unit) {
    tu[v] = { [year]: null };
  }

  const spm = situation.spm_units["your spm_unit"];
  for (const v of DETAIL_BY_ENTITY.spm_unit) {
    spm[v] = { [year]: null };
  }

  for (const personName of Object.keys(situation.people)) {
    const person = situation.people[personName];
    for (const v of DETAIL_BY_ENTITY.person) {
      person[v] = { [year]: null };
    }
  }

  // Per-state credit variables (only for the selected state)
  if (stateCode) {
    for (const entry of getStateCreditEntries(stateCode)) {
      if (entry.entity === "person") {
        for (const person of Object.values(situation.people)) {
          person[entry.variable] = { [year]: null };
        }
      } else {
        tu[entry.variable] = { [year]: null };
      }
    }
  }

  return situation;
}

// ---------- API call ----------

async function callApi(situation) {
  const res = await fetch(`${API_BASE}/us/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ household: situation }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (data.status === "error") {
    throw new Error(data.message || "Calculation error");
  }
  return data.result || data;
}

// ---------- extraction helpers ----------

function extractVal(result, entity, name, variable, year) {
  try {
    const val = result?.[entity]?.[name]?.[variable]?.[year];
    if (val == null) return 0;
    if (Array.isArray(val)) return val[0];
    return val;
  } catch {
    return 0;
  }
}

function extractArray(result, entity, name, variable, year) {
  try {
    const val = result?.[entity]?.[name]?.[variable]?.[year];
    if (Array.isArray(val)) return val;
    return val != null ? [val] : [];
  } catch {
    return [];
  }
}

function sumPersonVar(result, variable, year) {
  const people = result?.people || {};
  let total = 0;
  for (const person of Object.values(people)) {
    const val = person?.[variable]?.[year];
    if (typeof val === "number") total += val;
    else if (Array.isArray(val)) total += val[0] || 0;
  }
  return total;
}

function sumPersonArray(result, variable, year) {
  const people = result?.people || {};
  let total = null;
  for (const person of Object.values(people)) {
    const val = person?.[variable]?.[year];
    if (Array.isArray(val)) {
      if (!total) total = new Array(val.length).fill(0);
      for (let i = 0; i < val.length; i++) total[i] += val[i] || 0;
    } else if (typeof val === "number") {
      if (!total) total = [val];
      else total[0] += val;
    }
  }
  return total || [];
}

// ---------- metadata-driven extraction ----------

/**
 * Extract a single scalar value for a metadata entry.
 */
function extractMetaVal(result, entry, year) {
  const { variable, entity } = entry;
  if (entity === "person") return sumPersonVar(result, variable, year);
  const c = ENTITY_CONTAINERS[entity];
  return extractVal(result, c.key, c.name, variable, year);
}

/**
 * Extract a dict { variableName: value } for a list of metadata entries.
 */
function extractMetaDict(result, entries, year) {
  const dict = {};
  for (const entry of entries) {
    dict[entry.variable] = extractMetaVal(result, entry, year);
  }
  return dict;
}

/**
 * Extract an array value for a metadata entry (heatmap mode).
 */
function extractMetaArray(result, entry, year) {
  const { variable, entity } = entry;
  if (entity === "person") return sumPersonArray(result, variable, year);
  const c = ENTITY_CONTAINERS[entity];
  return extractArray(result, c.key, c.name, variable, year);
}

/**
 * Extract all variables as arrays (for heatmap programData).
 */
function extractAllArrays(result, year) {
  const data = {};
  for (const entry of ALL_VARS) {
    data[entry.variable] = extractMetaArray(result, entry, year);
  }
  return data;
}

// ---------- public API ----------

export async function getPrograms(
  stateCode,
  headIncome,
  disabilityStatus,
  spouseIncome = null,
  children = [],
  year = DEFAULT_YEAR,
  pregnancyStatus = {},
  headAge = DEFAULT_AGE,
  spouseAge = DEFAULT_AGE,
) {
  const situation = createSituation(
    stateCode,
    headIncome,
    disabilityStatus,
    spouseIncome,
    children,
    year,
    pregnancyStatus,
    headAge,
    spouseAge,
  );
  addOutputVariables(situation, year, stateCode);

  const result = await callApi(situation);

  // Per-state credits: use label as key for display
  const stateCreditEntries = getStateCreditEntries(stateCode);
  const perStateDict = {};
  for (const entry of stateCreditEntries) {
    perStateDict[entry.label] = extractMetaVal(result, entry, year);
  }

  return {
    aggregates: {
      householdNetIncome: extractMetaVal(result, metadata.aggregates[0], year),
      householdNetIncomeWithHealth: extractMetaVal(result, metadata.aggregates[1], year),
      householdBenefits: extractMetaVal(result, metadata.aggregates[2], year),
      householdRefundableCredits: extractMetaVal(result, metadata.aggregates[3], year),
      householdTaxBeforeCredits: extractMetaVal(result, metadata.aggregates[4], year),
      healthcareBenefitValue: extractMetaVal(result, metadata.aggregates[5], year),
      householdRefundableStateCredits: extractMetaVal(result, metadata.aggregates[6], year),
    },
    benefits: extractMetaDict(result, metadata.benefits, year),
    health: extractMetaDict(result, metadata.healthcare, year),
    credits: extractMetaDict(result, metadata.credits, year),
    stateCredits: {
      state_refundable_credits: extractMetaVal(result, metadata.stateCredits[0], year),
      ...perStateDict,
    },
    taxes: extractMetaDict(result, metadata.taxes, year),
    stateTaxes: extractMetaDict(result, metadata.stateTaxes, year),
  };
}

export async function getCategorizedPrograms(
  stateCode,
  headIncome,
  spouseIncome,
  children,
  disabilityStatus,
  year = DEFAULT_YEAR,
  pregnancyStatus = {},
  headAge = DEFAULT_AGE,
  spouseAge = DEFAULT_AGE,
) {
  const [married, headSingle, spouseSingle] = await Promise.all([
    getPrograms(
      stateCode,
      headIncome,
      disabilityStatus,
      spouseIncome,
      children,
      year,
      pregnancyStatus,
      headAge,
      spouseAge,
    ),
    getPrograms(
      stateCode,
      headIncome,
      disabilityStatus,
      null,
      children,
      year,
      { head: pregnancyStatus.head || false },
      headAge,
    ),
    getPrograms(
      stateCode,
      spouseIncome,
      { head: disabilityStatus.spouse || false },
      null,
      [],
      year,
      { head: pregnancyStatus.spouse || false },
      spouseAge,
    ),
  ]);

  return { married, headSingle, spouseSingle };
}

// ---------- Heatmap API calls ----------

export async function getHeatmapData(
  stateCode,
  children,
  disabilityStatus,
  year = DEFAULT_YEAR,
  pregnancyStatus = {},
  headIncome = 0,
  spouseIncome = 0,
  headAge = DEFAULT_AGE,
  spouseAge = DEFAULT_AGE,
) {
  const rawMax = Math.max(80000, headIncome, spouseIncome);
  const step = Math.ceil(rawMax / 32 / 2500) * 2500;
  const maxIncome = step * 32;
  const count = 33;

  function buildHeatmapSituation(includeSpouse, childrenList, disability, pregnancy, hAge, sAge) {
    const situation = createSituation(
      stateCode,
      maxIncome,
      disability,
      includeSpouse ? maxIncome : null,
      childrenList,
      year,
      pregnancy,
      hAge,
      sAge,
    );
    addOutputVariables(situation, year, stateCode);

    if (includeSpouse) {
      situation.axes = [
        [{ name: "employment_income", count, index: 0, min: 0, max: maxIncome, period: year }],
        [{ name: "employment_income", count, index: 1, min: 0, max: maxIncome, period: year }],
      ];
    } else {
      situation.axes = [
        [{ name: "employment_income", count, min: 0, max: maxIncome, period: year }],
      ];
    }

    return situation;
  }

  const marriedSituation = buildHeatmapSituation(
    true, children, disabilityStatus, pregnancyStatus, headAge, spouseAge,
  );
  const headSingleSituation = buildHeatmapSituation(
    false, children, disabilityStatus,
    { head: pregnancyStatus.head || false }, headAge,
  );
  const spouseSingleSituation = buildHeatmapSituation(
    false, [], { head: disabilityStatus.spouse || false },
    { head: pregnancyStatus.spouse || false }, spouseAge,
  );

  const [marriedResult, headResult, spouseResult] = await Promise.all([
    callApi(marriedSituation),
    callApi(headSingleSituation),
    callApi(spouseSingleSituation),
  ]);

  // Extract all per-program arrays for click-to-detail
  const marriedData = extractAllArrays(marriedResult, year);
  const headData = extractAllArrays(headResult, year);
  const spouseData = extractAllArrays(spouseResult, year);

  const stateCreditEntries = getStateCreditEntries(stateCode);

  const programData = {};
  for (const entry of [...ALL_VARS, ...stateCreditEntries]) {
    const v = entry.variable;
    programData[v] = {
      married: marriedData[v] || extractMetaArray(marriedResult, entry, year),
      head: headData[v] || extractMetaArray(headResult, entry, year),
      spouse: spouseData[v] || extractMetaArray(spouseResult, entry, year),
    };
  }

  // Build delta grids for the aggregate heatmap displays
  // All variables here are household-level, so they vary correctly in 2D axes.
  const gridVars = [
    "household_net_income",
    "household_net_income_including_health_benefits",
    "household_benefits",
    "household_refundable_tax_credits",
    "household_tax_before_refundable_credits",
    "healthcare_benefit_value",
    "household_refundable_state_tax_credits",
  ];
  const tabNames = [
    "Net Income",
    "Net Income (with Healthcare)",
    "Benefits",
    "Refundable Tax Credits",
    "Tax Before Refundable Credits",
    "Healthcare Benefits",
    "State Credits",
  ];

  const grids = {};

  function buildDeltaGrid(marriedFlat, headFlat, spouseFlat) {
    const marriedGrid = [];
    for (let i = 0; i < count; i++) {
      marriedGrid.push(marriedFlat.slice(i * count, (i + 1) * count));
    }
    const deltaGrid = marriedGrid.map((row, i) =>
      row.map((val, j) => val - (headFlat[i] + spouseFlat[j])),
    );
    // Transpose: API returns head-major (row=head, col=spouse) but Plotly
    // z[row][col] maps to y[row],x[col] and x=head, y=spouse, so we need
    // row=spouse, col=head.
    return deltaGrid[0].map((_, col) =>
      deltaGrid.map((row) => row[col]),
    );
  }

  for (let v = 0; v < gridVars.length; v++) {
    const varName = gridVars[v];
    const transposed = buildDeltaGrid(
      marriedData[varName], headData[varName], spouseData[varName],
    );

    if (varName === "household_tax_before_refundable_credits") {
      grids[tabNames[v]] = transposed.map((row) => row.map((val) => -val));
    } else {
      grids[tabNames[v]] = transposed;
    }
  }

  // Federal Credits = Total Credits - State Credits (both household-level)
  const totalCreditsGrid = grids["Refundable Tax Credits"];
  const stateCreditsGrid = grids["State Credits"];
  grids["Federal Credits"] = totalCreditsGrid.map((row, i) =>
    row.map((val, j) => val - stateCreditsGrid[i][j]),
  );

  return { grids, maxIncome, count, programData, stateCreditEntries };
}

export function buildCellResults(programData, headIdx, spouseIdx, count, stateCreditEntries) {
  function getVal(varName, scenario) {
    const arr = programData[varName]?.[scenario];
    if (!arr || arr.length === 0) return 0;
    if (scenario === "married") return arr[headIdx * count + spouseIdx] || 0;
    if (scenario === "head") return arr[headIdx] || 0;
    if (scenario === "spouse") return arr[spouseIdx] || 0;
    return 0;
  }

  function buildDict(metaEntries, scenario) {
    const d = {};
    for (const entry of metaEntries) d[entry.variable] = getVal(entry.variable, scenario);
    return d;
  }

  function buildStateCreditDict(scenario) {
    const d = {};
    d.state_refundable_credits = getVal("state_refundable_credits", scenario);
    for (const entry of (stateCreditEntries || [])) {
      d[entry.label] = getVal(entry.variable, scenario);
    }
    return d;
  }

  function buildResult(scenario) {
    return {
      aggregates: {
        householdNetIncome: getVal("household_net_income", scenario),
        householdNetIncomeWithHealth: getVal("household_net_income_including_health_benefits", scenario),
        householdBenefits: getVal("household_benefits", scenario),
        healthcareBenefitValue: getVal("healthcare_benefit_value", scenario),
        householdRefundableCredits: getVal("household_refundable_tax_credits", scenario),
        householdTaxBeforeCredits: getVal("household_tax_before_refundable_credits", scenario),
        householdRefundableStateCredits: getVal("household_refundable_state_tax_credits", scenario),
      },
      benefits: buildDict(metadata.benefits, scenario),
      health: buildDict(metadata.healthcare, scenario),
      credits: buildDict(metadata.credits, scenario),
      stateCredits: buildStateCreditDict(scenario),
      taxes: buildDict(metadata.taxes, scenario),
      stateTaxes: buildDict(metadata.stateTaxes, scenario),
    };
  }

  return {
    married: buildResult("married"),
    headSingle: buildResult("head"),
    spouseSingle: buildResult("spouse"),
  };
}
