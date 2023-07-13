import streamlit as st

#
from policyengine_us import Simulation


# Create a function to get net income for the household, married or separate.


def get_net_incomes(
    state_code, head_employment_income, spouse_employment_income, children=0
):
    # Tuple of net income for separate and married.
    net_income_married = get_net_income(
        state_code,
        head_employment_income,
        spouse_employment_income,
        children=children,
    )
    # Assume the head, not spouse, has the children.
    net_income_head = get_net_income(
        state_code, head_employment_income, children=children
    )
    net_income_spouse = get_net_income(
        state_code, spouse_employment_income, children=0
    )
    return net_income_married, net_income_head, net_income_spouse


DEFAULT_AGE = 40
DEFAULT_CHILD_AGE = 10


# Create a function to get net income for household
def get_net_income(
    state_code,
    head_employment_income,
    spouse_employment_income=None,
    children=0,
):
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
    # Add one child as a person for each child using a for loop.
    for i in range(children):
        situation["people"][f"child {i}"] = {
            "age": {"2023": DEFAULT_CHILD_AGE}
        }
        # Add child to members list.
        members.append(f"child {i}")
        print(i)
    # Create all parent entities.
    situation["families"] = {"your family": {"members": members}}
    situation["marital_units"] = {"your marital unit": {"members": members}}
    situation["tax_units"] = {
        "your tax unit": {"members": members, "premium_tax_credit": 0}
    }
    situation["spm_units"] = {"your spm_unit": {"members": members}}
    situation["households"] = {
        "your household": {
            "members": members,
            "state_name": {"2023": state_code},
        }
    }

    simulation = Simulation(situation=situation)

    return simulation.calculate("household_net_income", 2023)[0]


# Create Streamlit inputs for state code, head income, and spouse income.
state_code = st.text_input("State Code", "CA")
head_employment_income = st.number_input("Head Employment Income", 0)
spouse_employment_income = st.number_input("Spouse Employment Income", 0)
children = st.number_input("Number of Children", 0)

# Get net incomes.
net_income_married, net_income_head, net_income_spouse = get_net_incomes(
    state_code, head_employment_income, spouse_employment_income, children
)

net_income_separate = net_income_head + net_income_spouse

# Determine marriage penalty or bonus, and extent in dollars and percentage.
marriage_bonus = net_income_married - net_income_separate
marriage_bonus_percent = marriage_bonus / net_income_married


# Display net incomes in Streamlit.
st.write("Net Income Married: ", net_income_married)
st.write("Net Income Separate: ", net_income_separate)
st.write("- Head: ", net_income_head)
st.write("- Spouse: ", net_income_spouse)

# Display marriage bonus or penalty in Streamlit as a sentence.
# For example, "You face a marriage [PENALTY/BONUS]"
# "If you file separately, your combined net income will be [X] [more/less] (y%) than if you file together."


def summarize_marriage_bonus(marriage_bonus):
    # Create a string to summarize the marriage bonus or penalty.
    return (
        f"If you file separately, your combined net income will be ${abs(marriage_bonus):,.2f} "
        f"{'less' if marriage_bonus > 0 else 'more'} "
        f"({abs(marriage_bonus_percent):.1%}) than if you file together."
    )


if marriage_bonus > 0:
    st.write("You face a marriage BONUS.")
elif marriage_bonus < 0:
    st.write("You face a marriage PENALTY.")
else:
    st.write("You face no marriage penalty or bonus.")

st.write(summarize_marriage_bonus(marriage_bonus))
