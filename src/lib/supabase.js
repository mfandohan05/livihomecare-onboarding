import { createClient } from '@supabase/supabase-js'
import { reportHttpError } from './errorReporter'

function requestUrl(input) {
  return typeof input === 'string' ? input : input?.url
}

function parseErrorMessage(bodyText) {
  try {
    const parsed = JSON.parse(bodyText)
    return parsed?.error || parsed?.message || null
  } catch {
    return null
  }
}

function functionLabelFromUrl(url) {
  const match = url?.match(/\/functions\/v1\/([^/?]+)/)
  return match ? match[1].replace(/-/g, ' ') : null
}


async function monitoredFetch(input, init) {
  let response
  try {
    response = await fetch(input, init)
  } catch (err) {
    reportHttpError({
      url: requestUrl(input),
      method: init?.method || 'GET',
      status: null,
      statusText: 'Network error',
      body: err?.message || 'Failed to reach the server.',
      message: err?.message || 'Failed to reach the server.',
      functionLabel: functionLabelFromUrl(requestUrl(input)),
    })
    throw err
  }

  const isFunctionsCall = requestUrl(input)?.includes('/functions/v1/')
  const isUnexpected = response.status >= 500 || (isFunctionsCall && response.status >= 400)

  if (isUnexpected) {
    response
      .clone()
      .text()
      .then((body) => {
        reportHttpError({
          url: requestUrl(input),
          method: init?.method || 'GET',
          status: response.status,
          statusText: response.statusText,
          body,
          message: parseErrorMessage(body),
          functionLabel: functionLabelFromUrl(requestUrl(input)),
        })
      })
      .catch(() => {
        reportHttpError({
          url: requestUrl(input),
          method: init?.method || 'GET',
          status: response.status,
          statusText: response.statusText,
          body: '(could not read response body)',
          message: null,
          functionLabel: functionLabelFromUrl(requestUrl(input)),
        })
      })
  }

  return response
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      fetch: monitoredFetch,
    },
  }
)
