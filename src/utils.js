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

export function formatCurrency(value, showPlus = false) {
  const rounded = Math.round(value);
  const formatted = Math.abs(rounded).toLocaleString();
  if (rounded < 0) return `-$${formatted}`;
  if (showPlus && rounded > 0) return `+$${formatted}`;
  return `$${formatted}`;
}

export function formatPercent(value, showPlus = false) {
  const pct = (value * 100).toFixed(1) + "%";
  if (value < 0) return pct;
  if (showPlus && value > 0) return "+" + pct;
  return pct;
}

const ACRONYMS = {
  eitc: "EITC",
  snap: "SNAP",
  tanf: "TANF",
  wic: "WIC",
  ssi: "SSI",
  chip: "CHIP",
  ctc: "CTC",
  cdcc: "CDCC",
  ptc: "PTC",
  aca: "ACA",
  per_capita_chip: "CHIP",
  spm: "SPM",
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
    "Federal and state income tax, payroll taxes, and other taxes before any refundable credits are applied.",
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
  "SPM Unit Broadband Subsidy":
    "Broadband internet subsidy for low-income households.",
  "Unemployment Compensation":
    "Unemployment insurance benefits for workers who have lost their jobs.",
  "SPM Unit Capped Housing Subsidy":
    "Housing subsidies including Section 8 vouchers and public housing assistance.",
  "High Efficiency Electric Home Rebate":
    "Rebate for purchasing high-efficiency electric home appliances under the Inflation Reduction Act.",
  "Residential Efficiency Electrification Rebate":
    "Rebate for home energy efficiency improvements and electrification under the Inflation Reduction Act.",
  "Basic Income":
    "Universal or targeted basic income programs.",
  "Household State Benefits":
    "State-specific benefit programs (e.g., CalWORKs, state supplements).",
  "Commodity Supplemental Food Program":
    "USDA program providing food packages to low-income elderly individuals.",
  "Other Benefits":
    "Additional government benefits not individually listed, as computed by PolicyEngine.",
  // Healthcare
  "Medicaid Cost":
    "Cash equivalent value of Medicaid health coverage. Eligibility thresholds depend on household income; marriage can change eligibility.",
  CHIP:
    "Children's Health Insurance Program. Provides health coverage for children in families with incomes too high for Medicaid.",
  "ACA PTC":
    "ACA marketplace premium tax credit. Subsidizes health insurance based on household income relative to the poverty line.",
  "Co Omnisalud":
    "Colorado OmniSalud program providing health coverage regardless of immigration status.",
  "Or Healthier Oregon Cost":
    "Oregon Healthier Oregon program extending health coverage to additional residents.",
  "Other Healthcare":
    "Additional healthcare benefits not individually listed, as computed by PolicyEngine.",
  // Credits
  EITC: "Earned Income Tax Credit. Phase-out thresholds are higher for married filers, but combined income can still reduce the credit.",
  "Refundable CTC":
    "Refundable portion of the Child Tax Credit. Income phase-outs differ by filing status; marriage can push income above thresholds.",
  "Refundable American Opportunity Credit":
    "Refundable portion of the American Opportunity education tax credit.",
  "Recovery Rebate Credit":
    "Economic stimulus payment delivered as a refundable tax credit.",
  "Refundable Payroll Tax Credit":
    "Refundable credit offsetting payroll taxes for eligible workers.",
  "Other Credits":
    "Additional refundable tax credits not individually listed, as computed by PolicyEngine.",
  // Taxes
  "Employee Payroll Tax":
    "Employee-side Social Security (6.2%) and Medicare (1.45%) taxes. The additional Medicare tax threshold changes with marriage.",
  "Self Employment Tax":
    "Social Security and Medicare taxes on self-employment income. Calculated per person, unaffected by marriage.",
  "Income Tax Before Refundable Credits":
    "Federal income tax calculated on combined income. Tax brackets for married filers are not exactly double single brackets.",
  "Flat Tax":
    "Flat tax on income, if applicable.",
  "Household State Tax Before Refundable Credits":
    "Total state income tax before applying state refundable credits.",
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
    .split(/[_ ]+/)
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
      delta: formatCurrency(delta, true),
      deltaPct: formatPercent(deltaPct, true),
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

export function computeTableData(results, tab, { showHealth = false } = {}) {
  const { married, headSingle, spouseSingle } = results;

  if (tab === "summary") {
    const netKey = showHealth ? "householdNetIncomeWithHealth" : "householdNetIncome";
    const netLabel = showHealth ? "Net Income (incl. Healthcare)" : "Net Income";
    const categories = [
      netLabel,
      ...(showHealth ? ["Healthcare Benefits"] : []),
      "Benefits", "Refundable Tax Credits", "Taxes Before Refundable Credits",
    ];

    const mVals = [
      married.aggregates[netKey],
      ...(showHealth ? [married.aggregates.healthcareBenefitValue] : []),
      married.aggregates.householdBenefits,
      married.aggregates.householdRefundableCredits,
      married.aggregates.householdTaxBeforeCredits,
    ];
    const sVals = [
      headSingle.aggregates[netKey] + spouseSingle.aggregates[netKey],
      ...(showHealth ? [headSingle.aggregates.healthcareBenefitValue + spouseSingle.aggregates.healthcareBenefitValue] : []),
      headSingle.aggregates.householdBenefits + spouseSingle.aggregates.householdBenefits,
      headSingle.aggregates.householdRefundableCredits + spouseSingle.aggregates.householdRefundableCredits,
      headSingle.aggregates.householdTaxBeforeCredits + spouseSingle.aggregates.householdTaxBeforeCredits,
    ];
    const hVals = [
      headSingle.aggregates[netKey],
      ...(showHealth ? [headSingle.aggregates.healthcareBenefitValue] : []),
      headSingle.aggregates.householdBenefits,
      headSingle.aggregates.householdRefundableCredits,
      headSingle.aggregates.householdTaxBeforeCredits,
    ];
    const spVals = [
      spouseSingle.aggregates[netKey],
      ...(showHealth ? [spouseSingle.aggregates.healthcareBenefitValue] : []),
      spouseSingle.aggregates.householdBenefits,
      spouseSingle.aggregates.householdRefundableCredits,
      spouseSingle.aggregates.householdTaxBeforeCredits,
    ];

    const rows = buildRows(categories, mVals, sVals, hVals, spVals, false);
    // Invert coloring for the taxes row: reduction = green
    const taxRow = rows.find((r) => r.program === "Taxes Before Refundable Credits");
    if (taxRow) taxRow.rawDelta = -taxRow.rawDelta;
    return rows;
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
    // Federal-only aggregate = total credits - state credits
    const fedAgg = (r) =>
      r.aggregates.householdRefundableCredits - r.aggregates.householdRefundableStateCredits;
    const rows = buildBreakdownRows(
      married.credits,
      headSingle.credits,
      spouseSingle.credits,
    );
    addOtherRow(rows, "Other Credits",
      fedAgg(married),
      fedAgg(headSingle),
      fedAgg(spouseSingle),
      sumDict(married.credits),
      sumDict(headSingle.credits),
      sumDict(spouseSingle.credits),
    );
    return rows;
  }

  if (tab === "taxes") {
    // taxes dict now includes federal + state aggregate + payroll taxes
    const alwaysShow = ["income_tax_before_refundable_credits", "household_state_tax_before_refundable_credits"];
    const rows = buildBreakdownRows(
      married.taxes,
      headSingle.taxes,
      spouseSingle.taxes,
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
    // Invert coloring: tax reduction = green, tax increase = red
    for (const row of rows) row.rawDelta = -row.rawDelta;
    return rows;
  }

  if (tab === "state") {
    // Strip the aggregate key only when per-state breakout entries exist;
    // otherwise keep it so we still show a row (e.g. heatmap cell clicks
    // or states without discovered per-state credits).
    const strip = (d) => {
      const o = { ...d };
      if (Object.keys(o).length > 1) {
        delete o.state_refundable_credits;
      }
      return o;
    };
    return buildBreakdownRows(
      strip(married.stateCredits || {}),
      strip(headSingle.stateCredits || {}),
      strip(spouseSingle.stateCredits || {}),
    );
  }

  return [];
}
