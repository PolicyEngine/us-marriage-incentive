const API_BASE = "https://api.policyengine.org";
export const DEFAULT_YEAR = "2026";
export const AVAILABLE_YEARS = ["2024", "2025", "2026", "2027", "2028"];
export const DEFAULT_AGE = 40;

// Variables organized by entity level (verified against the API)
const SPM_UNIT_BENEFITS = [
  "snap",
  "tanf",
  "free_school_meals",
  "reduced_price_school_meals",
  "lifeline",
  "acp",
];

const PERSON_BENEFITS = ["wic", "ssi", "social_security", "head_start", "early_head_start"];

// Healthcare variables are NOT part of household_benefits or household_net_income.
// They feed into healthcare_benefit_value and household_net_income_including_health_benefits.
const HEALTH_PERSON_VARS = ["medicaid", "per_capita_chip"];
const HEALTH_TAX_UNIT_VARS = ["premium_tax_credit"];

const TAX_UNIT_CREDITS = ["eitc", "ctc", "cdcc"];

const TAX_UNIT_STATE_CREDITS = [
  "state_eitc",
  "state_ctc",
  "state_cdcc",
  "state_refundable_credits",
];

const TAX_UNIT_TAXES = ["income_tax_before_refundable_credits"];

const TAX_UNIT_STATE_TAXES = ["state_income_tax_before_refundable_credits"];

const PERSON_TAXES = [
  "self_employment_tax",
  "employee_social_security_tax",
  "employee_medicare_tax",
];

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

function addOutputVariables(situation, year) {
  const hh = situation.households["your household"];
  hh.household_net_income = { [year]: null };
  hh.household_benefits = { [year]: null };
  hh.household_refundable_tax_credits = { [year]: null };
  hh.household_tax_before_refundable_credits = { [year]: null };
  hh.healthcare_benefit_value = { [year]: null };
  hh.household_net_income_including_health_benefits = { [year]: null };

  for (const personName of Object.keys(situation.people)) {
    const person = situation.people[personName];
    for (const v of [...PERSON_BENEFITS, ...HEALTH_PERSON_VARS, ...PERSON_TAXES]) {
      person[v] = { [year]: null };
    }
  }

  const spm = situation.spm_units["your spm_unit"];
  for (const v of SPM_UNIT_BENEFITS) {
    spm[v] = { [year]: null };
  }

  const tu = situation.tax_units["your tax unit"];
  for (const v of [
    ...HEALTH_TAX_UNIT_VARS,
    ...TAX_UNIT_CREDITS,
    ...TAX_UNIT_STATE_CREDITS,
    ...TAX_UNIT_TAXES,
    ...TAX_UNIT_STATE_TAXES,
  ]) {
    tu[v] = { [year]: null };
  }

  return situation;
}

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

function extractDict(result, entity, name, vars, year) {
  const dict = {};
  for (const v of vars) {
    dict[v] = extractVal(result, entity, name, v, year);
  }
  return dict;
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

function extractPersonDict(result, vars, year) {
  const dict = {};
  for (const v of vars) {
    dict[v] = sumPersonVar(result, v, year);
  }
  return dict;
}

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
  addOutputVariables(situation, year);

  const result = await callApi(situation);

  const spmBenefits = extractDict(
    result,
    "spm_units",
    "your spm_unit",
    SPM_UNIT_BENEFITS,
    year,
  );
  const personBenefits = extractPersonDict(result, PERSON_BENEFITS, year);
  const benefits = { ...spmBenefits, ...personBenefits };

  // Healthcare variables (NOT part of household_benefits)
  const healthPerson = extractPersonDict(result, HEALTH_PERSON_VARS, year);
  const healthTu = extractDict(
    result,
    "tax_units",
    "your tax unit",
    HEALTH_TAX_UNIT_VARS,
    year,
  );
  const health = { ...healthPerson, ...healthTu };

  const tuTaxes = extractDict(
    result,
    "tax_units",
    "your tax unit",
    TAX_UNIT_TAXES,
    year,
  );
  const personTaxes = extractPersonDict(result, PERSON_TAXES, year);
  const taxes = { ...tuTaxes, ...personTaxes };

  const stateTaxes = extractDict(
    result,
    "tax_units",
    "your tax unit",
    TAX_UNIT_STATE_TAXES,
    year,
  );

  return {
    aggregates: {
      householdNetIncome: extractVal(
        result,
        "households",
        "your household",
        "household_net_income",
        year,
      ),
      householdNetIncomeWithHealth: extractVal(
        result,
        "households",
        "your household",
        "household_net_income_including_health_benefits",
        year,
      ),
      householdBenefits: extractVal(
        result,
        "households",
        "your household",
        "household_benefits",
        year,
      ),
      healthcareBenefitValue: extractVal(
        result,
        "households",
        "your household",
        "healthcare_benefit_value",
        year,
      ),
      householdRefundableCredits: extractVal(
        result,
        "households",
        "your household",
        "household_refundable_tax_credits",
        year,
      ),
      householdTaxBeforeCredits: extractVal(
        result,
        "households",
        "your household",
        "household_tax_before_refundable_credits",
        year,
      ),
    },
    benefits,
    health,
    credits: extractDict(
      result,
      "tax_units",
      "your tax unit",
      TAX_UNIT_CREDITS,
      year,
    ),
    stateCredits: extractDict(
      result,
      "tax_units",
      "your tax unit",
      TAX_UNIT_STATE_CREDITS,
      year,
    ),
    taxes,
    stateTaxes,
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

// Heatmap API calls
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

    const hh = situation.households["your household"];
    hh.household_net_income = { [year]: null };
    hh.household_net_income_including_health_benefits = { [year]: null };
    hh.household_benefits = { [year]: null };
    hh.household_refundable_tax_credits = { [year]: null };
    hh.household_tax_before_refundable_credits = { [year]: null };

    if (includeSpouse) {
      situation.axes = [
        [
          {
            name: "employment_income",
            count,
            index: 0,
            min: 0,
            max: maxIncome,
            period: year,
          },
        ],
        [
          {
            name: "employment_income",
            count,
            index: 1,
            min: 0,
            max: maxIncome,
            period: year,
          },
        ],
      ];
    } else {
      situation.axes = [
        [
          {
            name: "employment_income",
            count,
            min: 0,
            max: maxIncome,
            period: year,
          },
        ],
      ];
    }

    return situation;
  }

  const marriedSituation = buildHeatmapSituation(
    true,
    children,
    disabilityStatus,
    pregnancyStatus,
    headAge,
    spouseAge,
  );
  const headSingleSituation = buildHeatmapSituation(
    false,
    children,
    disabilityStatus,
    { head: pregnancyStatus.head || false },
    headAge,
  );
  const spouseSingleSituation = buildHeatmapSituation(false, [], {
    head: disabilityStatus.spouse || false,
  }, { head: pregnancyStatus.spouse || false }, spouseAge);

  const [marriedResult, headResult, spouseResult] = await Promise.all([
    callApi(marriedSituation),
    callApi(headSingleSituation),
    callApi(spouseSingleSituation),
  ]);

  const variables = [
    "household_net_income",
    "household_net_income_including_health_benefits",
    "household_benefits",
    "household_refundable_tax_credits",
    "household_tax_before_refundable_credits",
  ];

  const tabNames = [
    "Net Income",
    "Net Income (with Healthcare)",
    "Benefits",
    "Refundable Tax Credits",
    "Tax Before Refundable Credits",
  ];

  const grids = {};

  for (let v = 0; v < variables.length; v++) {
    const varName = variables[v];
    const marriedFlat = extractArray(
      marriedResult,
      "households",
      "your household",
      varName,
      year,
    );
    const headFlat = extractArray(
      headResult,
      "households",
      "your household",
      varName,
      year,
    );
    const spouseFlat = extractArray(
      spouseResult,
      "households",
      "your household",
      varName,
      year,
    );

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
    const transposed = deltaGrid[0].map((_, col) =>
      deltaGrid.map((row) => row[col]),
    );

    if (varName === "household_tax_before_refundable_credits") {
      grids[tabNames[v]] = transposed.map((row) => row.map((val) => -val));
    } else {
      grids[tabNames[v]] = transposed;
    }
  }

  return { grids, maxIncome, count };
}
