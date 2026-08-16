# Worker Setup

This file explains how to set up the Cloudflare Worker for this project.

The Worker handles:

- Paystack payment verification
- Paystack webhooks
- manual bank transfer orders
- owner/admin email notifications
- customer confirmation emails
- Gmail SMTP sending
- Resend fallback if Gmail SMTP fails
- Discord notifications for orders and failed attempts
- Telegram notifications for orders and failed attempts
- owner stats storage and protected dashboard API

## Files

- Worker code: [worker/src/index.js](file:///c:/laragon/www/PMELAB-single-product-template/worker/src/index.js)
- Worker config: [worker/wrangler.jsonc](file:///c:/laragon/www/PMELAB-single-product-template/worker/wrangler.jsonc)
- Local env example: [worker/.dev.vars.example](file:///c:/laragon/www/PMELAB-single-product-template/worker/.dev.vars.example)
- Owner dashboard page: [owner.html](file:///c:/laragon/www/PMELAB-single-product-template/owner.html)

## 1. Install Worker dependencies

Open a terminal in the `worker` folder and run:

```bash
npm install
```

## 2. Local development env file

For local testing with `wrangler dev`, create a file named:

```text
worker/.dev.vars
```

You can copy from:

```text
worker/.dev.vars.example
```

The project already includes [worker/.gitignore](file:///c:/laragon/www/PMELAB-single-product-template/worker/.gitignore), so your real `.dev.vars` will not be committed.

Example local env:

```env
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key_here
OWNER_EMAIL=owner@example.com
OWNER_DASHBOARD_USERNAME=owner
OWNER_DASHBOARD_PASSWORD=change_this_dashboard_password

GMAIL_SMTP_HOST=smtp.gmail.com
GMAIL_SMTP_PORT=465
GMAIL_SMTP_USER=yourgmail@gmail.com
GMAIL_SMTP_PASSWORD=your_16_character_gmail_app_password
GMAIL_FROM_EMAIL=yourgmail@gmail.com
MAIL_FROM=yourgmail@gmail.com

RESEND_API_KEY=re_your_resend_api_key_here
RESEND_FROM_EMAIL=orders@yourdomain.com

DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your_webhook_id/your_webhook_token

TELEGRAM_BOT_TOKEN=123456789:your_telegram_bot_token_here
TELEGRAM_CHAT_ID=-1001234567890
```

## 3. What each variable does

`PAYSTACK_SECRET_KEY`  
Used to verify Paystack transactions and webhooks.

`OWNER_EMAIL`  
The email address that receives new order notifications.

`OWNER_DASHBOARD_USERNAME`
The username required to access the owner stats dashboard.

`OWNER_DASHBOARD_PASSWORD`
The password required to access the owner stats dashboard.

`GMAIL_SMTP_HOST`  
Usually `smtp.gmail.com`.

`GMAIL_SMTP_PORT`  
Recommended: `465`.

`GMAIL_SMTP_USER`  
Your Gmail address used for SMTP login.

`GMAIL_SMTP_PASSWORD`  
Your Gmail App Password. Do not use your normal Gmail password.

`GMAIL_FROM_EMAIL`  
Optional. The visible sender for Gmail SMTP. Use only if it is the Gmail address itself or a valid Gmail alias.

`MAIL_FROM`  
Optional common sender override.

`RESEND_API_KEY`  
Optional fallback provider. If Gmail SMTP fails, the Worker will try Resend.

`RESEND_FROM_EMAIL`  
The sender address for Resend fallback. This must be valid in Resend.

`DISCORD_WEBHOOK_URL`
Optional. If set, the Worker sends order notifications to Discord.

`TELEGRAM_BOT_TOKEN`
Optional. Telegram bot token for order notifications.

`TELEGRAM_CHAT_ID`
Optional. Telegram chat or group id that receives the notifications.

## 3.5 Owner dashboard and stats storage

The project now includes a private owner page:

```text
/owner.html
```

This page shows:

- visitors
- page views
- successful sales
- successful sales revenue
- failed sales
- abandoned checkout count
- manual order count
- manual order value

How access works:

- the page asks for username and password
- the Worker checks those against `OWNER_DASHBOARD_USERNAME` and `OWNER_DASHBOARD_PASSWORD`
- without valid credentials, stats cannot be loaded

Stats are stored in Worker KV using the `OWNER_STATS` binding already added in [worker/wrangler.jsonc](file:///c:/laragon/www/PMELAB-single-product-template/worker/wrangler.jsonc).

If your Wrangler version does not auto-provision KV on deploy, create the KV namespace manually and add its id to `wrangler.jsonc`.

## 4. Gmail setup

To use Gmail SMTP:

1. Log in to your Google account
2. Enable 2-Step Verification
3. Create a Gmail App Password
4. Put that App Password into:

```env
GMAIL_SMTP_PASSWORD=...
```

Recommended Gmail config:

```env
GMAIL_SMTP_HOST=smtp.gmail.com
GMAIL_SMTP_PORT=465
GMAIL_SMTP_USER=yourgmail@gmail.com
GMAIL_SMTP_PASSWORD=your_16_character_gmail_app_password
GMAIL_FROM_EMAIL=yourgmail@gmail.com
```

Important:

- Gmail is the **primary** sender
- Resend is the **fallback**
- Gmail is stricter about `From` addresses, so it is safest to use the same Gmail address as the sender

## 5. Resend fallback setup

If Gmail SMTP fails, the Worker will automatically try Resend.

Set:

```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=orders@yourdomain.com
```

Important:

- `RESEND_FROM_EMAIL` must be valid in your Resend account
- if Gmail is not configured, Resend can still send as long as these two values exist

## 6. Discord notifications

If you want Discord notifications, set:

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your_webhook_id/your_webhook_token
```

The Worker will send notifications for:

- verified Paystack orders
- manual orders received
- failed Paystack verification attempts that hit the Worker
- abandoned checkout when the customer closes Paystack on the frontend

## 7. Telegram notifications

If you want Telegram notifications, set:

```env
TELEGRAM_BOT_TOKEN=123456789:your_telegram_bot_token_here
TELEGRAM_CHAT_ID=-1001234567890
```

The Worker will send notifications for:

- verified Paystack orders
- manual orders received
- failed Paystack verification attempts that hit the Worker

Important:

- the Worker only sees attempts that reach backend verification
- if a customer opens Paystack and closes it before verification, the Worker cannot notify that event because it never receives it

## 8. Local Worker run

From the `worker` folder:

```bash
npm run dev
```

or:

```bash
npx wrangler dev
```

This will use your local `.dev.vars` automatically.

## 9. Production secrets

For deployed Workers, do **not** use `.dev.vars`.

Use Wrangler secrets instead.

From the `worker` folder:

```bash
wrangler secret put PAYSTACK_SECRET_KEY
wrangler secret put OWNER_EMAIL
wrangler secret put OWNER_DASHBOARD_USERNAME
wrangler secret put OWNER_DASHBOARD_PASSWORD
wrangler secret put GMAIL_SMTP_USER
wrangler secret put GMAIL_SMTP_PASSWORD
wrangler secret put RESEND_API_KEY
wrangler secret put DISCORD_WEBHOOK_URL
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID
```

For non-secret values, you can also set them in Cloudflare Worker settings or add them as plain vars if you want, but secrets are better when sensitive.

Recommended production values:

```text
PAYSTACK_SECRET_KEY=sk_live_...
OWNER_EMAIL=owner@yourdomain.com
OWNER_DASHBOARD_USERNAME=owner
OWNER_DASHBOARD_PASSWORD=strong_dashboard_password
GMAIL_SMTP_USER=yourgmail@gmail.com
GMAIL_SMTP_PASSWORD=your_gmail_app_password
```

Optional production values:

```text
GMAIL_SMTP_HOST=smtp.gmail.com
GMAIL_SMTP_PORT=465
GMAIL_FROM_EMAIL=yourgmail@gmail.com
MAIL_FROM=yourgmail@gmail.com
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=orders@yourdomain.com
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your_webhook_id/your_webhook_token
TELEGRAM_BOT_TOKEN=123456789:your_telegram_bot_token_here
TELEGRAM_CHAT_ID=-1001234567890
```

## 10. Deploy the Worker

From the `worker` folder:

```bash
npm run deploy
```

or:

```bash
npx wrangler deploy
```

## 11. Update the route/domain

Check [worker/wrangler.jsonc](file:///c:/laragon/www/PMELAB-single-product-template/worker/wrangler.jsonc).

It still contains:

```json
"pattern": "your-domain.com/api/*"
```

Replace that with your real production domain before final deployment.

Example:

```json
"pattern": "paymelab.com/api/*"
```

## 12. How email sending works now

### Paystack orders

The Worker sends:

- owner/admin order email
- customer confirmation email

### Manual bank transfer orders

The Worker sends:

- owner/admin order email
- customer confirmation email

For manual orders, the owner/admin email includes:

- order reference / order ID
- product
- product type
- package
- quantity
- amount
- customer name
- customer email
- customer phone
- customer address/state/city
- special request
- uploaded receipt as an attachment

## 13. How notifications work

If Discord and/or Telegram are configured, the Worker sends notifications for:

- verified Paystack orders
- manual orders received
- failed Paystack verification attempts that reach the Worker

The notification includes:

- order reference
- package id
- amount
- customer name
- customer email
- customer phone
- address if present
- extra event details

## 14. Owner dashboard stats

The owner dashboard reads from:

```text
/api/owner/stats
```

Protected with Basic Auth using:

```text
OWNER_DASHBOARD_USERNAME
OWNER_DASHBOARD_PASSWORD
```

Traffic and checkout data are collected from:

- `/api/track-visit`
- `/api/track-order-attempt`
- `/api/verify-payment`
- `/api/manual-order`

## 15. Receipt attachment behavior

If a customer chooses manual bank transfer and uploads a receipt:

- the receipt file is sent to the Worker
- the Worker attaches it to the owner/admin email
- Gmail SMTP sends it directly if Gmail works
- Resend sends it if Gmail fails and Resend is configured

## 16. Minimum recommended setup

If you want the smallest working production setup:

```text
PAYSTACK_SECRET_KEY
OWNER_EMAIL
OWNER_DASHBOARD_USERNAME
OWNER_DASHBOARD_PASSWORD
GMAIL_SMTP_USER
GMAIL_SMTP_PASSWORD
```

If you want safer email delivery:

```text
PAYSTACK_SECRET_KEY
OWNER_EMAIL
GMAIL_SMTP_USER
GMAIL_SMTP_PASSWORD
RESEND_API_KEY
RESEND_FROM_EMAIL
```

For notifications too:

```text
DISCORD_WEBHOOK_URL
```

or:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

## 17. Quick test checklist

After deployment, test these:

1. Paystack order succeeds
2. owner receives Paystack order email
3. customer receives Paystack confirmation email
4. manual bank transfer can be submitted
5. receipt upload works
6. owner receives manual order email with the receipt attached
7. customer receives manual order confirmation email
8. Discord receives order notifications if enabled
9. Telegram receives order notifications if enabled
10. `owner.html` accepts the correct username and password
11. the dashboard stats change after test visits and test orders

## 18. Common problems

### Gmail auth fails

Usually caused by:

- using normal Gmail password instead of App Password
- 2-Step Verification not enabled
- invalid `GMAIL_FROM_EMAIL`

### Resend fallback fails

Usually caused by:

- missing `RESEND_API_KEY`
- invalid `RESEND_FROM_EMAIL`
- sender domain not configured in Resend

### Discord notifications do not arrive

Check:

- `DISCORD_WEBHOOK_URL` is correct
- the webhook still exists in your Discord server
- the Worker logs do not show webhook errors

### Telegram notifications do not arrive

Check:

- `TELEGRAM_BOT_TOKEN` is correct
- `TELEGRAM_CHAT_ID` is correct
- the bot has permission to post in that chat or group

### Manual order email arrives without attachment

Check:

- the customer selected manual bank transfer
- a receipt was actually uploaded
- the file was not empty

### Worker deploys but API route does not work

Check:

- [worker/wrangler.jsonc](file:///c:/laragon/www/PMELAB-single-product-template/worker/wrangler.jsonc)
- your real route/domain pattern
- whether the frontend is calling the correct `/api/...` endpoint

### Owner dashboard says stats storage is not configured

Check:

- the `OWNER_STATS` KV binding exists
- Wrangler auto-provisioning worked, or
- you manually created a KV namespace and added its id in [worker/wrangler.jsonc](file:///c:/laragon/www/PMELAB-single-product-template/worker/wrangler.jsonc)

### Owner dashboard login fails

Check:

- `OWNER_DASHBOARD_USERNAME` is set
- `OWNER_DASHBOARD_PASSWORD` is set
- you deployed the updated Worker after setting them

## 19. Suggested next step

After setting secrets, place one real test order in local or staging mode and confirm:

- Gmail sends correctly
- if Gmail is broken, Resend fallback sends correctly
- the admin email includes the uploaded receipt attachment
- Discord receives the notification if enabled
- Telegram receives the notification if enabled
