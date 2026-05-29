import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { caregiverId, section2Data, adminName } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // load existing Section 1 PDF
    const { data: existingFile, error: loadError } = await supabase.storage
      .from("generated-pdfs")
      .download(`${caregiverId}/i9_completed.pdf`);

    if (loadError) throw new Error(`Could not load I-9: ${loadError.message}`);

    const pdfBytes = await existingFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    const setText = (fieldId: string, value: string | undefined) => {
      if (value == null) return;
      try {
        form.getTextField(fieldId).setText(String(value));
      } catch {
        console.log(`Text field not found: ${fieldId}`);
      }
    };

    const setCheckbox = (fieldId: string, checked: boolean) => {
      try {
        const field = form.getCheckBox(fieldId);
        checked ? field.check() : field.uncheck();
      } catch {
        console.log(`Checkbox not found: ${fieldId}`);
      }
    };

    const today = new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      timeZone: 'America/New_York'
    });

    // List A
    setText("Document Title 1", section2Data.listADocTitle);
    setText("Issuing Authority 1", section2Data.listAIssuingAuthority);
    setText("Document Number 0 (if any)", section2Data.listADocNumber);
    setText("Expiration Date if any", section2Data.listAExpDate);

    // List A Doc 2 (if any)
    setText("Document Title 2 If any", section2Data.listADoc2Title);
    setText("Issuing Authority_2", section2Data.listADoc2IssuingAuthority);
    setText("Document Number If any_2", section2Data.listADoc2Number);

    // List B
    setText("List B Document 1 Title", section2Data.listBDocTitle);
    setText("List B Issuing Authority 1", section2Data.listBIssuingAuthority);
    setText("List B Document Number 1", section2Data.listBDocNumber);
    setText("List B Expiration Date 1", section2Data.listBExpDate);

    // List C
    setText("List C Document Title 1", section2Data.listCDocTitle);
    setText("List C Issuing Authority 1", section2Data.listCIssuingAuthority);
    setText("List C Document Number 1", section2Data.listCDocNumber);
    setText("List C Expiration Date 1", section2Data.listCExpDate);

    // Additional info
    setText("Additional Information", section2Data.additionalInfo);
    setCheckbox("CB_Alt", section2Data.alternativeProcedure || false);

    // Employer certification
    setText("FirstDayEmployed mmddyyyy", section2Data.firstDayOfEmployment);
    setText(
      "Last Name First Name and Title of Employer or Authorized Representative",
      adminName,
    );
    setText("Signature of Employer or AR", adminName);
    setText("S2 Todays Date mmddyyyy", today);
    setText(
      "Employers Business or Org Name",
      "MDC Global Care Solutions dba Livi Home Care",
    );
    setText(
      "Employers Business or Org Address",
      "179 Gasoline Alley Dr. Suite 203, Mooresville NC 28117",
    );

    form.flatten();
    const filledPdfBytes = await pdfDoc.save();
    const { data: caregiver } = await supabase
      .from("caregivers")
      .select("name")
      .eq("id", caregiverId)
      .single();

    if (!caregiver) throw new Error("Caregiver not found");

    const sanitized = caregiver.name.replace(/[^a-zA-Z0-9]/g, "_");
    const filePath = `${caregiverId}/i9_completed.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("generated-pdfs")
      .upload(filePath, filledPdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError)
      throw new Error(`Could not save I-9: ${uploadError.message}`);

    await supabase.from("caregiver_documents").upsert(
      {
        caregiver_id: caregiverId,
        document_type: "i9_completed",
        file_name: `i9_completed.pdf`,
        file_path: filePath,
        mime_type: "application/pdf",
      },
      { onConflict: "caregiver_id, document_type" },
    );

    await supabase.from("caregiver_tax_forms").upsert(
      {
        caregiver_id: caregiverId,
        i9_section2_data: section2Data,
        i9_section2_completed_at: new Date().toISOString(),
        i9_section2_completed_by: adminName,
      },
      { onConflict: "caregiver_id" },
    );

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
