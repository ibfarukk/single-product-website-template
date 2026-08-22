const BUSINESS = {
    name: "PMELAB TECHNOLOGY LIMITED",
    shortName: "PMELAB STORE",
    phone: "+2347040616209",
    email: "support@paymelab.com",
    address: "Office No. 9, Achida Plaza, Opposite JEFLA, Beside AA RANO Filling Station, Kpakungu, Minna, Niger State, Nigeria.",
    country: "Nigeria",
    currency: "₦",
    currencyCode: "NGN",
    website: "https://paymelab.com"
};

const API_BASE_URL = "";

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
    preset: "green"
};

const PAYMENT = {
    paystackEnabled: true,
    manualEnabled: true,
    manualReceiptRequired: true,
    paystackPublicKey: "pk_test_d81cbc3f5d3f34ad13bb5b6626b869bb4545b02a",
    currency: "NGN"
};

const MANUAL_PAYMENT = {
    enabled: true,
    bankName: "First Bank of Nigeria",
    accountName: "PMELAB TECHNOLOGY LIMITED",
    accountNumber: "1234567890",
    instructions: "",
    paymentDeadline: "Please complete payment within 24 hours to avoid order cancellation."
};

const STORE_CONTENT = {
    bannerTitle: "Shop Products",
    bannerSubtitle: "Choose a product, view details, add to cart, and checkout securely.",
    aboutTitle: "About Us",
    aboutText: "We are committed to providing quality products and excellent customer service.",
    contactTitle: "Contact Us",
    contactText: "Need help with an order? Reach out using the details below.",
    refundPolicyTitle: "Refund Policy",
    refundPolicyText: "Refunds are processed according to our refund policy. Please submit a refund request using the refund form and include your order reference.",
    refundFormTitle: "Refund Request",
    refundFormText: "Fill the form below with your order reference and the email used during checkout."
};

const PRODUCTS = [
    {
        id: "pmelab-power-bank",
        title: "PMELAB Power Bank",
        shortTitle: "Power Bank",
        description: "Portable power whenever you need it.",
        longDescription: "A reliable power bank designed for everyday use. Built for convenience with dependable charging performance for your devices.",
        productType: "physical",
        shippingFee: 1500,
        image: "productsimages/image1.jpg",
        images: [
            "productsimages/image1.jpg",
            "productsimages/image2.jpg",
            "productsimages/image3.jpg",
            "productsimages/image4.jpg",
            "productsimages/image5.jpg"
        ],
        specs: [
            { label: "Capacity", value: "20,000mAh" },
            { label: "Ports", value: "USB-A + USB-C" },
            { label: "Fast Charge", value: "Supported" },
            { label: "Warranty", value: "6 months" }
        ],
        packages: [
            { id: "single", title: "Single Unit", price: 25000 },
            { id: "double", title: "2 Units Bundle", price: 48000 }
        ]
    },
    {
        id: "wireless-earbuds",
        title: "Wireless Earbuds",
        shortTitle: "Earbuds",
        description: "Clear sound, strong bass, and stable Bluetooth connection.",
        longDescription: "Enjoy crisp audio and comfortable fit. Perfect for calls, music, and workouts with stable Bluetooth performance.",
        productType: "physical",
        shippingFee: 1200,
        image: "productsimages/image2.jpg",
        images: [
            "productsimages/image2.jpg",
            "productsimages/image3.jpg",
            "productsimages/image4.jpg",
            "productsimages/image1.jpg",
            "productsimages/image5.jpg"
        ],
        specs: [
            { label: "Bluetooth", value: "5.x" },
            { label: "Battery", value: "Up to 20 hours (case)" },
            { label: "Noise Isolation", value: "Passive" },
            { label: "Mic", value: "Built-in" }
        ],
        packages: [
            { id: "standard", title: "Standard Edition", price: 18000 },
            { id: "pro", title: "Pro Edition", price: 26000 }
        ]
    },
    {
        id: "smart-watch",
        title: "Smart Watch",
        shortTitle: "Watch",
        description: "Track your steps, heart rate, and notifications on the go.",
        longDescription: "A stylish smart watch that keeps you connected and helps you track daily activity and wellness features.",
        productType: "physical",
        shippingFee: 1400,
        image: "productsimages/image3.jpg",
        images: [
            "productsimages/image3.jpg",
            "productsimages/image4.jpg",
            "productsimages/image2.jpg",
            "productsimages/image5.jpg",
            "productsimages/image1.jpg"
        ],
        specs: [
            { label: "Display", value: "HD" },
            { label: "Sensors", value: "Heart rate, steps" },
            { label: "Charging", value: "Magnetic" },
            { label: "Water Resistance", value: "Everyday use" }
        ],
        packages: [
            { id: "basic", title: "Basic", price: 22000 },
            { id: "premium", title: "Premium", price: 32000 }
        ]
    },
    {
        id: "bluetooth-speaker",
        title: "Bluetooth Speaker",
        shortTitle: "Speaker",
        description: "Portable speaker with deep sound and long battery life.",
        longDescription: "Compact speaker built for clean sound and portability. Great for indoor and outdoor listening.",
        productType: "physical",
        shippingFee: 1800,
        image: "productsimages/image4.jpg",
        images: [
            "productsimages/image4.jpg",
            "productsimages/image5.jpg",
            "productsimages/image3.jpg",
            "productsimages/image2.jpg",
            "productsimages/image1.jpg"
        ],
        specs: [
            { label: "Output", value: "High power audio" },
            { label: "Battery", value: "Long lasting" },
            { label: "Connectivity", value: "Bluetooth" },
            { label: "Use", value: "Indoor/Outdoor" }
        ],
        packages: [
            { id: "mini", title: "Mini", price: 15000 },
            { id: "max", title: "Max", price: 28000 }
        ]
    },
    {
        id: "usb-c-fast-charger",
        title: "USB-C Fast Charger",
        shortTitle: "Fast Charger",
        description: "Fast and safe charging for phones, tablets, and accessories.",
        longDescription: "A fast-charging adapter designed to power your devices safely with stable performance.",
        productType: "physical",
        shippingFee: 900,
        image: "productsimages/image5.jpg",
        images: [
            "productsimages/image5.jpg",
            "productsimages/image1.jpg",
            "productsimages/image2.jpg",
            "productsimages/image3.jpg",
            "productsimages/image4.jpg"
        ],
        specs: [
            { label: "Port", value: "USB-C" },
            { label: "Safety", value: "Overcurrent protection" },
            { label: "Use", value: "Phones/Tablets" },
            { label: "Build", value: "Compact" }
        ],
        packages: [
            { id: "20w", title: "20W Adapter", price: 8500 },
            { id: "33w", title: "33W Adapter", price: 11000 }
        ]
    },
    {
        id: "data-cable",
        title: "Data Cable",
        shortTitle: "Cable",
        description: "Durable cable for charging and data transfer.",
        longDescription: "A reliable cable built for everyday charging and stable data transfer. Designed to last longer with reinforced build.",
        productType: "physical",
        shippingFee: 700,
        image: "productsimages/5771629618929536855.jpg",
        images: [
            "productsimages/5771629618929536855.jpg",
            "productsimages/image2.jpg",
            "productsimages/image5.jpg",
            "productsimages/image1.jpg",
            "productsimages/image3.jpg"
        ],
        specs: [
            { label: "Durability", value: "Reinforced" },
            { label: "Charging", value: "Fast charge supported" },
            { label: "Data", value: "High-speed transfer" },
            { label: "Length", value: "Standard" }
        ],
        packages: [
            { id: "type-c", title: "USB-C Cable", price: 3500 },
            { id: "lightning", title: "Lightning Cable", price: 4500 },
            { id: "micro", title: "Micro USB Cable", price: 2500 }
        ]
    },
    {
        id: "led-desk-lamp",
        title: "LED Desk Lamp",
        shortTitle: "Desk Lamp",
        description: "Eye-friendly LED lamp for reading and work.",
        longDescription: "A clean desk lamp designed for comfort with adjustable brightness for study and work environments.",
        productType: "physical",
        shippingFee: 1600,
        image: "productsimages/images (4).jpg",
        images: [
            "productsimages/images (4).jpg",
            "productsimages/image4.jpg",
            "productsimages/image3.jpg",
            "productsimages/image5.jpg",
            "productsimages/image2.jpg"
        ],
        specs: [
            { label: "Lighting", value: "LED" },
            { label: "Brightness", value: "Adjustable" },
            { label: "Power", value: "USB/Rechargeable option" },
            { label: "Use", value: "Desk/Reading" }
        ],
        packages: [
            { id: "standard", title: "Standard", price: 13500 },
            { id: "rechargeable", title: "Rechargeable", price: 18500 }
        ]
    },
    {
        id: "phone-stand",
        title: "Phone Stand",
        shortTitle: "Stand",
        description: "Adjustable stand for desk, bed, and video calls.",
        longDescription: "An adjustable stand for comfortable viewing angles during calls, browsing, and content watching.",
        productType: "physical",
        shippingFee: 800,
        image: "productsimages/images (1).png",
        images: [
            "productsimages/images (1).png",
            "productsimages/image1.jpg",
            "productsimages/image2.jpg",
            "productsimages/image3.jpg",
            "productsimages/image4.jpg"
        ],
        specs: [
            { label: "Adjustable", value: "Yes" },
            { label: "Use", value: "Desk/Bed" },
            { label: "Material", value: "Durable build" },
            { label: "Compatibility", value: "Most phones" }
        ],
        packages: [
            { id: "single", title: "Single Stand", price: 4000 },
            { id: "bundle", title: "2-Pack Bundle", price: 7000 }
        ]
    },
    {
        id: "mtn-airtime-voucher",
        title: "MTN Airtime Voucher",
        shortTitle: "MTN Airtime",
        description: "Instant MTN airtime voucher delivery after confirmation.",
        longDescription: "Digital airtime voucher delivered after payment confirmation. Suitable for quick top-ups.",
        productType: "digital",
        shippingFee: 0,
        image: "productsimages/mtn.jpg",
        images: [
            "productsimages/mtn.jpg",
            "productsimages/image1.jpg",
            "productsimages/image2.jpg",
            "productsimages/image3.jpg",
            "productsimages/image4.jpg"
        ],
        specs: [
            { label: "Delivery", value: "Digital" },
            { label: "Network", value: "MTN" },
            { label: "Speed", value: "After confirmation" },
            { label: "Support", value: "Available" }
        ],
        packages: [
            { id: "mtn-1000", title: "₦1,000 Airtime", price: 1000 },
            { id: "mtn-2000", title: "₦2,000 Airtime", price: 2000 },
            { id: "mtn-5000", title: "₦5,000 Airtime", price: 5000 }
        ]
    },
    {
        id: "glo-data-voucher",
        title: "Glo Data Voucher",
        shortTitle: "Glo Data",
        description: "Digital data voucher delivered after payment confirmation.",
        longDescription: "A convenient data voucher delivered digitally after confirmation.",
        productType: "digital",
        shippingFee: 0,
        image: "productsimages/glo.jpg",
        images: [
            "productsimages/glo.jpg",
            "productsimages/image5.jpg",
            "productsimages/image4.jpg",
            "productsimages/image3.jpg",
            "productsimages/image2.jpg"
        ],
        specs: [
            { label: "Delivery", value: "Digital" },
            { label: "Network", value: "Glo" },
            { label: "Speed", value: "After confirmation" },
            { label: "Support", value: "Available" }
        ],
        packages: [
            { id: "glo-2gb", title: "2GB Data", price: 1500 },
            { id: "glo-5gb", title: "5GB Data", price: 3000 },
            { id: "glo-10gb", title: "10GB Data", price: 5500 }
        ]
    }
];
