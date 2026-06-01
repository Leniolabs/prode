import { Auth } from '@auth/core'
import { authConfig } from '@/lib/auth/auth.config'
import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Auth.js v5 Pages Router handler.
 *
 * Next.js Pages Router uses Node.js IncomingMessage/ServerResponse; Auth.js v5
 * internally works with the Web Fetch Request/Response API. We bridge the two
 * by constructing a Web Request from the incoming Pages Router request and
 * writing the Web Response back to the ServerResponse.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const host = req.headers['x-forwarded-host'] ?? req.headers['host'] ?? 'localhost'
  const proto = req.headers['x-forwarded-proto'] ?? 'http'
  const origin = `${proto}://${host}`
  const url = new URL(req.url ?? '/', origin)

  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v)
    } else {
      headers.set(key, value)
    }
  }

  const webReq = new Request(url.toString(), {
    method: req.method ?? 'GET',
    headers,
    // Pages Router body is already parsed by Next.js for JSON; for auth routes
    // (signin/signout/callback) it comes as a raw stream that needs to be
    // forwarded. We only include a body for non-GET requests.
    body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
  })

  const webRes = await Auth(webReq, authConfig)

  // Forward status
  res.status(webRes.status)

  // Forward headers
  webRes.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      res.appendHeader('set-cookie', value)
    } else {
      res.setHeader(key, value)
    }
  })

  // Forward body
  const body = await webRes.text()
  res.send(body)
}
