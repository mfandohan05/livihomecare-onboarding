import { supabase } from '@/lib/supabase'

export function logImportantAction (caregiverId, caregiverName) {
    const logAction = async (action, metadata = {}) => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            return
        }

        await supabase.from('audit_logs').insert({
            admin_id: session.user.id,
            admin_email: session.user.email,
            action,
            caregiver_id: caregiverId,
            caregiver_name: caregiverName,
            metadata
        })
    }

    return { logAction }
}