import { useState } from 'react'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

// Set VITE_FORMSPREE_ENDPOINT in .env to enable submissions. Never hardcode the endpoint.
const FORMSPREE_ENDPOINT = import.meta.env.VITE_FORMSPREE_ENDPOINT || ''
const FALLBACK_EMAIL = 'info@rsonboard.com' // TODO: confirm the monitored contact address

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMPTY = { name: '', email: '', company: '', phone: '', message: '', website: '' } // `website` is the honeypot

function validate(v) {
    const e = {}
    if (!v.name.trim()) e.name = 'Please enter your name.'
    if (!v.email.trim()) e.email = 'Please enter your work email.'
    else if (!EMAIL_RE.test(v.email.trim())) e.email = 'Please enter a valid email address.'
    if (!v.company.trim()) e.company = 'Please enter your company or agency name.'
    if (!v.message.trim()) e.message = 'Please tell us a little about what you need.'
    return e
}

function Field({ id, label, optional, error, children }) {
    return (
        <div>
            <label htmlFor={id} className="text-sm font-semibold text-[var(--lr-navy)]">
                {label}{optional && <span className="lr-muted font-normal"> (optional)</span>}
            </label>
            {children}
            {error && <p id={`${id}-error`} className="lr-error">{error}</p>}
        </div>
    )
}

export default function Contact() {
    const [values, setValues] = useState(EMPTY)
    const [errors, setErrors] = useState({})
    const [status, setStatus] = useState('idle') // idle | loading | success | error | unconfigured

    const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }))
    const props = (k) => ({
        id: k, name: k, value: values[k], onChange: set(k), className: 'lr-input',
        'aria-invalid': errors[k] ? 'true' : undefined,
        'aria-describedby': errors[k] ? `${k}-error` : undefined,
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        const found = validate(values)
        setErrors(found)
        if (Object.keys(found).length) return

        // Honeypot: bots fill the hidden field. Pretend success and drop it.
        if (values.website) { setStatus('success'); return }

        if (!FORMSPREE_ENDPOINT) {
            console.warn('[Contact form] Not configured: set VITE_FORMSPREE_ENDPOINT in .env to enable submissions.')
            setStatus('unconfigured')
            return
        }

        setStatus('loading')
        try {
            const payload = { ...values }
            delete payload.website
            const res = await fetch(FORMSPREE_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error(`Formspree responded ${res.status}`)
            setValues(EMPTY)
            setStatus('success')
        } catch (err) {
            console.error('[Contact form] Submit failed:', err)
            setStatus('error')
        }
    }

    const mailto = `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent('RSOnboard inquiry')}&body=${encodeURIComponent(`Name: ${values.name}\nCompany: ${values.company}\n\n${values.message}`)}`

    return (
        <section id="contact" aria-labelledby="contact-heading" className="lr-dark" style={{ background: 'var(--lr-navy)' }}>
            <div className="lr-container grid gap-10 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:py-28">
                <div className="text-white">
                    <h2 id="contact-heading" className="lr-h2" style={{ color: '#fff' }}>Talk to us about setting this up for your company.</h2>
                    <p className="lr-lead mt-5" style={{ color: 'rgba(255,255,255,0.85)' }}>Tell us a bit about your agency and we will get back to you.</p>
                </div>

                <div className="relative rounded-[28px] bg-white p-6 sm:p-8" style={{ color: 'var(--lr-text)' }}>
                    {status === 'success' ? (
                        <div role="status" className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-[var(--lr-navy)]" aria-hidden="true" />
                            <div>
                                <p className="text-lg font-semibold text-[var(--lr-navy)]">Thanks, we got your message.</p>
                                <p className="lr-muted mt-1">We will be in touch soon.</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
                            <Field id="name" label="Name" error={errors.name}>
                                <input type="text" autoComplete="name" {...props('name')} />
                            </Field>
                            <Field id="email" label="Work email" error={errors.email}>
                                <input type="email" autoComplete="email" {...props('email')} />
                            </Field>
                            <Field id="company" label="Company / agency name" error={errors.company}>
                                <input type="text" autoComplete="organization" {...props('company')} />
                            </Field>
                            <Field id="phone" label="Phone" optional>
                                <input type="tel" autoComplete="tel" {...props('phone')} />
                            </Field>
                            <div className="sm:col-span-2">
                                <Field id="message" label="Message" error={errors.message}>
                                    <textarea rows={5} {...props('message')} />
                                </Field>
                            </div>

                            {/* Honeypot: hidden from people and assistive tech */}
                            <div aria-hidden="true" className="lr-hp">
                                <label htmlFor="website">Leave this field empty</label>
                                <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
                            </div>

                            <div className="sm:col-span-2">
                                <button type="submit" disabled={status === 'loading'} className="lr-btn lr-btn-primary w-full sm:w-auto">
                                    {status === 'loading' && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                                    {status === 'loading' ? 'Sending…' : 'Send message'}
                                </button>

                                <div aria-live="polite">
                                    {status === 'error' && (
                                        <p className="lr-error mt-4 flex items-start gap-2">
                                            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                            <span>Your message did not send. Try again, or email us at{' '}
                                            <a className="font-semibold underline" href={mailto}>{FALLBACK_EMAIL}</a>.</span>
                                        </p>
                                    )}
                                    {status === 'unconfigured' && (
                                        <p className="mt-4 flex items-start gap-2 text-sm">
                                            <AlertCircle className="mt-0.5 size-4 shrink-0 text-[var(--lr-navy)]" aria-hidden="true" />
                                            <span>The contact form is not available yet. Email us at{' '}
                                            <a className="font-semibold text-[var(--lr-navy)] underline" href={mailto}>{FALLBACK_EMAIL}</a>.</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </section>
    )
}
