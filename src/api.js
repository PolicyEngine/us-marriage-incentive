const API_BASE = "https://api.policyengine.org";
const YEAR = "2024";
const DEFAULT_AGE = 40;

// Variables organized by entity level (verified against the API)
const SPM_UNIT_BENEFITS = [
  "snap",
  "tanf",
  "free_school_meals",
  "reduced_price_school_meals",
  "lifeline",
  "acp",
];

const PERSON_BENEFITS = ["wic", "ssi", "medicaid"];

const TAX_UNIT_CREDITS = ["eitc", "ctc", "premium_tax_credit", "cdcc"];

const TAX_UNIT_TAXES = ["income_tax_before_refundable_credits"];

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
) {
  const members = ["you"];
  const maritalUnitMembers = ["you"];

  const people = {
    you: {
      age: { [YEAR]: DEFAULT_AGE },
      employment_income: { [YEAR]: headIncome },
      is_disabled: { [YEAR]: disabilityStatus.head || false },
    },
  };

  if (spouseIncome !== null) {
    people["your partner"] = {
      age: { [YEAR]: DEFAULT_AGE },
      employment_income: { [YEAR]: spouseIncome },
      is_disabled: { [YEAR]: disabilityStatus.spouse || false },
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
      age: { [YEAR]: child.age },
      employment_income: { [YEAR]: 0 },
      is_disabled: { [YEAR]: child.isDisabled || false },
    };
    members.push(childId);
    maritalUnits[`${childId} marital unit`] = {
      marital_unit_id: { [YEAR]: i + 1 },
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
        state_name: { [YEAR]: stateCode },
      },
    },
  };
}

function addOutputVariables(situation) {
  // Household-level aggregates
  const hh = situation.households["your household"];
  hh.household_net_income = { [YEAR]: null };
  hh.household_benefits = { [YEAR]: null };
  hh.household_refundable_tax_credits = { [YEAR]: null };
  hh.household_tax_before_refundable_credits = { [YEAR]: null };

  // Person-level variables (benefits + taxes)
  for (const personName of Object.keys(situation.people)) {
    const person = situation.people[personName];
    for (const v of [...PERSON_BENEFITS, ...PERSON_TAXES]) {
      person[v] = { [YEAR]: null };
    }
  }

  // SPM-unit benefits
  const spm = situation.spm_units["your spm_unit"];
  for (const v of SPM_UNIT_BENEFITS) {
    spm[v] = { [YEAR]: null };
  }

  // Tax-unit credits and taxes
  const tu = situation.tax_units["your tax unit"];
  for (const v of [...TAX_UNIT_CREDITS, ...TAX_UNIT_TAXES]) {
    tu[v] = { [YEAR]: null };
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

function extractVal(result, entity, name, variable) {
  try {
    const val = result?.[entity]?.[name]?.[variable]?.[YEAR];
    if (val == null) return 0;
    if (Array.isArray(val)) return val[0];
    return val;
  } catch {
    return 0;
  }
}

function extractArray(result, entity, name, variable) {
  try {
    const val = result?.[entity]?.[name]?.[variable]?.[YEAR];
    if (Array.isArray(val)) return val;
    return val != null ? [val] : [];
  } catch {
    return [];
  }
}

function extractDict(result, entity, name, vars) {
  const dict = {};
  for (const v of vars) {
    dict[v] = extractVal(result, entity, name, v);
  }
  return dict;
}

// Sum a person-level variable across all people in the household
function sumPersonVar(result, variable) {
  const people = result?.people || {};
  let total = 0;
  for (const person of Object.values(people)) {
    const val = person?.[variable]?.[YEAR];
    if (typeof val === "number") total += val;
    else if (Array.isArray(val)) total += val[0] || 0;
  }
  return total;
}

function extractPersonDict(result, vars) {
  const dict = {};
  for (const v of vars) {
    dict[v] = sumPersonVar(result, v);
  }
  return dict;
}

export async function getPrograms(
  stateCode,
  headIncome,
  disabilityStatus,
  spouseIncome = null,
  children = [],
) {
  const situation = createSituation(
    stateCode,
    headIncome,
    disabilityStatus,
    spouseIncome,
    children,
  );
  addOutputVariables(situation);

  const result = await callApi(situation);

  // Merge spm_unit + person benefits
  const spmBenefits = extractDict(
    result,
    "spm_units",
    "your spm_unit",
    SPM_UNIT_BENEFITS,
  );
  const personBenefits = extractPersonDict(result, PERSON_BENEFITS);
  const benefits = { ...spmBenefits, ...personBenefits };

  // Merge tax_unit + person taxes
  const tuTaxes = extractDict(
    result,
    "tax_units",
    "your tax unit",
    TAX_UNIT_TAXES,
  );
  const personTaxes = extractPersonDict(result, PERSON_TAXES);
  const taxes = { ...tuTaxes, ...personTaxes };

  return {
    aggregates: {
      householdNetIncome: extractVal(
        result,
        "households",
        "your household",
        "household_net_income",
      ),
      householdBenefits: extractVal(
        result,
        "households",
        "your household",
        "household_benefits",
      ),
      householdRefundableCredits: extractVal(
        result,
        "households",
        "your household",
        "household_refundable_tax_credits",
      ),
      householdTaxBeforeCredits: extractVal(
        result,
        "households",
        "your household",
        "household_tax_before_refundable_credits",
      ),
    },
    benefits,
    credits: extractDict(
      result,
      "tax_units",
      "your tax unit",
      TAX_UNIT_CREDITS,
    ),
    taxes,
  };
}

export async function getCategorizedPrograms(
  stateCode,
  headIncome,
  spouseIncome,
  children,
  disabilityStatus,
) {
  const [married, headSingle, spouseSingle] = await Promise.all([
    getPrograms(
      stateCode,
      headIncome,
      disabilityStatus,
      spouseIncome,
      children,
    ),
    getPrograms(stateCode, headIncome, disabilityStatus, null, children),
    getPrograms(
      stateCode,
      spouseIncome,
      { head: disabilityStatus.spouse || false },
      null,
      [],
    ),
  ]);

  return { married, headSingle, spouseSingle };
}

// Heatmap API calls
export async function getHeatmapData(stateCode, children, disabilityStatus) {
  const maxIncome = 80000;
  const count = 9;

  function buildHeatmapSituation(includeSpouse, childrenList, disability) {
    const situation = createSituation(
      stateCode,
      maxIncome,
      disability,
      includeSpouse ? maxIncome : null,
      childrenList,
    );

    // Only request household-level outputs for heatmap
    const hh = situation.households["your household"];
    hh.household_net_income = { [YEAR]: null };
    hh.household_benefits = { [YEAR]: null };
    hh.household_refundable_tax_credits = { [YEAR]: null };
    hh.household_tax_before_refundable_credits = { [YEAR]: null };

    if (includeSpouse) {
      situation.axes = [
        [
          {
            name: "employment_income",
            count,
            index: 0,
            min: 0,
            max: maxIncome,
            period: YEAR,
          },
        ],
        [
          {
            name: "employment_income",
            count,
            index: 1,
            min: 0,
            max: maxIncome,
            period: YEAR,
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
            period: YEAR,
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
  );
  const headSingleSituation = buildHeatmapSituation(
    false,
    children,
    disabilityStatus,
  );
  const spouseSingleSituation = buildHeatmapSituation(false, [], {
    head: disabilityStatus.spouse || false,
  });

  const [marriedResult, headResult, spouseResult] = await Promise.all([
    callApi(marriedSituation),
    callApi(headSingleSituation),
    callApi(spouseSingleSituation),
  ]);

  const variables = [
    "household_net_income",
    "household_benefits",
    "household_refundable_tax_credits",
    "household_tax_before_refundable_credits",
  ];

  const tabNames = [
    "Net Income",
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
    );
    const headFlat = extractArray(
      headResult,
      "households",
      "your household",
      varName,
    );
    const spouseFlat = extractArray(
      spouseResult,
      "households",
      "your household",
      varName,
    );

    // Reshape married to 9x9
    const marriedGrid = [];
    for (let i = 0; i < count; i++) {
      marriedGrid.push(marriedFlat.slice(i * count, (i + 1) * count));
    }

    // Compute delta: married - (head_single + spouse_single)
    const deltaGrid = marriedGrid.map((row, i) =>
      row.map((val, j) => val - (headFlat[i] + spouseFlat[j])),
    );

    // For taxes, negate the delta (positive tax = penalty)
    if (varName === "household_tax_before_refundable_credits") {
      grids[tabNames[v]] = deltaGrid.map((row) => row.map((val) => -val));
    } else {
      grids[tabNames[v]] = deltaGrid;
    }
  }

  return grids;
}
