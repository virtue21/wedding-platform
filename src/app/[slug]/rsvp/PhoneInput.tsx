'use client'

import { useState } from 'react'
import RPNInput, { type Value } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

export default function PhoneInput() {
  const [value, setValue] = useState<Value>()

  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1">
        Phone number <span className="text-red-500">*</span>
      </label>
      {/* Hidden input carries the E.164 value for the server action */}
      <input type="hidden" name="phone" value={value ?? ''} />
      <RPNInput
        international
        defaultCountry="NG"
        value={value}
        onChange={setValue}
        required
        className="w-full"
        numberInputProps={{
          className:
            'flex-1 px-3 py-2 border border-stone-300 rounded-r-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent',
          placeholder: '080 1234 5678',
        }}
      />
    </div>
  )
}
