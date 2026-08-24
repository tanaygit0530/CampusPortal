import { useState } from 'react'

// Reusable form-handling hook. Any form (Login, Register, Create Event in the
// admin panel later) can call useForm({...initialValues}, validate) instead
// of re-writing the same useState + onChange + validation wiring every time.
export default function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    // clear that field's error as soon as the user starts fixing it
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = (onValid) => async (e) => {
    e.preventDefault()
    const validationErrors = validate ? validate(values) : {}
    setErrors(validationErrors)

    const hasErrors = Object.values(validationErrors).some(Boolean)
    if (hasErrors) return

    setSubmitting(true)
    try {
      await onValid(values)
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => setValues(initialValues)

  return { values, errors, submitting, handleChange, handleSubmit, reset }
}
