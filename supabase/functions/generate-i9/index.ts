import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://app.livihomecare.com",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { caregiverId, i9Data } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: caregiver } = await supabase
      .from("caregivers")
      .select("name")
      .eq("id", caregiverId)
      .single();

    if (!caregiver) throw new Error("Caregiver not found");

    const sanitized = caregiver.name.replace(/[^a-zA-Z0-9]/g, "_");
    const outputPath = `${caregiverId}/i9_completed.pdf`;

    const { data: templateFile, error: templateError } = await supabase.storage
      .from("generated-pdfs")
      .download("templates/i-9form.pdf");

    if (templateError)
      throw new Error(`Could not load I-9 template: ${templateError.message}`);

    const templateBytes = await templateFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(templateBytes);
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

    const setDropdown = (fieldId: string, value: string | undefined) => {
      if (value == null) return;
      try {
        form.getDropdown(fieldId).select(value);
      } catch {
        console.log(`Dropdown not found: ${fieldId}`);
      }
    };

    const today = new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      timeZone: 'America/New_York'
    });

    setText("Last Name (Family Name)", i9Data.lastName);
    setText("First Name Given Name", i9Data.firstName);
    setText("Employee Middle Initial (if any)", i9Data.middleInitial);
    setText("Employee Other Last Names Used (if any)", i9Data.otherLastNames);

    setText("Address Street Number and Name", i9Data.address);
    setText("Apt Number (if any)", i9Data.apt);
    setText("City or Town", i9Data.city);
    setDropdown("State", i9Data.state);
    setText("ZIP Code", i9Data.zip);

    setText("Date of Birth mmddyyyy", i9Data.dob);
    setText("US Social Security Number", i9Data.ssn);
    setText("US Social Security Number 1", i9Data.ssn);
    setText("Employees E-mail Address", i9Data.email);
    setText("Telephone Number", i9Data.phone);

    setText(
      "Signature of Employee",
      `${i9Data.firstName || ""} ${i9Data.lastName || ""}`,
    );
    setText("Today's Date mmddyyy", today);

    setCheckbox("CB_1", i9Data.citizenshipStatus === "1");
    setCheckbox("CB_2", i9Data.citizenshipStatus === "2");
    setCheckbox("CB_3", i9Data.citizenshipStatus === "3");
    setCheckbox("CB_4", i9Data.citizenshipStatus === "4");

    if (i9Data.citizenshipStatus === "3" && i9Data.uscisNumber) {
      setText(
        "3 A lawful permanent resident Enter USCIS or ANumber",
        i9Data.uscisNumber,
      );
    }

    if (i9Data.citizenshipStatus === "4") {
      setText("Exp Date mmddyyyy", i9Data.expDate);

      if (i9Data.alienNumberType === "uscis") {
        setText("USCIS ANumber", i9Data.uscisANumberAlien);
      } else if (i9Data.alienNumberType === "i94") {
        setText("Form I94 Admission Number", i9Data.i94AdmissionNumber);
      } else if (i9Data.alienNumberType === "passport") {
        setText(
          "Foreign Passport Number and Country of IssuanceRow1",
          `${i9Data.foreignPassportNumber} / ${i9Data.countryOfIssuance}`,
        );
      }
    }
    // flatten only Section 1 fields, leave Section 2 fields editable
    const section1Fields = [
      "Last Name (Family Name)",
      "First Name Given Name",
      "Employee Middle Initial (if any)",
      "Employee Other Last Names Used (if any)",
      "Address Street Number and Name",
      "Apt Number (if any)",
      "City or Town",
      "State",
      "ZIP Code",
      "Date of Birth mmddyyyy",
      "US Social Security Number",
      "US Social Security Number 1",
      "Employees E-mail Address",
      "Telephone Number",
      "Signature of Employee",
      "Today's Date mmddyyy",
      "CB_1",
      "CB_2",
      "CB_3",
      "CB_4",
      "3 A lawful permanent resident Enter USCIS or ANumber",
      "Exp Date mmddyyyy",
      "USCIS ANumber",
      "Form I94 Admission Number",
      "Foreign Passport Number and Country of IssuanceRow1",
    ];

    for (const fieldName of section1Fields) {
      try {
        const field = form.getField(fieldName);
        field.enableReadOnly();
      } catch {
      }
    }
    const filledPdfBytes = await pdfDoc.save();

    const { error: uploadError } = await supabase.storage
      .from("generated-pdfs")
      .upload(outputPath, filledPdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError)
      throw new Error(`Could not save completed I-9: ${uploadError.message}`);

    await supabase.from("caregiver_documents").upsert(
      {
        caregiver_id: caregiverId,
        document_type: "i9_completed",
        file_name: `i9_completed.pdf`,
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
