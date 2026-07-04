import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const CompanyContext = createContext(null)

export function CompanyProvider({ children }) {
    const [companyId, setCompanyId] = useState(null)
    const [companyName, setCompanyName] = useState('')
    const [primaryColor, setPrimaryColor] = useState(null)
    const [secondaryColor, setSecondaryColor] = useState(null)
    const [hoverColor, setHoverColor] = useState(null);
    const [logoUrl, setLogoUrl] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false

        const fetchAdminAndCompany = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                if (!cancelled) setLoading(false)
                return
            }

            const { data: admin, error: adminError } = await supabase
                .from('admin_users')
                .select('company_id')
                .eq('id', session.user.id)
                .single()

            if (cancelled) return

            if (adminError || !admin) {
                setLoading(false)
                return
            }

            setCompanyId(admin.company_id)

            const { data: company, error: companyError } = await supabase
                .from('company_data')
                .select('logo_path, company_name, primary_color, secondary_bg_color, hover_color')
                .eq('company_id', admin.company_id)
                .maybeSingle()

            if (cancelled) return

            if (!companyError && company) {
                setCompanyName(company.company_name || '')
                setPrimaryColor(company.primary_color || '#577C09')
                setSecondaryColor(company.secondary_bg_color || '#E8F0D0')
                setHoverColor(company.hover_color || '#3D5906')

                if (company.logo_path) {
                    const { data: urlData } = supabase.storage
                        .from('company_assets')
                        .getPublicUrl(company.logo_path)
                    setLogoUrl(urlData.publicUrl)
                }
            }

            setLoading(false)
        }

        fetchAdminAndCompany()

        return () => { cancelled = true }
    }, [])
    useEffect(() => {
        if (primaryColor) {
            document.documentElement.style.setProperty('--primary-color', primaryColor);
        }
        if (hoverColor) {
            document.documentElement.style.setProperty('--hover-color', hoverColor);
        }
        if (secondaryColor) {
            document.documentElement.style.setProperty('--secondary-bg', secondaryColor)
        }
    }, [primaryColor, secondaryColor])
    return (
        <CompanyContext.Provider
            value={{ companyId, companyName, primaryColor, secondaryColor, logoUrl, loading }}
        >
            {children}
        </CompanyContext.Provider>
    )
}

export function useCompany() {
    const ctx = useContext(CompanyContext)
    if (!ctx) {
        throw new Error('useCompany must be used within a CompanyProvider')
    }
    return ctx
}