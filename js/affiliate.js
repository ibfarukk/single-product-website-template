(function() {
    'use strict';

    function $(id) {
        return document.getElementById(id);
    }

    function formatMoney(amount) {
        const value = Number(amount || 0);
        return (BUSINESS.currency || '') + value.toLocaleString('en-NG');
    }

    function normalizeProducts() {
        if (typeof AFFILIATE_PRODUCTS !== 'undefined' && Array.isArray(AFFILIATE_PRODUCTS)) return AFFILIATE_PRODUCTS;
        if (Array.isArray(window.AFFILIATE_PRODUCTS)) return window.AFFILIATE_PRODUCTS;
        return [];
    }

    function initPageBranding() {
        const badge = $('affiliate-badge');
        const title = $('affiliate-title');
        const desc = $('affiliate-desc');

        if (badge) badge.textContent = String(BUSINESS.shortName || BUSINESS.name || 'AFFILIATE');
        if (title) title.textContent = (typeof STORE_CONTENT !== 'undefined' && STORE_CONTENT.bannerTitle) ? String(STORE_CONTENT.bannerTitle) : 'Recommended Products';
        if (desc) desc.textContent = (typeof STORE_CONTENT !== 'undefined' && STORE_CONTENT.bannerSubtitle) ? String(STORE_CONTENT.bannerSubtitle) : 'Explore products and visit the vendor website to purchase.';

        document.title = String(BUSINESS.shortName || BUSINESS.name || 'Affiliate');
    }

    function renderProducts() {
        const grid = $('affiliate-products-grid');
        const empty = $('affiliate-products-empty');
        if (!grid) return;

        const products = normalizeProducts();
        if (!products.length) {
            if (empty) empty.classList.remove('owner-hidden');
            return;
        }

        if (empty) empty.classList.add('owner-hidden');

        grid.innerHTML = products.map(function(product) {
            const href = 'product-details.html?id=' + encodeURIComponent(String(product.id || ''));
            const priceText = product.price !== undefined && product.price !== null ? ('From ' + formatMoney(product.price)) : '';
            const specs = Array.isArray(product.specs) ? product.specs.slice(0, 3) : [];
            const specsHtml = specs.length
                ? ('<div style="margin-top:10px;display:grid;gap:6px;">' + specs.map(function(row) {
                    const label = String(row && row.label ? row.label : '').trim();
                    const value = String(row && row.value ? row.value : '').trim();
                    if (!label || !value) return '';
                    return '<div style="display:flex;justify-content:space-between;gap:12px;"><span style="color:var(--muted);font-size:12px;">' + label + '</span><span style="font-weight:800;font-size:12px;">' + value + '</span></div>';
                }).filter(Boolean).join('') + '</div>')
                : '';
            return [
                '<div class="package-card" style="text-align:left;">',
                '<div style="display:flex;gap:14px;align-items:flex-start;">',
                '<img src="' + String(product.image || 'productsimages/logo.jpg') + '" alt="" style="width:84px;height:84px;border-radius:16px;object-fit:cover;border:1px solid var(--border);" loading="lazy">',
                '<div style="flex:1;">',
                '<div class="package-title" style="margin-bottom:6px;text-align:left;">' + String(product.title || product.id) + '</div>',
                '<div class="package-desc" style="margin:0;">' + String(product.description || '') + '</div>',
                (priceText ? ('<div style="margin-top:10px;font-weight:900;color:var(--primary);font-size:1.25rem;">' + priceText + '</div>') : ''),
                specsHtml,
                '</div>',
                '</div>',
                '<div style="margin-top:14px;display:grid;gap:10px;">',
                '<a class="btn btn-primary" href="' + href + '" style="width:100%;display:inline-flex;justify-content:center;">View Details</a>',
                '</div>',
                '</div>'
            ].join('');
        }).join('');
    }

    document.addEventListener('DOMContentLoaded', function() {
        initPageBranding();
        renderProducts();
        if (window.PMELAB_CART && typeof window.PMELAB_CART.init === 'function') {
            window.PMELAB_CART.init();
        }
    });
})();

