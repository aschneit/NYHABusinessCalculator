import React from 'react';
import './App.css';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      workerItemCount: 1,
      workerItems: {
        1: { number: '', type: 'Worker-Owner', salary: '', selectOpen: false }
      },
      currentExpenditure: ""
    }
  }
  
  handleAddWorker = (e) => {
    e.preventDefault();
    this.setState({
      workerItemCount: this.state.workerItemCount + 1,
      workerItems: {
        ...this.state.workerItems, 
        [this.state.workerItemCount + 1]: { number: '', type: 'Worker-Owner', salary: '', selectOpen: false }
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
  
  render() {
    console.log(this.state);
    const { workerItems } = this.state;
    return (
      <div className="App">
        <h1>Business Calculator</h1>
        <form>
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
                <input 
                  className="worker-salary element" 
                  value={workerItems[k]['salary']}
                  onChange={this.handleFieldChange(k, 'salary')}
                  placeholder='Salary (numbers only)'
                />
              </div>
            )
          })}
          <input 
            className="current-expenditure element" 
            value={this.state.currentExpenditure}
            onChange={this.handleExpenditure}
            placeholder='Current Expenditure'
          />                  
        </form>
      </div>
    );
  }
}


