import { billingCorsHeaders, errorResponse, getBillingRow, getStripe, json, requireSuperadmin, siteUrl } from '../_shared/billing.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: billingCorsHeaders })

  try {
    const ctx = await requireSuperadmin(req)
    const row = await getBillingRow(ctx)
    if (!row.stripe_customer_id) throw new Error('No billing account exists yet')

    const session = await getStripe().billingPortal.sessions.create({
      customer: row.stripe_customer_id,
      return_url: `${siteUrl()}/admin/billing`,
    })

    return json({ url: session.url })
  } catch (err) {
    return errorResponse(err)
  }
})
