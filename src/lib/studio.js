import { supabase } from '@/lib/supabase'

export async function callStudioFunction(name, body) {
    const { data: { session } } = await supabase.auth.getSession()
    const { data, error } = await supabase.functions.invoke(name, {
        body,
        headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (error) throw error
    if (data?.error) throw new Error(data.error)
    return data
}

export const FORM_TYPE_LABELS = {
    signature_only: 'Signature Only',
    hepb_status: 'Hep B Status',
    job_description: 'Job Description',
    direct_deposit: 'Direct Deposit',
    reference_check: 'Reference Check',
    wotc: 'WOTC',
}

export const FIELD_MAPPING_TYPES = ['signature_only', 'hepb_status']
