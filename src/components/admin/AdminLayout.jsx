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
import { LayoutDashboard, Users, LogOut, ChevronDown, Map, Logs } from 'lucide-react'
import companyLogo from '@/assets/logo.png'

export default function AdminLayout({ children }) {
    const navigate = useNavigate()
    const location = useLocation()
    const [adminName, setAdminName] = useState('');
    const [adminRole, setAdminRole] = useState('');

    useEffect(() => {
        const fetchAdmin = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { data } = await supabase
                .from('admin_users')
                .select('name, role')
                .eq('id', session.user.id)
                .single()

            if (data) {
                setAdminName(data.name);
                setAdminRole(data.role);
            }
        }
        fetchAdmin()
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
            <div className="bg-white border-b border-border px-8 py-3 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/admin/dashboard')}>
                        <img src={companyLogo} alt="Livi Home Care" className="w-[50px]" />
                        <div>
                            <p className="font-semibold text-sm leading-none">CareReady</p>
                            <p className="text-xs text-muted-foreground leading-none mt-0.5">Admin Portal</p>
                        </div>
                    </div>

                    <NavigationMenu>
                        <NavigationMenuList>
                            {navItems.map((item) => (
                                <NavigationMenuItem key={item.path}>
                                    <NavigationMenuLink
                                        onClick={() => navigate(item.path)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${isActive(item.path)
                                                ? 'bg-[#E8F0D0] text-[#577C09]'
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
                        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted">
                            <div className="w-7 h-7 rounded-full bg-[#577C09] flex items-center justify-center text-white text-xs font-medium">
                                {adminName ? adminName.split(' ').map(n => n[0]).join('').slice(0, 2) : '?'}
                            </div>
                            <span>Hi, {adminName ? adminName.split(' ')[0] : '...'}</span>
                            <ChevronDown className="w-3 h-3" />
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

            <div className="max-w-6xl mx-auto px-8 py-10">
                {children}
            </div>
        </div>
    )
}