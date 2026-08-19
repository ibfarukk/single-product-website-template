# [OPEN] payment-runtime

## Summary
- Symptoms:
  - owner and customer emails are not sending
  - owner stats are not showing
  - Paystack confirmation is not working
- Scope:
  - single Worker deployment serving frontend and `/api/*`

## Hypotheses
1. One or more Worker routes are reaching the handler, but a runtime dependency or binding is missing in production.
2. The Gmail SMTP path is hanging or failing during `sendEmail`, preventing downstream behavior from completing as expected.
3. The `OWNER_STATS` KV binding is missing or misbound in the live Worker, so stats reads/writes fail.
4. Paystack verification is failing in production because the secret key, currency, amount, or returned transaction state does not match expectations.
5. One of the API handlers is throwing before `jsonResponse(...)` is returned, leaving the browser request pending.

## Status
- Session started
- Applied first pass runtime hardening:
  - added timeouts around owner stats read, Paystack verify, Gmail SMTP, and Resend
  - removed `WWW-Authenticate` from owner stats 401 JSON response
  - made Paystack verify return retryable responses for `not found` and pending states
  - made checkout retry those Paystack states instead of failing immediately
  - made owner and customer emails attempt independently
- Awaiting redeploy and live reproduction
