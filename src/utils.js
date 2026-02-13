export const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

export function formatCurrency(value) {
  const rounded = Math.round(value);
  const formatted = Math.abs(rounded).toLocaleString();
  return rounded < 0 ? `-$${formatted}` : `$${formatted}`;
}

export function formatPercent(value) {
  return (value * 100).toFixed(1) + "%";
}

const ACRONYMS = {
  eitc: "EITC",
  snap: "SNAP",
  tanf: "TANF",
  wic: "WIC",
  ssi: "SSI",
  acp: "ACP",
  ctc: "CTC",
  cdcc: "CDCC",
  chip: "CHIP",
  per_capita_chip: "CHIP",
};

export const PROGRAM_DESCRIPTIONS = {
  // Summary
  "Net Income":
    "Total income after taxes, credits, and benefits. Does not include the value of healthcare coverage.",
  "Healthcare Benefits":
    "Cash equivalent value of healthcare coverage (Medicaid, CHIP, ACA premium subsidies). Not included in net income.",
  Benefits:
    "Government assistance programs like SNAP, TANF, and Head Start. Eligibility often depends on combined household income.",
  "Refundable Tax Credits":
    "Tax credits that can result in a payment even if you owe no tax. Includes EITC and CTC.",
  "Taxes Before Refundable Credits":
    "Federal income tax, Social Security, and Medicare taxes before any refundable credits are applied.",
  // Benefits
  SNAP: "Supplemental Nutrition Assistance Program. Benefits are based on household size and income; marriage combines both incomes.",
  TANF: "Temporary Assistance for Needy Families. Cash assistance with income limits that change when households merge.",
  WIC: "Special Supplemental Nutrition Program for Women, Infants, and Children. Eligibility based on household income.",
  SSI: "Supplemental Security Income. Married couples receive less than two individuals would separately.",
  "Social Security":
    "Social Security benefits including retirement, disability, and survivors benefits.",
  "Head Start":
    "Federal preschool program for children ages 3–5 from low-income families.",
  "Early Head Start":
    "Federal program for infants and toddlers (0–3) from low-income families. Includes childcare and development services.",
  "Free School Meals":
    "National School Lunch Program free meals. Eligibility based on household income relative to the poverty line.",
  "Reduced Price School Meals":
    "National School Lunch Program reduced-price meals. Based on household income between 130%–185% of poverty.",
  Lifeline:
    "FCC program providing discounted phone or internet service to low-income households.",
  ACP: "Affordable Connectivity Program. Broadband subsidy based on household income or program participation.",
  "Other Benefits":
    "Additional government benefits not individually listed, as computed by PolicyEngine.",
  // Healthcare
  Medicaid:
    "Health coverage with income thresholds based on household size. Marriage can change eligibility.",
  CHIP:
    "Children's Health Insurance Program. Provides health coverage for children in families with incomes too high for Medicaid.",
  "Premium Tax Credit":
    "ACA marketplace health insurance subsidy. Based on household income relative to the poverty line.",
  "Other Healthcare":
    "Additional healthcare benefits not individually listed, as computed by PolicyEngine.",
  // Credits
  EITC: "Earned Income Tax Credit. Phase-out thresholds are higher for married filers, but combined income can still reduce the credit.",
  CTC: "Child Tax Credit. Income phase-outs differ by filing status; marriage can push income above thresholds.",
  CDCC: "Child and Dependent Care Credit. Available to working parents; marriage changes eligible expenses and income limits.",
  "Other Credits":
    "Additional refundable tax credits not individually listed, as computed by PolicyEngine.",
  // Taxes
  "Income Tax Before Refundable Credits":
    "Federal income tax calculated on combined income. Tax brackets for married filers are not exactly double single brackets.",
  "Self Employment Tax":
    "Social Security and Medicare taxes on self-employment income. Calculated per person, unaffected by marriage.",
  "Employee Social Security Tax":
    "6.2% tax on wages up to the annual cap. Calculated per worker, generally unaffected by marital status.",
  "Employee Medicare Tax":
    "1.45% tax on all wages (plus 0.9% above $200k/$250k married). The additional Medicare tax threshold changes with marriage.",
  // State credits
  "State EITC":
    "State-level Earned Income Tax Credit. Many states offer their own EITC as a percentage of the federal credit.",
  "State CTC":
    "State-level Child Tax Credit. Some states provide additional child tax credits beyond the federal CTC.",
  "State CDCC":
    "State-level Child and Dependent Care Credit. State version of the federal dependent care credit.",
  "State Refundable Credits":
    "Total state refundable tax credits. Includes state EITC, CTC, and other refundable credits.",
  "State Income Tax Before Refundable Credits":
    "State income tax liability before applying state refundable credits.",
  "Other Taxes":
    "Additional taxes not individually listed, as computed by PolicyEngine.",
};

export function formatProgramName(name) {
  if (ACRONYMS[name]) return ACRONYMS[name];
  return name
    .split("_")
    .map((word) => ACRONYMS[word] || word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildRows(categories, marriedValues, separateValues, headValues, spouseValues, filterZeros) {
  const rows = [];
  for (let i = 0; i < categories.length; i++) {
    const m = marriedValues[i];
    const s = separateValues[i];
    if (filterZeros && m === 0 && s === 0) continue;
    const delta = m - s;
    const deltaPct = s !== 0 ? delta / s : 0;
    rows.push({
      program: categories[i],
      headSingle: headValues ? formatCurrency(headValues[i]) : null,
      spouseSingle: spouseValues ? formatCurrency(spouseValues[i]) : null,
      notMarried: formatCurrency(s),
      married: formatCurrency(m),
      delta: formatCurrency(delta),
      deltaPct: formatPercent(deltaPct),
      rawDelta: delta,
    });
  }
  return rows;
}

function buildBreakdownRows(marriedDict, headDict, spouseDict, alwaysShowKeys) {
  const alwaysShow = new Set((alwaysShowKeys || []).map(formatProgramName));
  const allKeys = [
    ...new Set([
      ...Object.keys(marriedDict),
      ...Object.keys(headDict),
      ...Object.keys(spouseDict),
    ]),
  ];
  const categories = [];
  const marriedValues = [];
  const separateValues = [];
  const headValues = [];
  const spouseValues = [];

  for (const key of allKeys) {
    const mVal = marriedDict[key] || 0;
    const hVal = headDict[key] || 0;
    const sVal = spouseDict[key] || 0;
    const name = formatProgramName(key);
    // Skip zeros unless this key is in alwaysShow
    if (mVal === 0 && hVal === 0 && sVal === 0 && !alwaysShow.has(name)) continue;
    categories.push(name);
    marriedValues.push(mVal);
    separateValues.push(hVal + sVal);
    headValues.push(hVal);
    spouseValues.push(sVal);
  }

  return buildRows(categories, marriedValues, separateValues, headValues, spouseValues, false);
}

function sumDict(dict) {
  return Object.values(dict || {}).reduce((a, b) => a + b, 0);
}

function addOtherRow(rows, label, aggMarried, aggHead, aggSpouse, trackedMarried, trackedHead, trackedSpouse) {
  const otherM = aggMarried - trackedMarried;
  const otherH = aggHead - trackedHead;
  const otherS = aggSpouse - trackedSpouse;
  const otherTotal = otherH + otherS;
  if (Math.abs(otherM) < 1 && Math.abs(otherTotal) < 1) return;
  const delta = otherM - otherTotal;
  rows.push({
    program: label,
    headSingle: formatCurrency(otherH),
    spouseSingle: formatCurrency(otherS),
    notMarried: formatCurrency(otherTotal),
    married: formatCurrency(otherM),
    delta: formatCurrency(delta),
    deltaPct: formatPercent(otherTotal !== 0 ? delta / otherTotal : 0),
    rawDelta: delta,
  });
}

export function computeTableData(results, tab) {
  const { married, headSingle, spouseSingle } = results;

  if (tab === "summary") {
    return buildRows(
      ["Net Income", "Healthcare Benefits", "Benefits", "Refundable Tax Credits", "Taxes Before Refundable Credits"],
      [
        married.aggregates.householdNetIncome,
        married.aggregates.healthcareBenefitValue,
        married.aggregates.householdBenefits,
        married.aggregates.householdRefundableCredits,
        married.aggregates.householdTaxBeforeCredits,
      ],
      [
        headSingle.aggregates.householdNetIncome +
          spouseSingle.aggregates.householdNetIncome,
        headSingle.aggregates.healthcareBenefitValue +
          spouseSingle.aggregates.healthcareBenefitValue,
        headSingle.aggregates.householdBenefits +
          spouseSingle.aggregates.householdBenefits,
        headSingle.aggregates.householdRefundableCredits +
          spouseSingle.aggregates.householdRefundableCredits,
        headSingle.aggregates.householdTaxBeforeCredits +
          spouseSingle.aggregates.householdTaxBeforeCredits,
      ],
      [
        headSingle.aggregates.householdNetIncome,
        headSingle.aggregates.healthcareBenefitValue,
        headSingle.aggregates.householdBenefits,
        headSingle.aggregates.householdRefundableCredits,
        headSingle.aggregates.householdTaxBeforeCredits,
      ],
      [
        spouseSingle.aggregates.householdNetIncome,
        spouseSingle.aggregates.healthcareBenefitValue,
        spouseSingle.aggregates.householdBenefits,
        spouseSingle.aggregates.householdRefundableCredits,
        spouseSingle.aggregates.householdTaxBeforeCredits,
      ],
      false,
    );
  }

  if (tab === "benefits") {
    const rows = buildBreakdownRows(
      married.benefits,
      headSingle.benefits,
      spouseSingle.benefits,
    );
    addOtherRow(rows, "Other Benefits",
      married.aggregates.householdBenefits,
      headSingle.aggregates.householdBenefits,
      spouseSingle.aggregates.householdBenefits,
      sumDict(married.benefits),
      sumDict(headSingle.benefits),
      sumDict(spouseSingle.benefits),
    );
    return rows;
  }

  if (tab === "healthcare") {
    const rows = buildBreakdownRows(
      married.health,
      headSingle.health,
      spouseSingle.health,
    );
    addOtherRow(rows, "Other Healthcare",
      married.aggregates.healthcareBenefitValue,
      headSingle.aggregates.healthcareBenefitValue,
      spouseSingle.aggregates.healthcareBenefitValue,
      sumDict(married.health),
      sumDict(headSingle.health),
      sumDict(spouseSingle.health),
    );
    return rows;
  }

  if (tab === "credits") {
    const rows = buildBreakdownRows(
      married.credits,
      headSingle.credits,
      spouseSingle.credits,
    );
    addOtherRow(rows, "Other Credits",
      married.aggregates.householdRefundableCredits,
      headSingle.aggregates.householdRefundableCredits,
      spouseSingle.aggregates.householdRefundableCredits,
      sumDict(married.credits),
      sumDict(headSingle.credits),
      sumDict(spouseSingle.credits),
    );
    return rows;
  }

  if (tab === "taxes") {
    // Ensure federal and state income tax always appear, even if $0
    const alwaysShow = ["income_tax_before_refundable_credits", "state_income_tax_before_refundable_credits"];
    const ensure = (dict) => {
      const d = { ...dict };
      for (const key of alwaysShow) if (!(key in d)) d[key] = 0;
      return d;
    };
    const rows = buildBreakdownRows(
      ensure(married.taxes),
      ensure(headSingle.taxes),
      ensure(spouseSingle.taxes),
      alwaysShow,
    );
    addOtherRow(rows, "Other Taxes",
      married.aggregates.householdTaxBeforeCredits,
      headSingle.aggregates.householdTaxBeforeCredits,
      spouseSingle.aggregates.householdTaxBeforeCredits,
      sumDict(married.taxes),
      sumDict(headSingle.taxes),
      sumDict(spouseSingle.taxes),
    );
    return rows;
  }

  if (tab === "state") {
    const strip = (d) => {
      const o = { ...d };
      delete o.state_refundable_credits;
      return o;
    };
    return buildBreakdownRows(
      { ...strip(married.stateCredits || {}), ...(married.stateTaxes || {}) },
      { ...strip(headSingle.stateCredits || {}), ...(headSingle.stateTaxes || {}) },
      { ...strip(spouseSingle.stateCredits || {}), ...(spouseSingle.stateTaxes || {}) },
    );
  }

  return [];
}
