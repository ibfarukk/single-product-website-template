(function() {
    'use strict';

    function $(id) {
        return document.getElementById(id);
    }

    function getMode() {
        if (window.PMELAB_SITE && typeof window.PMELAB_SITE.getMode === 'function') {
            return window.PMELAB_SITE.getMode();
        }
        try {
            const raw = typeof WEBSITE_TYPE_SELECT !== 'undefined' ? String(WEBSITE_TYPE_SELECT) : 'singleproduct';
            return raw.trim().toLowerCase();
        } catch (error) {
            return 'singleproduct';
        }
    }

    function getHomeHref(mode) {
        if (mode === 'multipleproducts') return 'multiple.html';
        if (mode === 'affiliate') return 'affiliate.html';
        return 'index.html';
    }

    function updateProductsLinks(mode) {
        const href = getHomeHref(mode);
        document.querySelectorAll('[data-nav-products]').forEach(function(a) {
            a.setAttribute('href', href);
        });
    }

    function injectCssVariables() {
        if (typeof BRAND === 'undefined' || !BRAND) return;
        const root = document.documentElement;
        root.style.setProperty('--primary', BRAND.primaryColor);
        root.style.setProperty('--primary-dark', BRAND.primaryDark);
        root.style.setProperty('--primary-light', BRAND.primaryLight);
        root.style.setProperty('--background', BRAND.backgroundColor);
        root.style.setProperty('--surface', BRAND.lightBackground);
        root.style.setProperty('--text', BRAND.textColor);
        root.style.setProperty('--muted', BRAND.mutedTextColor);
        root.style.setProperty('--border', BRAND.borderColor);
    }

    function initMobileMenu() {
        const btn = document.querySelector('.mobile-menu-btn');
        const nav = document.querySelector('.mobile-nav');
        if (!btn || !nav) return;
        btn.addEventListener('click', function() {
            btn.classList.toggle('active');
            nav.classList.toggle('active');
            document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
        });
        nav.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                btn.classList.remove('active');
                nav.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    function showError(message) {
        const el = $('cart-checkout-error');
        if (!el) return;
        el.textContent = message || '';
        el.classList.toggle('owner-hidden', !message);
    }

    function formatMoney(amount) {
        const currency = (typeof BUSINESS !== 'undefined' && BUSINESS && BUSINESS.currency) ? BUSINESS.currency : '₦';
        const value = Number(amount || 0);
        return currency + value.toLocaleString('en-NG');
    }

    function getApiUrl(path) {
        const cleanPath = path.startsWith('/') ? path : '/' + path;
        const base = typeof API_BASE_URL !== 'undefined' ? String(API_BASE_URL).trim() : '';
        if (!base) return cleanPath;
        return base.replace(/\/+$/, '') + cleanPath;
    }

    function generateOrderRef() {
        const prefix = String((BUSINESS && BUSINESS.shortName) ? BUSINESS.shortName : 'ORDER').substring(0, 6).toUpperCase().replace(/\s+/g, '');
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return prefix + '-' + timestamp + random;
    }

    function normalizeProducts() {
        if (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS)) return PRODUCTS;
        return [];
    }

    function findProduct(productId) {
        const id = String(productId || '').trim();
        return normalizeProducts().find(function(p) { return p.id === id; }) || null;
    }

    function findPackage(product, packageId) {
        if (!product || !Array.isArray(product.packages)) return null;
        const pid = String(packageId || '').trim();
        return product.packages.find(function(p) { return p.id === pid; }) || null;
    }

    function computeTotals(product, pkg, qty) {
        const quantity = Number(qty || 0) || 1;
        const base = Number(pkg && pkg.price ? pkg.price : 0) * quantity;
        const shippingPerUnit = Number(product && product.shippingFee ? product.shippingFee : 0);
        const shipping = shippingPerUnit * quantity;
        return { base: base, shipping: shipping, total: base + shipping };
    }

    function computeCartTotals(cart) {
        const rows = Array.isArray(cart) ? cart : [];
        let base = 0;
        let shipping = 0;
        let totalQty = 0;
        let hasPhysical = false;
        const lineItems = [];

        rows.forEach(function(row) {
            const product = findProduct(row.productId);
            const pkg = findPackage(product, row.packageId);
            if (!product || !pkg) return;
            const qty = Number(row.qty || 0) || 1;
            const totals = computeTotals(product, pkg, qty);
            base += totals.base;
            shipping += totals.shipping;
            totalQty += qty;
            if (String(product.productType || '').toLowerCase() !== 'digital') hasPhysical = true;
            lineItems.push({ product: product, pkg: pkg, qty: qty, totals: totals });
        });

        return { base: base, shipping: shipping, total: base + shipping, totalQty: totalQty, hasPhysical: hasPhysical, lines: lineItems };
    }

    function toggleManual(show) {
        const manualBox = $('cart-manual-details');
        if (manualBox) manualBox.classList.toggle('owner-hidden', !show);
    }

    function renderManualDetails() {
        if (typeof MANUAL_PAYMENT === 'undefined') return;
        const bank = $('cart-manual-bank');
        const name = $('cart-manual-account-name');
        const number = $('cart-manual-account-number');
        const deadline = $('cart-manual-deadline');

        if (bank) bank.textContent = MANUAL_PAYMENT.bankName || '';
        if (name) name.textContent = MANUAL_PAYMENT.accountName || '';
        if (number) number.textContent = MANUAL_PAYMENT.accountNumber || '';
        if (deadline) deadline.textContent = MANUAL_PAYMENT.paymentDeadline || '';
    }

    function getSelectedPaymentMethod(form) {
        const selectedRadio = form.querySelector('input[name="payment_method"]:checked');
        return selectedRadio ? String(selectedRadio.value || '').trim() : 'paystack';
    }

    function getCustomerInfo() {
        return {
            name: String(($('cart-name').value || '')).trim(),
            email: String(($('cart-email').value || '')).trim(),
            phone: String(($('cart-phone').value || '')).trim(),
            address: String(($('cart-address').value || '')).trim(),
            state: String(($('cart-state').value || '')).trim(),
            city: String(($('cart-city').value || '')).trim(),
            specialRequest: String(($('cart-special').value || '')).trim()
        };
    }

    function setAddressRequired(isRequired) {
        const addressGroup = $('cart-address-group');
        const locationRow = $('cart-location-row');
        const addressInput = $('cart-address');
        if (addressGroup) addressGroup.style.display = isRequired ? '' : 'none';
        if (locationRow) locationRow.style.display = isRequired ? '' : 'none';
        if (addressInput) addressInput.required = isRequired;
    }

    function setSubmitting(submitting) {
        const btn = $('cart-checkout-submit');
        if (!btn) return;
        btn.disabled = submitting;
        btn.textContent = submitting ? 'PROCESSING...' : 'PAY NOW';
    }

    async function verifyPayment(payload) {
        const res = await fetch(getApiUrl('/api/verify-payment'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json().catch(function() { return {}; });
        if (!res.ok || !data.success) {
            throw new Error(data.error || 'Payment verification failed');
        }
        return data;
    }

    async function submitManualOrder(payload, receiptFile) {
        const formData = new FormData();
        formData.append('order_ref', String(payload.order_ref || ''));
        formData.append('payment_method', 'manual');
        formData.append('currency', String(payload.currency || ''));
        formData.append('items', JSON.stringify(payload.items || []));
        formData.append('product', 'Cart order');
        formData.append('package_id', 'cart');
        formData.append('package_title', 'Cart');

        const customer = payload.customer || {};
        formData.append('customer_name', String(customer.name || ''));
        formData.append('customer_email', String(customer.email || ''));
        formData.append('customer_phone', String(customer.phone || ''));
        formData.append('customer_address', String(customer.address || ''));
        formData.append('customer_state', String(customer.state || ''));
        formData.append('customer_city', String(customer.city || ''));
        formData.append('customer_special_request', String(customer.specialRequest || ''));

        if (receiptFile) {
            formData.append('payment_receipt', receiptFile, receiptFile.name);
        }

        const res = await fetch(getApiUrl('/api/manual-order'), {
            method: 'POST',
            body: formData
        });
        const data = await res.json().catch(function() { return {}; });
        if (!res.ok || !data.success) {
            throw new Error(data.error || 'Manual order submission failed');
        }
        return data;
    }

    function renderSummary(cartTotals) {
        const linesEl = $('cart-summary-lines');
        if (linesEl) {
            linesEl.innerHTML = cartTotals.lines.map(function(line) {
                return '<div style="border:1px solid var(--border);border-radius:14px;padding:12px;background:#fff;">' +
                    '<div style="font-weight:900;margin-bottom:6px;">' + String(line.product.title || line.product.id) + '</div>' +
                    '<div style="color:var(--muted);font-size:13px;line-height:1.6;">' +
                    'Package: ' + String(line.pkg.title || line.pkg.id) + '<br>' +
                    'Qty: ' + String(line.qty) + '<br>' +
                    'Line total: ' + formatMoney(line.totals.total) +
                    '</div>' +
                    '</div>';
            }).join('');
        }

        $('cart-summary-subtotal').textContent = formatMoney(cartTotals.base);
        $('cart-summary-shipping').textContent = formatMoney(cartTotals.shipping);
        $('cart-summary-total').textContent = formatMoney(cartTotals.total);
    }

    function initCheckout(cart, cartTotals) {
        const form = $('cart-checkout-form');
        if (!form) return;

        setAddressRequired(cartTotals.hasPhysical);
        toggleManual(false);
        renderManualDetails();

        form.addEventListener('change', function(e) {
            if (e.target && e.target.name === 'payment_method') {
                toggleManual(getSelectedPaymentMethod(form) === 'manual');
            }
        });

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            showError('');

            if (!cart.length) {
                showError('Your cart is empty.');
                return;
            }

            const customer = getCustomerInfo();
            if (!customer.name || !customer.email || !customer.phone) {
                showError('Please fill your name, email, and phone.');
                return;
            }
            if (cartTotals.hasPhysical && !customer.address) {
                showError('Please enter your delivery address.');
                return;
            }

            const method = getSelectedPaymentMethod(form);
            const orderRef = generateOrderRef();
            const currency = (typeof PAYMENT !== 'undefined' && PAYMENT && PAYMENT.currency) ? PAYMENT.currency : (BUSINESS.currencyCode || 'NGN');

            const payload = {
                order_ref: orderRef,
                customer: customer,
                currency: currency,
                items: cart.map(function(row) {
                    return { productId: row.productId, packageId: row.packageId, qty: row.qty };
                })
            };

            if (method === 'manual') {
                const receiptInput = $('cart-receipt');
                const receipt = receiptInput && receiptInput.files && receiptInput.files[0] ? receiptInput.files[0] : null;
                if (typeof PAYMENT !== 'undefined' && PAYMENT && PAYMENT.manualReceiptRequired && !receipt) {
                    showError('Please upload payment receipt.');
                    return;
                }

                setSubmitting(true);
                submitManualOrder(payload, receipt)
                    .then(function() {
                        if (window.PMELAB_CART && typeof window.PMELAB_CART.clear === 'function') {
                            window.PMELAB_CART.clear();
                        }
                        window.location.href = 'success.html?ref=' + encodeURIComponent(orderRef);
                    })
                    .catch(function(error) {
                        showError(error && error.message ? error.message : 'Manual order submission failed.');
                    })
                    .finally(function() {
                        setSubmitting(false);
                    });
                return;
            }

            if (typeof PAYMENT === 'undefined' || !PAYMENT || !PAYMENT.paystackEnabled) {
                showError('Online payment is disabled.');
                return;
            }

            if (!PAYMENT.paystackPublicKey) {
                showError('Paystack key not configured.');
                return;
            }

            setSubmitting(true);

            const handler = PaystackPop.setup({
                key: PAYMENT.paystackPublicKey,
                email: customer.email,
                amount: Math.round(Number(cartTotals.total || 0) * 100),
                currency: PAYMENT.currency || 'NGN',
                ref: orderRef,
                metadata: {
                    custom_fields: [
                        { display_name: 'Customer Name', variable_name: 'customer_name', value: customer.name },
                        { display_name: 'Phone', variable_name: 'customer_phone', value: customer.phone }
                    ]
                },
                callback: function(response) {
                    verifyPayment(Object.assign({}, payload, { reference: response.reference }))
                        .then(function() {
                            if (window.PMELAB_CART && typeof window.PMELAB_CART.clear === 'function') {
                                window.PMELAB_CART.clear();
                            }
                            window.location.href = 'success.html?ref=' + encodeURIComponent(response.reference);
                        })
                        .catch(function(error) {
                            window.location.href = 'payment-failed.html?ref=' + encodeURIComponent(response.reference) + '&reason=' + encodeURIComponent(error && error.message ? error.message : 'Payment verification failed');
                        })
                        .finally(function() {
                            setSubmitting(false);
                        });
                },
                onClose: function() {
                    setSubmitting(false);
                    showError('Payment window closed.');
                }
            });

            handler.openIframe();
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        initMobileMenu();
        showError('');

        const loader = window.PMELAB_SITE && typeof window.PMELAB_SITE.ensureConfigLoaded === 'function'
            ? window.PMELAB_SITE.ensureConfigLoaded()
            : Promise.resolve();

        loader.then(function() {
            injectCssVariables();
            const mode = getMode();
            updateProductsLinks(mode);

            if (mode !== 'multipleproducts') {
                window.location.replace(getHomeHref(mode));
                return;
            }

            if (!window.PMELAB_CART || typeof window.PMELAB_CART.load !== 'function') {
                showError('Cart is not available.');
                return;
            }

            const cart = window.PMELAB_CART.load();
            if (!cart.length) {
                showError('Your cart is empty.');
                return;
            }

            const cartTotals = computeCartTotals(cart);
            if (!cartTotals.lines.length) {
                showError('Some cart items are invalid. Please clear cart and add items again.');
                return;
            }

            renderSummary(cartTotals);
            initCheckout(cart, cartTotals);

            if (window.PMELAB_CART && typeof window.PMELAB_CART.init === 'function') {
                window.PMELAB_CART.init();
            }
        }).catch(function() {
            showError('Failed to load site configuration.');
        });
    });
})();

