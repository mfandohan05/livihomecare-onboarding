import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
    NavigationMenuLink,
} from '@/components/ui/navigation-menu'
import { LayoutDashboard, Users, LogOut, Plus } from 'lucide-react'
import companyLogo from '@/assets/logo.png'

export default function AdminLayout({ children }) {
    const navigate = useNavigate()
    const location = useLocation()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        navigate('/admin/login')
    }

    const navItems = [
        { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Caregivers', path: '/admin/caregivers', icon: Users },
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
                                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                                            isActive(item.path)
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

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/admin/caregivers/new')}
                        className="flex items-center gap-2 bg-[#577C09] hover:bg-[#3D5906] text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Caregiver
                    </button>
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign out
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-8 py-10">
                {children}
            </div>
        </div>
    )
}