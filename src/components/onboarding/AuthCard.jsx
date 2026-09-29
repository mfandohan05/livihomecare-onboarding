import companyLogo from '@/assets/logo.png'

export default function AuthCard({ title, subtitle, children }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <div className="w-full max-w-sm">
                <div className="flex justify-center mb-8">
                    <img src={companyLogo} alt="Ready, Set, Onboard!" className="w-[200px]" />
                </div>

                <div className="bg-white rounded-xl border border-border p-6 sm:p-8 shadow-sm">
                    <h1 className="text-xl font-semibold mb-1">{title}</h1>
                    {subtitle && <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>}
                    {children}
                </div>
            </div>
        </div>
    )
}
