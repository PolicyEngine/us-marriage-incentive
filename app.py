import streamlit as st
import plotly.graph_objs as go
import numpy as np
from scipy.interpolate import griddata
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

# Create a function to get net income for household
def get_net_income(state_code, head_employment_income, spouse_employment_income=None):
    # Convert NumPy int64 to Python int
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

def generate_heatmap_data(state_code, income_range):
    data = []
    for head_income in income_range:
        row = []
        for spouse_income in income_range:
            net_income_married, _ = get_net_incomes(
                state_code, head_income, spouse_income
            )
            # Convert to Python int before appending
            row.append(int(net_income_married))
        data.append(row)
    return np.array(data)


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

if st.button("Generate Heatmap"):
    with st.spinner('Generating heatmap...'):
        income_range = np.arange(0, 10001, 1000)
        heatmap_data = generate_heatmap_data(state_code, income_range)    
        income_range = np.arange(0, 10001, 1000)  # Income range from 0 to 10,000, step 1,000
        heatmap_data = generate_heatmap_data(state_code, income_range)

        # Create heatmap
        heatmap = go.Figure(data=go.Heatmap(
            z=heatmap_data,
            x=income_range,
            y=income_range,
            colorscale='Viridis'
        ))

        heatmap.update_layout(
            title='Net Income Heatmap',
            xaxis_nticks=36,
            yaxis_nticks=36,
            xaxis_title="Head Employment Income",
            yaxis_title="Spouse Employment Income"
        )

    # Display heatmap in Streamlit
    st.plotly_chart(heatmap)
    # test_data = np.random.rand(10, 10)  # Simple random data for testing
    # heatmap = go.Figure(data=go.Heatmap(z=test_data))
    # st.plotly_chart(heatmap)