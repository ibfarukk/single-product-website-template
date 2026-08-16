# PMELAB Product Template — Complete Setup Guide

Follow this guide step-by-step to customize, deploy, and launch your single-product e-commerce website.

---

## Table of Contents

1. [Edit the Website](#part-1--edit-the-website)
2. [Replace Images](#part-2--replace-images)
3. [Upload to GitHub](#part-3--upload-to-github)
4. [Create Cloudflare Pages](#part-4--create-cloudflare-pages)
5. [Deploy the Worker](#part-5--deploy-worker)
6. [Add Worker Secrets](#part-6--add-worker-secrets)
7. [Connect Paystack](#part-7--connect-paystack)
8. [Connect Gmail](#part-8--connect-gmail)
9. [Connect Custom Domain](#part-9--connect-custom-domain)
10. [Test Everything](#part-10--test-everything)

---

## PART 1 — EDIT THE WEBSITE

Open `js/config.js` in any text editor (Notepad, VS Code, etc.).

### Step 1: Business Information

Find the `BUSINESS` object and update:

```javascript
const BUSINESS = {
    name: "YOUR COMPANY NAME",
    shortName: "YOUR BRAND",
    phone: "+234YOURPHONE",
    email: "you@yourdomain.com",
    address: "Your Full Address",
    country: "Nigeria",
    currency: "₦",
    currencyCode: "NGN",
    website: "https://yourdomain.com"
};
```

### Step 2: Brand Colors

Find the `BRAND` object. You can either:

**Option A: Use a preset**
```javascript
const BRAND = {
    preset: "blue",  // green, blue, black, purple, red, orange, custom
    // ... other values will auto-fill if preset is set
};
```

**Option B: Define custom colors**
```javascript
const BRAND = {
    preset: "custom",
    primaryColor: "#16A34A",
    primaryDark: "#15803D",
    primaryLight: "#DCFCE7",
    backgroundColor: "#FFFFFF",
    lightBackground: "#F8FAFC",
    textColor: "#111827",
    mutedTextColor: "#6B7280",
    borderColor: "#E5E7EB",
    buttonTextColor: "#FFFFFF"
};
```

### Step 3: Product Information

```javascript
const PRODUCT = {
    name: "Your Product Name",
    shortName: "Short Name",
    headline: "YOUR POWERFUL HEADLINE.",
    subheadline: "Your compelling subheadline.",
    description: "Your product description.",
    category: "Your Category",
    brand: "Your Brand",
    model: "Your Model",
    rating: 5,
    reviewCount: 128,
    oldPrice: 50000,
    currentPrice: 35000,
    discountPercent: 30,
    badge: "BEST SELLER"
};
```

### Step 4: Product Images

```javascript
const PRODUCT_IMAGES = [
    {
        enabled: true,
        file: "productsimages/image1.png",
        description: "Front view of your product"
    },
    {
        enabled: true,
        file: "productsimages/image2.png",
        description: "Side view"
    }
    // ... up to 10 images
];
```

Set `enabled: false` for images you don't have yet.

### Step 5: Packages & Pricing

```javascript
const PACKAGES = [
    {
        id: "single",
        title: "BUY 1",
        quantity: 1,
        price: 35000,
        oldPrice: 50000,
        badge: "",
        description: "1 Unit",
        popular: false
    },
    {
        id: "double",
        title: "BUY 2",
        quantity: 2,
        price: 60000,
        oldPrice: 100000,
        badge: "MOST POPULAR",
        description: "2 Units",
        popular: true
    }
];
```

### Step 6: Testimonials

Replace the demo testimonials with real ones:

```javascript
const TESTIMONIALS = [
    {
        enabled: true,
        name: "Real Customer Name",
        location: "City, State",
        rating: 5,
        text: "Genuine testimonial text here.",
        image: "",  // optional: path to customer photo
        verifiedBuyer: true
    }
];
```

**Important:** Only use genuine testimonials. Do not invent fake reviews.

### Step 7: FAQ

```javascript
const FAQ = [
    {
        enabled: true,
        question: "Your question here?",
        answer: "Your answer here."
    }
];
```

### Step 8: WhatsApp Numbers

```javascript
const WHATSAPP_NUMBERS = [
    {
        enabled: true,
        label: "Sales",
        number: "234YOURNUMBER"  // No + sign needed
    }
];
```

### Step 9: Payment Settings

```javascript
const PAYMENT = {
    paystackEnabled: true,
    manualPaymentEnabled: true,
    paystackPublicKey: "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    currency: "NGN"
};
```

Get your Paystack public key from: https://dashboard.paystack.com

### Step 10: Manual Bank Details

```javascript
const MANUAL_PAYMENT = {
    enabled: true,
    bankName: "Your Bank Name",
    accountName: "Your Account Name",
    accountNumber: "1234567890",
    instructions: "After making payment, please send proof via WhatsApp.",
    paymentDeadline: "Please complete payment within 24 hours."
};
```

### Step 11: Social Media

```javascript
const SOCIAL_LINKS = {
    instagram: "https://instagram.com/yourbrand",
    facebook: "https://facebook.com/yourbrand",
    tiktok: "",
    youtube: "",
    twitter: ""
};
```

Leave empty (`""`) to hide an icon.

### Step 12: SEO

```javascript
const SEO = {
    title: "Your Product | Your Company",
    description: "Your meta description for Google.",
    keywords: "keyword1, keyword2, keyword3",
    canonicalUrl: "https://yourdomain.com",
    socialImage: "productsimages/image1.png"
};
```

### Step 13: Analytics (Optional)

```javascript
const ANALYTICS = {
    googleAnalyticsId: "G-XXXXXXXXXX",
    metaPixelId: "123456789012345",
    googleTagManagerId: "GTM-XXXXXXX"
};
```

Leave empty (`""`) if not using.

---

## PART 2 — REPLACE IMAGES

1. Open the `productsimages/` folder
2. Delete the placeholder files
3. Add your own product images named:
   - `image1.png`
   - `image2.png`
   - `image3.png`
   - ... up to `image10.png`
4. Recommended specs:
   - **Format:** PNG or JPG
   - **Size:** 800x800px (square)
   - **Max file size:** 200KB each
   - **Background:** White or transparent

5. Add your logo as `logo.png` in the root folder (optional)
6. Add a favicon as `favicon.png` in the root folder (optional)

**Tip:** Use [remove.bg](https://remove.bg) to remove backgrounds from product photos.

---

## PART 3 — UPLOAD TO GITHUB

### Step 1: Create a GitHub Account
1. Go to [github.com](https://github.com)
2. Sign up for a free account
3. Verify your email

### Step 2: Create a New Repository
1. Click the **+** icon → **New repository**
2. Name it: `my-product-website` (or any name)
3. Make it **Public**
4. Click **Create repository**

### Step 3: Upload Files
1. On the repository page, click **"uploading an existing file"**
2. Drag and drop ALL files from the `PMELAB-product-template` folder
3. Make sure these are included:
   - `index.html`
   - `success.html`
   - `payment-failed.html`
   - `404.html`
   - `css/` folder
   - `js/` folder
   - `productsimages/` folder (with your images)
4. Scroll down and click **Commit changes**

---

## PART 4 — CREATE CLOUDFLARE PAGES

### Step 1: Create Cloudflare Account
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Sign up for a free account
3. Verify your email

### Step 2: Create a Pages Project
1. In the Cloudflare dashboard, click **Pages**
2. Click **Create a project**
3. Click **Connect to Git**
4. Authorize Cloudflare to access your GitHub account
5. Select the repository you created in Part 3
6. Click **Begin setup**

### Step 3: Configure Build Settings
1. **Project name:** `my-product-website`
2. **Production branch:** `main`
3. **Framework preset:** `None`
4. **Build command:** (leave empty)
5. **Build output directory:** (leave empty)
6. Click **Save and Deploy**

### Step 4: Wait for Deployment
- Cloudflare will build and deploy your site (takes ~1 minute)
- You'll get a URL like: `https://my-product-website.pages.dev`
- Click the URL to view your live website!

---

## PART 5 — DEPLOY WORKER

The Cloudflare Worker handles:
- Paystack payment verification
- Paystack webhook
- Email notifications
- Manual order processing

### Step 1: Install Wrangler

**Option A: Using npm (requires Node.js)**
```bash
npm install -g wrangler
```

**Option B: Using npx (no install)**
```bash
npx wrangler
```

### Step 2: Login to Wrangler
```bash
wrangler login
```
- This opens a browser window
- Authorize Wrangler to access your Cloudflare account

### Step 3: Deploy the Worker
```bash
cd worker
wrangler deploy
```

You'll see output like:
```
✨ Successfully published your script to:
https://pmelab-worker.your-account.workers.dev
```

**Save this URL** — you'll need it for the Paystack webhook.

---

## PART 6 — ADD WORKER SECRETS

Secrets are encrypted values stored in Cloudflare that your Worker can access. **Never put these in your code or GitHub.**

Run each command and enter the value when prompted:

### 1. Paystack Secret Key
```bash
wrangler secret put PAYSTACK_SECRET_KEY
```
- Get this from: [Paystack Dashboard](https://dashboard.paystack.com) → Settings → API Keys
- Use the **Secret Key** (starts with `sk_`)

### 2. Gmail SMTP Settings
```bash
wrangler secret put GMAIL_SMTP_HOST
```
Enter: `smtp.gmail.com`

```bash
wrangler secret put GMAIL_SMTP_PORT
```
Enter: `587`

```bash
wrangler secret put GMAIL_SMTP_USER
```
Enter your Gmail address (e.g., `yourname@gmail.com`)

```bash
wrangler secret put GMAIL_SMTP_PASSWORD
```
Enter your **Gmail App Password** (see Part 8)

### 3. Owner Email
```bash
wrangler secret put OWNER_EMAIL
```
Enter the email address that should receive order notifications.

---

## PART 7 — CONNECT PAYSTACK

### Step 1: Get Your Keys
1. Go to [dashboard.paystack.com](https://dashboard.paystack.com)
2. Sign up / Log in
3. Go to **Settings** → **API Keys**
4. Copy your **Public Key** (starts with `pk_test_` or `pk_live_`)
5. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)

### Step 2: Add Public Key to Website
1. Open `js/config.js`
2. Find `PAYSTACK.paystackPublicKey`
3. Paste your public key:
```javascript
paystackPublicKey: "pk_test_your_actual_key_here"
```

### Step 3: Add Secret Key to Worker
You already did this in Part 6:
```bash
wrangler secret put PAYSTACK_SECRET_KEY
```

### Step 4: Set Up Webhook
1. In Paystack Dashboard, go to **Settings** → **Webhooks**
2. Add a new webhook URL:
   ```
   https://your-worker.your-account.workers.dev/api/paystack-webhook
   ```
3. Select events: `charge.success`
4. Save

### Step 5: Switch to Live Mode (When Ready)
1. In Paystack, activate your business account
2. Replace `pk_test_` with `pk_live_` in `js/config.js`
3. Replace `sk_test_` with `sk_live_` in Worker secrets:
   ```bash
   wrangler secret put PAYSTACK_SECRET_KEY
   ```

---

## PART 8 — CONNECT GMAIL

Gmail is used to send order confirmation emails to both you and your customers.

### Step 1: Enable 2-Step Verification
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **Security**
3. Under **Signing in to Google**, click **2-Step Verification**
4. Follow the steps to enable it

### Step 2: Create an App Password
1. In Google Account Security, click **2-Step Verification**
2. Scroll to the bottom and click **App passwords**
3. Select **App:** Mail
4. Select **Device:** Other (Custom name)
5. Name it: `PMELAB Website`
6. Click **Generate**
7. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 3: Add to Worker Secrets
```bash
wrangler secret put GMAIL_SMTP_PASSWORD
```
Paste the 16-character app password (without spaces).

**Important:** This is NOT your regular Gmail password. It's a special app password.

---

## PART 9 — CONNECT CUSTOM DOMAIN

### Step 1: Add Domain to Cloudflare
1. In Cloudflare Dashboard, click your Pages project
2. Click **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain: `yourstore.com`
5. Click **Continue**

### Step 2: Configure DNS
1. Cloudflare will show you DNS records to add
2. If your domain is already on Cloudflare, it will auto-configure
3. If not, add the CNAME record shown to your domain registrar

### Step 3: Wait for SSL
- Cloudflare automatically issues an SSL certificate
- This usually takes less than 5 minutes
- Your site will be accessible via `https://yourstore.com`

---

## PART 10 — TEST EVERYTHING

Use this checklist before launching:

### Website Display
- [ ] Website loads on desktop
- [ ] Website loads on mobile phone
- [ ] Logo displays correctly
- [ ] Product images display
- [ ] All text is correct (your business name, not PMELAB)
- [ ] Colors match your brand

### Navigation
- [ ] All menu links scroll to correct sections
- [ ] Mobile menu opens and closes
- [ ] Header becomes sticky when scrolling

### Product Gallery
- [ ] Main image displays
- [ ] Thumbnails are clickable
- [ ] Previous/Next buttons work
- [ ] Lightbox opens on image click
- [ ] Lightbox keyboard navigation works (arrow keys, Escape)
- [ ] Touch swipe works on mobile

### Packages
- [ ] All packages display correctly
- [ ] Popular package is highlighted
- [ ] Clicking "Select Package" scrolls to checkout
- [ ] Prices are correct
- [ ] Discounts calculate correctly

### Checkout Form
- [ ] Form displays all fields
- [ ] Required field validation works
- [ ] Email validation works
- [ ] Phone validation works
- [ ] Order summary updates when package changes

### Payments
- [ ] Paystack option is selectable
- [ ] Manual payment option is selectable
- [ ] Manual payment shows bank details
- [ ] Test Paystack payment completes successfully
- [ ] Success page displays correct order details
- [ ] Payment failed page works

### WhatsApp
- [ ] WhatsApp button opens WhatsApp
- [ ] Message is pre-filled with correct product info
- [ ] WhatsApp number is correct

### Emails
- [ ] Owner receives order notification email
- [ ] Customer receives confirmation email
- [ ] Manual order emails are sent

### Pages
- [ ] Success page shows correct order reference
- [ ] Payment failed page has retry button
- [ ] 404 page works (try a fake URL)

### SEO & Analytics
- [ ] Page title is correct
- [ ] Meta description is set
- [ ] Social sharing image is set
- [ ] Google Analytics fires (if configured)
- [ ] Meta Pixel fires (if configured)

### Performance
- [ ] Page loads in under 3 seconds
- [ ] Images are optimized
- [ ] No console errors in browser

### Mobile
- [ ] Sticky CTA appears at bottom
- [ ] Text is readable without zooming
- [ ] Buttons are easy to tap
- [ ] Forms are easy to fill on mobile

---

## BEFORE YOU PUBLISH

### Final Checklist

1. [ ] Change company name
2. [ ] Change product name
3. [ ] Change product description
4. [ ] Change product prices
5. [ ] Configure product packages
6. [ ] Replace logo
7. [ ] Replace ALL product images
8. [ ] Add YouTube videos (if available)
9. [ ] Add genuine testimonials
10. [ ] Add WhatsApp numbers
11. [ ] Add contact information
12. [ ] Add social media links
13. [ ] Add Paystack public key
14. [ ] Configure Worker secrets
15. [ ] Configure Gmail SMTP
16. [ ] Test Paystack payment
17. [ ] Test manual payment flow
18. [ ] Test emails
19. [ ] Test WhatsApp ordering
20. [ ] Test on mobile device
21. [ ] Connect custom domain
22. [ ] Launch advertising

---

## TROUBLESHOOTING

### Website not loading?
- Check that `index.html` is in the root of your repository
- Verify all file paths are correct (case-sensitive)

### Images not showing?
- Ensure images are in `productsimages/` folder
- Check that filenames match exactly (e.g., `image1.png` not `Image1.png`)
- Verify `enabled: true` in `PRODUCT_IMAGES`

### Paystack not working?
- Check that `paystackPublicKey` is correct (public key, not secret)
- Ensure Worker is deployed and secrets are set
- Check browser console for errors

### Emails not sending?
- Verify Gmail App Password is correct (not regular password)
- Ensure `OWNER_EMAIL` secret is set
- Check spam/junk folders

### WhatsApp not opening?
- Ensure WhatsApp is installed on the device
- Check that the number format is correct (no + sign in config)

---

## SUPPORT

If you encounter issues:

1. Check the browser console (F12 → Console) for errors
2. Verify your config.js has valid JavaScript syntax
3. Ensure all required Worker secrets are set
4. Test with Paystack test mode first

---

**Good luck with your launch!** 🚀
