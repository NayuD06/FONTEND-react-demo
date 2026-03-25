import Button from './Button'
import './ButtonGrid.css'

export default function ButtonGrid({ onButtonClick }) {
  const buttons = [
    { label: '7', type: 'number' },
    { label: '8', type: 'number' },
    { label: '9', type: 'number' },
    { label: '/', type: 'operator' },
    { label: '4', type: 'number' },
    { label: '5', type: 'number' },
    { label: '6', type: 'number' },
    { label: '*', type: 'operator' },
    { label: '1', type: 'number' },
    { label: '2', type: 'number' },
    { label: '3', type: 'number' },
    { label: '-', type: 'operator' },
    { label: '0', type: 'number' },
    { label: '.', type: 'decimal' },
    { label: '=', type: 'equals' },
    { label: '+', type: 'operator' },
  ]

  return (
    <div className="button-grid">
      {buttons.map((btn, index) => (
        <Button
          key={index}
          label={btn.label}
          onClick={onButtonClick}
          className={btn.type}
        />
      ))}
    </div>
  )
}
