# Deployment Guide

This guide shows how to deploy this project using:

- **Cloudflare Pages** for the frontend
- **Cloudflare Workers** for the API
- **GitHub** for automatic deploys
- **Cloudflare free plan**

This project is already structured well for both setups:

- frontend files live in the project root
- Worker code lives in [worker/](file:///c:/laragon/www/PMELAB-single-product-template/worker)
- the frontend calls API routes using relative paths like `/api/...`

Because of that last point, the best production setup is:

- your website on `https://yourdomain.com`
- your Worker routed on `https://yourdomain.com/api/*`

That lets the frontend and backend work together on the same domain.

There are now **2 supported deployment modes**:

### Mode A: Pages + separate Worker URL

- frontend on `*.pages.dev`
- backend on `*.workers.dev`
- set `API_BASE_URL` in [js/config.js](file:///c:/laragon/www/PMELAB-single-product-template/js/config.js) to the Worker URL
- do **not** enable the custom domain Worker route

### Mode B: Custom domain for frontend + backend

- frontend on `https://yourdomain.com`
- backend on `https://yourdomain.com/api/*`
- leave `API_BASE_URL` empty in [js/config.js](file:///c:/laragon/www/PMELAB-single-product-template/js/config.js)
- enable the custom domain Worker route in [worker/wrangler.jsonc](file:///c:/laragon/www/PMELAB-single-product-template/worker/wrangler.jsonc)

## 1. What you need before starting

You need:

- a **Cloudflare account**
- a **GitHub account**
- a **domain name** you control
- this project pushed to a **GitHub repository**

If you do not have a custom domain yet, you can still preview the frontend on `*.pages.dev`, but full checkout testing will not be correct until the Worker is routed on your real domain under `/api/*`.

## 2. Create a Cloudflare account

1. Go to `https://dash.cloudflare.com/sign-up`
2. Create your account
3. Verify your email
4. Log in to the Cloudflare dashboard

## 3. Add your domain to Cloudflare

If your domain is already on Cloudflare, you can skip this section.

If your domain is with another registrar:

1. In Cloudflare dashboard, click **Add a domain**
2. Enter your domain, for example:

```text
yourdomain.com
```

3. Choose the **Free** plan
4. Cloudflare will scan existing DNS records
5. Review the records and continue
6. Cloudflare will show you **2 nameservers**
7. Go to your domain registrar and replace the current nameservers with the Cloudflare ones
8. Wait for Cloudflare to confirm the domain is active

This can take a few minutes to a few hours depending on the registrar.

## 4. Push the project to GitHub

Create a GitHub repository and push this project.

Example commands:

```bash
git init
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git add .
git commit -m "Initial deploy-ready commit"
git branch -M main
git push -u origin main
```

Important:

- do **not** commit `worker/.dev.vars`
- `worker/.dev.vars.example` is safe to keep in Git

## 5. Prepare the project for production

Before deploying, update the real production values in:

- [js/config.js](file:///c:/laragon/www/PMELAB-single-product-template/js/config.js)
- [worker/wrangler.jsonc](file:///c:/laragon/www/PMELAB-single-product-template/worker/wrangler.jsonc)

At minimum, replace:

- Paystack public key in `js/config.js`
- route pattern in `worker/wrangler.jsonc`
- any placeholder business info, social links, legal text, and branding assets

In [worker/wrangler.jsonc](file:///c:/laragon/www/PMELAB-single-product-template/worker/wrangler.jsonc), change:

```json
"pattern": "your-domain.com/api/*"
```

to your real domain:

```json
"pattern": "yourdomain.com/api/*"
```

## 6. Deploy the frontend with Cloudflare Pages

This project is a static site, so Pages setup is simple.

### Step 6.1 Open Pages

1. In Cloudflare dashboard, go to **Workers & Pages**
2. Click **Create application**
3. Choose **Pages**
4. Choose **Import an existing Git repository**
5. Connect your GitHub account if asked
6. Select this repository
7. Click **Begin setup**

### Step 6.2 Use these Pages settings

Use these values:

- **Production branch**: `main`
- **Framework preset**: `None`
- **Build command**: `exit 0`
- **Build output directory**: `.`
- **Root directory**: leave blank

Why:

- this project does not use a build system
- `index.html` and the rest of the site files already live in the repo root

### Step 6.3 Deploy Pages

1. Click **Save and Deploy**
2. Wait for the first Pages deployment to finish
3. Cloudflare will give you a temporary URL like:

```text
https://your-project.pages.dev
```

You can open that URL to confirm the frontend loads.

Important:

- the site will load there
- but API routes under `/api/*` will not fully reflect production until you add your real custom domain and Worker route

## 7. Add your custom domain to Pages

This is important for this project.

Because the frontend calls `/api/...`, the site and Worker should share the same domain.

### Step 7.1 Add the custom domain

1. Open your Pages project
2. Go to **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain, for example:

```text
yourdomain.com
```

5. Follow the prompts

You can also add:

```text
www.yourdomain.com
```

if you want both root and `www`.

### Step 7.2 Verify frontend domain

After setup, your frontend should open at:

```text
https://yourdomain.com
```

## 8. Deploy the Worker from GitHub

Now deploy the backend Worker as a separate Cloudflare project connected to the same GitHub repository.

### Step 8.1 Important Worker naming rule

The Worker name in Cloudflare should match the `name` in [worker/wrangler.jsonc](file:///c:/laragon/www/PMELAB-single-product-template/worker/wrangler.jsonc).

Right now it is:

```json
"name": "pmelab-worker"
```

Keep that name unless you intentionally change it in both places.

### Step 8.2 Create the Worker project

1. In Cloudflare dashboard, go to **Workers & Pages**
2. Click **Create application**
3. Choose **Import a repository**
4. Select your GitHub repository
5. Choose the Worker project type

### Step 8.3 Use these Worker Git settings

Use these values:

- **Worker name**: `pmelab-worker`
- **Production branch**: `main`
- **Root directory**: `worker`
- **Build command**: `npm install`
- **Deploy command**: `npx wrangler deploy`

If Cloudflare offers an install command field separately, use:

```text
npm install
```

If Cloudflare only asks for build/deploy, the values above are enough.

### Step 8.4 Save and deploy the Worker

1. Click **Save and Deploy**
2. Wait for the first Worker build to finish

At this point the Worker project exists, but it still needs secrets, KV, and route checks.

## 9. Add Worker secrets and variables in Cloudflare

Open your Worker project and add the required secrets/vars in the dashboard.

Use [worker/.dev.vars.example](file:///c:/laragon/www/PMELAB-single-product-template/worker/.dev.vars.example) as your reference.

### Step 9.1 Required values

These are the most important:

```text
PAYSTACK_SECRET_KEY
OWNER_EMAIL
OWNER_DASHBOARD_USERNAME
OWNER_DASHBOARD_PASSWORD
GMAIL_SMTP_USER
GMAIL_SMTP_PASSWORD
```

### Step 9.2 Optional but recommended

```text
GMAIL_SMTP_HOST=smtp.gmail.com
GMAIL_SMTP_PORT=465
GMAIL_FROM_EMAIL=yourgmail@gmail.com
MAIL_FROM=yourgmail@gmail.com

RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=orders@yourdomain.com

DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

### Step 9.3 Add them in dashboard

In your Worker:

1. Open **Settings**
2. Open **Variables**
3. Add secrets and plain text vars
4. Save changes

Use secrets for anything sensitive.

## 10. Set up the `OWNER_STATS` KV namespace

The owner dashboard uses Worker KV.

Your Worker config already contains this binding:

```json
"kv_namespaces": [
  {
    "binding": "OWNER_STATS"
  }
]
```

Depending on your Wrangler / Cloudflare flow, the KV namespace may be auto-provisioned.

If the owner dashboard later says:

```text
Stats storage not configured
```

then do this manually:

1. In Cloudflare dashboard, go to **Workers & Pages**
2. Open your Worker
3. Go to **Storage**
4. Create a **KV Namespace**
5. Name it something like:

```text
OWNER_STATS
```

6. Bind it to the Worker as:

```text
OWNER_STATS
```

If Cloudflare asks for the binding inside Worker settings, the binding name must be exactly:

```text
OWNER_STATS
```

## 11. Confirm the Worker route

This project expects the Worker to answer on the same domain under `/api/*`.

That means your Worker route should be:

```text
yourdomain.com/api/*
```

Open [worker/wrangler.jsonc](file:///c:/laragon/www/PMELAB-single-product-template/worker/wrangler.jsonc) and confirm the route is correct.

Example:

```json
"routes": [
  {
    "pattern": "yourdomain.com/api/*",
    "custom_domain": true
  }
]
```

If you changed the route after the first deploy, push the change to GitHub so Cloudflare rebuilds.

## 12. Set Paystack webhook URL

In your Paystack dashboard, set the webhook URL to:

```text
https://yourdomain.com/api/paystack-webhook
```

This is important for payment confirmation and order processing.

## 13. How automatic GitHub deployment works after setup

Once both projects are connected:

- push to `main`
- Pages redeploys the frontend
- Worker redeploys the backend

That means GitHub becomes your deployment trigger.

Typical future workflow:

1. edit locally
2. commit
3. push to GitHub
4. Cloudflare deploys automatically

## 14. Suggested production architecture

Recommended final URLs:

- frontend: `https://yourdomain.com`
- Worker API: `https://yourdomain.com/api/*`
- owner page: `https://yourdomain.com/owner.html`

That keeps everything consistent with the current codebase.

## 15. Real testing checklist after deployment

After deployment, test these in order:

### Frontend

1. open `https://yourdomain.com`
2. confirm images, styles, and videos load
3. confirm footer links and FAQ links work
4. confirm `owner.html` loads

### Checkout

1. test Paystack success
2. test Paystack close/cancel
3. test manual bank transfer
4. test receipt upload

### Emails

1. owner receives order email
2. owner receives manual order with receipt attachment
3. customer receives confirmation email
4. Gmail works
5. Resend fallback works if Gmail fails

### Notifications

1. Discord receives order notices if enabled
2. Telegram receives order notices if enabled

### Owner dashboard

1. open `https://yourdomain.com/owner.html`
2. enter wrong login and confirm error appears
3. enter correct login and confirm stats load
4. confirm visitors increase after visits
5. confirm successful sales update after Paystack success
6. confirm failed/abandoned attempts update

## 16. Common deployment mistakes

### Pages deploys but shows blank or wrong content

Check:

- **Build command** is `exit 0`
- **Build output directory** is `.`
- **Root directory** is blank

### Frontend works but checkout API fails

Check:

- Pages custom domain is connected
- Worker route is `yourdomain.com/api/*`
- frontend is being tested on your real custom domain, not only `pages.dev`

### Worker deploy fails from GitHub

Check:

- Worker name matches [worker/wrangler.jsonc](file:///c:/laragon/www/PMELAB-single-product-template/worker/wrangler.jsonc)
- Worker root directory is `worker`
- secrets and vars are configured

### Owner dashboard login works but stats fail

Check:

- `OWNER_STATS` binding exists
- KV namespace is attached correctly

## 17. Free-plan note

This setup is designed for the Cloudflare free plan:

- Pages free for static frontend hosting
- Workers free for backend/API
- custom domain support included

For small and medium traffic, this is a strong setup.

## 18. Recommended next step

After you finish this deployment:

1. push all final code to GitHub
2. connect Pages
3. connect Worker
4. add secrets
5. attach custom domain
6. test the full payment flow on the live domain

For Worker-specific variable details, see [workersetup.md](file:///c:/laragon/www/PMELAB-single-product-template/workersetup.md).
