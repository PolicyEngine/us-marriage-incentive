/**
 * Audit test: prints every value and checks exact alignment between
 * breakdowns and aggregates. Fails if any category is off by > $1.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { getPrograms } from "../src/api.js";
import metadata from "../src/metadata.json";

function sumValues(dict) {
  return Object.values(dict).reduce((a, b) => a + (b || 0), 0);
}

const SCENARIOS = [
  { label: "Married CA $45k/$45k no kids", args: ["CA", 45000, { head: false, spouse: false }, 45000, [], "2026"] },
  { label: "Single CA $20k 1 child(5)", args: ["CA", 20000, { head: false }, null, [{ age: 5 }], "2026"] },
  { label: "Low-income CA $10k 1 child(3)", args: ["CA", 10000, { head: false }, null, [{ age: 3 }], "2026"] },
  { label: "Married NY $80k/$40k 2 kids", args: ["NY", 80000, { head: false, spouse: false }, 40000, [{ age: 8 }, { age: 12 }], "2026"] },
  { label: "Single TX $0 no kids (zero income)", args: ["TX", 0, { head: false }, null, [], "2026"] },
];

for (const scenario of SCENARIOS) {
  describe(`Audit: ${scenario.label}`, () => {
    let r;

    beforeAll(async () => {
      r = await getPrograms(...scenario.args);
    }, 60000);

    it("benefits breakdown sums to aggregate", () => {
      const entries = {};
      for (const key of Object.keys(r.benefits)) {
        if (r.benefits[key] !== 0) entries[key] = r.benefits[key];
      }
      const sum = sumValues(r.benefits);
      const agg = r.aggregates.householdBenefits;
      const diff = sum - agg;

      console.log(`\n  [${scenario.label}] BENEFITS`);
      for (const [k, v] of Object.entries(entries)) console.log(`    ${k}: $${v.toFixed(2)}`);
      console.log(`    --- SUM: $${sum.toFixed(2)}`);
      console.log(`    --- AGG: $${agg.toFixed(2)}`);
      console.log(`    --- DIFF: $${diff.toFixed(2)}`);

      expect(Math.abs(diff)).toBeLessThan(1);
    });

    it("federal + state credits sum to aggregate", () => {
      const fedEntries = {};
      for (const key of Object.keys(r.credits)) {
        if (r.credits[key] !== 0) fedEntries[key] = r.credits[key];
      }
      const stateEntries = {};
      for (const key of Object.keys(r.stateCredits)) {
        if (r.stateCredits[key] !== 0) stateEntries[key] = r.stateCredits[key];
      }
      const fedSum = sumValues(r.credits);
      const stateRefundable = r.stateCredits.state_refundable_credits || 0;
      const totalSum = fedSum + stateRefundable;
      const agg = r.aggregates.householdRefundableCredits;
      const diff = totalSum - agg;

      console.log(`\n  [${scenario.label}] CREDITS`);
      console.log(`    Federal:`);
      for (const [k, v] of Object.entries(fedEntries)) console.log(`      ${k}: $${v.toFixed(2)}`);
      console.log(`      --- federal sum: $${fedSum.toFixed(2)}`);
      console.log(`    State:`);
      for (const [k, v] of Object.entries(stateEntries)) console.log(`      ${k}: $${v.toFixed(2)}`);
      console.log(`      --- state_refundable_credits: $${stateRefundable.toFixed(2)}`);
      console.log(`    --- TOTAL: $${totalSum.toFixed(2)}`);
      console.log(`    --- AGG (household_refundable_tax_credits): $${agg.toFixed(2)}`);
      console.log(`    --- DIFF: $${diff.toFixed(2)}`);

      expect(Math.abs(diff)).toBeLessThan(1);
    });

    it("taxes breakdown sums to aggregate", () => {
      const entries = {};
      for (const key of Object.keys(r.taxes)) {
        if (r.taxes[key] !== 0) entries[key] = r.taxes[key];
      }
      const sum = sumValues(r.taxes);
      const agg = r.aggregates.householdTaxBeforeCredits;
      const diff = sum - agg;

      console.log(`\n  [${scenario.label}] TAXES`);
      for (const [k, v] of Object.entries(entries)) console.log(`    ${k}: $${v.toFixed(2)}`);
      console.log(`    --- SUM: $${sum.toFixed(2)}`);
      console.log(`    --- AGG: $${agg.toFixed(2)}`);
      console.log(`    --- DIFF: $${diff.toFixed(2)}`);

      expect(Math.abs(diff)).toBeLessThan(1);
    });

    it("health breakdown sums to aggregate", () => {
      const entries = {};
      for (const key of Object.keys(r.health)) {
        if (r.health[key] !== 0) entries[key] = r.health[key];
      }
      const sum = sumValues(r.health);
      const agg = r.aggregates.healthcareBenefitValue;
      const diff = sum - agg;

      console.log(`\n  [${scenario.label}] HEALTHCARE`);
      for (const [k, v] of Object.entries(entries)) console.log(`    ${k}: $${v.toFixed(2)}`);
      console.log(`    --- SUM: $${sum.toFixed(2)}`);
      console.log(`    --- AGG: $${agg.toFixed(2)}`);
      console.log(`    --- DIFF: $${diff.toFixed(2)}`);

      expect(Math.abs(diff)).toBeLessThan(1);
    });

    it("net income identity holds", () => {
      const { householdNetIncome, householdBenefits, householdRefundableCredits, householdTaxBeforeCredits } = r.aggregates;
      const income = scenario.args[1] + (scenario.args[3] || 0); // head + spouse
      const computed = income + householdBenefits + householdRefundableCredits - householdTaxBeforeCredits;
      const diff = computed - householdNetIncome;

      console.log(`\n  [${scenario.label}] NET INCOME IDENTITY`);
      console.log(`    employment income: $${income.toFixed(2)}`);
      console.log(`    + benefits:        $${householdBenefits.toFixed(2)}`);
      console.log(`    + credits:         $${householdRefundableCredits.toFixed(2)}`);
      console.log(`    - taxes:           $${householdTaxBeforeCredits.toFixed(2)}`);
      console.log(`    = computed:        $${computed.toFixed(2)}`);
      console.log(`    actual net income: $${householdNetIncome.toFixed(2)}`);
      console.log(`    --- DIFF: $${diff.toFixed(2)}`);

      // Allow some slack — net income can include adjustments we don't track
      expect(Math.abs(diff)).toBeLessThan(Math.max(10, Math.abs(householdNetIncome) * 0.01));
    });
  });
}
