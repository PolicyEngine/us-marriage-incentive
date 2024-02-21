import streamlit as st
import pandas as pd
#
from policyengine_us import Simulation


# Create a function to get net income for the household, married or separate.


def get_net_incomes(state_code, head_employment_income, spouse_employment_income):
    # Tuple of net income for separate and married.
    net_income_married = get_net_income(
        state_code, head_employment_income, spouse_employment_income
    )
    net_income_head = get_net_income(state_code, head_employment_income)
    net_income_spouse = get_net_income(state_code, spouse_employment_income)
    return net_income_married, net_income_head + net_income_spouse


DEFAULT_AGE = 40


def get_programs(state_code, head_employment_income, spouse_employment_income=None):
    # Start by adding the single head.
    situation = {
        "people": {
            "you": {
                "age": {"2023": DEFAULT_AGE},
                "employment_income": {"2023": head_employment_income},
            }
        }
    }
    members = ["you"]
    if spouse_employment_income is not None:
        situation["people"]["your partner"] = {
            "age": {"2023": DEFAULT_AGE},
            "employment_income": {"2023": spouse_employment_income},
        }
        # Add your partner to members list.
        members.append("your partner")
    # Create all parent entities.
    situation["families"] = {"your family": {"members": members}}
    situation["marital_units"] = {"your marital unit": {"members": members}}
    situation["tax_units"] = {"your tax unit": {"members": members}}
    situation["spm_units"] = {"your spm_unit": {"members": members}}
    situation["households"] = {
        "your household": {"members": members, "state_name": {"2023": state_code}}
    }

    simulation = Simulation(situation=situation)
    household_market_income = int(simulation.calculate( "household_market_income", 2023)[0])
    household_benefits = int(simulation.calculate("household_benefits", 2023)[0])
    household_refundable_tax_credits = int(simulation.calculate("household_refundable_tax_credits", 2023)[0])
    household_refundable_tax_credits = int(simulation.calculate("household_refundable_tax_credits", 2023)[0])
    household_tax_before_refundable_credits = int(simulation.calculate("household_tax_before_refundable_credits", 2023)[0])
    snap = int(simulation.calculate( "snap", 2023)[0])
    school_meal_net_subsidy = int(simulation.calculate("school_meal_net_subsidy", 2023)[0])
    tanf = int(simulation.calculate("tanf", 2023)[0])
    spm_unit_wic    = int(simulation.calculate("spm_unit_wic", 2023)[0])
    medicaid    = int(simulation.calculate("medicaid", 2023)[0])
    ssi    = int(simulation.calculate("ssi", 2023)[0])
    eitc = int(simulation.calculate("eitc", 2023)[0])
    refundable_american_opportunity_credit    = int(simulation.calculate("refundable_american_opportunity_credit", 2023)[0])
    refundable_ctc    = int(simulation.calculate("refundable_ctc", 2023)[0])
    recovery_rebate_credit    = int(simulation.calculate("recovery_rebate_credit", 2023)[0])
    refundable_payroll_tax_credit    = int(simulation.calculate("refundable_payroll_tax_credit", 2023)[0])
    premium_tax_credit    = int(simulation.calculate("premium_tax_credit", 2023)[0])
    ecpa_filer_credit    = int(simulation.calculate("ecpa_filer_credit", 2023)[0])
    ecpa_adult_dependent_credit    = int(simulation.calculate("ecpa_adult_dependent_credit", 2023)[0])

    return [household_market_income ,household_benefits ,household_refundable_tax_credits,household_tax_before_refundable_credits]
def get_categorized_programs(state_code, head_employment_income, spouse_employment_income):
     programs_married = get_programs(state_code, head_employment_income, spouse_employment_income)
     programs_head = get_programs(state_code, head_employment_income)
     programs_spouse = get_programs(state_code, spouse_employment_income)
     return [programs_married, programs_head, programs_spouse]

# Create a function to get net income for household
def get_net_income(state_code, head_employment_income, spouse_employment_income=None):
    # Start by adding the single head.
    situation = {
        "people": {
            "you": {
                "age": {"2023": DEFAULT_AGE},
                "employment_income": {"2023": head_employment_income},
            }
        }
    }
    members = ["you"]
    if spouse_employment_income is not None:
        situation["people"]["your partner"] = {
            "age": {"2023": DEFAULT_AGE},
            "employment_income": {"2023": spouse_employment_income},
        }
        # Add your partner to members list.
        members.append("your partner")
    # Create all parent entities.
    situation["families"] = {"your family": {"members": members}}
    situation["marital_units"] = {"your marital unit": {"members": members}}
    situation["tax_units"] = {"your tax unit": {"members": members}}
    situation["spm_units"] = {"your spm_unit": {"members": members}}
    situation["households"] = {
        "your household": {"members": members, "state_name": {"2023": state_code}}
    }

    simulation = Simulation(situation=situation)

    return simulation.calculate("household_net_income", 2023)[0]
# st.set_page_config(
#     page_title="My Streamlit App",
#     layout="wide",  # or "centered"
#     initial_sidebar_state="expanded"  # or "collapsed"
# )

# Create Streamlit inputs for state code, head income, and spouse income.
state_code = st.text_input("State Code", "CA")
head_employment_income = st.number_input("Head Employment Income", 0)
spouse_employment_income = st.number_input("Spouse Employment Income", 0)

# Get net incomes.
net_income_married, net_income_separate = get_net_incomes(
    state_code, head_employment_income, spouse_employment_income
)
programs = get_categorized_programs(state_code, head_employment_income, spouse_employment_income)
married_programs = programs[0]
head_separate = programs[1]
spouse_separate = programs[2]
separate = [x + y for x, y in zip(head_separate, spouse_separate)]
delta = [x - y for x, y in zip(married_programs, separate)]

programs = ["household_market_income", "household_benefits", "household_refundable_tax_credits", "household_tax_before_refundable_credits"]



# Determine marriage penalty or bonus, and extent in dollars and percentage.
marriage_bonus = net_income_married - net_income_separate
marriage_bonus_percent = marriage_bonus / net_income_married


# Display net incomes in Streamlit.
st.write("Net Income Married: ", net_income_married)
st.write("Net Income Not Married: ", net_income_separate)

# Display marriage bonus or penalty in Streamlit as a sentence.
# For example, "You face a marriage [PENALTY/BONUS]"
# "If you file separately, your combined net income will be [X] [more/less] (y%) than if you file together."


def summarize_marriage_bonus(marriage_bonus):
    # Create a string to summarize the marriage bonus or penalty.
    return (
        f"If you file separately, your combined net income will be ${abs(marriage_bonus):,.2f} "
        f"{'less' if marriage_bonus > 0 else 'more'} "
        f"({abs(marriage_bonus_percent):.2f}%) than if you file together."
    )


if marriage_bonus > 0:
    st.write("You face a marriage BONUS.")
elif marriage_bonus < 0:
    st.write("You face a marriage PENALTY.")
else:
    st.write("You face no marriage penalty or bonus.")

st.write(summarize_marriage_bonus(marriage_bonus))
# Sample data
data = {
    'Program': programs,
    'Married': married_programs,
    'Not Married': separate,
    'Delta ': delta
}

# Create a DataFrame
#df = pd.DataFrame(data)

# Display the table in Streamlit
st.table(data)
