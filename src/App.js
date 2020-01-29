import React from 'react';
import './App.css';
import campaign from './campaign.png';

const calculate = [
  {lowerBound: 0, upperBound: 25000, baseCost: 0, rate: 0},
  {lowerBound: 25001, upperBound: 50000, baseCost: 0, rate: .138},
  {lowerBound: 50001, upperBound: 75000, baseCost: 3450, rate: .169},
  {lowerBound: 75001, upperBound: 100000, baseCost: 7675, rate: .184},
  {lowerBound: 100001, upperBound: 200000, baseCost: 12275, rate: .216},
  {lowerBound: 200001, upperBound: Number.POSITIVE_INFINITY, baseCost: 33875, rate: .246}
]

const formatNumber = number => {
  let negative;
  if (number < 0) {
    number = -number;
    negative = true;
  }
  const numberString = String(number);
  const resultArray = [];
  let i;
  for (let j = numberString.length; j >= 1; j -=3) {
    i = j - 3 < 0 ? 0 : j - 3;
    resultArray.unshift(numberString.slice(i,j));
  }
  if (negative) resultArray[0] = '-' + resultArray[0].slice(0);
  return resultArray.join(",");
}


export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      step: 1,
      workerItemCount: 1,
      workerItems: {
        1: { number: 1, type: 'Worker-Owner', salary: '', selectOpen: false }
      },
      currentExpenditure: "",
      projectedExpenditure: "",
      errors: []
    }
  }

  handleAddWorker = (e) => {
    e.preventDefault();
    this.setState({
      workerItemCount: this.state.workerItemCount + 1,
      workerItems: {
        ...this.state.workerItems,
        [this.state.workerItemCount + 1]: { number: 1, type: 'Worker-Owner', salary: '', selectOpen: false }
      }
    });
  }

  handleFieldChange = (k, field) => e => {
    const { workerItems } = this.state;
    this.setState({ workerItems: { ...workerItems, [k]: { ...workerItems[k], [field]: e.currentTarget.value } } })
  }

  handleOpenSelect = k => e => {
    const { workerItems } = this.state;
    const prevSelectState = workerItems[k].selectOpen;
    this.setState({ workerItems: { ...workerItems, [k]: { ...workerItems[k], selectOpen: !prevSelectState } } })
  }

  handleTypeSelection = k => e => {
    const { workerItems } = this.state;
    this.setState({ workerItems: { ...workerItems, [k]: { ...workerItems[k], type: e.target.type, selectOpen: false } } })
  }

  handleExpenditure = e => {
    this.setState({ currentExpenditure: e.currentTarget.value });
  }

  handleRemoveWorker = k => e => {
    const { workerItemCount, workerItems: {[k]: deleteItem, ...rest } } = this.state;
    this.setState({
      workerItemCount: workerItemCount - 1,
      workerItems: rest
    });
  }

  handleSubmit = e => {
    e.preventDefault();
    this.setState({ errors: [] })
    const { workerItems, currentExpenditure } = this.state;
    let totalPayroll = 0;
    let errors = new Set();
    const numberMatch = /^[0-9]+$/;
    if (currentExpenditure === "" || !currentExpenditure.match(numberMatch)) errors.add('Current expenditure must contain valid amount.');
    const projectedExpenditure = Object.keys(workerItems).reduce((acc, el) => {
      if (workerItems[el].number === "" || !String(workerItems[el].number).match(numberMatch)) errors.add('Number of workers must contain valid number.');
      if (workerItems[el].salary === "" || !workerItems[el].salary.match(numberMatch)) errors.add('Salary must contain valid amount.');
      let baseCost, rate, lowerBound;
      for (let i = 0; i < calculate.length; i++) {
        if ((workerItems[el].salary <= calculate[i].upperBound) && (workerItems[el].salary >= calculate[i].lowerBound)) {
          baseCost = calculate[i].baseCost;
          rate = calculate[i].rate;
          lowerBound = calculate[i].lowerBound;
          break;
        }
      }
      totalPayroll += parseInt(workerItems[el].salary);
      const percentage = workerItems[el].type === "Employee" ? .8 : 1;
      return Math.round(acc + workerItems[el].number * (baseCost + (workerItems[el].salary - lowerBound) * percentage * rate));
    }, 0)
    if (errors.size) {
      this.setState({ errors: [...errors] })
    } else {
      this.setState({ projectedExpenditure, totalPayroll, step: 2 })
    }
  }

  handleReturn = e => {
    e.preventDefault();
    this.setState({ step: 1 })
  }

  clearForm = e => {
    e.preventDefault();
    this.setState({
      workerItemCount: 1,
      workerItems: {
        1: { number: 1, type: 'Worker-Owner', salary: '', selectOpen: false }
      },
      currentExpenditure: "",
      projectedExpenditure: "",
      errors: []
    });
  }

  render() {
    console.log(this.state);
    const { workerItems, step, currentExpenditure, projectedExpenditure, totalPayroll, errors } = this.state;
    return (
      <div className="App">
        <div className="content">
          <div className="header">
            <img src={campaign} alt="campaign"/>
            <div>Business Savings Calculator</div>
          </div>
          {step === 1 &&
            <form onSubmit={this.handleSubmit}>
              <div>
                This a calculator to help you estimate how much you would save on your business's healthcare coverage expenses
                under the NYHA compared to what you pay today.
              </div>
              <h3>I. Personnel Annual Salaries</h3>
              <div className="instructions">Please input all annual salaries for current personnel. Input the number of people
              who are receiving the salary, choose type "Worker-Owner", "Owner", or "Employee" from the drop-down menu,
              and input the salary with no commas or spaces. Click "Add Worker" for additional salary entries.</div>
              <button className="add-worker" onClick={this.handleAddWorker}>Add Worker</button>
              {Object.keys(workerItems).map(k => {
                return (
                  <div className="worker-item" key={k}>
                    <input
                      className="worker-number element"
                      value={workerItems[k]['number']}
                      onChange={this.handleFieldChange(k, 'number')}
                      placeholder='#'
                    />
                    <div className="worker-type">
                      <div className="element" onClick={this.handleOpenSelect(k)}>
                        <span className="select-value">{workerItems[k]['type']}</span><span>&#9660;</span>
                      </div>
                      {workerItems[k].selectOpen && (
                        <ul className="dropdown" onClick={this.handleTypeSelection(k)}>
                          <li type="Worker-Owner">Worker-Owner</li>
                          <li type="Employee">Employee</li>
                          <li type="Owner">Owner</li>
                        </ul>
                      )}
                    </div>
                    <span className="dollar-sign">$</span>
                    <input
                      className="worker-salary element"
                      value={workerItems[k]['salary']}
                      onChange={this.handleFieldChange(k, 'salary')}
                      placeholder='Enter Salary'
                    />
                    {k !== '1' &&
                      <div className="remove-worker" onClick={this.handleRemoveWorker(k)}>
                        x
                      </div>
                    }
                  </div>
                )
              })}
              <h3>II. Current Annual Healthcare Expenditure</h3>
              <div className="instructions">
                Please input an estimate of all expenses put toward employee healthcare annually (no commas or spaces).
                Don't forget to incude costs of time spent on evaluation, administration and maintenance.
              </div>
              <span className="dollar-sign">$</span>
              <input
                className="current-expenditure element"
                value={this.state.currentExpenditure}
                onChange={this.handleExpenditure}
                placeholder='Enter Expenditure'
              />
              <div className="action-buttons">
                <input type="submit" value="Submit"/>
                <button className="clear-form" onClick={this.clearForm}>Clear Form</button>
              </div>
              <ul className="errors">
                {errors.map(error => {
                  return (
                    <li>{error}</li>
                  )
                })}
              </ul>
            </form>
          }
          {step === 2 &&
            <div className="results">
              <div>Here's how much you currently spend on payroll annually: <b>{`$${formatNumber(totalPayroll)}`}</b></div>
              <div>Here's how much you currently spend on your business's healthcare coverage annually: <b>{`$${formatNumber(currentExpenditure)}`}</b></div>
              <div>Here's how much you would spend annually for your business's healthcare coverage under the NYHA: <b>{`$${formatNumber(projectedExpenditure)}`}</b></div>
              <div>Here's how much you would save: <b>{`$${formatNumber(currentExpenditure - projectedExpenditure)}`}</b></div>
              <div>Here's what your effective payroll tax for healthcare would be under the NYHA: <b>{`${(projectedExpenditure / totalPayroll * 100).toFixed(2)}%`}</b></div>
              <button className="return" onClick={this.handleReturn}>Return to Form</button>
            </div>
          }
        </div>
      </div>
    );
  }
}
