import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import logo from '@/assets/logo.png'

const LINKS = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How it works' },
    { href: '#contact', label: 'Contact' },
]

export default function Nav() {
    const [open, setOpen] = useState(false)

    return (
        <header className="sticky top-0 z-40 border-b border-[var(--lr-line)] bg-white">
            <nav aria-label="Main" className="lr-container flex h-[72px] items-center justify-between gap-3">
                <Link to="/" className="shrink-0" aria-label="Ready, Set, Onboard! home">
                    <img src={logo} alt="Ready, Set, Onboard!" width="498" height="226" className="h-11 w-auto" />
                </Link>

                <ul className="hidden items-center gap-1 md:flex">
                    {LINKS.map((l) => (
                        <li key={l.href}>
                            <a href={l.href} className="rounded-full px-4 py-2 text-[0.9375rem] font-medium text-[var(--lr-text-2)] transition-colors hover:bg-[var(--lr-surface)] hover:text-[var(--lr-navy)]">
                                {l.label}
                            </a>
                        </li>
                    ))}
                </ul>

                <div className="flex items-center gap-2">
                    <Link to="/login" className="lr-btn lr-btn-tonal lr-btn-sm">Log in</Link>
                    <a href="#contact" className="lr-btn lr-btn-primary lr-btn-sm hidden sm:inline-flex">Contact us</a>
                    <button
                        type="button"
                        className="inline-flex size-10 items-center justify-center rounded-full text-[var(--lr-navy)] hover:bg-[var(--lr-surface)] md:hidden"
                        aria-expanded={open}
                        aria-controls="mobile-menu"
                        aria-label={open ? 'Close menu' : 'Open menu'}
                        onClick={() => setOpen((o) => !o)}
                    >
                        {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
                    </button>
                </div>
            </nav>

            {open && (
                <div id="mobile-menu" className="border-t border-[var(--lr-line)] bg-white pb-5 md:hidden">
                    <ul className="lr-container flex flex-col py-2">
                        {LINKS.map((l) => (
                            <li key={l.href}>
                                <a href={l.href} onClick={() => setOpen(false)} className="block rounded-xl px-2 py-3 text-base font-medium text-[var(--lr-navy)]">
                                    {l.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                    <div className="lr-container">
                        <a href="#contact" onClick={() => setOpen(false)} className="lr-btn lr-btn-primary w-full">Contact us</a>
                    </div>
                </div>
            )}
        </header>
    )
}
