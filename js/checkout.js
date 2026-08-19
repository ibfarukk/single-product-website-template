/* =========================================================
   PMELAB PRODUCT TEMPLATE — CHECKOUT & PAYMENT
   ========================================================= */

(function() {
    'use strict';

    let selectedPaymentMethod = 'paystack';
    let checkoutModal = null;

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

    function getApiUrl(path) {
        const cleanPath = path.startsWith('/') ? path : '/' + path;
        const base = typeof API_BASE_URL !== 'undefined' ? String(API_BASE_URL).trim() : '';
        if (!base) return cleanPath;
        return base.replace(/\/+$/, '') + cleanPath;
    }

    function sendOwnerTracking(endpoint, payload) {
        fetch(getApiUrl(endpoint), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload || {})
        }).catch(function() {});
    }

    function ensureCheckoutModal() {
        if (checkoutModal) return checkoutModal;

        const modal = document.createElement('div');
        modal.className = 'checkout-modal-overlay';
        modal.innerHTML = [
            '<div class="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-modal-title">',
            '<button type="button" class="checkout-modal-close" aria-label="Close modal">&times;</button>',
            '<div class="checkout-modal-badge">',
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">',
            '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>',
            '</svg>',
            '</div>',
            '<h3 id="checkout-modal-title" class="checkout-modal-title"></h3>',
            '<p class="checkout-modal-message"></p>',
            '<div class="checkout-modal-actions">',
            '<button type="button" class="btn btn-primary checkout-modal-confirm">OK</button>',
            '</div>',
            '</div>'
        ].join('');

        const style = document.createElement('style');
        style.textContent = [
            '.checkout-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;z-index:9999;opacity:0;pointer-events:none;transition:opacity .2s ease;}',
            '.checkout-modal-overlay.visible{opacity:1;pointer-events:auto;}',
            '.checkout-modal{position:relative;width:100%;max-width:460px;background:#fff;border:1px solid rgba(229,231,235,1);border-radius:24px;box-shadow:0 30px 80px rgba(15,23,42,.22);padding:28px 24px 24px;text-align:left;transform:translateY(12px);transition:transform .2s ease;}',
            '.checkout-modal-overlay.visible .checkout-modal{transform:translateY(0);}',
            '.checkout-modal-close{position:absolute;top:14px;right:14px;width:36px;height:36px;border:none;border-radius:50%;background:#f8fafc;color:#64748b;font-size:1.5rem;cursor:pointer;line-height:1;}',
            '.checkout-modal-badge{width:52px;height:52px;border-radius:16px;background:rgba(22,163,74,.12);color:var(--primary);display:flex;align-items:center;justify-content:center;margin-bottom:18px;}',
            '.checkout-modal-title{font-size:1.2rem;font-weight:800;color:var(--text);margin-bottom:10px;}',
            '.checkout-modal-message{color:var(--muted);line-height:1.65;margin-bottom:24px;}',
            '.checkout-modal-actions{display:flex;justify-content:flex-end;}',
            '.checkout-modal-confirm{min-width:110px;justify-content:center;}'
        ].join('');

        document.head.appendChild(style);
        document.body.appendChild(modal);

        modal.querySelector('.checkout-modal-close').addEventListener('click', hideCheckoutModal);
        modal.querySelector('.checkout-modal-confirm').addEventListener('click', hideCheckoutModal);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) hideCheckoutModal();
        });

        checkoutModal = modal;
        return modal;
    }

    function showCheckoutModal(title, message) {
        const modal = ensureCheckoutModal();
        modal.querySelector('.checkout-modal-title').textContent = title;
        modal.querySelector('.checkout-modal-message').textContent = message;
        modal.classList.add('visible');
    }

    function hideCheckoutModal() {
        if (checkoutModal) {
            checkoutModal.classList.remove('visible');
        }
    }

    function setSubmitState(isBusy, label) {
        const submitBtn = document.querySelector('#checkout-form button[type="submit"]');
        if (!submitBtn) return function() {};

        const originalText = submitBtn.dataset.originalText || submitBtn.innerHTML;
        submitBtn.dataset.originalText = originalText;

        if (isBusy) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/></svg> ' + label;
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }

        return function restore() {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        };
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
            showCheckoutModal(
                'Online Payment Not Available',
                'Online payment is not configured yet. Please use Manual Bank Transfer or WhatsApp ordering for now.'
            );
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
        const restoreSubmitState = setSubmitState(true, 'Processing...');

        fetch(getApiUrl('/api/verify-payment'), {
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
        .then(function(res) {
            return res.json().catch(function() {
                return {
                    success: false,
                    error: 'Unable to read verification response',
                    httpStatus: res.status
                };
            }).then(function(data) {
                if (typeof data.httpStatus === 'undefined') {
                    data.httpStatus = res.status;
                }
                return data;
            });
        })
        .then(function(data) {
            if (data.success) {
                window.location.href = 'success.html?ref=' + encodeURIComponent(reference) + '&pkg=' + encodeURIComponent(pkg.id);
            } else {
                if (shouldRetryVerification(data)) {
                    pollPaymentStatus(reference, pkg, customerInfo, function() {
                        window.location.href = 'success.html?ref=' + encodeURIComponent(reference) + '&pkg=' + encodeURIComponent(pkg.id);
                    }, function() {
                        window.location.href = 'payment-failed.html?ref=' + encodeURIComponent(reference);
                    });
                    return;
                }

                window.location.href = 'payment-failed.html?ref=' + encodeURIComponent(reference);
            }
        })
        .catch(function(err) {
            console.error('Payment verification error:', err);
            pollPaymentStatus(reference, pkg, customerInfo, function() {
                window.location.href = 'success.html?ref=' + encodeURIComponent(reference) + '&pkg=' + encodeURIComponent(pkg.id);
            }, function() {
                showCheckoutModal(
                    'Payment Verification Delayed',
                    'We could not confirm your payment immediately. Please wait a few moments and try again, or contact support with your payment reference.'
                );
            });
        })
        .finally(function() {
            restoreSubmitState();
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

        const restoreSubmitState = setSubmitState(true, 'Submitting Order...');

        fetch(getApiUrl('/api/manual-order'), {
            method: 'POST',
            body: formData
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.success) {
                window.location.href = 'success.html?ref=' + encodeURIComponent(orderData.order_ref) + '&pkg=' + encodeURIComponent(pkg.id) + '&manual=1';
            } else {
                showCheckoutModal(
                    'Order Not Submitted',
                    'We could not submit your manual order yet. Please try again in a moment or contact us on WhatsApp.'
                );
            }
        })
        .catch(function(err) {
            console.error('Manual order error:', err);
            showCheckoutModal(
                'Submission Failed',
                'We could not confirm your order, so Your order was not delivered to us. Use our WhatsApp Order or  try again and wait for confirmation before leaving this page.'
            );
        })
        .finally(function() {
            restoreSubmitState();
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

    function shouldRetryVerification(data) {
        const errorText = String(data && data.error ? data.error : '').toLowerCase();
        return Boolean(
            data &&
            (
                data.retryable === true ||
                data.httpStatus === 404 ||
                data.httpStatus === 409 ||
                data.httpStatus >= 500 ||
                errorText.includes('unable to read') ||
                errorText.includes('pending') ||
                errorText.includes('not found') ||
                errorText.includes('configured') ||
                errorText.includes('temporar') ||
                errorText.includes('server')
            )
        );
    }

    function pollPaymentStatus(reference, pkg, customerInfo, onVerified, onFailed) {
        let attempts = 0;
        const maxAttempts = 6;

        function attemptVerify() {
            return fetch(getApiUrl('/api/verify-payment'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reference: reference,
                    package_id: pkg.id,
                    expected_amount: pkg.price,
                    currency: BUSINESS.currencyCode,
                    customer: customerInfo
                })
            }).then(function(res) {
                return res.json().catch(function() {
                    return {
                        success: false,
                        error: 'Unable to read verification response',
                        httpStatus: res.status
                    };
                }).then(function(data) {
                    if (typeof data.httpStatus === 'undefined') {
                        data.httpStatus = res.status;
                    }
                    return data;
                });
            });
        }

        function check() {
            attempts += 1;

            attemptVerify()
                .then(function(data) {
                    if (data && data.success) {
                        onVerified();
                        return;
                    }

                    if (shouldRetryVerification(data) && attempts < maxAttempts) {
                        window.setTimeout(check, 2000);
                        return;
                    }

                    return fetch(getApiUrl('/api/payment-status?ref=' + encodeURIComponent(reference)))
                        .then(function(res) {
                            return res.json().catch(function() { return { success: false }; });
                        })
                        .then(function(statusData) {
                            const record = statusData && statusData.record ? statusData.record : null;
                            if (statusData.success && record && record.paymentStatus === 'verified') {
                                onVerified();
                                return;
                            }

                            if (attempts < maxAttempts) {
                                window.setTimeout(check, 2000);
                            } else {
                                onFailed();
                            }
                        });
                })
                .catch(function() {
                    if (attempts < maxAttempts) {
                        window.setTimeout(check, 2000);
                    } else {
                        onFailed();
                    }
                });
        }

        check();
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
