import Stripe from 'npm:stripe@^18'
import { requireAdminContext, AdminContext } from './requireAdmin.ts'

export const billingCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...billingCorsHeaders, 'Content-Type': 'application/json' },
  })

export const MANAGED_PAYMENTS_API_VERSION = '2026-02-25.preview'

export function getStripe(): Stripe {
  return new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)
}

export function siteUrl(): string {
  return (Deno.env.get('SITE_URL') || 'https://rsonboard.com').replace(/\/$/, '')
}

export async function requireSuperadmin(req: Request): Promise<AdminContext> {
  const ctx = await requireAdminContext(req)
  if (ctx.role !== 'superadmin') throw new Error('Unauthorized')
  return ctx
}

export async function getBillingRow(ctx: AdminContext) {
  const { data, error } = await ctx.supabase
    .from('company_data')
    .select('company_id, company_name, support_email, stripe_customer_id, stripe_subscription_id, stripe_price_id, subscription_status, subscription_current_period_end')
    .eq('company_id', ctx.companyId)
    .maybeSingle()
  if (error || !data) throw new Error('Company not found')
  return data
}

export async function ensureStripeCustomer(ctx: AdminContext, stripe: Stripe) {
  const row = await getBillingRow(ctx)
  if (row.stripe_customer_id) return row.stripe_customer_id as string

  const customer = await stripe.customers.create({
    name: row.company_name || undefined,
    email: ctx.email || row.support_email || undefined,
    metadata: { company_id: ctx.companyId },
  })

  const { error } = await ctx.supabase
    .from('company_data')
    .update({ stripe_customer_id: customer.id })
    .eq('company_id', ctx.companyId)
  if (error) throw new Error('Could not save Stripe customer')

  return customer.id
}

export function errorResponse(err: unknown) {
  const message = (err as Error).message || 'Something went wrong'
  const status = message === 'Unauthorized' ? 401 : 400
  return json({ error: message }, status)
}
