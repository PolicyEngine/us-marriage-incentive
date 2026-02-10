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
};

export const PROGRAM_DESCRIPTIONS = {
  // Summary
  "Net Income":
    "Total income after taxes, credits, and benefits. The bottom line of how marriage affects your finances.",
  Benefits:
    "Government assistance programs like SNAP, TANF, and Medicaid. Eligibility often depends on combined household income.",
  "Refundable Tax Credits":
    "Tax credits that can result in a payment even if you owe no tax. Includes EITC, CTC, and premium tax credits.",
  "Taxes Before Refundable Credits":
    "Federal income tax, Social Security, and Medicare taxes before any refundable credits are applied.",
  // Benefits
  SNAP: "Supplemental Nutrition Assistance Program. Benefits are based on household size and income; marriage combines both incomes.",
  TANF: "Temporary Assistance for Needy Families. Cash assistance with income limits that change when households merge.",
  WIC: "Special Supplemental Nutrition Program for Women, Infants, and Children. Eligibility based on household income.",
  SSI: "Supplemental Security Income. Married couples receive less than two individuals would separately.",
  Medicaid:
    "Health coverage with income thresholds based on household size. Marriage can change eligibility.",
  "Free School Meals":
    "National School Lunch Program free meals. Eligibility based on household income relative to the poverty line.",
  "Reduced Price School Meals":
    "National School Lunch Program reduced-price meals. Based on household income between 130%–185% of poverty.",
  Lifeline:
    "FCC program providing discounted phone or internet service to low-income households.",
  ACP: "Affordable Connectivity Program. Broadband subsidy based on household income or program participation.",
  // Credits
  EITC: "Earned Income Tax Credit. Phase-out thresholds are higher for married filers, but combined income can still reduce the credit.",
  CTC: "Child Tax Credit. Income phase-outs differ by filing status; marriage can push income above thresholds.",
  "Premium Tax Credit":
    "ACA marketplace health insurance subsidy. Based on household income relative to the poverty line.",
  CDCC: "Child and Dependent Care Credit. Available to working parents; marriage changes eligible expenses and income limits.",
  // Taxes
  "Income Tax Before Refundable Credits":
    "Federal income tax calculated on combined income. Tax brackets for married filers are not exactly double single brackets.",
  "Self Employment Tax":
    "Social Security and Medicare taxes on self-employment income. Calculated per person, unaffected by marriage.",
  "Employee Social Security Tax":
    "6.2% tax on wages up to the annual cap. Calculated per worker, generally unaffected by marital status.",
  "Employee Medicare Tax":
    "1.45% tax on all wages (plus 0.9% above $200k/$250k married). The additional Medicare tax threshold changes with marriage.",
};

export function formatProgramName(name) {
  if (ACRONYMS[name]) return ACRONYMS[name];
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildRows(categories, marriedValues, separateValues, filterZeros) {
  const rows = [];
  for (let i = 0; i < categories.length; i++) {
    const m = marriedValues[i];
    const s = separateValues[i];
    if (filterZeros && m === 0 && s === 0) continue;
    const delta = m - s;
    const deltaPct = s !== 0 ? delta / s : 0;
    rows.push({
      program: categories[i],
      notMarried: formatCurrency(s),
      married: formatCurrency(m),
      delta: formatCurrency(delta),
      deltaPct: formatPercent(deltaPct),
      rawDelta: delta,
    });
  }
  return rows;
}

function buildBreakdownRows(marriedDict, headDict, spouseDict) {
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

  for (const key of allKeys) {
    const mVal = marriedDict[key] || 0;
    const hVal = headDict[key] || 0;
    const sVal = spouseDict[key] || 0;
    categories.push(formatProgramName(key));
    marriedValues.push(mVal);
    separateValues.push(hVal + sVal);
  }

  return buildRows(categories, marriedValues, separateValues, true);
}

export function computeTableData(results, tab) {
  const { married, headSingle, spouseSingle } = results;

  if (tab === "summary") {
    return buildRows(
      [
        "Net Income",
        "Benefits",
        "Refundable Tax Credits",
        "Taxes Before Refundable Credits",
      ],
      [
        married.aggregates.householdNetIncome,
        married.aggregates.householdBenefits,
        married.aggregates.householdRefundableCredits,
        married.aggregates.householdTaxBeforeCredits,
      ],
      [
        headSingle.aggregates.householdNetIncome +
          spouseSingle.aggregates.householdNetIncome,
        headSingle.aggregates.householdBenefits +
          spouseSingle.aggregates.householdBenefits,
        headSingle.aggregates.householdRefundableCredits +
          spouseSingle.aggregates.householdRefundableCredits,
        headSingle.aggregates.householdTaxBeforeCredits +
          spouseSingle.aggregates.householdTaxBeforeCredits,
      ],
      false,
    );
  }

  if (tab === "benefits") {
    return buildBreakdownRows(
      married.benefits,
      headSingle.benefits,
      spouseSingle.benefits,
    );
  }

  if (tab === "credits") {
    return buildBreakdownRows(
      married.credits,
      headSingle.credits,
      spouseSingle.credits,
    );
  }

  if (tab === "taxes") {
    return buildBreakdownRows(
      married.taxes,
      headSingle.taxes,
      spouseSingle.taxes,
    );
  }

  return [];
}
