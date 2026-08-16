/*
=========================================================
                START HERE
=========================================================

If you are not a developer, this is the main file
you need to edit.

You can change:

✓ Company name
✓ Product name
✓ Product description
✓ Product prices
✓ Product packages
✓ Website colors
✓ Product images
✓ Image descriptions
✓ YouTube videos
✓ Testimonials
✓ WhatsApp numbers
✓ Contact information
✓ Social media
✓ Payment settings
✓ FAQ
✓ Delivery information
✓ Footer information

DO NOT edit the other files unless you know what
you are doing.

=========================================================
*/

// =========================================================
// 1. BUSINESS CONFIGURATION
// Edit this section to change your business identity.
// This shows in: header brand name, contact section, footer,
// WhatsApp messages, success page title, and general site text.
// =========================================================
const BUSINESS = {
    name: "PMELAB TECHNOLOGY LIMITED",
    shortName: "PMELAB",
    phone: "+2347040616209",
    email: "support@paymelab.com",
    address: "Office No. 9, Achida Plaza, Opposite JEFLA, Beside AA RANO Filling Station, Kpakungu, Minna, Niger State, Nigeria.",
    country: "Nigeria",
    currency: "₦",
    currencyCode: "NGN",
    website: "https://paymelab.com"
};

// =========================================================
// 1A. API CONNECTION CONFIGURATION
// Leave this EMPTY if your frontend and backend use the same domain:
// Example:
// - Frontend: https://yourdomain.com
// - Backend:  https://yourdomain.com/api/*
//
// Set this to your Worker URL if your frontend is on Pages
// and your backend is on a different Worker domain.
// Example:
// API_BASE_URL = "https://pmelab-worker.your-subdomain.workers.dev"
//
// This affects:
// - payment verification
// - manual order submission
// - visitor tracking
// - owner dashboard stats
// =========================================================
const API_BASE_URL = "";

// =========================================================
// 2. BRAND CONFIGURATION
// Edit this section to change the colors across the whole website.
// This shows in: buttons, highlights, badges, icons, links,
// section accents, sticky CTA, and other branded UI elements.
// =========================================================
const BRAND = {
    primaryColor: "#16A34A",
    primaryDark: "#15803D",
    primaryLight: "#DCFCE7",
    backgroundColor: "#FFFFFF",
    lightBackground: "#F8FAFC",
    textColor: "#111827",
    mutedTextColor: "#6B7280",
    borderColor: "#E5E7EB",
    buttonTextColor: "#FFFFFF",
    // Optional preset: "green", "blue", "black", "purple", "red", "orange", "custom"
    preset: "green"
};

// =========================================================
// 3. PRODUCT CONFIGURATION
// Edit this section to change the main product details.
// This shows in: hero section "POWER THAT GOES WHERE YOU GO.",
// pricing areas, order summary, WhatsApp message, and product text.
// =========================================================
const PRODUCT = {
    name: "PMELAB Power Bank",
    shortName: "PMELAB Power Bank",
    headline: "POWER THAT GOES WHERE YOU GO.",
    subheadline: "Keep your devices powered wherever life takes you with the PMELAB Power Bank.",
    description: "The PMELAB Power Bank is designed to provide convenient portable power whenever you need it. Stay connected, stay productive, and never worry about running out of battery again.",
    category: "Power Bank",
    brand: "PMELAB",
    model: "PM-PB20000",
    rating: 5,
    reviewCount: 128,
    oldPrice: 35000,
    currentPrice: 25000,
    discountPercent: 29,
    badge: "BEST SELLER"
};

// =========================================================
// 3A. PRODUCT TYPE CONFIGURATION
// Set this to:
// - "physical" for items that need delivery address and location
// - "digital" for items that do not need shipping details
// This affects the checkout form fields shown in:
// Order Now
// COMPLETE YOUR ORDER
// =========================================================
const PRODUCT_TYPE = "digital";

// =========================================================
// 4. PRODUCT IMAGES (Up to 10)
// These are the images that show in:
// - the hero gallery beside "POWER THAT GOES WHERE YOU GO."
// - the About The Product image beside "POWER WHEN YOU NEED IT MOST"
// - the lightbox popup gallery
// Use real files from: productsimages/
// =========================================================
const PRODUCT_IMAGES = [
    {
        enabled: true,
        file: "productsimages/image1.jpg",
        description: "Front view of the PMELAB Power Bank"
    },
    {
        enabled: true,
        file: "productsimages/image2.jpg",
        description: "Detailed view of the power bank ports and indicators"
    },
    {
        enabled: true,
        file: "productsimages/image3.jpg",
        description: "PMELAB Power Bank being used on the go"
    },
    {
        enabled: true,
        file: "productsimages/image4.jpg",
        description: "Compact size comparison with smartphone"
    },
    {
        enabled: true,
        file: "productsimages/image5.jpg",
        description: "Lifestyle product image for marketing and customer trust"
    },
    {
        enabled: false,
        file: "",
        description: "Add another product image here when ready"
    },
    {
        enabled: false,
        file: "",
        description: "Add another product image here when ready"
    },
    {
        enabled: false,
        file: "",
        description: "Add another product image here when ready"
    },
    {
        enabled: false,
        file: "",
        description: "Add another product image here when ready"
    },
    {
        enabled: false,
        file: "",
        description: "Add another product image here when ready"
    }
];

// =========================================================
// 5. PRODUCT VIDEOS (Up to 10 YouTube videos)
// These videos show in the section:
// Videos
// SEE IT IN ACTION
// Use full YouTube URLs only.
// =========================================================
const PRODUCT_VIDEOS = [
    {
        enabled: true,
        title: "See the PMELAB Power Bank in Action",
        url: "https://www.youtube.com/watch?v=M7lc1UVf-VE"
    },
    {
        enabled: true,
        title: "Portable Charger Demo and Usage Ideas",
        url: "https://www.youtube.com/watch?v=BxQmDHeHfo0"
    },
    {
        enabled: false,
        title: "Add your product video title here",
        url: ""
    },
    {
        enabled: false,
        title: "Add your product video title here",
        url: ""
    },
    {
        enabled: false,
        title: "Add your product video title here",
        url: ""
    },
    {
        enabled: false,
        title: "Add your product video title here",
        url: ""
    },
    {
        enabled: false,
        title: "Add your product video title here",
        url: ""
    },
    {
        enabled: false,
        title: "Add your product video title here",
        url: ""
    },
    {
        enabled: false,
        title: "Add your product video title here",
        url: ""
    },
    {
        enabled: false,
        title: "Add your product video title here",
        url: ""
    }
];

// =========================================================
// 6. PRODUCT FEATURES (Up to 10)
// These cards show in the section:
// Features
// EVERYTHING YOU NEED
// =========================================================
const FEATURES = [
    {
        enabled: true,
        icon: "battery",
        title: "Portable Power",
        description: "Take convenient power with you wherever you go. Perfect for travel, work, and daily commutes."
    },
    {
        enabled: true,
        icon: "zap",
        title: "Fast Charging",
        description: "Designed for everyday charging needs with reliable output for your devices."
    },
    {
        enabled: true,
        icon: "shield",
        title: "Safe & Reliable",
        description: "Built with safety features to protect your devices during charging."
    },
    {
        enabled: true,
        icon: "smartphone",
        title: "Universal Compatibility",
        description: "Works with smartphones, tablets, and other USB-powered devices."
    },
    {
        enabled: true,
        icon: "gauge",
        title: "LED Indicator",
        description: "Know your remaining power at a glance with the built-in LED display."
    },
    {
        enabled: true,
        icon: "gift",
        title: "Great Gift Idea",
        description: "A practical and appreciated gift for friends, family, and professionals."
    },
    {
        enabled: false,
        icon: "",
        title: "",
        description: ""
    },
    {
        enabled: false,
        icon: "",
        title: "",
        description: ""
    },
    {
        enabled: false,
        icon: "",
        title: "",
        description: ""
    },
    {
        enabled: false,
        icon: "",
        title: "",
        description: ""
    }
];

// =========================================================
// 7. PRODUCT SPECIFICATIONS
// These rows show in the section:
// Specifications
// TECHNICAL DETAILS
// =========================================================
const SPECIFICATIONS = [
    { label: "Capacity", value: "20,000mAh" },
    { label: "Battery Type", value: "Lithium Polymer" },
    { label: "Input", value: "Micro USB / Type-C" },
    { label: "Output", value: "USB-A x 2" },
    { label: "Ports", value: "2 USB Output, 2 Input" },
    { label: "Weight", value: "Approx. 350g" },
    { label: "Dimensions", value: "150 x 70 x 20mm" },
    { label: "Warranty", value: "6 Months" }
];

// =========================================================
// 8. PACKAGES / PRICING
// These pricing cards show in the section:
// Pricing
// CHOOSE YOUR BEST VALUE
// The selected package also updates the checkout summary and WhatsApp order.
// =========================================================
const PACKAGES = [
    {
        id: "single",
        title: "BUY 1",
        quantity: 1,
        price: 25000,
        oldPrice: 35000,
        badge: "",
        description: "1 Power Bank",
        popular: false
    },
    {
        id: "double",
        title: "BUY 2",
        quantity: 2,
        price: 45000,
        oldPrice: 70000,
        badge: "MOST POPULAR",
        description: "2 Power Banks",
        popular: true
    },
    {
        id: "triple",
        title: "BUY 3",
        quantity: 3,
        price: 60000,
        oldPrice: 105000,
        badge: "BEST VALUE",
        description: "3 Power Banks",
        popular: false
    }
];

// =========================================================
// 9. DELIVERY CONFIGURATION
// This content shows in the section:
// Delivery
// WE DELIVER TO YOU
// =========================================================
const DELIVERY = {
    enabled: true,
    title: "Fast & Reliable Delivery",
    description: "Your order will be processed and delivered according to our delivery policy. We partner with trusted logistics providers to ensure your package arrives safely.",
    estimatedTime: "1–5 business days",
    feeText: "Delivery fees apply based on location",
    note: "Nationwide delivery available across Nigeria"
};

// =========================================================
// 10. GUARANTEE / TRUST
// These cards show in the section:
// Our Promise
// SHOP WITH CONFIDENCE
// =========================================================
const GUARANTEE = {
    enabled: true,
    title: "SHOP WITH CONFIDENCE",
    items: [
        { icon: "shield-check", title: "Quality Product", description: "Every unit is checked before dispatch." },
        { icon: "headphones", title: "Customer Support", description: "Reach us via phone, email, or WhatsApp." },
        { icon: "lock", title: "Secure Payment", description: "Your payment information is protected." },
        { icon: "truck", title: "Fast Processing", description: "Orders are processed within 24 hours." },
        { icon: "refresh-cw", title: "Easy Returns", description: "Hassle-free return within policy terms." },
        { icon: "award", title: "Genuine Product", description: "Authentic PMELAB product guaranteed." }
    ]
};

// =========================================================
// 11. WHY CHOOSE THIS PRODUCT
// These cards show in the section:
// Why Choose Us
// DESIGNED FOR YOUR LIFESTYLE
// =========================================================
const WHY_CHOOSE = [
    { icon: "briefcase", title: "PORTABLE", description: "Take your power with you wherever you go." },
    { icon: "plug", title: "CONVENIENT", description: "Designed for everyday charging needs." },
    { icon: "check-circle", title: "RELIABLE", description: "A practical power solution for your devices." },
    { icon: "map-pin", title: "TRAVEL-FRIENDLY", description: "Ideal for work, travel, school and everyday use." },
    { icon: "layout", title: "MODERN DESIGN", description: "A clean and practical design suitable for everyday use." },
    { icon: "heart", title: "GREAT GIFT", description: "A useful gift for friends, family and professionals." }
];

// =========================================================
// 12. TESTIMONIALS (Up to 10)
// These reviews show in the section:
// Testimonials
// WHAT OUR CUSTOMERS SAY
// You can use a customer image from productsimages/ or leave it blank.
// =========================================================
const TESTIMONIALS = [
    {
        enabled: true,
        name: "Ahmed Musa",
        location: "Minna, Niger State",
        rating: 5,
        text: "This power bank has been a lifesaver during my daily commute. It charges my phone quickly and the battery lasts really well. Highly recommended!",
        image: "productsimages/image5.jpg",
        verifiedBuyer: true
    },
    {
        enabled: true,
        name: "Fatima Ibrahim",
        location: "Abuja",
        rating: 5,
        text: "I bought two for myself and my husband. We both love how reliable it is. The delivery was fast and the product quality is excellent.",
        image: "",
        verifiedBuyer: true
    },
    {
        enabled: true,
        name: "John Okafor",
        location: "Lagos",
        rating: 4,
        text: "Good value for money. The power bank is sturdy and works well with my Samsung and iPhone. Customer service was also very helpful.",
        image: "",
        verifiedBuyer: true
    },
    {
        enabled: false,
        name: "",
        location: "",
        rating: 5,
        text: "",
        image: "",
        verifiedBuyer: false
    },
    {
        enabled: false,
        name: "",
        location: "",
        rating: 5,
        text: "",
        image: "",
        verifiedBuyer: false
    },
    {
        enabled: false,
        name: "",
        location: "",
        rating: 5,
        text: "",
        image: "",
        verifiedBuyer: false
    },
    {
        enabled: false,
        name: "",
        location: "",
        rating: 5,
        text: "",
        image: "",
        verifiedBuyer: false
    },
    {
        enabled: false,
        name: "",
        location: "",
        rating: 5,
        text: "",
        image: "",
        verifiedBuyer: false
    },
    {
        enabled: false,
        name: "",
        location: "",
        rating: 5,
        text: "",
        image: "",
        verifiedBuyer: false
    },
    {
        enabled: false,
        name: "",
        location: "",
        rating: 5,
        text: "",
        image: "",
        verifiedBuyer: false
    }
];

// =========================================================
// 13. FAQ (Up to 15)
// These questions show in the section:
// FAQ
// FREQUENTLY ASKED QUESTIONS
// =========================================================
const FAQ = [
    {
        enabled: true,
        question: "What is the capacity of the power bank?",
        answer: "The PMELAB Power Bank has a capacity of 20,000mAh, which is enough to charge most smartphones multiple times."
    },
    {
        enabled: true,
        question: "How long does delivery take?",
        answer: "Delivery typically takes 1–5 business days depending on your location within Nigeria."
    },
    {
        enabled: true,
        question: "Do you deliver nationwide?",
        answer: "Yes, we deliver to all states across Nigeria. Delivery fees may vary based on your location."
    },
    {
        enabled: true,
        question: "What payment methods are available?",
        answer: "We accept online payment via Paystack (card, bank transfer, USSD) and manual bank transfer."
    },
    {
        enabled: true,
        question: "Can I pay manually by bank transfer?",
        answer: "Yes, you can select the manual payment option at checkout. Our bank details will be provided, and your order will be processed once payment is confirmed."
    },
    {
        enabled: true,
        question: "Can I order through WhatsApp?",
        answer: "Absolutely! Click the 'Order via WhatsApp' button anywhere on the page to place your order directly through WhatsApp."
    },
    {
        enabled: true,
        question: "Can I buy multiple power banks?",
        answer: "Yes, we offer package deals. You can buy 1, 2, or 3 units with increasing discounts."
    },
    {
        enabled: true,
        question: "Is there a warranty?",
        answer: "Yes, the PMELAB Power Bank comes with a 6-month warranty against manufacturing defects."
    },
    {
        enabled: true,
        question: "What is your return policy?",
        answer: "We accept returns within 7 days of delivery if the product is unused and in original packaging. Please contact our support team for assistance."
    },
    {
        enabled: true,
        question: "How can I contact support?",
        answer: "You can reach us via phone at +2347040616209, email at support@paymelab.com, or WhatsApp."
    },
    {
        enabled: true,
        id: "faq-privacy-policy",
        question: "Privacy Policy",
        answer: "We only collect the information needed to process your order, contact you about your purchase, and provide customer support. Your personal information is handled responsibly and is not sold to third parties."
    },
    {
        enabled: true,
        id: "faq-terms-and-conditions",
        question: "Terms & Conditions",
        answer: "By placing an order on this website, you agree to provide accurate information, complete payment as required, and use the product as intended. We reserve the right to update pricing, product details, and policies when necessary."
    },
    {
        enabled: true,
        id: "faq-refund-policy",
        question: "Refund Policy",
        answer: "Refunds may be approved based on the condition of the product and the circumstances of the order. Please contact support within the allowed review period so we can assess your case and guide you through the next steps."
    },
    {
        enabled: true,
        id: "faq-delivery-policy",
        question: "Delivery Policy",
        answer: "Delivery timelines depend on your location and the selected fulfillment method. Orders are processed after payment confirmation, and customers will be contacted if there are any unusual delays."
    },
    {
        enabled: false,
        question: "",
        answer: ""
    }
];

// =========================================================
// 14. WHATSAPP NUMBERS (Up to 5)
// These numbers power the WhatsApp buttons across the website,
// including the hero, final CTA, and sticky mobile CTA.
// Use number format without spaces or plus sign.
// =========================================================
const WHATSAPP_NUMBERS = [
    {
        enabled: true,
        label: "Sales",
        number: "2347040616209"
    },
    {
        enabled: false,
        label: "Sales 2",
        number: ""
    },
    {
        enabled: false,
        label: "Sales 3",
        number: ""
    },
    {
        enabled: false,
        label: "Support",
        number: ""
    },
    {
        enabled: false,
        label: "Wholesale",
        number: ""
    }
];

// =========================================================
// 15. PAYMENT CONFIGURATION
// This controls the payment methods shown in checkout.
// Edit this section for Paystack and manual payment visibility.
// =========================================================
const PAYMENT = {
    paystackEnabled: true, // Set to false to hide Paystack
    manualEnabled: true, // Set to false to hide Manual Bank Transfer
    manualReceiptRequired: true, // Set to false if receipt upload should be optional
    paystackPublicKey: "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    currency: "NGN"
};

// =========================================================
// 16. MANUAL PAYMENT DETAILS
// These bank details show in checkout when the customer selects:
// Manual Bank Transfer
// The receipt upload field also appears with this payment option.
// =========================================================
const MANUAL_PAYMENT = {
    enabled: true,
    bankName: "First Bank of Nigeria",
    accountName: "PMELAB TECHNOLOGY LIMITED",
    accountNumber: "1234567890",
    instructions: "",
    paymentDeadline: "Please complete payment within 24 hours to avoid order cancellation."
};

// =========================================================
// 17. SOCIAL MEDIA LINKS
// These links show as social icons in the footer.
// Add full URLs. Leave blank to hide a platform.
// =========================================================
const SOCIAL_LINKS = {
    instagram: "https://instagram.com/paymelab",
    facebook: "https://facebook.com/paymelab",
    tiktok: "https://tiktok.com/@paymelab",
    youtube: "https://youtube.com/@paymelab",
    twitter: "https://x.com/paymelab"
};

// =========================================================
// 18. LOGO CONFIGURATION
// This controls the logo in the header and footer brand area.
// Use type "text" for simple brand text or "image" for a real logo file.
// =========================================================
const LOGO = {
    type: "text", // "image" or "text"
    text: "PMELAB",
    image: "logo.png",
    alt: "PMELAB TECHNOLOGY LIMITED Logo"
};

// =========================================================
// 19. HEADER NAVIGATION
// These are the menu links shown in the desktop and mobile header.
// Each href should point to a section id on the page.
// =========================================================
const NAVIGATION = [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Features", href: "#features" },
    { label: "Reviews", href: "#reviews" },
    { label: "FAQ", href: "#faq" }
];

// =========================================================
// 20. FOOTER LINKS
// These links show in the footer under Quick Links and Legal.
// Replace example URLs with your real pages when ready.
// =========================================================
const FOOTER_LINKS = {
    quickLinks: [
        { label: "Home", href: "#home" },
        { label: "About Product", href: "#about" },
        { label: "Features", href: "#features" },
        { label: "Reviews", href: "#reviews" },
        { label: "FAQ", href: "#faq" },
        { label: "Contact", href: "#contact" }
    ],
    legalLinks: [
        { label: "Privacy Policy", href: "#faq-privacy-policy" },
        { label: "Terms & Conditions", href: "#faq-terms-and-conditions" },
        { label: "Refund Policy", href: "#faq-refund-policy" },
        { label: "Delivery Policy", href: "#faq-delivery-policy" }
    ]
};

// =========================================================
// 21. SEO CONFIGURATION
// This controls the browser title, search preview text,
// social share image, and canonical URL.
// =========================================================
const SEO = {
    title: "PMELAB Power Bank | PMELAB TECHNOLOGY LIMITED",
    description: "Get reliable portable power from PMELAB TECHNOLOGY LIMITED. The PMELAB Power Bank keeps your devices charged wherever you go. Order now with fast delivery across Nigeria.",
    keywords: "power bank, PMELAB, portable charger, Nigeria, power bank Nigeria, phone charger",
    canonicalUrl: "https://paymelab.com",
    socialImage: "productsimages/image1.jpg"
};

// =========================================================
// 22. ANALYTICS CONFIGURATION
// Add your analytics ids here when ready.
// These do not show visually on the site but power tracking.
// =========================================================
const ANALYTICS = {
    googleAnalyticsId: "",
    metaPixelId: "",
    googleTagManagerId: ""
};

// =========================================================
// 23. PROMOTION / URGENCY (Use only genuine promotions)
// Use this as a sample promo section for future use.
// If you enable it later, keep the offer honest and time-bound.
// =========================================================
const PROMOTION = {
    enabled: false,
    title: "Weekend Power Deal",
    description: "Save more when you buy 2 or 3 units this weekend only.",
    endDate: "2026-12-31"
};

// =========================================================
// 24. SOCIAL PROOF GALLERY (Optional)
// Sample gallery content for future customer/lifestyle images.
// Use real photos from happy customers or product usage.
// =========================================================
const SOCIAL_PROOF_GALLERY = {
    enabled: false,
    title: "Customer Moments",
    description: "See how our customers use their PMELAB Power Bank.",
    images: [
        "productsimages/image3.jpg",
        "productsimages/image4.jpg",
        "productsimages/image5.jpg"
    ]
};

// =========================================================
// 25. ABOUT THE COMPANY
// This content shows in the section:
// About Us
// ABOUT PMELAB TECHNOLOGY LIMITED
// =========================================================
const COMPANY = {
    enabled: true,
    title: "ABOUT PMELAB TECHNOLOGY LIMITED",
    description: "PMELAB TECHNOLOGY LIMITED is committed to providing reliable tech accessories that make everyday life easier. Based in Minna, Niger State, we serve customers across Nigeria with quality products and dependable customer service.",
    mission: "To make reliable technology accessible to everyone in Nigeria.",
    values: ["Quality", "Integrity", "Customer First", "Innovation"]
};

// =========================================================
// 26. TRUST BADGES (Why Buy From Us)
// Sample trust badge content for future use.
// These can support reassurance messaging across the site.
// =========================================================
const TRUST_BADGES = [
    { icon: "shield", text: "Secure Payment" },
    { icon: "package", text: "Quality Products" },
    { icon: "message-circle", text: "Customer Support" },
    { icon: "smartphone", text: "Convenient Ordering" },
    { icon: "clock", text: "Fast Processing" },
    { icon: "thumbs-up", text: "Reliable Service" }
];

// =========================================================
// 27. CONTACT SECTION
// This controls the section:
// Contact
// GET IN TOUCH
// =========================================================
const CONTACT = {
    enabled: true,
    title: "GET IN TOUCH",
    subtitle: "Have questions? We're here to help.",
    showMap: false,
    mapEmbedUrl: ""
};

// =========================================================
// 28. ABOUT PRODUCT SECTION
// This content shows in the section:
// About The Product
// POWER WHEN YOU NEED IT MOST
// =========================================================
const ABOUT_PRODUCT = {
    enabled: true,
    title: "POWER WHEN YOU NEED IT MOST",
    paragraphs: [
        "In today's connected world, staying powered is not a luxury — it's a necessity. The PMELAB Power Bank is designed for people who refuse to let a dead battery slow them down.",
        "Whether you're commuting to work, traveling across the country, studying late at night, or simply spending a day out with friends, this power bank ensures your devices stay charged and ready.",
        "With a sleek, modern design and reliable performance, the PMELAB Power Bank fits seamlessly into your lifestyle. It's more than a charger — it's peace of mind in your pocket."
    ],
    benefits: [
        "Stay connected during power outages",
        "Charge multiple devices on the go",
        "Perfect for students, professionals, and travelers",
        "A thoughtful gift for loved ones"
    ]
};

// =========================================================
// 29. HERO TRUST INDICATORS
// These small trust items show under the hero buttons
// in the top section "POWER THAT GOES WHERE YOU GO."
// =========================================================
const HERO_TRUST = [
    { icon: "shield-check", text: "Secure Payment" },
    { icon: "truck", text: "Fast Delivery" },
    { icon: "headphones", text: "Customer Support" },
    { icon: "award", text: "Quality Product" }
];

// =========================================================
// 30. STICKY CTA CONFIG
// This controls the sticky mobile action bar at the bottom of the screen.
// =========================================================
const STICKY_CTA = {
    enabled: true,
    text: "BUY NOW",
    whatsappText: "WHATSAPP"
};

// =========================================================
// DO NOT EDIT BELOW THIS LINE
// =========================================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BUSINESS, API_BASE_URL, BRAND, PRODUCT, PRODUCT_TYPE, PRODUCT_IMAGES, PRODUCT_VIDEOS,
        FEATURES, SPECIFICATIONS, PACKAGES, DELIVERY, GUARANTEE,
        WHY_CHOOSE, TESTIMONIALS, FAQ, WHATSAPP_NUMBERS, PAYMENT,
        MANUAL_PAYMENT, SOCIAL_LINKS, LOGO, NAVIGATION, FOOTER_LINKS,
        SEO, ANALYTICS, PROMOTION, SOCIAL_PROOF_GALLERY, COMPANY,
        TRUST_BADGES, CONTACT, ABOUT_PRODUCT, HERO_TRUST, STICKY_CTA
    };
}
