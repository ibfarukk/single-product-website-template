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
        if (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS)) return PRODUCTS;
        if (Array.isArray(window.PRODUCTS)) return window.PRODUCTS;
        return [];
    }

    function getBestPackage(product) {
        const packages = product && Array.isArray(product.packages) ? product.packages.slice() : [];
        packages.sort(function(a, b) {
            return Number(a && a.price ? a.price : 0) - Number(b && b.price ? b.price : 0);
        });
        return packages.length ? packages[0] : null;
    }

    function initPageBranding() {
        const badge = $('multi-badge');
        const title = $('multi-title');
        const desc = $('multi-desc');

        if (badge) badge.textContent = String(BUSINESS.shortName || BUSINESS.name || 'STORE');
        if (title) title.textContent = (typeof STORE_CONTENT !== 'undefined' && STORE_CONTENT.bannerTitle) ? String(STORE_CONTENT.bannerTitle) : String(BUSINESS.shortName || 'Shop Products');
        if (desc) desc.textContent = (typeof STORE_CONTENT !== 'undefined' && STORE_CONTENT.bannerSubtitle) ? String(STORE_CONTENT.bannerSubtitle) : 'Choose a product, view details, add to cart, and checkout securely.';

        document.title = String(BUSINESS.shortName || BUSINESS.name || 'Store');
    }

    function renderProducts() {
        const grid = $('multi-products-grid');
        const empty = $('multi-products-empty');
        if (!grid) return;

        const products = normalizeProducts();
        if (!products.length) {
            if (empty) empty.classList.remove('owner-hidden');
            return;
        }

        if (empty) empty.classList.add('owner-hidden');

        grid.innerHTML = products.map(function(product) {
            const href = 'product-details.html?id=' + encodeURIComponent(String(product.id || ''));
            const pkg = getBestPackage(product);
            const priceText = pkg ? formatMoney(pkg.price || 0) : '';
            return [
                '<div class="package-card" style="text-align:left;">',
                '<div style="display:flex;gap:14px;align-items:flex-start;">',
                '<img src="' + String(product.image || 'productsimages/logo.jpg') + '" alt="" style="width:84px;height:84px;border-radius:16px;object-fit:cover;border:1px solid var(--border);" loading="lazy">',
                '<div style="flex:1;">',
                '<div class="package-title" style="margin:0;text-align:left;">' + String(product.title || product.id) + '</div>',
                '<div class="package-desc" style="margin-top:8px;margin-bottom:0;">' + String(product.description || '') + '</div>',
                '<div style="margin-top:10px;font-weight:900;color:var(--primary);font-size:1.25rem;">' + priceText + '</div>',
                '</div>',
                '</div>',
                '<div style="margin-top:14px;display:grid;gap:10px;">',
                '<button type="button" class="btn btn-outline" data-add-cart="' + String(product.id || '') + '" data-default-package="' + String(pkg && pkg.id ? pkg.id : '') + '" style="width:100%;">Add to Cart</button>',
                '<a class="btn btn-primary" href="' + href + '" style="width:100%;display:inline-flex;justify-content:center;">Buy Now</a>',
                '</div>',
                '</div>'
            ].join('');
        }).join('');

        grid.querySelectorAll('[data-add-cart]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const productId = String(btn.getAttribute('data-add-cart') || '').trim();
                const packageId = String(btn.getAttribute('data-default-package') || '').trim();
                if (!productId || !packageId) return;
                if (window.PMELAB_CART && typeof window.PMELAB_CART.addItem === 'function') {
                    window.PMELAB_CART.addItem(productId, packageId, 1);
                    if (typeof window.PMELAB_CART.open === 'function') {
                        window.PMELAB_CART.open();
                    }
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        initPageBranding();
        renderProducts();
        if (window.PMELAB_CART && typeof window.PMELAB_CART.init === 'function') {
            window.PMELAB_CART.init();
        }
    });
})();
