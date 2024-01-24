import streamlit as st
import numpy as np
import plotly.graph_objs as go
#
from policyengine_us import Simulation
from policyengine_core.charts import format_fig, BLUE, GRAY, DARK_GRAY
from joblib import Parallel, delayed
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

# Create a function to get net income for household
def get_net_income(state_code, head_employment_income, spouse_employment_income=None):
    head_employment_income = int(head_employment_income)
    if spouse_employment_income is not None:
        spouse_employment_income = int(spouse_employment_income)

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

# Create Streamlit inputs for state code, head income, and spouse income.
state_code = st.text_input("State Code", "CA")
head_employment_income = st.number_input("Head Employment Income", 0)
spouse_employment_income = st.number_input("Spouse Employment Income", 0)

# Get net incomes.
net_income_married, net_income_separate = get_net_incomes(
    state_code, head_employment_income, spouse_employment_income
)

# Determine marriage penalty or bonus, and extent in dollars and percentage.
marriage_bonus = net_income_married - net_income_separate
marriage_bonus_percent = marriage_bonus / net_income_married

def generate_heatmap_data(state_code):
    income_range = np.arange(0, 80001, 5000)  # Adjust the step size if needed
    data = np.zeros((len(income_range), len(income_range)), dtype=bool)

    # Function to process each income pair
    def process_income_pair(i, j):
        head_income = income_range[i]
        spouse_income = income_range[j]
        net_income_married, net_income_separate = get_net_incomes(state_code, head_income, spouse_income)
        return net_income_married < net_income_separate  # True for penalty, False otherwise

    # Generate heatmap data using parallel processing
    results = Parallel(n_jobs=-1)(delayed(process_income_pair)(i, j) for i in range(len(income_range)) for j in range(len(income_range)))
    
    # Reshape results back into a matrix
    for idx, value in enumerate(results):
        i = idx // len(income_range)
        j = idx % len(income_range)
        data[j, i] = value

    return data, income_range

# Display net incomes in Streamlit.
st.write("Net Income Married: ", net_income_married)
st.write("Net Income Separate: ", net_income_separate)

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

# Generate and display heatmap
heatmap_data, income_range = generate_heatmap_data(state_code)
heatmap = go.Figure(data=go.Heatmap(
    z=heatmap_data,
    x=income_range,
    y=income_range,
    colorscale=[(0, "green"), (1, "red")],  # Green for incentive/neutral, red for penalty
    zmin=0,  # Minimum value for z-axis
    zmax=1   # Maximum value for z-axis
))

heatmap = format_fig(heatmap)
heatmap.update_layout(
    title='Marriage Incentive and Penalty Analysis',
    xaxis_title="Head Employment Income",
    yaxis_title="Spouse Employment Income"
)

st.plotly_chart(heatmap)