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
    const { caregiverId, w9Data } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: templateFile, error: templateError } = await supabase.storage
      .from("generated-pdfs")
      .download("templates/fw9.pdf");

    if (templateError)
      throw new Error(`Could not load W-9 template: ${templateError.message}`);

    const templateBytes = await templateFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(templateBytes, {
      ignoreEncryption: true,
    });
    const form = pdfDoc.getForm();

    const today = new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
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
      } catch {
        console.log(`✗ checkbox ${fieldId}`);
      }
    };

    // Line 1 — Full legal name
    setText("topmostSubform[0].Page1[0].f1_01[0]", w9Data.name);

    // Line 2 — Business name/DBA
    setText("topmostSubform[0].Page1[0].f1_02[0]", w9Data.businessName);

    // Line 3a — Tax classification checkboxes
    const classMap: Record<string, number> = {
      individual: 0,
      c_corp: 1,
      s_corp: 2,
      partnership: 3,
      trust: 4,
      llc: 5,
      other: 6,
    };
    if (
      w9Data.taxClassification &&
      classMap[w9Data.taxClassification] !== undefined
    ) {
      setCheckbox(
        `topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].c1_1[${classMap[w9Data.taxClassification]}]`,
        true,
      );
    }

    // LLC classification letter
    if (w9Data.taxClassification === "llc" && w9Data.llcClassification) {
      setText(
        "topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].f1_03[0]",
        w9Data.llcClassification,
      );
    }

    // Other description
    if (w9Data.taxClassification === "other" && w9Data.otherDescription) {
      setText(
        "topmostSubform[0].Page1[0].Boxes3a-b_ReadOrder[0].f1_04[0]",
        w9Data.otherDescription,
      );
    }

    // Address
    setText(
      "topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_07[0]",
      w9Data.address,
    );
    setText(
      "topmostSubform[0].Page1[0].Address_ReadOrder[0].f1_08[0]",
      w9Data.cityStateZip,
    );

if (w9Data.ssn) {
  const ssnClean = w9Data.ssn.replace(/-/g, '').slice(0, 9)
  setText('topmostSubform[0].Page1[0].f1_11[0]', ssnClean.slice(0, 3))
  setText('topmostSubform[0].Page1[0].f1_12[0]', ssnClean.slice(3, 5))
  setText('topmostSubform[0].Page1[0].f1_13[0]', ssnClean.slice(5))
}

// EIN — two boxes at y=420
if (w9Data.ein) {
  const einClean = w9Data.ein.replace(/-/g, '').slice(0, 9)
  setText('topmostSubform[0].Page1[0].f1_14[0]', einClean.slice(0, 2))
  setText('topmostSubform[0].Page1[0].f1_15[0]', einClean.slice(2))
}

  

    form.flatten();
    const filledPdfBytes = await pdfDoc.save();
    const outputPath = `${caregiverId}/w9_completed.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("generated-pdfs")
      .upload(outputPath, filledPdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError)
      throw new Error(`Could not save W-9: ${uploadError.message}`);

    await supabase.from("caregiver_documents").upsert(
      {
        caregiver_id: caregiverId,
        document_type: "w9_completed",
        file_name: "W-9_Completed.pdf",
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
