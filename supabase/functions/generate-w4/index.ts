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
    const { caregiverId, w4Data } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: caregiver, error: caregiverError } = await supabase
      .from("caregivers")
      .select("id, company_id")
      .eq("id", caregiverId)
      .single();

    if (caregiverError || !caregiver) throw new Error("Caregiver not found");

    const { data: companyData, error: companyDataError } = await supabase
      .from("company_data")
      .select("legal_name, dba_name, address_line1, city, state, zip")
      .eq("company_id", caregiver.company_id)
      .maybeSingle();

    if (companyDataError || !companyData) throw new Error("Company data not found");

    const employerName = companyData.dba_name || companyData.legal_name || "";
    const employerAddress = `${companyData.address_line1 || ""}, ${companyData.city || ""} ${companyData.state || ""} ${companyData.zip || ""}`.trim();
    const employerBlock = `${employerName}\n${employerAddress}`;

    const companyEncryptionKey = Deno.env.get("COMPANY_ENCRYPTION_KEY");

    const { data: companyEIN, error: einError } = await supabase.rpc("get_company_ein", {
      p_company_id: caregiver.company_id,
      p_encryption_key: companyEncryptionKey,
    });

    const templatePath = "templates/default/W4.pdf";
    const { data: templateFile, error: templateError } = await supabase.storage
      .from("generated-pdfs")
      .download(templatePath);

    if (templateError)
      throw new Error(`Could not load W-4 template at "${templatePath}": ${templateError.message}`);

    const templateBytes = await templateFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(templateBytes, {
      ignoreEncryption: true,
    });
    const form = pdfDoc.getForm();

    const today = new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      timeZone: "America/New_York",
    });

    const setText = (fieldId: string, value: string | undefined) => {
      if (!value) return;
      try {
        form.getTextField(fieldId).setText(String(value));
        console.log(`✓ ${fieldId}`);
      } catch {
        console.log(`✗ ${fieldId}`);
      }
    };

    const setCheckbox = (fieldId: string, checked: boolean) => {
      try {
        const field = form.getCheckBox(fieldId);
        checked ? field.check() : field.uncheck();
        console.log(`✓ checkbox ${fieldId}`);
      } catch {
        console.log(`✗ checkbox ${fieldId}`);
      }
    };

    setText(
      "topmostSubform[0].Page1[0].Step1a[0].f1_01[0]",
      w4Data.middleInitial
        ? `${w4Data.firstName} ${w4Data.middleInitial}`
        : w4Data.firstName || "",
    );
    setText(
      "topmostSubform[0].Page1[0].Step1a[0].f1_02[0]",
      w4Data.lastName || "",
    );
    setText(
      "topmostSubform[0].Page1[0].Step1a[0].f1_03[0]",
      w4Data.address || "",
    );
    setText(
      "topmostSubform[0].Page1[0].Step1a[0].f1_04[0]",
      w4Data.cityStateZip || "",
    );

    setText("topmostSubform[0].Page1[0].f1_05[0]", w4Data.ssn || "");

    setCheckbox(
      "topmostSubform[0].Page1[0].c1_1[0]",
      w4Data.filingStatus === "single",
    );
    setCheckbox(
      "topmostSubform[0].Page1[0].c1_1[1]",
      w4Data.filingStatus === "joint",
    );
    setCheckbox(
      "topmostSubform[0].Page1[0].c1_1[2]",
      w4Data.filingStatus === "head",
    );

    setCheckbox("topmostSubform[0].Page1[0].c1_2[0]", !!w4Data.multipleJobs);

    setText(
      "topmostSubform[0].Page1[0].Step3_ReadOrder[0].f1_06[0]",
      w4Data.childCredit || "",
    );
    setText(
      "topmostSubform[0].Page1[0].Step3_ReadOrder[0].f1_07[0]",
      w4Data.otherDependents || "",
    );
    setText("topmostSubform[0].Page1[0].f1_08[0]", w4Data.totalCredits || "");

    setText("topmostSubform[0].Page1[0].f1_09[0]", w4Data.otherIncome || "");
    setText("topmostSubform[0].Page1[0].f1_10[0]", w4Data.deductions || "");
    setText(
      "topmostSubform[0].Page1[0].f1_11[0]",
      w4Data.extraWithholding || "",
    );

    setCheckbox("topmostSubform[0].Page1[0].c1_3[0]", !!w4Data.exempt);

    setText("topmostSubform[0].Page1[0].f1_12[0]", employerBlock);
    setText("topmostSubform[0].Page1[0].f1_13[0]", w4Data.startDate || "");
    setText("topmostSubform[0].Page1[0].f1_14[0]", companyEIN || "No EIN Provided");

    const page = pdfDoc.getPage(0);
    const signatureName =
      `${w4Data.firstName || ""} ${w4Data.lastName || ""}`.trim();
    page.drawText(signatureName, { x: 105, y: 93, size: 11 });
    page.drawText(today, { x: 465, y: 93, size: 11 });

    form.flatten();
    const filledPdfBytes = await pdfDoc.save();
    const outputPath = `${caregiver.company_id}/${caregiverId}/w4_completed.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("generated-pdfs")
      .upload(outputPath, filledPdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError)
      throw new Error(`Could not save W-4: ${uploadError.message}`);

    await supabase.from("caregiver_documents").upsert(
      {
        caregiver_id: caregiverId,
        company_id: caregiver.company_id,
        document_type: "w4_completed",
        file_name: "W-4_Completed.pdf",
        file_path: outputPath,
        mime_type: "application/pdf",
      },
      { onConflict: "caregiver_id, document_type" },
    );

    return new Response(JSON.stringify({ success: true, path: outputPath }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});