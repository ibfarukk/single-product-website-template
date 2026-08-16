# Worker Setup

This file is the Worker-only setup guide for this project.

Use [deployment.md](file:///c:/laragon/www/PMELAB-single-product-template/deployment.md) for the full frontend + backend deployment flow.
Use this file when you want to focus only on:

- the Cloudflare Worker
- Worker secrets and vars
- email sending
- Discord / Telegram notifications
- owner dashboard stats storage
- Worker routes and testing

## What the Worker does

The Worker handles:

- Paystack payment verification
- Paystack webhooks
- manual bank transfer order submission
- owner/admin email notifications
- customer confirmation emails
- Gmail SMTP sending
- Resend fallback if Gmail fails
- Discord notifications
- Telegram notifications
- owner stats dashboard API
- visitor and checkout attempt tracking

## Important files

- Worker code: [worker/src/index.js](file:///c:/laragon/www/PMELAB-single-product-template/worker/src/index.js)
- Worker config: [worker/wrangler.jsonc](file:///c:/laragon/www/PMELAB-single-product-template/worker/wrangler.jsonc)
- Local env example: [worker/.dev.vars.example](file:///c:/laragon/www/PMELAB-single-product-template/worker/.dev.vars.example)
- Worker local ignore file: [worker/.gitignore](file:///c:/laragon/www/PMELAB-single-product-template/worker/.gitignore)
- Owner page: [owner.html](file:///c:/laragon/www/PMELAB-single-product-template/owner.html)

## 1. Install Worker dependencies locally

Open a terminal inside the `worker` folder and run:

```bash
npm install
```

## 2. Create local Worker env file

For local testing, create:

```text
worker/.dev.vars
```

Copy from:

```text
worker/.dev.vars.example
```

The real `.dev.vars` file should stay local only.

Example:

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

## 3. What each env variable does

### Required

`PAYSTACK_SECRET_KEY`  
Used to verify Paystack transactions and Paystack webhooks.

`OWNER_EMAIL`  
The email that receives new order notifications.

`OWNER_DASHBOARD_USERNAME`  
Username for [owner.html](file:///c:/laragon/www/PMELAB-single-product-template/owner.html).

`OWNER_DASHBOARD_PASSWORD`  
Password for [owner.html](file:///c:/laragon/www/PMELAB-single-product-template/owner.html).

`GMAIL_SMTP_USER`  
The Gmail account used to send mail.

`GMAIL_SMTP_PASSWORD`  
A Gmail App Password, not your normal Gmail password.

### Optional but recommended

`GMAIL_SMTP_HOST`  
Usually `smtp.gmail.com`.

`GMAIL_SMTP_PORT`  
Recommended: `465`.

`GMAIL_FROM_EMAIL`  
Optional visible sender for Gmail. Safest value is the same Gmail account used for SMTP.

`MAIL_FROM`  
Optional general sender override.

`RESEND_API_KEY`  
Fallback provider if Gmail fails.

`RESEND_FROM_EMAIL`  
The sender address used by Resend.

`DISCORD_WEBHOOK_URL`  
Optional Discord order notifications.

`TELEGRAM_BOT_TOKEN`  
Optional Telegram bot token for notifications.

`TELEGRAM_CHAT_ID`  
Optional Telegram chat or group ID.

## 4. Local Worker test

From the `worker` folder:

```bash
npm run dev
```

or:

```bash
npx wrangler dev
```

This uses `worker/.dev.vars` automatically.

## 5. Gmail SMTP setup

To use Gmail as the main sender:

1. Log in to your Google account
2. Enable **2-Step Verification**
3. Create a **Google App Password**
4. Put that app password into:

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

- Gmail is the primary sender
- Resend is the fallback
- Gmail is stricter about sender identity, so `GMAIL_FROM_EMAIL` should normally be the same Gmail address

## 6. Resend fallback setup

If Gmail fails, the Worker automatically tries Resend.

Set:

```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=orders@yourdomain.com
```

Important:

- `RESEND_FROM_EMAIL` must be valid in your Resend account
- Resend can work even if Gmail is not configured, as long as these values are valid

## 7. Discord and Telegram notifications

### Discord

Set:

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your_webhook_id/your_webhook_token
```

### Telegram

Set:

```env
TELEGRAM_BOT_TOKEN=123456789:your_telegram_bot_token_here
TELEGRAM_CHAT_ID=-1001234567890
```

Notifications are sent for:

- verified Paystack orders
- manual orders received
- failed Paystack verification attempts
- abandoned checkout when the customer closes Paystack before payment completes

## 8. Owner dashboard stats

The private owner page is:

```text
/owner.html
```

It reads protected data from:

```text
/api/owner/stats
```

The login is controlled by:

```text
OWNER_DASHBOARD_USERNAME
OWNER_DASHBOARD_PASSWORD
```

The Worker tracks and stores:

- total visitors
- total page views
- successful sales
- successful sales revenue
- failed sales
- abandoned checkout
- manual orders
- manual order value

Traffic and checkout data come from:

- `/api/track-visit`
- `/api/track-order-attempt`
- `/api/verify-payment`
- `/api/manual-order`

## 9. KV storage for owner stats

The owner dashboard uses a KV binding named:

```text
OWNER_STATS
```

That binding already exists in [worker/wrangler.jsonc](file:///c:/laragon/www/PMELAB-single-product-template/worker/wrangler.jsonc).

If Cloudflare auto-provisions KV, you are fine.

If it does not, create it manually:

1. Open your Worker in Cloudflare
2. Go to **Storage**
3. Create a KV namespace
4. Bind it as:

```text
OWNER_STATS
```

If the owner dashboard says `Stats storage not configured`, this is the first thing to check.

## 10. Production Worker deploy from GitHub

This project is meant to deploy the Worker from GitHub using Cloudflare’s Git integration.

Use [deployment.md](file:///c:/laragon/www/PMELAB-single-product-template/deployment.md) for the full account-level flow.

Worker-specific settings:

- Worker name should match `name` in [worker/wrangler.jsonc](file:///c:/laragon/www/PMELAB-single-product-template/worker/wrangler.jsonc)
- root directory should be:

```text
worker
```

- install/build command:

```text
npm install
```

- deploy command:

```text
npx wrangler deploy
```

## 11. Production secrets and vars

Do not use `.dev.vars` in production.

Add the values in Cloudflare Worker settings.

### Core production values

```text
PAYSTACK_SECRET_KEY=sk_live_...
OWNER_EMAIL=owner@yourdomain.com
OWNER_DASHBOARD_USERNAME=owner
OWNER_DASHBOARD_PASSWORD=strong_dashboard_password
GMAIL_SMTP_USER=yourgmail@gmail.com
GMAIL_SMTP_PASSWORD=your_gmail_app_password
```

### Optional production values

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

## 12. Worker route

This Worker now supports both modes:

### Mode A: Pages frontend + workers.dev backend

Use:

```text
https://yourproject.pages.dev
```

for the frontend, and:

```text
https://your-worker-name.your-subdomain.workers.dev
```

for the backend.

In this mode:

- leave the `routes` section disabled in [worker/wrangler.jsonc](file:///c:/laragon/www/PMELAB-single-product-template/worker/wrangler.jsonc)
- set `API_BASE_URL` in [js/config.js](file:///c:/laragon/www/PMELAB-single-product-template/js/config.js) to your Worker URL

### Mode B: Custom domain frontend + same-domain backend

This Worker can also serve the API on the same domain as the frontend:

```text
yourdomain.com/api/*
```

In this mode:

- leave `API_BASE_URL` empty in [js/config.js](file:///c:/laragon/www/PMELAB-single-product-template/js/config.js)
- enable the route in [worker/wrangler.jsonc](file:///c:/laragon/www/PMELAB-single-product-template/worker/wrangler.jsonc)

Example route:

```json
"pattern": "yourdomain.com/api/*"
```

## 13. What emails the Worker sends

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
- customer details
- special request
- uploaded receipt as an attachment

## 14. Receipt attachment behavior

If a customer uses manual bank transfer and uploads a receipt:

- the receipt is sent to the Worker
- the Worker includes it in the owner/admin email
- Gmail sends it directly if Gmail works
- Resend sends it if Gmail fails and Resend is configured

## 15. Worker test checklist

After production setup, test these:

1. Paystack success flow
2. Paystack verification failure flow
3. Paystack close/abandon flow
4. manual bank transfer flow
5. receipt upload
6. owner email delivery
7. customer email delivery
8. receipt attachment delivery
9. Discord notification if enabled
10. Telegram notification if enabled
11. owner dashboard login
12. owner dashboard stats updating

## 16. Common Worker problems

### Gmail auth fails

Usually caused by:

- using your normal Gmail password instead of App Password
- not enabling 2-Step Verification
- invalid `GMAIL_FROM_EMAIL`

### Resend fallback fails

Usually caused by:

- missing `RESEND_API_KEY`
- invalid `RESEND_FROM_EMAIL`
- sender domain not configured in Resend

### Discord notifications do not arrive

Check:

- `DISCORD_WEBHOOK_URL`
- webhook still exists
- Worker logs for webhook errors

### Telegram notifications do not arrive

Check:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- bot permission in the target chat

### Owner dashboard login fails

Check:

- `OWNER_DASHBOARD_USERNAME`
- `OWNER_DASHBOARD_PASSWORD`
- Worker redeployed after adding them

### Owner dashboard stats fail

Check:

- `OWNER_STATS` binding exists
- KV namespace is attached correctly

### API routes do not work

Check:

- [worker/wrangler.jsonc](file:///c:/laragon/www/PMELAB-single-product-template/worker/wrangler.jsonc)
- route pattern uses the real domain
- frontend is being tested on the same live custom domain

## 17. Minimum recommended production setup

Smallest practical setup:

```text
PAYSTACK_SECRET_KEY
OWNER_EMAIL
OWNER_DASHBOARD_USERNAME
OWNER_DASHBOARD_PASSWORD
GMAIL_SMTP_USER
GMAIL_SMTP_PASSWORD
```

Better setup:

```text
PAYSTACK_SECRET_KEY
OWNER_EMAIL
OWNER_DASHBOARD_USERNAME
OWNER_DASHBOARD_PASSWORD
GMAIL_SMTP_USER
GMAIL_SMTP_PASSWORD
RESEND_API_KEY
RESEND_FROM_EMAIL
```

## 18. Recommended next step

After Worker deployment:

1. confirm the route works on your live domain
2. test one Paystack order
3. test one manual order with receipt upload
4. confirm emails and notifications arrive
5. confirm the owner dashboard updates
