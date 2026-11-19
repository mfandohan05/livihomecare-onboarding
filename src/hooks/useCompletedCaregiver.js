import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getMyCaregiver } from '@/lib/caregiver'

export function useCompletedCaregiver() {
    const [state, setState] = useState({ status: 'loading' })

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                if (!cancelled) setState({ status: 'signin' })
                return
            }

            const caregiver = await getMyCaregiver()
            if (!caregiver) {
                if (!cancelled) setState({ status: 'norecord' })
                return
            }
            if (caregiver.status !== 'completed') {
                if (!cancelled) setState({ status: 'onboarding' })
                return
            }

            const { data: branding } = await supabase
                .from('company_branding')
                .select('company_name, primary_color, secondary_bg_color, hover_color')
                .eq('company_id', caregiver.company_id)
                .single()

            if (cancelled) return
            if (branding) {
                document.documentElement.style.setProperty('--primary-color', branding.primary_color)
                document.documentElement.style.setProperty('--secondary-bg', branding.secondary_bg_color)
                document.documentElement.style.setProperty('--hover-color', branding.hover_color)
            }
            setState({ status: 'ready', caregiver, companyName: branding?.company_name || '' })
        }

        load()
        return () => { cancelled = true }
    }, [])

    return state
}
