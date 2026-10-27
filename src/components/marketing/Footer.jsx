import { Link } from 'react-router-dom'
import logo from '@/assets/logo.png'

export default function Footer() {
    return (
        <footer className="lr-dark text-white" style={{ background: 'var(--lr-navy-deep)' }}>
            <div className="lr-container flex flex-col gap-8 py-12 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    {/* The logo is transparent with a navy figure, so it sits on a white container on navy surfaces. */}
                    <Link to="/" aria-label="Ready, Set, Onboard! home" className="rounded-2xl bg-white p-2">
                        <img src={logo} alt="Ready, Set, Onboard!" width="498" height="226" className="h-10 w-auto" />
                    </Link>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>&copy; {new Date().getFullYear()} MLF Technologies LLC. All rights reserved.</p>
                </div>
                <nav aria-label="Footer">
                    <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
                        <li><a href="#features" className="hover:underline">Features</a></li>
                        <li><a href="#contact" className="hover:underline">Contact</a></li>
                        <li><Link to="/login" className="hover:underline">Log in</Link></li>
                    </ul>
                </nav>
            </div>
        </footer>
    )
}
