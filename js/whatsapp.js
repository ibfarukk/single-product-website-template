/* =========================================================
   PMELAB PRODUCT TEMPLATE — WHATSAPP ORDERING
   ========================================================= */

(function() {
    'use strict';

    // =========================================================
    // GET ACTIVE WHATSAPP NUMBER
    // =========================================================
    function getActiveWhatsAppNumber() {
        const active = WHATSAPP_NUMBERS.find(function(w) { return w.enabled && w.number; });
        return active ? active.number : null;
    }

    // =========================================================
    // GENERATE WHATSAPP MESSAGE
    // =========================================================
    function generateWhatsAppMessage(pkg, customerInfo) {
        const currency = BUSINESS.currency;
        let message = 'Hello ' + BUSINESS.name + ',%0A%0A';
        message += 'I would like to order:%0A%0A';
        message += '*Product:* ' + PRODUCT.name + '%0A';
        message += '*Package:* ' + pkg.title + '%0A';
        message += '*Quantity:* ' + pkg.quantity + '%0A';
        message += '*Price:* ' + currency + formatPrice(pkg.price) + '%0A%0A';

        if (customerInfo) {
            if (customerInfo.name) message += '*Name:* ' + customerInfo.name + '%0A';
            if (customerInfo.phone) message += '*Phone:* ' + customerInfo.phone + '%0A';
            if (customerInfo.address) message += '*Address:* ' + customerInfo.address + '%0A';
            if (customerInfo.email) message += '*Email:* ' + customerInfo.email + '%0A';
            if (customerInfo.specialRequest) message += '*Special Request:* ' + customerInfo.specialRequest + '%0A%0A';
        }

        message += 'Please assist me with my order.';
        return message;
    }

    // =========================================================
    // OPEN WHATSAPP
    // =========================================================
    function openWhatsApp(message) {
        const number = getActiveWhatsAppNumber();
        if (!number) {
            alert('WhatsApp ordering is currently unavailable. Please use the checkout form.');
            return;
        }

        // Clean number - remove any non-digits
        const cleanNumber = number.replace(/\D/g, '');
        const url = 'https://wa.me/' + cleanNumber + '?text=' + message;

        trackEvent('click_whatsapp', { package_id: window.selectedPackage ? window.selectedPackage.id : '' });
        window.open(url, '_blank');
    }

    // =========================================================
    // WHATSAPP ORDER FROM HERO
    // =========================================================
    function initHeroWhatsApp() {
        const btn = document.querySelector('.hero-buttons .btn-whatsapp');
        if (!btn) return;

        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const pkg = window.selectedPackage || PACKAGES[0];
            const message = generateWhatsAppMessage(pkg);
            openWhatsApp(message);
        });
    }

    // =========================================================
    // WHATSAPP ORDER FROM FINAL CTA
    // =========================================================
    function initFinalCTAWhatsApp() {
        const btn = document.querySelector('.final-cta .btn-whatsapp');
        if (!btn) return;

        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const pkg = window.selectedPackage || PACKAGES[0];
            const message = generateWhatsAppMessage(pkg);
            openWhatsApp(message);
        });
    }

    // =========================================================
    // WHATSAPP ORDER FROM STICKY CTA
    // =========================================================
    function initStickyCTAWhatsApp() {
        const btn = document.querySelector('.sticky-cta .btn-whatsapp');
        if (!btn) return;

        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const pkg = window.selectedPackage || PACKAGES[0];
            const message = generateWhatsAppMessage(pkg);
            openWhatsApp(message);
        });
    }

    // =========================================================
    // WHATSAPP ORDER FROM CHECKOUT
    // =========================================================
    function initCheckoutWhatsApp() {
        // This would be used if there's a WhatsApp button in checkout
    }

    // =========================================================
    // INITIALIZE
    // =========================================================
    document.addEventListener('DOMContentLoaded', function() {
        initHeroWhatsApp();
        initFinalCTAWhatsApp();
        initStickyCTAWhatsApp();
    });

    // Expose for checkout
    window.openWhatsApp = openWhatsApp;
    window.generateWhatsAppMessage = generateWhatsAppMessage;
})();
