import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getMyCaregiver } from '@/lib/caregiver'
import { applyBranding } from '@/lib/branding'

export function useCaregiverCompany() {
    const [state, setState] = useState({ company: null, loading: true })

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) return null

                const caregiver = await getMyCaregiver()
                if (!caregiver) return null

                const { data } = await supabase
                    .from('company_branding')
                    .select('company_name, phone, support_email, primary_color, secondary_bg_color, hover_color')
                    .eq('company_id', caregiver.company_id)
                    .single()

                if (!data) return null
                applyBranding({ primary: data.primary_color, hover: data.hover_color, secondary: data.secondary_bg_color })
                return { name: data.company_name, phone: data.phone, email: data.support_email }
            } catch {
                return null
            }
        }

        load().then((company) => {
            if (!cancelled) setState({ company, loading: false })
        })
        return () => { cancelled = true }
    }, [])

    return state
}
