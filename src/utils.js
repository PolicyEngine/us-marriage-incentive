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

export function formatProgramName(name) {
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
