# PMELAB Product Template

A **premium, reusable single-product e-commerce website template** built with HTML5, CSS3, and Vanilla JavaScript. Designed for paid advertising campaigns and high conversion rates.

> **Demo Case Study:** PMELAB TECHNOLOGY LIMITED — PMELAB Power Bank

---

## Features

- **Single-product focus** — Optimized for conversion
- **Fully configurable** — Edit one file (`js/config.js`) to customize everything
- **Premium design** — Modern, clean, professional green branding
- **Mobile-first responsive** — Looks great on all devices
- **Product image gallery** — Thumbnails, lightbox, keyboard nav, touch swipe
- **YouTube video support** — Up to 10 embedded videos
- **Package selection** — Multiple pricing tiers with dynamic updates
- **Paystack integration** — Secure online payments
- **Manual bank transfer** — Alternative payment option
- **WhatsApp ordering** — One-click WhatsApp order generation
- **Email notifications** — Order confirmations via Gmail SMTP
- **SEO optimized** — Meta tags, Open Graph, structured data
- **Analytics ready** — Google Analytics 4, Meta Pixel, Google Tag Manager
- **Cloudflare deployment** — Fast, free, global CDN

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Hosting | Cloudflare Pages |
| Backend | Cloudflare Workers |
| Payments | Paystack |
| Email | Gmail SMTP |
| Fonts | Inter (Google Fonts) |

**No frameworks. No build step. No dependencies.**

---

## Quick Start

### 1. Edit Configuration

Open `js/config.js` and customize:

```javascript
const BUSINESS = {
    name: "Your Company Name",
    phone: "+234XXXXXXXXXX",
    email: "you@example.com",
    // ...
};
```

### 2. Replace Images

Add your product photos to `productsimages/`:
- `image1.png` through `image10.png`
- `logo.png` (optional)
- `favicon.png`

### 3. Deploy

Upload to GitHub → Connect to Cloudflare Pages → Live in minutes.

See [SETUP.md](SETUP.md) for the complete deployment guide.

---

## File Structure

```
PMELAB-product-template/
├── index.html              # Main sales page
├── success.html            # Order confirmation
├── payment-failed.html     # Payment failure
├── 404.html                # Not found page
├── css/
│   ├── style.css           # Main styles
│   └── responsive.css      # Mobile styles
├── js/
│   ├── config.js           # Central configuration
│   ├── main.js             # Core functionality
│   ├── product.js          # Gallery, packages, features
│   ├── checkout.js         # Form, Paystack, manual payment
│   ├── gallery.js          # Lightbox, touch swipe
│   └── whatsapp.js         # WhatsApp ordering
├── productsimages/         # Product images
├── worker/
│   ├── src/index.js        # Cloudflare Worker
│   ├── wrangler.jsonc      # Wrangler config
│   └── package.json
├── README.md               # This file
└── SETUP.md                # Detailed setup guide
```

---

## Configuration Guide

Everything is controlled through `js/config.js`:

| Section | What You Can Change |
|---------|-------------------|
| `BUSINESS` | Company name, phone, email, address, currency |
| `BRAND` | Primary color, dark, light, backgrounds, text colors |
| `PRODUCT` | Name, headline, description, price, rating |
| `PRODUCT_IMAGES` | Up to 10 images with descriptions |
| `PRODUCT_VIDEOS` | Up to 10 YouTube videos |
| `FEATURES` | Up to 10 product features with icons |
| `SPECIFICATIONS` | Technical specs table |
| `PACKAGES` | Pricing tiers (1, 2, 3+ quantity deals) |
| `TESTIMONIALS` | Up to 10 customer reviews |
| `FAQ` | Up to 15 questions and answers |
| `WHATSAPP_NUMBERS` | Up to 5 WhatsApp sales numbers |
| `PAYMENT` | Paystack public key, enable/disable methods |
| `MANUAL_PAYMENT` | Bank name, account details, instructions |
| `SOCIAL_LINKS` | Instagram, Facebook, TikTok, YouTube, Twitter |
| `SEO` | Title, description, keywords, canonical URL |
| `ANALYTICS` | GA4 ID, Meta Pixel ID, GTM ID |

---

## Brand Color Presets

Set `BRAND.preset` to one of:
- `green` (default)
- `blue`
- `black`
- `purple`
- `red`
- `orange`
- `custom` (define your own colors)

---

## Payment Flow

### Paystack (Online)
```
Customer → Select Package → Enter Details → Paystack Checkout
→ Cloudflare Worker Verifies → Sends Emails → Success Page
```

### Manual Bank Transfer
```
Customer → Select Package → Enter Details → See Bank Details
→ Make Transfer → Order Submitted → Owner Notified via Email
```

### WhatsApp
```
Customer → Click WhatsApp Button → Pre-filled Message
→ Opens WhatsApp Chat → Complete Order Manually
```

---

## Security

- **Paystack Secret Key** — Stored only in Cloudflare Worker secrets
- **Gmail credentials** — Stored only in Cloudflare Worker secrets
- **No sensitive data** in frontend code or GitHub
- **Server-side amount verification** — Never trust browser prices
- **Webhook signature validation** — Prevents spoofed callbacks

---

## Performance

- Zero external CSS/JS frameworks
- Lazy loading for images and videos
- Optimized for mobile internet
- Sub-1 second first paint on fast connections
- Semantic HTML for SEO

---

## Browser Support

- Chrome / Edge (latest)
- Firefox (latest)
- Safari (latest)
- Safari iOS (latest)
- Chrome Android (latest)

---

## License

This template is provided as-is for commercial use. You are free to use, modify, and deploy it for your business.

---

## Support

For detailed setup instructions, see [SETUP.md](SETUP.md).

Built for business owners who want a professional online store without hiring a developer.
