import { billingCorsHeaders, errorResponse, getBillingRow, json, requireSuperadmin } from '../_shared/billing.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: billingCorsHeaders })

  try {
    const ctx = await requireSuperadmin(req)
    const row = await getBillingRow(ctx)

    return json({
      hasCustomer: !!row.stripe_customer_id,
      status: row.subscription_status || 'none',
      currentPeriodEnd: row.subscription_current_period_end || null,
    })
  } catch (err) {
    return errorResponse(err)
  }
})
