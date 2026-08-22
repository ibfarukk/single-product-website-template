(function() {
    'use strict';

    const KEY_V2 = 'multi_cart_v2';
    const KEY_V1 = 'multi_cart_v1';
    const uiState = { open: null, close: null };

    function safeJsonParse(value) {
        try {
            return JSON.parse(value);
        } catch (error) {
            return null;
        }
    }

    function loadRaw(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            return null;
        }
    }

    function saveRaw(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {}
    }

    function loadCart() {
        const rawV2 = loadRaw(KEY_V2);
        const parsedV2 = rawV2 ? safeJsonParse(rawV2) : null;
        if (Array.isArray(parsedV2)) return parsedV2;

        const rawV1 = loadRaw(KEY_V1);
        const parsedV1 = rawV1 ? safeJsonParse(rawV1) : null;
        if (Array.isArray(parsedV1)) {
            saveCart(parsedV1);
            return parsedV1;
        }
        return [];
    }

    function saveCart(cart) {
        const value = JSON.stringify(Array.isArray(cart) ? cart : []);
        saveRaw(KEY_V2, value);
    }

    function getKey(item) {
        return String(item.productId || '') + '::' + String(item.packageId || '');
    }

    function addItem(productId, packageId, qty) {
        const pid = String(productId || '').trim();
        const pkg = String(packageId || '').trim();
        const count = Number(qty || 0) || 1;
        if (!pid || !pkg) return;

        const cart = loadCart();
        const key = getKey({ productId: pid, packageId: pkg });
        const existing = cart.find(function(row) { return getKey(row) === key; });
        if (existing) {
            existing.qty = (Number(existing.qty || 0) || 0) + count;
        } else {
            cart.push({ productId: pid, packageId: pkg, qty: count });
        }
        saveCart(cart);
        notify();
    }

    function removeByKey(key) {
        const k = String(key || '');
        const cart = loadCart().filter(function(row) { return getKey(row) !== k; });
        saveCart(cart);
        notify();
    }

    function setQtyByKey(key, qty) {
        const k = String(key || '');
        const value = Number(qty || 0);
        const cart = loadCart();
        cart.forEach(function(row) {
            if (getKey(row) === k) {
                row.qty = value > 0 ? Math.floor(value) : 1;
            }
        });
        saveCart(cart);
        notify();
    }

    function clearCart() {
        saveCart([]);
        notify();
    }

    function getCount() {
        let total = 0;
        loadCart().forEach(function(row) {
            total += Number(row.qty || 0) || 0;
        });
        return total;
    }

    function getTotalAmount(mode) {
        if (mode !== 'multipleproducts') return 0;
        const cart = loadCart();
        let total = 0;
        cart.forEach(function(item) {
            const product = findProduct(mode, item.productId);
            const pkg = findPackage(product, item.packageId);
            if (!product || !pkg) return;
            const qty = Number(item.qty || 0) || 1;
            const unitPrice = Number(pkg.price || 0);
            const shippingPerUnit = Number(product.shippingFee || 0);
            total += (unitPrice + shippingPerUnit) * qty;
        });
        return total;
    }

    function findProduct(mode, productId) {
        const id = String(productId || '').trim();
        if (!id) return null;

        if (mode === 'multipleproducts') {
            if (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS)) {
                return PRODUCTS.find(function(p) { return p.id === id; }) || null;
            }
        }
        if (mode === 'affiliate') {
            if (typeof AFFILIATE_PRODUCTS !== 'undefined' && Array.isArray(AFFILIATE_PRODUCTS)) {
                return AFFILIATE_PRODUCTS.find(function(p) { return p.id === id; }) || null;
            }
        }
        return null;
    }

    function findPackage(product, packageId) {
        if (!product || !Array.isArray(product.packages)) return null;
        const pid = String(packageId || '').trim();
        return product.packages.find(function(p) { return p.id === pid; }) || null;
    }

    function formatMoney(amount) {
        const currency = (typeof BUSINESS !== 'undefined' && BUSINESS && BUSINESS.currency) ? BUSINESS.currency : '₦';
        const value = Number(amount || 0);
        return currency + value.toLocaleString('en-NG');
    }

    function getMode() {
        if (window.PMELAB_SITE && typeof window.PMELAB_SITE.getMode === 'function') {
            return window.PMELAB_SITE.getMode();
        }
        try {
            const raw = typeof WEBSITE_TYPE_SELECT !== 'undefined' ? String(WEBSITE_TYPE_SELECT) : 'singleproduct';
            const value = raw.trim().toLowerCase();
            if (value === 'multipleproducts') return 'multipleproducts';
            if (value === 'affiliate') return 'affiliate';
            return 'singleproduct';
        } catch (error) {
            return 'singleproduct';
        }
    }

    function ensureUi() {
        if (document.getElementById('floating-cart')) return;

        const button = document.createElement('button');
        button.id = 'floating-cart';
        button.type = 'button';
        button.setAttribute('aria-label', 'Open cart');
        button.innerHTML =
            '<span style="font-size:18px;line-height:1;">🛒</span>' +
            '<span id="floating-cart-total" style="font-weight:900;"></span>' +
            '<span id="floating-cart-count" style="font-weight:800;color:var(--muted);"></span>';
        button.className = 'floating-cart';

        const backdrop = document.createElement('div');
        backdrop.id = 'cart-backdrop';
        backdrop.className = 'cart-backdrop owner-hidden';

        const drawer = document.createElement('div');
        drawer.id = 'cart-drawer';
        drawer.className = 'cart-drawer owner-hidden';
        drawer.innerHTML =
            '<div class="cart-drawer-header">' +
            '<div style="display:grid;gap:2px;">' +
            '<div style="font-weight:900;font-size:16px;">Cart</div>' +
            '<div id="cart-drawer-subtitle" style="color:var(--muted);font-size:12px;"></div>' +
            '</div>' +
            '<button type="button" id="cart-drawer-close" class="btn btn-outline" style="padding:10px 12px;">Close</button>' +
            '</div>' +
            '<div id="cart-drawer-body" style="padding:14px;display:grid;gap:12px;"></div>' +
            '<div class="cart-drawer-footer">' +
            '<button type="button" id="cart-clear" class="btn btn-outline" style="width:100%;">Clear Cart</button>' +
            '<a id="cart-checkout-all" class="btn btn-primary" href="cart-checkout.html" style="margin-top:10px;width:100%;display:inline-flex;justify-content:center;">Checkout All</a>' +
            '</div>';

        document.body.appendChild(button);
        document.body.appendChild(backdrop);
        document.body.appendChild(drawer);

        function close() {
            backdrop.classList.add('owner-hidden');
            drawer.classList.add('owner-hidden');
            document.body.style.overflow = '';
        }

        function open() {
            renderDrawer();
            backdrop.classList.remove('owner-hidden');
            drawer.classList.remove('owner-hidden');
            document.body.style.overflow = 'hidden';
        }

        uiState.open = open;
        uiState.close = close;

        button.addEventListener('click', open);
        backdrop.addEventListener('click', close);
        const closeBtn = document.getElementById('cart-drawer-close');
        if (closeBtn) closeBtn.addEventListener('click', close);
        const clearBtn = document.getElementById('cart-clear');
        if (clearBtn) clearBtn.addEventListener('click', function() {
            clearCart();
            renderDrawer();
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') close();
        });
    }

    function renderDrawer() {
        const mode = getMode();
        const buttonTotal = document.getElementById('floating-cart-total');
        const buttonCount = document.getElementById('floating-cart-count');
        const count = getCount();
        const totalAmount = getTotalAmount(mode);
        if (buttonTotal) buttonTotal.textContent = totalAmount ? formatMoney(totalAmount) : formatMoney(0);
        if (buttonCount) buttonCount.textContent = count ? ' (' + count + ')' : '';

        const body = document.getElementById('cart-drawer-body');
        if (!body) return;

        if (mode !== 'multipleproducts') {
            body.innerHTML = '<div style="color:var(--muted);line-height:1.6;">Cart is available for store purchases only.</div>';
            const footer = document.querySelector('.cart-drawer-footer');
            if (footer) footer.style.display = 'none';
            const subtitle = document.getElementById('cart-drawer-subtitle');
            if (subtitle) subtitle.textContent = '';
            return;
        }

        const footer = document.querySelector('.cart-drawer-footer');
        if (footer) footer.style.display = '';
        const checkoutAll = document.getElementById('cart-checkout-all');

        const cart = loadCart();
        if (!cart.length) {
            body.innerHTML = '<div style="color:var(--muted);">Your cart is empty.</div>';
            if (checkoutAll) checkoutAll.style.display = 'none';
            const subtitle = document.getElementById('cart-drawer-subtitle');
            if (subtitle) subtitle.textContent = '';
            return;
        }

        if (checkoutAll) checkoutAll.style.display = '';
        const subtitle = document.getElementById('cart-drawer-subtitle');
        if (subtitle) subtitle.textContent = count + ' item(s) • ' + formatMoney(totalAmount);

        body.innerHTML = cart.map(function(item) {
            const product = findProduct(mode, item.productId);
            const pkg = findPackage(product, item.packageId);
            const key = getKey(item);
            const qty = Number(item.qty || 0) || 1;
            const unitPrice = Number(pkg && pkg.price ? pkg.price : 0);
            const shippingPerUnit = Number(product && product.shippingFee ? product.shippingFee : 0);
            const total = (unitPrice + shippingPerUnit) * qty;

            const title = product ? String(product.title || product.id) : String(item.productId || '');
            const variant = pkg ? String(pkg.title || pkg.id) : String(item.packageId || '');
            const checkoutHref = 'checkout.html?id=' + encodeURIComponent(String(item.productId || '')) +
                '&package=' + encodeURIComponent(String(item.packageId || '')) +
                '&qty=' + encodeURIComponent(String(qty));

            return '' +
                '<div style="border:1px solid var(--border);border-radius:16px;padding:12px;background:#fff;display:grid;gap:10px;">' +
                '<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">' +
                '<div>' +
                '<div style="font-weight:900;">' + title + '</div>' +
                '<div style="color:var(--muted);font-size:13px;line-height:1.6;">' + variant + '</div>' +
                '</div>' +
                '<button type="button" data-cart-remove="' + key + '" class="btn btn-outline" style="padding:10px 12px;">Remove</button>' +
                '</div>' +
                '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;">' +
                '<div>' +
                '<label style="display:block;color:var(--muted);font-size:12px;margin-bottom:6px;">Qty</label>' +
                '<input type="number" min="1" value="' + String(qty) + '" data-cart-qty="' + key + '" style="width:110px;">' +
                '</div>' +
                '<div style="text-align:right;">' +
                '<div style="font-weight:900;">' + formatMoney(total) + '</div>' +
                '<a class="btn btn-outline" href="' + checkoutHref + '" style="margin-top:8px;display:inline-flex;justify-content:center;">Checkout item</a>' +
                '</div>' +
                '</div>' +
                '</div>';
        }).join('');

        body.querySelectorAll('[data-cart-remove]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const key = String(btn.getAttribute('data-cart-remove') || '');
                removeByKey(key);
                renderDrawer();
            });
        });

        body.querySelectorAll('[data-cart-qty]').forEach(function(input) {
            input.addEventListener('change', function() {
                const key = String(input.getAttribute('data-cart-qty') || '');
                setQtyByKey(key, input.value);
                renderDrawer();
            });
        });
    }

    function notify() {
        try {
            window.dispatchEvent(new CustomEvent('pmelab:cart_updated', { detail: { count: getCount() } }));
        } catch (error) {}
    }

    function init() {
        ensureUi();
        renderDrawer();
        window.addEventListener('pmelab:cart_updated', renderDrawer);
        window.addEventListener('storage', function(e) {
            if (e && (e.key === KEY_V2 || e.key === KEY_V1)) renderDrawer();
        });
    }

    window.PMELAB_CART = {
        init: init,
        load: loadCart,
        addItem: addItem,
        clear: clearCart,
        count: getCount,
        open: function() {
            ensureUi();
            if (uiState.open) uiState.open();
        }
    };
})();
