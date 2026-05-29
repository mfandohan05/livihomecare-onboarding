import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const allowedOrigins = [
  "https://app.livihomecare.com",
  "http://localhost:5173",
];

const todayStr = () =>
  new Date().toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    timeZone: 'America/New_York'
  });

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin)
      ? origin
      : allowedOrigins[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { caregiverId, documentType, adminName } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: caregiver } = await supabase
      .from("caregivers")
      .select("id, name")
      .eq("id", caregiverId)
      .single();

    if (!caregiver) throw new Error("Caregiver not found");

    const sanitized = caregiver.name.replace(/[^a-zA-Z0-9]/g, "_");
    const filePath = `${caregiverId}/${sanitized}_${documentType}.pdf`;

    const { data: existingFile, error: loadError } = await supabase.storage
      .from("generated-pdfs")
      .download(filePath);

    if (loadError)
      throw new Error(`Could not load document: ${loadError.message}`);

    const pdfBytes = await existingFile.arrayBuffer();
    const pdf = await PDFDocument.load(pdfBytes);
    const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);

    if (documentType === "drug_test_policy_signed") {
      const page = pdf.getPages()[0];
      const h = page.getHeight();
      // LHC Representative signature
      page.drawText(adminName, {
        x: 190,
        y: h - 680,
        size: 11,
        font: italic,
        color: rgb(0, 0, 0),
      });
      // LHC Date
      page.drawText(todayStr(), {
        x: 410,
        y: h - 680,
        size: 11,
        font: regular,
        color: rgb(0, 0, 0),
      });
    }

    if (documentType === "non_compete_signed") {
      const page = pdf.getPages()[0];
      const h = page.getHeight();
      // LHC Representative Name
      page.drawText(adminName, {
        x: 210,
        y: h - 720,
        size: 11,
        font: regular,
        color: rgb(0, 0, 0),
      });
      // LHC Signature
      page.drawText(adminName, {
        x: 132,
        y: h - 746,
        size: 11,
        font: italic,
        color: rgb(0, 0, 0),
      });
      // LHC Date
      page.drawText(todayStr(), {
        x: 372,
        y: h - 746,
        size: 11,
        font: regular,
        color: rgb(0, 0, 0),
      });
    }

    if (documentType === "orientation_checklist_signed") {
      const page = pdf.getPages()[1]; // page 2
      const h = page.getHeight();
      // LHC Representative Printed Name
      page.drawText(adminName, {
        x: 72,
        y: h - 342,
        size: 11,
        font: regular,
        color: rgb(0, 0, 0),
      });
      // LHC Signature
      page.drawText(adminName, {
        x: 72,
        y: h - 440,
        size: 11,
        font: italic,
        color: rgb(0, 0, 0),
      });
      // LHC Date
      page.drawText(todayStr(), {
        x: 350,
        y: h - 440,
        size: 11,
        font: regular,
        color: rgb(0, 0, 0),
      });
    }

    const saved = await pdf.save();

    await supabase.storage.from("generated-pdfs").upload(filePath, saved, {
      contentType: "application/pdf",
      upsert: true,
    });
    await supabase
      .from("caregiver_documents")
      .update({
        admin_signed_at: new Date().toISOString(),
        admin_signed_by: adminName,
      })
      .eq("caregiver_id", caregiverId)
      .eq("document_type", documentType);
      

    await supabase.from("audit_logs").insert({
      admin_email: adminName,
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
