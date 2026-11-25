import Stripe from 'npm:stripe@^18'
import { getStripe, json } from '../_shared/billing.ts'
import { serviceClient } from '../_shared/caregiverAccess.ts'

const cryptoProvider = Stripe.createSubtleCryptoProvider()

const periodEndIso = (subscription: Stripe.Subscription): string | null => {
  const seconds = (subscription as unknown as { current_period_end?: number }).current_period_end
    ?? subscription.items?.data?.[0]?.current_period_end
  return seconds ? new Date(seconds * 1000).toISOString() : null
}

async function saveSubscription(subscription: Stripe.Subscription, fallbackCompanyId?: string | null) {
  const supabase = serviceClient()
  const update = {
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    subscription_current_period_end: periodEndIso(subscription),
  }

  const companyId = subscription.metadata?.company_id || fallbackCompanyId
  if (companyId) {
    await supabase.from('company_data').update(update).eq('company_id', companyId)
    return
  }

  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
  await supabase.from('company_data').update(update).eq('stripe_customer_id', customerId)
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const signature = req.headers.get('stripe-signature')
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!signature || !secret) return json({ error: 'Unauthorized' }, 401)

  const stripe = getStripe()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(await req.text(), signature, secret, undefined, cryptoProvider)
  } catch (_err) {
    return json({ error: 'Invalid signature' }, 400)
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode === 'subscription' && session.subscription) {
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        await saveSubscription(subscription, session.client_reference_id)
      }
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      await saveSubscription(event.data.object as Stripe.Subscription)
    }
  } catch (err) {
    console.error('stripe-webhook handler error:', (err as Error).message)
    return json({ error: 'Handler failed' }, 500)
  }

  return json({ received: true })
})
