import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://app.livihomecare.com",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const today = () => {
  const d = new Date();
  return d.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
};

// pdf-lib uses bottom-left origin, but our coords are top-left
// height=841.9 for all pages
const flipY = (y: number, pageHeight = 841.9) => pageHeight - y;

async function loadTemplate(supabase: any, name: string): Promise<Uint8Array> {
  const { data, error } = await supabase.storage
    .from("generated-pdfs")
    .download(`templates/${name}`);
  if (error)
    throw new Error(`Failed to load template ${name}: ${error.message}`);
  return new Uint8Array(await data.arrayBuffer());
}

async function saveOutput(
  supabase: any,
  caregiverId: string,
  caregiverName: string,
  formName: string,
  bytes: Uint8Array,
) {
  const sanitized = caregiverName.replace(/[^a-zA-Z0-9]/g, "_");
  const filePath = `${caregiverId}/${sanitized}_${formName}.pdf`;

  await supabase.storage
    .from("generated-pdfs")
    .upload(filePath, bytes, { upsert: true, contentType: "application/pdf" });

  await supabase.from("caregiver_documents").upsert(
    {
      caregiver_id: caregiverId,
      document_type: formName,
      file_name: `${sanitized}_${formName}.pdf`,
      file_path: filePath,
      file_size: bytes.length,
      mime_type: "application/pdf",
    },
    { onConflict: "caregiver_id, document_type" },
  );
}

async function generateDrugTestPolicy(
  supabase: any,
  caregiver: any,
  signature: string,
) {
  const bytes = await loadTemplate(supabase, "drug_test_policy.pdf");
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const page = pdf.getPages()[0];
  const h = page.getHeight();

  // Employee Name line (y=140.8 top-left → flip)
  page.drawText(caregiver.name, {
    x: 175,
    y: h - 155,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });

  // "I, ___" acknowledgment name (y=548.1)
  page.drawText(caregiver.name, {
    x: 82,
    y: h - 558,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });

  // Employee Signature (y=630.9)
  page.drawText(signature, {
    x: 190,
    y: h - 643,
    size: 11,
    font: italic,
    color: rgb(0, 0, 0),
  });

  // Date next to signature
  page.drawText(today(), {
    x: 400,
    y: h - 643,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });

  const saved = await pdf.save();
  await saveOutput(
    supabase,
    caregiver.id,
    caregiver.name,
    "drug_test_policy_signed",
    saved,
  );
}

async function generateOrientationChecklist(
  supabase: any,
  caregiver: any,
  signature: string,
) {
  const bytes = await loadTemplate(supabase, "orientation_checklist.pdf");
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  // Page 1 has no employee fields to fill (it's a checklist)
  // Page 2 has signatures
  const page2 = pdf.getPages()[1];
  const h = page2.getHeight();

  // Employee Name (Print) - above "Employee Signature" line at y=243.3
  page2.drawText(caregiver.name, {
    x: 72,
    y: h - 235,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });


  // Date next to signature (y=243.3)
  page2.drawText(today(), {
    x: 350,
    y: h - 235,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });

  const saved = await pdf.save();
  await saveOutput(
    supabase,
    caregiver.id,
    caregiver.name,
    "orientation_checklist_signed",
    saved,
  );
}

async function generateCriminalBackgroundCheck(
  supabase: any,
  caregiver: any,
  signature: string,
) {
  const bytes = await loadTemplate(supabase, "criminal_background_check.pdf");
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const page = pdf.getPages()[0];
  const h = page.getHeight();

  // "I, ___ (Full Name)" at y=218.3
  page.drawText(caregiver.name, {
    x: 82,
    y: h - 228,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });

  // Printed Name at y=610.7
  page.drawText(caregiver.name, {
    x: 150,
    y: h - 620,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });

  // Signature at y=667.8
  page.drawText(signature, {
    x: 130,
    y: h - 680,
    size: 11,
    font: italic,
    color: rgb(0, 0, 0),
  });

  // Date at y=711.2
  page.drawText(today(), {
    x: 110,
    y: h - 724,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });

  const saved = await pdf.save();
  await saveOutput(
    supabase,
    caregiver.id,
    caregiver.name,
    "criminal_background_check_signed",
    saved,
  );
}

async function generateNewHireNotification(
  supabase: any,
  caregiver: any,
  signature: string,
) {
  const bytes = await loadTemplate(supabase, "new_hire_notification.pdf");
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const page = pdf.getPages()[0];
  const h = page.getHeight();

  // Applicant Name (Print) at y=174.7 — label ends at x=205.9, fill after
  page.drawText(caregiver.name, {
    x: 215,
    y: h - 187,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });

  // Position Applied for at y=209.0
  page.drawText(caregiver.position_title || "", {
    x: 193,
    y: h - 222,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });

  // Date at y=243.1
  page.drawText(today(), {
    x: 108,
    y: h - 256,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });

  // Signature of Applicant at y=499.4
  page.drawText(signature, {
    x: 210,
    y: h - 512,
    size: 11,
    font: italic,
    color: rgb(0, 0, 0),
  });

  const saved = await pdf.save();
  await saveOutput(
    supabase,
    caregiver.id,
    caregiver.name,
    "new_hire_notification_signed",
    saved,
  );
}

async function generateHepBDeclination(
  supabase: any,
  caregiver: any,
  signature: string,
  hepBStatus: string,
) {
  const bytes = await loadTemplate(supabase, "hep_b_declination.pdf");
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const page = pdf.getPages()[0];
  const h = page.getHeight();

  const optionYMap: Record<string, number> = {
    decline: 427,
    received: 442,
    immune: 457,
    medical: 472,
  };

  const checkY = optionYMap[hepBStatus];
  if (checkY) {
    page.drawText("X", {
      x: 90,
      y: h - checkY,
      size: 12,
      font,
      color: rgb(0.34, 0.49, 0.04),
    });
  }

  // Employee Name (Print) at y=547.3
  page.drawText(caregiver.name, {
    x: 72,
    y: h - 540,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });

  // Employee Signature at y=620.5
  page.drawText(signature, {
    x: 72,
    y: h - 613,
    size: 11,
    font: italic,
    color: rgb(0, 0, 0),
  });

  // Date at y=679.1
  page.drawText(today(), {
    x: 72,
    y: h - 672,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });

  const saved = await pdf.save();
  await saveOutput(
    supabase,
    caregiver.id,
    caregiver.name,
    "hep_b_declination_signed",
    saved,
  );
}

async function generateNonCompete(
  supabase: any,
  caregiver: any,
  signature: string,
) {
  const bytes = await loadTemplate(supabase, "non_compete.pdf");
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const page = pdf.getPages()[0];
  const h = page.getHeight();

  // Fill in "this ___ day of ___" at y=~130
  const now = new Date();
  const day = now.getDate().toString();
  const month = now.toLocaleString("en-US", { month: "long" });

  page.drawText(day, {
    x: 345,
    y: h - 130,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });
  page.drawText(month, {
    x: 435,
    y: h - 130,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });

  // Employee name at end of first paragraph "and ___"
  page.drawText(caregiver.name, {
    x: 290,
    y: h - 162.5,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });

  // Employee Signature at y=680.3
  page.drawText(signature, {
    x: 180,
    y: h - 688,
    size: 11,
    font: italic,
    color: rgb(0, 0, 0),
  });

  // Date next to employee signature
  page.drawText(today(), {
    x: 430,
    y: h - 688,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });

  const saved = await pdf.save();
  await saveOutput(
    supabase,
    caregiver.id,
    caregiver.name,
    "non_compete_signed",
    saved,
  );
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') || ''
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { caregiverId, signature, hepBStatus, forms } = await req.json();
    // forms: array of which forms to generate e.g. ['drug_test', 'non_compete', 'hep_b', 'criminal', 'new_hire', 'orientation']

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: caregiver } = await supabase
      .from("caregivers")
      .select("id, name, position_title, role")
      .eq("id", caregiverId)
      .single();

    if (!caregiver) throw new Error("Caregiver not found");

    const results: string[] = [];

    if (!forms || forms.includes("drug_test")) {
      await generateDrugTestPolicy(supabase, caregiver, signature);
      results.push("drug_test_policy_signed");
    }
    if (!forms || forms.includes("criminal")) {
      await generateCriminalBackgroundCheck(supabase, caregiver, signature);
      results.push("criminal_background_check_signed");
    }
    if (!forms || forms.includes("new_hire")) {
      await generateNewHireNotification(supabase, caregiver, signature);
      results.push("new_hire_notification_signed");
    }
    if (!forms || forms.includes("orientation")) {
      await generateOrientationChecklist(supabase, caregiver, signature);
      results.push("orientation_checklist_signed");
    }
    if (forms?.includes("non_compete")) {
      await generateNonCompete(supabase, caregiver, signature);
      results.push("non_compete_signed");
    }
    if (forms?.includes("hep_b") && hepBStatus) {
      await generateHepBDeclination(supabase, caregiver, signature, hepBStatus);
      results.push("hep_b_declination_signed");
    }

    return new Response(JSON.stringify({ success: true, generated: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
