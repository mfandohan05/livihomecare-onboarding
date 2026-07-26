import { useState, useEffect } from 'react'
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
import { LayoutDashboard, Users, LogOut, ChevronDown, Map, Logs, Menu } from 'lucide-react'
import { APP_VERSION } from '@/version'
import { useCompany } from '@/context/CompanyContext'

export default function AdminLayout({ children }) {
    const navigate = useNavigate()
    const location = useLocation()
    const [adminName, setAdminName] = useState('');
    const [adminRole, setAdminRole] = useState('');
    const { companyName, primaryColor, secondaryColor, logoUrl } = useCompany();

    useEffect(() => {
        const fetchAdmin = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { data } = await supabase
                .from('admin_users')
                .select('name, role, company_id')
                .eq('id', session.user.id)
                .single()

            if (data) {
                setAdminName(data.name);
                setAdminRole(data.role);
            }
        }
        fetchAdmin();
    }, [])

    useEffect(() => {
        let timeout

        const resetTimer = () => {
            clearTimeout(timeout)
            timeout = setTimeout(async () => {
                await supabase.auth.signOut()
                navigate('/admin/login')
            }, 30 * 60 * 1000)
        }

        window.addEventListener('mousemove', resetTimer)
        window.addEventListener('keydown', resetTimer)
        window.addEventListener('click', resetTimer)
        resetTimer()

        return () => {
            clearTimeout(timeout)
            window.removeEventListener('mousemove', resetTimer)
            window.removeEventListener('keydown', resetTimer)
            window.removeEventListener('click', resetTimer)
        }
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        navigate('/admin/login')
    }

    const navItems = [
        { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Employees', path: '/admin/employees', icon: Users },
        { label: 'Caregiver Map', path: '/admin/map', icon: Map },
        ...(adminRole === 'superadmin' ? [{ label: 'Logs', path: '/admin/logs', icon: Logs }] : [])
    ]

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

    return (
        <div className="min-h-screen bg-muted/30">
            <div className="bg-white border-b border-border px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between gap-2 sticky top-0 z-50">
                <div className="flex items-center gap-3 md:gap-8 min-w-0">
                    <div className="flex items-center gap-2.5 cursor-pointer min-w-0" onClick={() => navigate('/admin/dashboard')}>
                        <img src={logoUrl} alt={companyName + " logo"} className="w-9 h-9 md:w-[50px] md:h-[50px] object-contain shrink-0" />
                        <div className="min-w-0">
                            <p className="font-semibold text-sm leading-none truncate">{companyName}</p>
                            <p className="text-xs text-muted-foreground leading-none mt-0.5 hidden sm:block truncate">RSOnboard Admin Portal v.{APP_VERSION}</p>
                        </div>
                    </div>

                    <NavigationMenu className="hidden md:flex">
                        <NavigationMenuList>
                            {navItems.map((item) => (
                                <NavigationMenuItem key={item.path}>
                                    <NavigationMenuLink
                                        onClick={() => navigate(item.path)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${isActive(item.path)
                                                ? `bg-[var(--secondary-bg)] text-[var(--primary-color)]`
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

                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    aria-label="Open navigation menu"
                                    className="flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)]"
                                >
                                    <Menu className="w-5 h-5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                {navItems.map((item) => (
                                    <DropdownMenuItem
                                        key={item.path}
                                        onClick={() => navigate(item.path)}
                                        className={`flex items-center gap-2 cursor-pointer focus:bg-[var(--primary-color)] focus:text-white ${isActive(item.path) ? 'text-[var(--primary-color)]' : ''}`}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        {item.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)]">
                                <div className="w-7 h-7 rounded-full bg-[var(--primary-color)] flex items-center justify-center text-white text-xs font-medium shrink-0">
                                    {adminName ? adminName.split(' ').map(n => n[0]).join('').slice(0, 2) : '?'}
                                </div>
                                <span className="hidden sm:inline">Hi, {adminName ? adminName.split(' ')[0] : '...'}</span>
                                <ChevronDown className="w-3 h-3 shrink-0" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                                onClick={handleSignOut}
                                className="flex items-center gap-2 text-red-600 focus:bg-[var(--primary-color)] cursor-pointer"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
                {children}
            </div>
        </div>
    )
}