import { useState, useCallback, useRef } from 'react'

/** Reusable validation rules. Each returns an error message or null. */
export const rules = {
    required: (message = 'This field is required') => (v) => (String(v ?? '').trim() ? null : message),
    email: (message = 'Enter a valid email address') => (v) =>
        !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()) ? null : message,
    minLength: (n, message) => (v) => (!v || String(v).length >= n ? null : message || `Must be at least ${n} characters`),
    maxLength: (n, message) => (v) => (!v || String(v).length <= n ? null : message || `Must be ${n} characters or fewer`),
    phone: (message = 'Enter a valid phone number') => (v) => {
        if (!v) return null
        const digits = String(v).replace(/\D/g, '')
        return digits.length >= 10 && digits.length <= 15 ? null : message
    },
    number: ({ min, max, message } = {}) => (v) => {
        if (v === '' || v == null) return null
        const n = Number(v)
        if (Number.isNaN(n)) return message || 'Enter a number'
        if (min != null && n < min) return message || `Must be at least ${min}`
        if (max != null && n > max) return message || `Must be at most ${max}`
        return null
    },
    matches: (field, message = 'Values do not match') => (v, values) => (v === values[field] ? null : message),
    url: (message = 'Enter a full link starting with https://') => (v) => (!v || /^https?:\/\/\S+$/.test(v) ? null : message),
}

function runRules(fieldRules = [], value, values) {
    for (const rule of fieldRules) {
        const error = rule(value, values)
        if (error) return error
    }
    return null
}

/**
 * Small form state helper.
 *   const form = useForm({ email: '' }, { email: [rules.required(), rules.email()] })
 *   <TextField {...form.field('email')} label="Email" />
 *   form.handleSubmit(async (values) => { ... })
 * Fields validate on blur, then live once they show an error. All fields validate on submit.
 */
export default function useForm(initialValues, schema = {}) {
    const [values, setValues] = useState(initialValues)
    const [errors, setErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState(null)
    const touched = useRef({})

    const validateField = useCallback((name, nextValues) => {
        const error = runRules(schema[name], nextValues[name], nextValues)
        setErrors((prev) => ({ ...prev, [name]: error }))
        return error
    }, [schema])

    const setValue = useCallback((name, value) => {
        setValues((prev) => {
            const next = { ...prev, [name]: value }
            if (touched.current[name]) validateField(name, next)
            return next
        })
        setFormError(null)
    }, [validateField])

    const field = (name) => ({
        name,
        value: values[name] ?? '',
        error: errors[name] || undefined,
        onChange: (e) => setValue(name, e.target.type === 'checkbox' ? e.target.checked : e.target.value),
        onBlur: () => {
            touched.current[name] = true
            validateField(name, values)
        },
    })

    const validateAll = () => {
        const nextErrors = {}
        Object.keys(schema).forEach((name) => {
            touched.current[name] = true
            const error = runRules(schema[name], values[name], values)
            if (error) nextErrors[name] = error
        })
        setErrors(nextErrors)
        return nextErrors
    }

    /** Validates, then runs onSubmit. Throwing { fieldErrors } or an Error shows it on the form. */
    const handleSubmit = (onSubmit) => async (e) => {
        e?.preventDefault?.()
        const found = validateAll()
        if (Object.keys(found).length) {
            // Move focus to the first invalid control
            const first = Object.keys(schema).find((name) => found[name])
            document.querySelector(`[name="${first}"]`)?.focus()
            return
        }
        setSubmitting(true)
        setFormError(null)
        try {
            await onSubmit(values)
        } catch (error) {
            setFormError(error?.message || 'Something went wrong')
        } finally {
            setSubmitting(false)
        }
    }

    return { values, setValues, setValue, errors, setErrors, field, handleSubmit, submitting, formError, setFormError, validateAll }
}
