import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const todayStr = () =>
  new Date().toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    timeZone: 'America/New_York'
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { caregiverId, documentType, adminName, adminPosition, adminId, adminEmail } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: caregiver, error: caregiverError } = await supabase
      .from("caregivers")
      .select("id, name, company_id")
      .eq("id", caregiverId)
      .single();

    if (caregiverError || !caregiver) throw new Error("Caregiver not found");

    const filePath = `${caregiver.company_id}/${caregiverId}/${documentType}.pdf`;

    const { data: existingFile, error: loadError } = await supabase.storage
      .from("generated-pdfs")
      .download(filePath);

    if (loadError)
      throw new Error(`Could not load document at "${filePath}": ${loadError.message}`);

    const pdfBytes = await existingFile.arrayBuffer();
    const pdf = await PDFDocument.load(pdfBytes);
    const form = pdf.getForm();
    const italicFont = await pdf.embedFont(StandardFonts.HelveticaOblique);
    const regularFont = await pdf.embedFont(StandardFonts.Helvetica);

    const today = todayStr();

    const trySet = (fieldName: string, value: string) => {
      try {
        form.getTextField(fieldName).setText(value);
        return true;
      } catch {
        return false;
      }
    };

    trySet('rep_name', adminName);
    trySet('rep_title', adminPosition || '');
    const signatureSet = trySet('rep_signature', adminName);
    trySet('rep_date', today);

    form.updateFieldAppearances(regularFont);
    if (signatureSet) {
      try {
        form.getTextField('rep_signature').updateAppearances(italicFont);
      } catch {
      }
    }

    form.flatten();

    const saved = await pdf.save();

    const { error: uploadError } = await supabase.storage
      .from("generated-pdfs")
      .upload(filePath, saved, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError)
      throw new Error(`Could not save signed document: ${uploadError.message}`);

    await supabase
      .from("caregiver_documents")
      .update({
        admin_signed_at: new Date().toISOString(),
        admin_signed_by: adminName,
      })
      .eq("caregiver_id", caregiverId)
      .eq("company_id", caregiver.company_id)
      .eq("document_type", documentType);

    await supabase.from("audit_logs").insert({
      company_id: caregiver.company_id,
      admin_email: adminEmail,
      admin_id: adminId,
      action: `signed_${documentType}`,
      caregiver_id: caregiverId,
      caregiver_name: caregiver.name,
      metadata: { signed_at: new Date().toISOString() },
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
