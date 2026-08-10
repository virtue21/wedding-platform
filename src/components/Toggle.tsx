'use client'

type Props = {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  label?: string
}

export default function Toggle({ checked, onChange, disabled, label }: Props) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-label={label}
      aria-pressed={checked}
      className={`relative w-12 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
        checked ? 'bg-emerald-500' : 'bg-stone-200'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
