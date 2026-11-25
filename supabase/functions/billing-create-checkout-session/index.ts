import { billingCorsHeaders, ensureStripeCustomer, errorResponse, getBillingRow, getStripe, json, MANAGED_PAYMENTS_API_VERSION, requireSuperadmin, siteUrl } from '../_shared/billing.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: billingCorsHeaders })

  try {
    const ctx = await requireSuperadmin(req)
    const priceId = Deno.env.get('STRIPE_PRICE_ID')
    if (!priceId) throw new Error('Billing is not configured')

    const row = await getBillingRow(ctx)
    if (row.subscription_status === 'active' || row.subscription_status === 'trialing') {
      throw new Error('This company already has an active subscription')
    }

    const stripe = getStripe()
    const customerId = await ensureStripeCustomer(ctx, stripe)

    const params = {
      mode: 'subscription',
      customer: customerId,
      client_reference_id: ctx.companyId,
      line_items: [{ price: priceId, quantity: 1 }],
      managed_payments: { enabled: true },
      subscription_data: { metadata: { company_id: ctx.companyId } },
      success_url: `${siteUrl()}/admin/billing?checkout=success`,
      cancel_url: `${siteUrl()}/admin/billing?checkout=cancelled`,
    }

    const session = await stripe.checkout.sessions.create(
      params as never,
      { apiVersion: MANAGED_PAYMENTS_API_VERSION } as never,
    )

    return json({ url: session.url })
  } catch (err) {
    return errorResponse(err)
  }
})
