import { useRef } from 'react'
import cn from '../../utils/cn'

/** 6-digit one-time code input. Supports typing, backspace navigation and pasting the whole code. */
export default function CodeInput({ value, onChange, onComplete, error, disabled, length = 6, label = 'Verification code' }) {
    const refs = useRef([])
    const digits = Array.from({ length }, (_, i) => value[i] || '')

    const update = (next) => {
        const code = next.join('').slice(0, length)
        onChange(code)
        if (code.length === length && !next.includes('')) onComplete?.(code)
    }

    const handleChange = (index, raw) => {
        const char = raw.replace(/\D/g, '').slice(-1)
        const next = [...digits]
        next[index] = char
        update(next)
        if (char && index < length - 1) refs.current[index + 1]?.focus()
    }

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) refs.current[index - 1]?.focus()
        if (e.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus()
        if (e.key === 'ArrowRight' && index < length - 1) refs.current[index + 1]?.focus()
    }

    const handlePaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
        if (!pasted) return
        e.preventDefault()
        const next = Array.from({ length }, (_, i) => pasted[i] || '')
        update(next)
        refs.current[Math.min(pasted.length, length - 1)]?.focus()
    }

    return (
        <fieldset>
            <legend className="sr-only">{label}</legend>
            <div className="flex justify-between gap-2">
                {digits.map((digit, i) => (
                    <input
                        key={i}
                        ref={(el) => (refs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        autoComplete={i === 0 ? 'one-time-code' : 'off'}
                        maxLength={1}
                        value={digit}
                        disabled={disabled}
                        aria-label={`Digit ${i + 1} of ${length}`}
                        aria-invalid={error ? true : undefined}
                        onChange={(e) => handleChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        onPaste={handlePaste}
                        onFocus={(e) => e.target.select()}
                        className={cn(
                            'h-12 w-full min-w-0 rounded-lg border bg-surface text-center text-lg font-semibold text-fg tabular',
                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:opacity-50',
                            error ? 'border-danger focus:border-danger focus-visible:ring-danger/30' : 'border-line focus:border-brand focus-visible:ring-brand/30'
                        )}
                    />
                ))}
            </div>
        </fieldset>
    )
}
