import { Link } from 'react-router-dom'
import '@/components/marketing/marketing.css'

export default function NotFound() {
    return (
        <main className="lr-page-enter min-h-screen flex items-center justify-center bg-muted/30 px-4 text-center">
            <div>
                <p className="text-sm font-semibold text-[var(--primary-color)]">404</p>
                <h1 className="mt-2 text-3xl font-semibold">Page not found</h1>
                <p className="mt-2 text-muted-foreground">The page you are looking for does not exist or has moved.</p>
                <Link to="/login" className="mt-6 inline-block rounded-full bg-[var(--primary-color)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--hover-color)]">
                    Go to sign in
                </Link>
            </div>
        </main>
    )
}
