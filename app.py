import streamlit as st
import math
#
from policyengine_us import Simulation


# Create a function to get net income for the household, married or separate.


def get_net_incomes(state_code, head_employment_income, spouse_employment_income, children_ages = {}):
    # Tuple of net income for separate and married.
    net_income_married = get_net_income(
        state_code, head_employment_income, spouse_employment_income, children_ages
    )
    net_income_head = get_net_income(state_code, head_employment_income, None,children_ages)
    net_income_spouse = get_net_income(state_code, spouse_employment_income, None, children_ages={})
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

    #household market income calculation
    hmi_result = simulation.calculate("household_market_income", 2023)[0]

    # Check if the result is NaN
    if math.isnan(hmi_result):
    # Handle the NaN case (e.g., set to a default value)
        household_market_income = 0  # Or any other default value
    else:
        # Convert the result to an integer
        household_market_income = int(hmi_result)

    # household_benefits calculation
    hb_result = simulation.calculate("household_benefits", 2023)[0]

    # Check if the result is NaN
    if math.isnan(hb_result):
    # Handle the NaN case (e.g., set to a default value)
        household_benefits = 0  # Or any other default value
    else:
        # Convert the result to an integer
        household_benefits = int(hb_result)

    # household_refundable_tax_credits calculation
    hrtc_result = simulation.calculate("household_refundable_tax_credits", 2023)[0]
    # Check if the result is NaN
    if math.isnan(hrtc_result):
    # Handle the NaN case (e.g., set to a default value)
        household_refundable_tax_credits = 0  # Or any other default value
    else:
        # Convert the result to an integer
        household_refundable_tax_credits = int(hrtc_result)
    

    # household_tax_before_refundable_credits calculation
    htbrc_result = simulation.calculate("household_tax_before_refundable_credits", 2023)[0]

    # Check if the result is NaN
    if math.isnan(htbrc_result):
    # Handle the NaN case (e.g., set to a default value)
        household_tax_before_refundable_credits = 0  # Or any other default value
    else:
        # Convert the result to an integer
        household_tax_before_refundable_credits = int(htbrc_result)
   

    return [household_market_income ,household_benefits ,household_refundable_tax_credits,household_tax_before_refundable_credits]
def get_categorized_programs(state_code, head_employment_income, spouse_employment_income):
     programs_married = get_programs(state_code, head_employment_income, spouse_employment_income)
     programs_head = get_programs(state_code, head_employment_income)
     programs_spouse = get_programs(state_code, spouse_employment_income)
     return [programs_married, programs_head, programs_spouse]

# Create a function to get net income for household
def get_net_income(state_code, head_employment_income, spouse_employment_income=None, children_ages = {}):
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
    for key, value in children_ages.items():
        situation["people"][f"child {key}"] = {
            "age": {"2023": value}
        }
        # Add child to members list.
        members.append(f"child {key}")
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

#Streamlit heading and description
header = st.header("Marriage Incentive Calculator")  
header_description = st.write("This application evaluates marriage penalties and bonuses of couples, based on state and individual employment income")
repo_link = st.markdown("This application utilizes the policyengine API <a href='https://github.com/PolicyEngine/us-marriage-incentive'>link</a>", unsafe_allow_html=True)  


# Create Streamlit inputs for state code, head income, and spouse income.
state_code = st.text_input("State Code", "CA")
head_employment_income = st.number_input("Head Employment Income", 0)
spouse_employment_income = st.number_input("Spouse Employment Income", 0)
num_children = st.number_input("Number of Children", 0)
children_ages = {}
for num in range(1,num_children + 1):
    children_ages[num] = st.number_input(f"Child {num} Age", 0)
#submit button
submit = st.button("Calculate")
# Get net incomes.
if submit:
    net_income_married, net_income_separate = get_net_incomes(
        state_code, head_employment_income, spouse_employment_income, children_ages
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