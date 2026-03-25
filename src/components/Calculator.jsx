import { useState } from 'react'
import Display from './Display'
import ButtonGrid from './ButtonGrid'
import './Calculator.css'

export default function Calculator() {
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState(null)
  const [operation, setOperation] = useState(null)
  const [newNumber, setNewNumber] = useState(true)

  const handleButtonClick = (label) => {
    // Handle numbers
    if (label >= '0' && label <= '9') {
      if (newNumber) {
        setDisplay(String(label))
        setNewNumber(false)
      } else {
        setDisplay(display === '0' ? String(label) : display + label)
      }
    }

    // Handle decimal
    else if (label === '.') {
      if (newNumber) {
        setDisplay('0.')
        setNewNumber(false)
      } else if (!display.includes('.')) {
        setDisplay(display + '.')
      }
    }

    // Handle operators
    else if (label === '+' || label === '-' || label === '*' || label === '/') {
      const currentValue = parseFloat(display)

      if (previousValue !== null && !newNumber && operation) {
        const result = calculate(previousValue, currentValue, operation)
        setDisplay(String(result))
        setPreviousValue(result)
      } else {
        setPreviousValue(currentValue)
      }

      setOperation(label)
      setNewNumber(true)
    }

    // Handle equals
    else if (label === '=') {
      if (previousValue !== null && operation) {
        const result = calculate(previousValue, parseFloat(display), operation)
        setDisplay(String(result))
        setPreviousValue(null)
        setOperation(null)
        setNewNumber(true)
      }
    }

    // Handle clear
    else if (label === 'C') {
      setDisplay('0')
      setPreviousValue(null)
      setOperation(null)
      setNewNumber(true)
    }
  }

  const calculate = (prev, current, op) => {
    switch (op) {
      case '+':
        return prev + current
      case '-':
        return prev - current
      case '*':
        return prev * current
      case '/':
        return current !== 0 ? prev / current : 0
      default:
        return current
    }
  }

  return (
    <div className="calculator-container">
      <div className="calculator">
        <h1>Calculator</h1>
        <Display value={display} />
        <button 
          className="clear-button"
          onClick={() => handleButtonClick('C')}
        >
          Clear
        </button>
        <ButtonGrid onButtonClick={handleButtonClick} />
      </div>
    </div>
  )
}
