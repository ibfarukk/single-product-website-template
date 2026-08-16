/* =========================================================
   PMELAB PRODUCT TEMPLATE — CHECKOUT & PAYMENT
   ========================================================= */

(function() {
    'use strict';

    let selectedPaymentMethod = 'paystack';

    function isDigitalProduct() {
        return String(typeof PRODUCT_TYPE !== 'undefined' ? PRODUCT_TYPE : 'physical').toLowerCase() === 'digital';
    }

    function getPaymentSettings() {
        return {
            paystackEnabled: PAYMENT.paystackEnabled !== false,
            manualEnabled: PAYMENT.manualEnabled !== false && PAYMENT.manualPaymentEnabled !== false,
            manualReceiptRequired: PAYMENT.manualReceiptRequired !== false
        };
    }

    // =========================================================
    // FORM VALIDATION
    // =========================================================
    function validateField(field) {
        const value = field.type === 'file' ? field.files : field.value.trim();
        const name = field.name;
        let isValid = true;
        let message = '';

        field.classList.remove('error');
        const errorEl = field.parentElement.querySelector('.error-message');
        if (errorEl) errorEl.classList.remove('visible');

        if (field.hasAttribute('required') && field.type === 'file' && (!value || !value.length)) {
            isValid = false;
            message = 'Please attach your payment receipt';
        } else if (field.hasAttribute('required') && !value) {
            isValid = false;
            message = 'This field is required';
        } else if (field.type === 'file' && value && value.length) {
            const file = value[0];
            const maxFileSize = 5 * 1024 * 1024;

            if (file.size > maxFileSize) {
                isValid = false;
                message = 'Receipt must be 5MB or less';
            }
        } else if (value) {
            switch (name) {
                case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        isValid = false;
                        message = 'Please enter a valid email address';
                    }
                    break;
                case 'phone':
                    const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,20}$/;
                    if (!phoneRegex.test(value)) {
                        isValid = false;
                        message = 'Please enter a valid phone number';
                    }
                    break;
                case 'fullName':
                    if (value.length < 2) {
                        isValid = false;
                        message = 'Please enter your full name';
                    }
                    break;
                case 'address':
                    if (value.length < 5) {
                        isValid = false;
                        message = 'Please enter a complete address';
                    }
                    break;
            }
        }

        if (!isValid) {
            field.classList.add('error');
            if (errorEl) {
                errorEl.textContent = message;
                errorEl.classList.add('visible');
            }
        }

        return isValid;
    }

    function validateForm() {
        const form = document.getElementById('checkout-form');
        const requiredFields = form.querySelectorAll('[required]:not([disabled])');
        let isValid = true;

        requiredFields.forEach(function(field) {
            if (!validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    // =========================================================
    // PAYMENT METHOD SELECTION
    // =========================================================
    function initPaymentMethods() {
        const methods = document.querySelectorAll('.payment-method');
        const manualInfo = document.querySelector('.manual-payment-info');
        const manualReceiptGroup = document.getElementById('manual-receipt-group');
        const manualReceiptInput = document.getElementById('paymentReceipt');
        const paymentSettings = getPaymentSettings();

        methods.forEach(function(method) {
            method.addEventListener('click', function() {
                const radio = this.querySelector('input[type="radio"]');
                radio.checked = true;
                selectedPaymentMethod = radio.value;

                methods.forEach(function(m) { m.classList.remove('selected'); });
                this.classList.add('selected');

                if (selectedPaymentMethod === 'manual' && manualInfo) {
                    manualInfo.classList.add('visible');
                    if (manualReceiptGroup) manualReceiptGroup.style.display = 'block';
                    if (manualReceiptInput && paymentSettings.manualReceiptRequired) {
                        manualReceiptInput.setAttribute('required', 'required');
                    }
                } else if (manualInfo) {
                    manualInfo.classList.remove('visible');
                    if (manualReceiptGroup) manualReceiptGroup.style.display = 'none';
                    if (manualReceiptInput) {
                        manualReceiptInput.removeAttribute('required');
                        manualReceiptInput.classList.remove('error');
                        manualReceiptInput.value = '';
                        const errorEl = manualReceiptInput.parentElement.querySelector('.error-message');
                        if (errorEl) errorEl.classList.remove('visible');
                    }
                }

                trackEvent('select_payment_method', { method: selectedPaymentMethod });
            });
        });
    }

    // =========================================================
    // RENDER MANUAL PAYMENT INFO
    // =========================================================
    function renderManualPaymentInfo() {
        const container = document.querySelector('.manual-payment-info');
        if (!container) return;

        if (!MANUAL_PAYMENT.enabled) {
            container.style.display = 'none';
            return;
        }

        container.innerHTML = 
            '<p><strong>Bank:</strong> ' + escapeHtml(MANUAL_PAYMENT.bankName) + '</p>' +
            '<p><strong>Account Name:</strong> ' + escapeHtml(MANUAL_PAYMENT.accountName) + '</p>' +
            '<p><strong>Account Number:</strong> ' + escapeHtml(MANUAL_PAYMENT.accountNumber) + '</p>' +
            '<p style="margin-top:12px">' + escapeHtml(MANUAL_PAYMENT.instructions) + '</p>' +
            '<p style="margin-top:8px;font-size:0.85rem;color:var(--muted)">' + escapeHtml(MANUAL_PAYMENT.paymentDeadline) + '</p>';
    }

    function updateProductTypeFields() {
        const digitalProduct = isDigitalProduct();
        const title = document.getElementById('customer-info-title');
        const addressWrapper = document.querySelector('[data-delivery-field="address"]');
        const locationWrapper = document.querySelector('[data-delivery-field="location"]');
        const addressField = document.getElementById('address');
        const stateField = document.getElementById('state');
        const cityField = document.getElementById('city');

        if (title) {
            title.textContent = digitalProduct ? 'Customer Information' : 'Delivery Information';
        }

        if (addressWrapper) {
            addressWrapper.style.display = digitalProduct ? 'none' : 'block';
        }

        if (locationWrapper) {
            locationWrapper.style.display = digitalProduct ? 'none' : 'grid';
        }

        if (addressField) {
            if (digitalProduct) {
                addressField.removeAttribute('required');
                addressField.value = '';
                addressField.classList.remove('error');
                const errorEl = addressField.parentElement.querySelector('.error-message');
                if (errorEl) errorEl.classList.remove('visible');
            } else {
                addressField.setAttribute('required', 'required');
            }
        }

        if (digitalProduct) {
            if (stateField) stateField.value = '';
            if (cityField) cityField.value = '';
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function sendOwnerTracking(endpoint, payload) {
        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload || {})
        }).catch(function() {});
    }

    // =========================================================
    // PAYSTACK PAYMENT
    // =========================================================
    function initPaystackPayment() {
        const form = document.getElementById('checkout-form');
        if (!form) return;

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            if (!validateForm()) {
                // Scroll to first error
                const firstError = form.querySelector('.error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstError.focus();
                }
                return;
            }

            const pkg = window.selectedPackage || PACKAGES[0];
            const formData = new FormData(form);
            const customerInfo = {
                name: formData.get('fullName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                address: isDigitalProduct() ? '' : (formData.get('address') || ''),
                state: isDigitalProduct() ? '' : (formData.get('state') || ''),
                city: isDigitalProduct() ? '' : (formData.get('city') || ''),
                specialRequest: formData.get('specialRequest') || ''
            };
            const receiptFile = formData.get('paymentReceipt');

            if (selectedPaymentMethod === 'paystack') {
                processPaystackPayment(pkg, customerInfo);
            } else {
                processManualPayment(pkg, customerInfo, receiptFile && receiptFile.size ? receiptFile : null);
            }
        });
    }

    function processPaystackPayment(pkg, customerInfo) {
        if (!getPaymentSettings().paystackEnabled || !PAYMENT.paystackPublicKey || PAYMENT.paystackPublicKey === 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
            alert('Online payment is not configured yet. Please use manual payment or WhatsApp.');
            return;
        }

        trackEvent('begin_checkout', {
            currency: BUSINESS.currencyCode,
            value: pkg.price,
            items: [{ item_name: PRODUCT.name, quantity: pkg.quantity }]
        });

        trackEvent('click_buy_now', { package_id: pkg.id });
        trackEvent('paystack_payment_started', { package_id: pkg.id, amount: pkg.price });
        const orderRef = generateOrderRef();

        sendOwnerTracking('/api/track-order-attempt', {
            reason: 'paystack_started',
            orderRef: orderRef,
            packageId: pkg.id,
            amount: pkg.price,
            currency: BUSINESS.currencyCode,
            customer: customerInfo
        });

        const handler = PaystackPop.setup({
            key: PAYMENT.paystackPublicKey,
            email: customerInfo.email,
            amount: pkg.price * 100, // Paystack uses kobo
            currency: BUSINESS.currencyCode,
            ref: orderRef,
            metadata: {
                custom_fields: [
                    { display_name: "Full Name", variable_name: "full_name", value: customerInfo.name },
                    { display_name: "Phone", variable_name: "phone", value: customerInfo.phone },
                    { display_name: "Address", variable_name: "address", value: customerInfo.address || 'Not required for digital product' },
                    { display_name: "Package", variable_name: "package", value: pkg.id },
                    { display_name: "Quantity", variable_name: "quantity", value: pkg.quantity }
                ]
            },
            callback: function(response) {
                trackEvent('paystack_payment_success', { reference: response.reference });
                verifyPayment(response.reference, pkg, customerInfo);
            },
            onClose: function() {
                trackEvent('paystack_payment_failed', { reason: 'closed' });
                sendOwnerTracking('/api/track-order-attempt', {
                    reason: 'paystack_closed',
                    orderRef: orderRef,
                    packageId: pkg.id,
                    amount: pkg.price,
                    currency: BUSINESS.currencyCode,
                    customer: customerInfo
                });
            }
        });

        handler.openIframe();
    }

    function verifyPayment(reference, pkg, customerInfo) {
        // Show loading state
        const submitBtn = document.querySelector('#checkout-form button[type="submit"]');
        const originalText = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/></svg> Processing...';
        }

        // Call Cloudflare Worker to verify
        fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reference: reference,
                package_id: pkg.id,
                expected_amount: pkg.price,
                currency: BUSINESS.currencyCode,
                customer: customerInfo
            })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.success) {
                window.location.href = 'success.html?ref=' + encodeURIComponent(reference) + '&pkg=' + encodeURIComponent(pkg.id);
            } else {
                window.location.href = 'payment-failed.html?ref=' + encodeURIComponent(reference);
            }
        })
        .catch(function(err) {
            console.error('Payment verification error:', err);
            // Even if verification fails, redirect to success if Paystack says it succeeded
            // The webhook will handle it server-side
            window.location.href = 'success.html?ref=' + encodeURIComponent(reference) + '&pkg=' + encodeURIComponent(pkg.id);
        })
        .finally(function() {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // =========================================================
    // MANUAL PAYMENT
    // =========================================================
    function processManualPayment(pkg, customerInfo, receiptFile) {
        trackEvent('manual_payment_order', {
            package_id: pkg.id,
            amount: pkg.price
        });

        const orderData = {
            package_id: pkg.id,
            customer: customerInfo,
            product: PRODUCT.name,
            package_title: pkg.title,
            quantity: pkg.quantity,
            amount: pkg.price,
            currency: BUSINESS.currencyCode,
            payment_method: 'manual',
            order_ref: generateOrderRef(),
            product_type: isDigitalProduct() ? 'digital' : 'physical'
        };

        const formData = new FormData();
        formData.append('package_id', orderData.package_id);
        formData.append('product', orderData.product);
        formData.append('package_title', orderData.package_title);
        formData.append('quantity', String(orderData.quantity));
        formData.append('amount', String(orderData.amount));
        formData.append('currency', orderData.currency);
        formData.append('payment_method', orderData.payment_method);
        formData.append('order_ref', orderData.order_ref);
        formData.append('product_type', orderData.product_type);
        formData.append('customer_name', orderData.customer.name || '');
        formData.append('customer_email', orderData.customer.email || '');
        formData.append('customer_phone', orderData.customer.phone || '');
        formData.append('customer_address', orderData.customer.address || '');
        formData.append('customer_state', orderData.customer.state || '');
        formData.append('customer_city', orderData.customer.city || '');
        formData.append('customer_special_request', orderData.customer.specialRequest || '');

        if (receiptFile) {
            formData.append('payment_receipt', receiptFile, receiptFile.name);
        }

        // Send to Cloudflare Worker
        fetch('/api/manual-order', {
            method: 'POST',
            body: formData
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.success) {
                window.location.href = 'success.html?ref=' + encodeURIComponent(orderData.order_ref) + '&pkg=' + encodeURIComponent(pkg.id) + '&manual=1';
            } else {
                alert('There was an error submitting your order. Please try again or order via WhatsApp.');
            }
        })
        .catch(function(err) {
            console.error('Manual order error:', err);
            // Still redirect to success page - the worker webhook may have issues
            // but we don't want to lose the customer
            alert('Your order has been received. Please complete your bank transfer and send proof via WhatsApp.');
            window.location.href = 'success.html?ref=' + encodeURIComponent(orderData.order_ref) + '&pkg=' + encodeURIComponent(pkg.id) + '&manual=1';
        });
    }

    // =========================================================
    // GENERATE ORDER REFERENCE
    // =========================================================
    function generateOrderRef() {
        const prefix = BUSINESS.shortName.substring(0, 6).toUpperCase();
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return prefix + '-' + timestamp + random;
    }

    // =========================================================
    // REAL-TIME FORM VALIDATION
    // =========================================================
    function initRealTimeValidation() {
        const form = document.getElementById('checkout-form');
        if (!form) return;

        form.querySelectorAll('input, textarea, select').forEach(function(field) {
            field.addEventListener('blur', function() {
                validateField(this);
            });

            field.addEventListener('input', function() {
                if (this.classList.contains('error')) {
                    validateField(this);
                }
            });

            if (field.type === 'file') {
                field.addEventListener('change', function() {
                    validateField(this);
                });
            }
        });
    }

    // =========================================================
    // INITIALIZE
    // =========================================================
    document.addEventListener('DOMContentLoaded', function() {
        const paymentSettings = getPaymentSettings();

        updateProductTypeFields();
        initPaymentMethods();
        initPaystackPayment();
        initRealTimeValidation();
        renderManualPaymentInfo();

        // Hide payment methods if disabled
        if (!paymentSettings.paystackEnabled) {
            const paystackMethod = document.querySelector('[data-payment="paystack"]');
            if (paystackMethod) paystackMethod.style.display = 'none';
        }

        if (!paymentSettings.manualEnabled || !MANUAL_PAYMENT.enabled) {
            const manualMethod = document.querySelector('[data-payment="manual"]');
            if (manualMethod) manualMethod.style.display = 'none';
        }

        // If only one payment method, select it by default
        const visibleMethods = document.querySelectorAll('.payment-method:not([style*="display: none"])');
        if (visibleMethods.length === 1) {
            visibleMethods[0].click();
        }
    });
})();
