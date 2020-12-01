import React from 'react';
import './App.css';
import StyledInput from './components/styled-input';
import campaign from './assets/campaign.png';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { omit } from 'lodash';

const brackets = [
  {lowerBound: 0, upperBound: 24999, baseCost: 0, rate: 0},
  {lowerBound: 25000, upperBound: 49999, baseCost: 0, rate: .138},
  {lowerBound: 50000, upperBound: 74999, baseCost: 3450, rate: .169},
  {lowerBound: 75000, upperBound: 99999, baseCost: 7675, rate: .184},
  {lowerBound: 100000, upperBound: 199999, baseCost: 12275, rate: .216},
  {lowerBound: 200000, upperBound: Number.POSITIVE_INFINITY, baseCost: 33875, rate: .246}
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
        1: { number: 1, type: 'Employee', salary: '', selectOpen: false }
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
        [this.state.workerItemCount + 1]: { number: 1, type: 'Employee', salary: '', selectOpen: false }
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
    let expenditureForPayrollTax = 0;
    let errors = new Set();
    const numberMatch = /^[0-9]+$/;
    if (currentExpenditure === "" || !currentExpenditure.match(numberMatch)) errors.add('Current expenditure must contain valid amount.');
    const projectedExpenditure = Object.keys(workerItems).reduce((acc, el) => {
      const currentWorker = workerItems[el];
      if (currentWorker.number === "" || !String(currentWorker.number).match(numberMatch)) errors.add('Number of workers must contain valid number.');
      if (currentWorker.salary === "" || !currentWorker.salary.match(numberMatch)) errors.add('Income must contain valid amount.');
      let baseCost, rate, lowerBound;
      for (let i = 0; i < brackets.length; i++) {
        const currentBracket = brackets[i];
        if ((currentWorker.salary <= currentBracket.upperBound) && (currentWorker.salary >= currentBracket.lowerBound)) {
          baseCost = currentBracket.baseCost;
          rate = currentBracket.rate;
          lowerBound = currentBracket.lowerBound;
          break;
        }
      }
      totalPayroll += parseInt(currentWorker.salary) * currentWorker.number;
      const percentage = currentWorker.type === "Employee" ? .8 : 1;
      expenditureForPayrollTax += currentWorker.number * (baseCost + (currentWorker.salary - lowerBound) * rate);
      return Math.round(acc + currentWorker.number * ((baseCost + (currentWorker.salary - lowerBound) * rate) * percentage));
    }, 0)
    if (errors.size) {
      this.setState({ errors: [...errors] })
    } else {
      this.setState({
        projectedExpenditure,
        totalPayroll,
        savings: currentExpenditure - projectedExpenditure,
        payrollTax: `${(expenditureForPayrollTax / totalPayroll * 100).toFixed(2)}%`,
        step: 2
      })
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
        1: { number: 1, type: 'Employee', salary: '', selectOpen: false }
      },
      currentExpenditure: "",
      projectedExpenditure: "",
      errors: []
    });
  }

  handleExport = () => {
    const { workerItems, totalPayroll, currentExpenditure, projectedExpenditure, payrollTax, savings } = this.state;
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';
    const csvData = Object.values(workerItems).map(item => omit(item, ['selectOpen']));
    const ws = XLSX.utils.json_to_sheet(csvData);
    ws['!cols'] = [{ width: 10 }, { width: 20 }, { width: 20 }];
    XLSX.utils.sheet_add_json(ws, [{ '': '' }], { origin: -1 });
    XLSX.utils.sheet_add_json(ws, [{ 'Total Payroll': `$${formatNumber(totalPayroll)}` }], { origin: -1 });
    XLSX.utils.sheet_add_json(ws, [{ '': '' }], { origin: -1 });
    XLSX.utils.sheet_add_json(ws, [{ 'Current Healthcare Expenditure': `$${formatNumber(currentExpenditure)}` }], { origin: -1 });
    XLSX.utils.sheet_add_json(ws, [{ '': '' }], { origin: -1 });
    XLSX.utils.sheet_add_json(ws, [{ 'Projected Expenditure': `$${formatNumber(projectedExpenditure)}` }], { origin: -1 });
    XLSX.utils.sheet_add_json(ws, [{ '': '' }], { origin: -1 });
    XLSX.utils.sheet_add_json(ws, [{ 'Savings': `$${formatNumber(savings)}` }], { origin: -1 });
    XLSX.utils.sheet_add_json(ws, [{ '': '' }], { origin: -1 });
    XLSX.utils.sheet_add_json(ws, [{ 'Effective Tax Rate': payrollTax }], { origin: -1 });
    XLSX.utils.sheet_add_json(ws, [{ '': '' }], { origin: -1 });
    const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], {type: fileType});
    FileSaver.saveAs(data, 'NY Health Act Business Results' + fileExtension);
  }

  render() {
    const { workerItems, step, currentExpenditure, projectedExpenditure, totalPayroll, savings, payrollTax, errors } = this.state;
    return (
      <div className="App">
        <div className="content">
          <div className="header">
            <img src={campaign} alt="campaign"/>
            <div>Business Savings Calculator</div>
          </div>
          {step === 1 &&
            <form onSubmit={this.handleSubmit}>
              <div className="intro">
                This is a calculator to help you estimate how much you would save on your business's healthcare coverage expenses
                under the NY Health Act compared to what you pay today.
              </div>
              <h3>I. Personnel Annual Income, Salaries, and Wages</h3>
              <div className="instructions">Please enter all annual income for current personnel. Enter the number of people
              who are receiving each income level, choose type "Owner", or "Employee" from the drop-down menu,
              and enter the income with no commas or spaces. Click "Add Income Level" for additional entries.</div>
            <button className="add-worker" onClick={this.handleAddWorker}>Add Income Level</button>
              {Object.keys(workerItems).map(k => {
                return (
                  <div className="worker-item" key={k}>
                    <div className="worker-number">
                      <StyledInput
                        value={workerItems[k]['number']}
                        onChange={this.handleFieldChange(k, 'number')}
                        placeholder='#'
                      />
                    </div>
                    <div className="worker-type">
                      <div onClick={this.handleOpenSelect(k)}>
                        <span className="select-value">
                          {`${workerItems[k]['type']} (${workerItems[k]['type'] === 'Employee' ? '80%' : '100%'})`}
                        </span>
                        <span>&#9660;</span>
                      </div>
                      {workerItems[k].selectOpen && (
                        <ul className="dropdown" onClick={this.handleTypeSelection(k)}>
                          <li type="Employee">Employee (80%)</li>
                          <li type="Owner">Owner (100%)</li>
                        </ul>
                      )}
                    </div>
                    <div className="worker-salary-item">
                      <StyledInput
                        className="worker-salary"
                        value={workerItems[k]['salary']}
                        onChange={this.handleFieldChange(k, 'salary')}
                        placeholder='Enter Income'
                        typeCharacter='$'
                      />
                      {k !== '1' &&
                        <div className="remove-worker" onClick={this.handleRemoveWorker(k)}>
                          x
                        </div>
                      }
                    </div>
                  </div>
                )
              })}
              <h3>II. Current Annual Healthcare Expenditure</h3>
              <div className="instructions">
                Please enter an estimate of all expenses put toward employee healthcare annually (no commas or spaces).
                Don't forget to incude costs of time spent on evaluation, administration and maintenance.
              </div>
              <StyledInput
                className="current-expenditure"
                value={this.state.currentExpenditure}
                onChange={this.handleExpenditure}
                placeholder='Enter Expenditure'
                typeCharacter='$'
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
              <div>Here's how much you would spend annually for your business's healthcare coverage under the NY Health Act: <b>{`$${formatNumber(projectedExpenditure)}`}</b></div>
              <div>Here's how much you would save: <b>{`$${formatNumber(savings)}`}</b></div>
              <div>Here's what the effective tax rate for healthcare would be under the NY Health Act: <b>{payrollTax}</b></div>
              <div className="result-buttons">
                <button className="return" onClick={this.handleReturn}>Return to Form</button>
                <button className="export" onClick={this.handleExport}>Export</button>
              </div>
            </div>
          }
        </div>
      </div>
    );
  }
}
