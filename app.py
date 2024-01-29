import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
#
from policyengine_us import Simulation
# Create a function to get net income for the household, married or separate.
def get_net_incomes(
    state_code, head_employment_income, spouse_employment_income, children=0
):
    # Tuple of net income for separate and married.
    net_income_married = get_net_income(
        state_code, head_employment_income, spouse_employment_income, children = children
    )
    net_income_head = get_net_income(state_code, head_employment_income, children = children)
    net_income_spouse = get_net_income(state_code, spouse_employment_income, children = 0)
    return net_income_married, net_income_head, net_income_spouse
DEFAULT_AGE = 40
DEFAULT_CHILD_AGE = 10
#income of the dependents, adjust to have age as input
# Create a function to get net income for household
def get_net_income(state_code, head_employment_income, spouse_employment_income=None, children = 0):
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
    for i in range(children):
            situation["people"][f"child {i}"] = {
                "age": {"2023": DEFAULT_CHILD_AGE}
            }
            # Add child to members list.
            members.append(f"child {i}")
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
children = st.number_input("Number of Children", 0)
# Get net incomes.

net_income_married, net_income_head, net_income_spouse  = get_net_incomes(
    state_code, head_employment_income, spouse_employment_income, children
)
net_income_separate = net_income_head + net_income_spouse
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

def check_child_influence(child_num):
    salary_ranges = [ 10000,20000,30000,40000,50000,60000,70000,80000,90000,100000]
    data = []
    for i in range(len(salary_ranges)):
        temp_data = []
        for j in range(len(salary_ranges)):
            head_employment_income = salary_ranges[i]
            spouse_employment_income= salary_ranges[j]
            net_income_married, net_income_head, net_income_spouse = get_net_incomes(
            state_code, head_employment_income, spouse_employment_income, child_num)
            net_income_separate = net_income_head + net_income_spouse
            marriage_bonus = net_income_married - net_income_separate
            if marriage_bonus > 0:
                temp_data.append(1)
            else:
                temp_data.append(0)
        print(data)
        data.append(temp_data)
    return data

    
def get_chart(data):
 
    # Set numerical values for x and y axes
    x_values = [ 10000,20000,30000,40000,50000,60000,70000,80000,90000,100000]
    y_values = [  10000,20000,30000,40000,50000,60000,70000,80000,90000,100000]
  
    fig = px.imshow(data,
                    labels=dict(x="Head Employment", y="Spouse Employment", color="Penalty/Bonus"),
                    x=x_values,
                    y=y_values,
                    color_continuous_scale=[[0, 'red'], [1, 'green']],

                   )
    fig.update_xaxes(side="top")

    # Format x and y axis tick labels
    fig.update_layout(
        xaxis=dict(
            tickmode='array',
            tickvals=x_values,
            ticktext=[f'{val:,}' for val in x_values]
        ),
        yaxis=dict(
            tickmode='array',
            tickvals=y_values,
            ticktext=[f'{val:,}' for val in y_values]
        )
    )
     # Highlight a specific spot (e.g., row 0, column 1)
    highlighted_row, highlighted_col = spouse_employment_income , head_employment_income, 
    highlight_text = "You"

    # Add text annotation at the specified spot
    fig.add_trace(go.Scatter(x=[highlighted_col], y=[highlighted_row],
                             mode="text", text=[highlight_text],
                             textfont=dict(size=20, color="red"),
                             showlegend=False))

    #add header
    st.header( f"# Children: {children}")

    # Display the chart
    st.plotly_chart(fig, theme="streamlit")

data = check_child_influence(children)
get_chart(data)




if marriage_bonus > 0:
    st.write("You face a marriage BONUS.")
elif marriage_bonus < 0:
    st.write("You face a marriage PENALTY.")
else:
    st.write("You face no marriage penalty or bonus.")
st.write(summarize_marriage_bonus(marriage_bonus))