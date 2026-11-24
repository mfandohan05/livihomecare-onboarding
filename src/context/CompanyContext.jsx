import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { applyBranding, clearBranding, getCachedBranding } from '@/lib/branding'

const NO_ROW = 'PGRST116'

const CompanyContext = createContext(null)

export function CompanyProvider({ children }) {
    const [companyId, setCompanyId] = useState(null)
    const [companyName, setCompanyName] = useState(() => getCachedBranding()?.companyName ?? '')
    const [primaryColor, setPrimaryColor] = useState(null)
    const [secondaryColor, setSecondaryColor] = useState(null)
    const [hoverColor, setHoverColor] = useState(null);
    const [logoUrl, setLogoUrl] = useState(() => getCachedBranding()?.logoUrl ?? null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false

        const forgetCompany = () => {
            clearBranding()
            setCompanyName('')
            setLogoUrl(null)
        }

        const fetchAdminAndCompany = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) return

                const { data: admin, error: adminError } = await supabase
                    .from('admin_users')
                    .select('company_id')
                    .eq('id', session.user.id)
                    .single()

                if (cancelled) return

                if (adminError?.code === NO_ROW) forgetCompany()
                if (adminError || !admin) return

                setCompanyId(admin.company_id)

                const { data: company, error: companyError } = await supabase
                    .from('company_data')
                    .select('logo_path, company_name, primary_color, secondary_bg_color, hover_color')
                    .eq('company_id', admin.company_id)
                    .maybeSingle()

                if (cancelled || companyError) return

                if (!company) {
                    forgetCompany()
                    return
                }

                setCompanyName(company.company_name || '')
                setPrimaryColor(company.primary_color || '#577C09')
                setSecondaryColor(company.secondary_bg_color || '#E8F0D0')
                setHoverColor(company.hover_color || '#3D5906')

                if (company.logo_path) {
                    const { data: urlData } = supabase.storage
                        .from('company_assets')
                        .getPublicUrl(company.logo_path)
                    setLogoUrl(urlData.publicUrl)
                } else {
                    setLogoUrl(null)
                }
            } catch (err) {
                console.error('Company branding could not be loaded:', err)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        fetchAdminAndCompany()

        return () => { cancelled = true }
    }, [])
    useEffect(() => {
        if (primaryColor) {
            applyBranding({
                primary: primaryColor,
                hover: hoverColor,
                secondary: secondaryColor,
                logoUrl,
                companyName,
            })
        }
    }, [primaryColor, hoverColor, secondaryColor, logoUrl, companyName])
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