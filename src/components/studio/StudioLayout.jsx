import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
    NavigationMenuLink,
} from '@/components/ui/navigation-menu'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Building2, LogOut, ChevronDown } from 'lucide-react'
import { useStudioBodyTheme } from '@/hooks/useStudioBodyTheme'

const navItems = [
    { label: 'Companies', path: '/studio/companies', icon: Building2 },
]

export default function StudioLayout({ children }) {
    const navigate = useNavigate()
    const location = useLocation()
    useStudioBodyTheme()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        navigate('/studio/login')
    }

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

    return (
        <div className="studio-theme min-h-screen bg-muted/30">
            <div className="bg-white border-b border-border px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between gap-2 sticky top-0 z-50">
                <div className="flex items-center gap-3 md:gap-8 min-w-0">
                    <div className="flex items-center gap-2.5 cursor-pointer min-w-0" onClick={() => navigate('/studio/companies')}>
                        <div className="w-9 h-9 rounded-md bg-[var(--primary-color)] flex items-center justify-center text-white shrink-0">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-sm leading-none truncate">Studio</p>
                            <p className="text-xs text-muted-foreground leading-none mt-0.5 hidden sm:block truncate">Platform Administration</p>
                        </div>
                    </div>

                    <NavigationMenu className="hidden md:flex">
                        <NavigationMenuList>
                            {navItems.map((item) => (
                                <NavigationMenuItem key={item.path}>
                                    <NavigationMenuLink
                                        onClick={() => navigate(item.path)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${isActive(item.path)
                                                ? 'bg-[var(--secondary-bg)] text-[var(--primary-color)]'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                            }`}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        {item.label}
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            ))}
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <span className="hidden sm:inline">Platform Admin</span>
                            <ChevronDown className="w-3 h-3 shrink-0" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                            onClick={handleSignOut}
                            className="flex items-center gap-2 text-red-600 cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
                {children}
            </div>
        </div>
    )
}
