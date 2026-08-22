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

const STORE_CONTENT = {
    bannerTitle: "Recommended Products",
    bannerSubtitle: "Explore products, view details, and purchase from the vendor website.",
    aboutTitle: "About Us",
    aboutText: "We share curated product recommendations and direct you to trusted vendors.",
    contactTitle: "Contact Us",
    contactText: "Need help? Contact us using the details below.",
    refundPolicyTitle: "Refund Policy",
    refundPolicyText: "Affiliate products are purchased on vendor websites. Refunds and returns follow the vendor’s policy. Contact the vendor for refunds.",
    refundFormTitle: "Refund Request",
    refundFormText: "If you need help reaching a vendor about a refund, submit the form below with your details."
};

const AFFILIATE_PRODUCTS = [
    {
        id: "affiliate-mtn-data",
        title: "MTN Data Plans",
        description: "Browse MTN data plans and complete purchase on the vendor website.",
        longDescription: "Explore available plans and pricing from the vendor website. Ensure you review vendor terms before purchase.",
        price: 500,
        image: "productsimages/mtn.jpg",
        images: [
            "productsimages/mtn.jpg",
            "productsimages/image1.jpg",
            "productsimages/image2.jpg",
            "productsimages/image3.jpg",
            "productsimages/image4.jpg"
        ],
        specs: [
            { label: "Category", value: "Data" },
            { label: "Network", value: "MTN" },
            { label: "Purchase", value: "Vendor website" }
        ],
        affiliateUrl: "https://example.com/mtn-data",
        buttonText: "Buy on Vendor"
    },
    {
        id: "affiliate-glo-data",
        title: "Glo Data Plans",
        description: "Choose a Glo data plan that fits your needs and buy on the vendor website.",
        longDescription: "Compare plans and proceed to the vendor website to complete purchase.",
        price: 500,
        image: "productsimages/glo.jpg",
        images: [
            "productsimages/glo.jpg",
            "productsimages/image5.jpg",
            "productsimages/image4.jpg",
            "productsimages/image3.jpg",
            "productsimages/image2.jpg"
        ],
        specs: [
            { label: "Category", value: "Data" },
            { label: "Network", value: "Glo" },
            { label: "Purchase", value: "Vendor website" }
        ],
        affiliateUrl: "https://example.com/glo-data",
        buttonText: "Buy on Vendor"
    },
    {
        id: "affiliate-9mobile-data",
        title: "9mobile Data Plans",
        description: "Get 9mobile data plans via the vendor website.",
        longDescription: "Pick a plan and complete the purchase on the vendor website.",
        price: 500,
        image: "productsimages/9mobile.jpg",
        images: [
            "productsimages/9mobile.jpg",
            "productsimages/image1.jpg",
            "productsimages/image2.jpg",
            "productsimages/image3.jpg",
            "productsimages/image4.jpg"
        ],
        specs: [
            { label: "Category", value: "Data" },
            { label: "Network", value: "9mobile" },
            { label: "Purchase", value: "Vendor website" }
        ],
        affiliateUrl: "https://example.com/9mobile-data",
        buttonText: "Buy on Vendor"
    },
    {
        id: "affiliate-smartphone-deals",
        title: "Smartphone Deals",
        description: "Check current smartphone deals and buy from the vendor website.",
        longDescription: "View available smartphone offers and verify full specifications on the vendor page.",
        price: 180000,
        image: "productsimages/image1.jpg",
        images: [
            "productsimages/image1.jpg",
            "productsimages/image2.jpg",
            "productsimages/image3.jpg",
            "productsimages/image4.jpg",
            "productsimages/image5.jpg"
        ],
        specs: [
            { label: "Category", value: "Phones" },
            { label: "Purchase", value: "Vendor website" }
        ],
        affiliateUrl: "https://example.com/phones",
        buttonText: "View Deals"
    },
    {
        id: "affiliate-laptop-deals",
        title: "Laptop Deals",
        description: "Compare laptop offers and buy from the vendor website.",
        longDescription: "Browse laptop models and compare specifications on the vendor website.",
        price: 350000,
        image: "productsimages/image2.jpg",
        images: [
            "productsimages/image2.jpg",
            "productsimages/image3.jpg",
            "productsimages/image4.jpg",
            "productsimages/image1.jpg",
            "productsimages/image5.jpg"
        ],
        specs: [
            { label: "Category", value: "Laptops" },
            { label: "Purchase", value: "Vendor website" }
        ],
        affiliateUrl: "https://example.com/laptops",
        buttonText: "View Deals"
    },
    {
        id: "affiliate-smartwatch",
        title: "Smart Watches",
        description: "Browse smart watches and purchase on the vendor website.",
        longDescription: "Browse smart watches and confirm features on the vendor website.",
        price: 22000,
        image: "productsimages/image3.jpg",
        images: [
            "productsimages/image3.jpg",
            "productsimages/image4.jpg",
            "productsimages/image2.jpg",
            "productsimages/image5.jpg",
            "productsimages/image1.jpg"
        ],
        specs: [
            { label: "Category", value: "Wearables" },
            { label: "Purchase", value: "Vendor website" }
        ],
        affiliateUrl: "https://example.com/smartwatches",
        buttonText: "View Options"
    },
    {
        id: "affiliate-bluetooth-speakers",
        title: "Bluetooth Speakers",
        description: "Explore portable speakers and buy from the vendor website.",
        longDescription: "Explore speaker models and confirm battery and output on the vendor website.",
        price: 18000,
        image: "productsimages/image4.jpg",
        images: [
            "productsimages/image4.jpg",
            "productsimages/image5.jpg",
            "productsimages/image3.jpg",
            "productsimages/image2.jpg",
            "productsimages/image1.jpg"
        ],
        specs: [
            { label: "Category", value: "Audio" },
            { label: "Purchase", value: "Vendor website" }
        ],
        affiliateUrl: "https://example.com/speakers",
        buttonText: "View Options"
    },
    {
        id: "affiliate-power-banks",
        title: "Power Banks",
        description: "Browse power banks on the vendor website.",
        longDescription: "Browse different capacities and brands on the vendor website.",
        price: 25000,
        image: "productsimages/image5.jpg",
        images: [
            "productsimages/image5.jpg",
            "productsimages/image1.jpg",
            "productsimages/image2.jpg",
            "productsimages/image3.jpg",
            "productsimages/image4.jpg"
        ],
        specs: [
            { label: "Category", value: "Accessories" },
            { label: "Purchase", value: "Vendor website" }
        ],
        affiliateUrl: "https://example.com/powerbanks",
        buttonText: "View Options"
    },
    {
        id: "affiliate-chargers",
        title: "Fast Chargers",
        description: "Find fast chargers and purchase from the vendor website.",
        longDescription: "Check charger wattages and compatibility on the vendor website.",
        price: 12000,
        image: "productsimages/5771629618929536855.jpg",
        images: [
            "productsimages/5771629618929536855.jpg",
            "productsimages/image2.jpg",
            "productsimages/image5.jpg",
            "productsimages/image1.jpg",
            "productsimages/image3.jpg"
        ],
        specs: [
            { label: "Category", value: "Charging" },
            { label: "Purchase", value: "Vendor website" }
        ],
        affiliateUrl: "https://example.com/chargers",
        buttonText: "View Options"
    },
    {
        id: "affiliate-accessories",
        title: "Phone Accessories",
        description: "Shop phone accessories on the vendor website.",
        longDescription: "Browse different accessories and complete your purchase on the vendor website.",
        price: 3500,
        image: "productsimages/images (1).png",
        images: [
            "productsimages/images (1).png",
            "productsimages/image1.jpg",
            "productsimages/image2.jpg",
            "productsimages/image3.jpg",
            "productsimages/image4.jpg"
        ],
        specs: [
            { label: "Category", value: "Accessories" },
            { label: "Purchase", value: "Vendor website" }
        ],
        affiliateUrl: "https://example.com/accessories",
        buttonText: "Shop Now"
    }
];
