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
      <div className="flex items-center w-full border border-rose-100 rounded-xl bg-white focus-within:ring-2 focus-within:ring-rose-300 transition-shadow overflow-hidden">
        <RPNInput
          international
          defaultCountry="NG"
          value={value}
          onChange={setValue}
          required
          className="phone-input-unified flex-1 flex items-center"
          numberInputProps={{
            className:
              'flex-1 min-w-0 px-3 py-2.5 border-0 text-sm text-stone-900 placeholder:text-stone-400 bg-transparent focus:outline-none focus:ring-0',
            placeholder: '080 1234 5678',
          }}
        />
      </div>
      <style jsx global>{`
        .phone-input-unified .PhoneInputCountry {
          padding-left: 0.875rem;
          margin-right: 0;
          border-right: 1px solid #ffe4e6;
          padding-right: 0.625rem;
        }
        .phone-input-unified .PhoneInputCountrySelect:focus + .PhoneInputCountryIcon {
          outline: none;
        }
      `}</style>
    </div>
  )
}
