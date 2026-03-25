import './Button.css'

export default function Button({ label, onClick, className }) {
  return (
    <button 
      onClick={() => onClick(label)}
      className={`calc-button ${className}`}
    >
      {label}
    </button>
  )
}
