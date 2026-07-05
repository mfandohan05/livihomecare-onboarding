import { supabase } from "@/lib/supabase";
import { useCompany } from "@/context/CompanyContext";

export function logImportantAction(caregiverId, caregiverName, isAdmin, companyId) {
  const logAction = async (action, metadata = {}) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return;
    }
    if (isAdmin) {
      await supabase.from("audit_logs").insert({
        admin_id: session.user.id,
        admin_email: session.user.email,
        action,
        caregiver_id: caregiverId,
        caregiver_name: caregiverName,
        company_id: companyId,
        metadata,
      });
    }
    else {
        await supabase.from('audit_logs').insert({
            action,
            caregiver_id: caregiverId,
            caregiver_name: caregiverName,
            company_id: companyId,
            metadata
        })
    }
  };

  return { logAction };
}
