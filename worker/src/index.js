/* =========================================================
   PMELAB PRODUCT TEMPLATE — CLOUDFLARE WORKER
   ========================================================= */

import { connect } from 'cloudflare:sockets';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Content-Type': 'application/json'
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Paystack Webhook
        if (path === '/api/paystack-webhook' && request.method === 'POST') {
            return handlePaystackWebhook(request, env);
        }

        // Verify Payment
        if (path === '/api/verify-payment' && request.method === 'POST') {
            return handleVerifyPayment(request, env);
        }

        // Manual Order
        if (path === '/api/manual-order' && request.method === 'POST') {
            return handleManualOrder(request, env);
        }

        if (path === '/api/refund-request' && request.method === 'POST') {
            return handleRefundRequest(request, env);
        }

        // Track site visit
        if (path === '/api/track-visit' && request.method === 'POST') {
            return handleTrackVisit(request, env);
        }

        // Track checkout attempt / abandonment
        if (path === '/api/track-order-attempt' && request.method === 'POST') {
            return handleTrackOrderAttempt(request, env);
        }

        // Owner dashboard stats
        if (path === '/api/owner/stats' && request.method === 'GET') {
            return handleOwnerStats(request, env);
        }

        if (path === '/api/owner/order' && request.method === 'GET') {
            return handleOwnerOrderLookup(request, env);
        }

        // Public payment / order status lookup
        if (path === '/api/payment-status' && request.method === 'GET') {
            return handlePaymentStatus(request, env);
        }

        if (path === '/api/health' && request.method === 'GET') {
            return handleHealthCheck(env);
        }

        if (path.startsWith('/api/')) {
            return new Response(JSON.stringify({ error: 'Not Found' }), {
                status: 404,
                headers: corsHeaders
            });
        }

        if (request.method === 'GET' && (path === '/' || path === '/index.html')) {
            const mode = await getSiteMode(env);
            if (mode === 'multipleproducts') {
                return Response.redirect('/multiple.html', 302);
            }
            if (mode === 'affiliate') {
                return Response.redirect('/affiliate.html', 302);
            }
        }

        if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
            return env.ASSETS.fetch(request);
        }

        return new Response(JSON.stringify({ error: 'Not Found' }), {
            status: 404,
            headers: corsHeaders
        });
    }
};

// =========================================================
// PAYSTACK WEBHOOK HANDLER
// =========================================================
async function handlePaystackWebhook(request, env) {
    const secret = env.PAYSTACK_SECRET_KEY;
    if (!secret) {
        return jsonResponse({ error: 'Payment not configured' }, 500);
    }

    // Validate signature
    const signature = request.headers.get('x-paystack-signature');
    const body = await request.text();

    const isValid = await verifyPaystackSignature(body, signature, secret);
    if (!isValid) {
        return jsonResponse({ error: 'Invalid signature' }, 400);
    }

    const event = JSON.parse(body);

    if (event.event === 'charge.success') {
        const reference = event.data.reference;

        const verifyResult = await verifyPaystackTransaction(reference, secret);
        if (!verifyResult.status) {
            return jsonResponse({ error: 'Verification failed' }, 400);
        }

        const transaction = verifyResult.data;
        if (!transaction || transaction.status !== 'success') {
            return jsonResponse({ received: true, ignored: true, reason: 'Transaction not successful' });
        }

        const customer = extractCustomerFromPaystackTransaction(transaction);
        const result = await confirmPaystackPayment(env, {
            transaction: transaction,
            packageId: extractCustomFieldValue(transaction, 'package'),
            expectedAmount: transaction.amount / 100,
            currency: transaction.currency,
            customer: customer,
            source: 'webhook'
        });

        return jsonResponse({
            success: true,
            duplicate: result.duplicate === true,
            source: 'webhook'
        });
    }

    return jsonResponse({ received: true });
}

// =========================================================
// VERIFY PAYMENT (Called from frontend)
// =========================================================
async function handleVerifyPayment(request, env) {
    try {
        const secret = env.PAYSTACK_SECRET_KEY;
        if (!secret) {
            return jsonResponse({ success: false, error: 'Payment not configured. Missing PAYSTACK_SECRET_KEY.', retryable: false }, 503);
        }

        const data = await request.json();
        const {
            reference,
            package_id,
            expected_amount,
            currency,
            customer,
            product_id,
            product_title,
            package_title,
            quantity,
            shipping_fee
        } = data;

        let expectedAmount = Number(expected_amount || 0);
        let expectedCurrency = String(currency || '').toUpperCase();
        let resolvedProductId = String(product_id || '').trim();
        let resolvedProductTitle = String(product_title || '').trim();
        let resolvedPackageTitle = String(package_title || '').trim();
        let resolvedQuantity = Number(quantity || 0) || 1;
        let resolvedShippingFee = Number(shipping_fee || 0) || 0;
        let resolvedItems = null;
        let resolvedSubtotal = null;
        let resolvedPackageId = String(package_id || '').trim();

        const mode = await getSiteMode(env);
        if (mode === 'multipleproducts' && Array.isArray(data.items) && data.items.length) {
            const site = await getSiteConfig(env);
            const resolvedCart = resolveMultipleCart(site, data.items);
            if (!resolvedCart.ok) {
                return jsonResponse({ success: false, error: resolvedCart.error || 'Invalid cart selection', retryable: false }, 400);
            }

            expectedAmount = resolvedCart.totals.total;
            resolvedSubtotal = resolvedCart.totals.base;
            resolvedShippingFee = resolvedCart.totals.shipping;
            resolvedQuantity = resolvedCart.totals.itemCount;
            resolvedItems = resolvedCart.items;
            resolvedPackageId = 'cart';
            resolvedPackageTitle = resolvedPackageTitle || 'Cart';
            resolvedProductId = '';
            resolvedProductTitle = '';

            if (site && site.BUSINESS && site.BUSINESS.currencyCode) {
                expectedCurrency = String(site.BUSINESS.currencyCode || expectedCurrency).toUpperCase();
            }
        } else if (mode === 'multipleproducts' && resolvedProductId) {
            const site = await getSiteConfig(env);
            const resolved = resolveMultipleProduct(site, resolvedProductId, String(package_id || '').trim());
            if (!resolved.ok) {
                return jsonResponse({ success: false, error: resolved.error || 'Invalid product selection', retryable: false }, 400);
            }

            const totals = computeMultipleProductTotals(resolved.product, resolved.pkg, resolvedQuantity);
            expectedAmount = totals.total;
            resolvedSubtotal = totals.base;
            resolvedShippingFee = totals.shipping;
            resolvedPackageId = String(package_id || '').trim();

            if (site && site.BUSINESS && site.BUSINESS.currencyCode) {
                expectedCurrency = String(site.BUSINESS.currencyCode || expectedCurrency).toUpperCase();
            }

            resolvedProductTitle = resolvedProductTitle || String(resolved.product.title || resolved.product.id || resolvedProductId);
            resolvedPackageTitle = resolvedPackageTitle || String(resolved.pkg.title || resolved.pkg.id || package_id);
        }

        const verifyResult = await verifyPaystackTransaction(reference, secret);
        if (!verifyResult.status) {
            const message = String(verifyResult.message || 'Transaction not found');
            const hint = getPaystackFailureHint(message);
            const retryable = isRetryablePaystackFailure(message);

            if (retryable) {
                return jsonResponse({
                    success: false,
                    error: message,
                    retryable: true,
                    hint: hint || undefined
                }, 409);
            }

            await updateOwnerStats(env, function(stats) {
                stats.failedSalesCount += 1;
            });
            await sendOrderNotifications(env, {
                event: 'paystack_attempt_failed',
                title: 'Paystack verification failed',
                orderRef: reference,
                packageId: package_id,
                amount: expectedAmount,
                currency: expectedCurrency,
                customer: customer,
                details: ['Reason: ' + message].concat(hint ? ['Hint: ' + hint] : [])
            });
            return jsonResponse({
                success: false,
                error: message,
                retryable: false,
                hint: hint || undefined
            }, 404);
        }

        const transaction = verifyResult.data;
        if (!transaction || transaction.status !== 'success') {
            const status = String(transaction && transaction.status ? transaction.status : 'unknown').toLowerCase();
            if (status === 'pending' || status === 'ongoing' || status === 'processing' || status === 'queued' || status === 'unknown') {
                return jsonResponse({
                    success: false,
                    error: 'Payment confirmation is still pending',
                    retryable: true,
                    transaction_status: status
                }, 409);
            }

            await updateOwnerStats(env, function(stats) {
                stats.failedSalesCount += 1;
            });
            await sendOrderNotifications(env, {
                event: 'paystack_attempt_failed',
                title: 'Paystack payment not completed',
                orderRef: reference,
                packageId: package_id,
                amount: expectedAmount,
                currency: expectedCurrency,
                customer: customer,
                details: ['Transaction status: ' + status]
            });
            return jsonResponse({ success: false, error: 'Payment is not successful', transaction_status: status, retryable: false }, 400);
        }

        const expectedKobo = Math.round(expectedAmount * 100);
        const receivedKobo = Number(transaction.amount || 0);
        if (receivedKobo !== expectedKobo) {
            await updateOwnerStats(env, function(stats) {
                stats.failedSalesCount += 1;
            });
            await sendOrderNotifications(env, {
                event: 'paystack_attempt_failed',
                title: 'Paystack amount mismatch',
                orderRef: reference,
                packageId: package_id,
                amount: expectedAmount,
                currency: expectedCurrency,
                customer: customer,
                details: [
                    'Expected: ' + expectedAmount + ' ' + expectedCurrency,
                    'Received: ' + (receivedKobo / 100) + ' ' + String(transaction.currency || '').toUpperCase()
                ]
            });
            return jsonResponse({ success: false, error: 'Amount mismatch', retryable: false }, 400);
        }

        const receivedCurrency = String(transaction.currency || '').toUpperCase();
        if (receivedCurrency !== expectedCurrency) {
            await updateOwnerStats(env, function(stats) {
                stats.failedSalesCount += 1;
            });
            await sendOrderNotifications(env, {
                event: 'paystack_attempt_failed',
                title: 'Paystack currency mismatch',
                orderRef: reference,
                packageId: package_id,
                amount: expectedAmount,
                currency: expectedCurrency,
                customer: customer,
                details: [
                    'Expected currency: ' + expectedCurrency,
                    'Received currency: ' + receivedCurrency
                ]
            });
            return jsonResponse({ success: false, error: 'Currency mismatch', retryable: false }, 400);
        }

        const result = await confirmPaystackPayment(env, {
            transaction: transaction,
            packageId: resolvedPackageId,
            packageTitle: resolvedPackageTitle,
            expectedAmount: expectedAmount,
            subtotal: resolvedSubtotal,
            currency: expectedCurrency,
            customer: customer,
            productId: resolvedProductId,
            productTitle: resolvedProductTitle,
            quantity: resolvedQuantity,
            shippingFee: resolvedShippingFee,
            items: resolvedItems,
            source: 'frontend_verify'
        });

        return jsonResponse({
            success: true,
            duplicate: result.duplicate === true,
            warnings: result.warnings || []
        });
    } catch (error) {
        return jsonResponse({
            success: false,
            error: error && error.message ? error.message : 'Verification failed',
            retryable: true
        }, 502);
    }
}

function resolveMultipleProduct(site, productId, packageId) {
    const products = site && Array.isArray(site.PRODUCTS) ? site.PRODUCTS : [];
    const product = products.find(function(p) { return p && p.id === productId; }) || null;
    if (!product) {
        return { ok: false, error: 'Product not found' };
    }
    const packages = Array.isArray(product.packages) ? product.packages : [];
    const pkg = packages.find(function(p) { return p && p.id === packageId; }) || null;
    if (!pkg) {
        return { ok: false, error: 'Package not found' };
    }
    return { ok: true, product: product, pkg: pkg };
}

function computeMultipleProductTotals(product, pkg, qty) {
    const quantity = Number(qty || 0) || 1;
    const unitPrice = Number(pkg && pkg.price ? pkg.price : 0);
    const shippingPerUnit = Number(product && product.shippingFee ? product.shippingFee : 0);
    const base = unitPrice * quantity;
    const shipping = shippingPerUnit * quantity;
    return { base: base, shipping: shipping, total: base + shipping };
}

function resolveMultipleCart(site, items) {
    const input = Array.isArray(items) ? items : [];
    const resolvedItems = [];
    let base = 0;
    let shipping = 0;
    let itemCount = 0;

    for (let i = 0; i < input.length; i += 1) {
        const row = input[i] || {};
        const productId = String(row.productId || row.product_id || '').trim();
        const packageId = String(row.packageId || row.package_id || '').trim();
        const qty = Number(row.qty || row.quantity || 0) || 1;
        if (!productId || !packageId) {
            return { ok: false, error: 'Invalid cart item' };
        }
        if (qty <= 0) {
            return { ok: false, error: 'Invalid quantity' };
        }

        const resolved = resolveMultipleProduct(site, productId, packageId);
        if (!resolved.ok) {
            return { ok: false, error: resolved.error || 'Invalid cart selection' };
        }

        const totals = computeMultipleProductTotals(resolved.product, resolved.pkg, qty);
        base += totals.base;
        shipping += totals.shipping;
        itemCount += qty;

        resolvedItems.push({
            productId: productId,
            productTitle: String(resolved.product.title || resolved.product.id || productId),
            packageId: packageId,
            packageTitle: String(resolved.pkg.title || resolved.pkg.id || packageId),
            qty: qty,
            unitPrice: Number(resolved.pkg.price || 0),
            shippingPerUnit: Number(resolved.product.shippingFee || 0),
            lineSubtotal: totals.base,
            lineShipping: totals.shipping,
            lineTotal: totals.total
        });
    }

    return { ok: true, items: resolvedItems, totals: { base: base, shipping: shipping, total: base + shipping, itemCount: itemCount } };
}

// =========================================================
// MANUAL ORDER HANDLER
// =========================================================
async function handleManualOrder(request, env) {
    const contentType = request.headers.get('content-type') || '';
    let data;

    if (contentType.includes('multipart/form-data')) {
        const form = await request.formData();
        const receiptFile = form.get('payment_receipt');

        data = {
            package_id: form.get('package_id') || '',
            product_id: form.get('product_id') || '',
            customer: {
                name: form.get('customer_name') || '',
                email: form.get('customer_email') || '',
                phone: form.get('customer_phone') || '',
                address: form.get('customer_address') || '',
                state: form.get('customer_state') || '',
                city: form.get('customer_city') || '',
                specialRequest: form.get('customer_special_request') || ''
            },
            product: form.get('product') || '',
            package_title: form.get('package_title') || '',
            quantity: Number(form.get('quantity') || 0),
            amount: Number(form.get('amount') || 0),
            shipping_fee: Number(form.get('shipping_fee') || 0),
            currency: form.get('currency') || '',
            payment_method: form.get('payment_method') || 'manual',
            order_ref: form.get('order_ref') || '',
            product_type: form.get('product_type') || 'physical'
        };

        const itemsRaw = form.get('items');
        if (itemsRaw) {
            try {
                data.items = JSON.parse(String(itemsRaw));
            } catch (error) {}
        }

        if (receiptFile && typeof receiptFile.arrayBuffer === 'function' && receiptFile.size > 0) {
            const buffer = await receiptFile.arrayBuffer();
            data.receipt = {
                name: receiptFile.name || 'payment-receipt',
                type: receiptFile.type || 'application/octet-stream',
                size: receiptFile.size,
                base64: arrayBufferToBase64(buffer)
            };
        }
    } else {
        data = await request.json();
    }

    if (!data.order_ref) {
        data.order_ref = 'MANUAL-' + Date.now();
    }

    if (!data.quantity || Number(data.quantity) <= 0) {
        data.quantity = 1;
    }

    const mode = await getSiteMode(env);
    if (mode === 'multipleproducts' && Array.isArray(data.items) && data.items.length) {
        const site = await getSiteConfig(env);
        const resolvedCart = resolveMultipleCart(site, data.items);
        if (resolvedCart.ok) {
            data.subtotal = resolvedCart.totals.base;
            data.shipping_fee = resolvedCart.totals.shipping;
            data.amount = resolvedCart.totals.total;
            data.quantity = resolvedCart.totals.itemCount;
            data.items = resolvedCart.items;
            data.package_id = 'cart';
            data.package_title = 'Cart';
            if (!data.product) data.product = 'Cart order';
            if (!data.product_type) data.product_type = 'mixed';
            if (!data.currency && site && site.BUSINESS && site.BUSINESS.currencyCode) {
                data.currency = String(site.BUSINESS.currencyCode || '').toUpperCase();
            }
        }
    } else if (mode === 'multipleproducts' && data.product_id && data.package_id) {
        const site = await getSiteConfig(env);
        const resolved = resolveMultipleProduct(site, String(data.product_id || '').trim(), String(data.package_id || '').trim());
        if (resolved.ok) {
            const totals = computeMultipleProductTotals(resolved.product, resolved.pkg, Number(data.quantity || 1));
            data.subtotal = totals.base;
            data.shipping_fee = totals.shipping;
            data.amount = totals.total;
            if (site && site.BUSINESS && site.BUSINESS.currencyCode) {
                data.currency = String(site.BUSINESS.currencyCode || data.currency || '').toUpperCase();
            }
            if (!data.product) data.product = String(resolved.product.title || resolved.product.id || '');
            if (!data.package_title) data.package_title = String(resolved.pkg.title || resolved.pkg.id || '');
            if (!data.product_type) data.product_type = String(resolved.product.productType || 'physical');
        }
    }

    const warnings = [];
    await recordManualOrder(env, data);

    try {
        await sendManualOrderEmail(data, env);
    } catch (error) {
        warnings.push('manual_order_email_failed');
        console.error('Manual order email failed:', error && error.message ? error.message : error);
    }

    try {
        await sendOrderNotifications(env, {
            event: 'manual_order_received',
            title: 'New manual order received',
            orderRef: data.order_ref,
            packageId: data.package_id,
            amount: data.amount,
            currency: data.currency,
            customer: data.customer,
            details: [
                'Product: ' + (data.product || ''),
                'Package: ' + (data.package_title || ''),
                'Product type: ' + (data.product_type || 'physical'),
                'Receipt attached: ' + (data.receipt ? 'Yes' : 'No')
            ]
        });
    } catch (error) {
        warnings.push('manual_order_notification_failed');
        console.error('Manual order notification failed:', error && error.message ? error.message : error);
    }

    return jsonResponse({
        success: true,
        message: 'Order received',
        status: 'manual_submitted',
        receiptUploaded: Boolean(data.receipt),
        warnings: warnings
    });
}

async function handleRefundRequest(request, env) {
    const ownerEmail = String(env.OWNER_EMAIL || '').trim();
    if (!ownerEmail) {
        return jsonResponse({ success: false, error: 'Owner email not configured' }, 503);
    }

    const payload = await request.json().catch(function() { return null; });
    if (!payload) {
        return jsonResponse({ success: false, error: 'Invalid request body' }, 400);
    }

    const name = String(payload.name || '').trim();
    const email = String(payload.email || '').trim();
    const phone = String(payload.phone || '').trim();
    const reference = String(payload.reference || '').trim();
    const message = String(payload.message || '').trim();

    if (!name || !email || !phone || !reference || !message) {
        return jsonResponse({ success: false, error: 'Missing required fields' }, 400);
    }

    const context = await getEmailContext(env);
    const fromEmail = getFromEmail(env);
    const preheader = 'Refund request from ' + name + ' (' + reference + ')';
    const rows = [
        { label: 'Name', value: name },
        { label: 'Email', value: email },
        { label: 'Phone', value: phone },
        { label: 'Order Reference', value: reference }
    ];

    const detailsTable = buildEmailKeyValueRows(rows, context);
    const messageHtml = '<div style="margin-top:14px;font-weight:700;">Message</div>' +
        '<div style="margin-top:8px;color:' + escapeHtmlText(context.brand.muted) + ';font-size:13px;line-height:1.7;white-space:pre-line;">' + escapeHtmlText(message) + '</div>';

    const ownerHtml = buildEmailShell(context, {
        title: 'Refund Request',
        preheader: preheader,
        contentHtml:
            '<div style="font-weight:900;font-size:18px;">Refund request submitted</div>' +
            '<div style="margin-top:10px;color:' + escapeHtmlText(context.brand.muted) + ';font-size:13px;line-height:1.6;">A customer submitted a refund request. Please review and respond.</div>' +
            detailsTable +
            messageHtml
    });

    const customerHtml = buildEmailShell(context, {
        title: 'Refund Request Received',
        preheader: 'We received your refund request (' + reference + ')',
        contentHtml:
            '<div style="font-weight:900;font-size:18px;">We received your refund request</div>' +
            '<div style="margin-top:10px;color:' + escapeHtmlText(context.brand.muted) + ';font-size:13px;line-height:1.6;">Thank you, ' + escapeHtmlText(name) + '. Our team will review your request and contact you shortly.</div>' +
            buildEmailKeyValueRows([{ label: 'Order Reference', value: reference }], context)
    });

    const jobs = [];
    jobs.push(sendEmail(env, {
        from: fromEmail,
        to: ownerEmail,
        subject: sanitizeHeaderValue(String(context.brand.shortName || 'Store') + ' — Refund Request (' + reference + ')'),
        text: 'Refund request\n\nName: ' + name + '\nEmail: ' + email + '\nPhone: ' + phone + '\nReference: ' + reference + '\n\nMessage:\n' + message,
        html: ownerHtml
    }));
    jobs.push(sendEmail(env, {
        from: fromEmail,
        to: email,
        subject: sanitizeHeaderValue(String(context.brand.shortName || 'Store') + ' — Refund Request Received (' + reference + ')'),
        text: 'Hello ' + name + ',\n\nWe received your refund request.\nOrder reference: ' + reference + '\n\nWe will contact you shortly.',
        html: customerHtml
    }));

    try {
        await Promise.all(jobs);
    } catch (error) {
        console.error('Refund request email failed:', error && error.message ? error.message : error);
        return jsonResponse({ success: false, error: 'Failed to submit request. Please try again.' }, 500);
    }

    return jsonResponse({ success: true });
}

async function handleTrackVisit(request, env) {
    if (!env.OWNER_STATS) {
        return jsonResponse({ success: false, error: 'Stats storage not configured' }, 503);
    }

    const data = await request.json().catch(function() { return {}; });
    const visitorId = String(data.visitorId || '').trim();

    await updateOwnerStats(env, async function(stats) {
        stats.totalPageViews += 1;

        if (visitorId) {
            const visitorKey = 'visitor:' + visitorId;
            const existingVisitor = await env.OWNER_STATS.get(visitorKey);

            if (!existingVisitor) {
                stats.totalVisitors += 1;
                await env.OWNER_STATS.put(visitorKey, JSON.stringify({
                    firstSeenAt: new Date().toISOString(),
                    path: data.path || '/',
                    referrer: data.referrer || ''
                }));
            }
        }
    });

    return jsonResponse({ success: true });
}

async function handleTrackOrderAttempt(request, env) {
    if (!env.OWNER_STATS) {
        return jsonResponse({ success: false, error: 'Stats storage not configured' }, 503);
    }

    const data = await request.json();
    const reason = String(data.reason || 'unknown');

    await updateOwnerStats(env, function(stats) {
        if (reason === 'paystack_started') {
            stats.salesAttemptsCount += 1;
        }

        if (reason === 'paystack_closed') {
            stats.abandonedCheckoutCount += 1;
        }
    });

    if (reason === 'paystack_closed') {
        await sendOrderNotifications(env, {
            event: 'paystack_attempt_abandoned',
            title: 'Checkout abandoned',
            orderRef: data.orderRef || 'N/A',
            packageId: data.packageId,
            amount: data.amount,
            currency: data.currency,
            customer: data.customer,
            details: ['Reason: Customer closed Paystack before completing payment']
        });
    }

    return jsonResponse({ success: true });
}

async function handleOwnerStats(request, env) {
    if (!env.OWNER_STATS) {
        return jsonResponse({ success: false, error: 'Stats storage not configured' }, 503);
    }

    const authorized = isOwnerAuthorized(request, env);
    if (!authorized.ok) {
        return new Response(JSON.stringify({
            success: false,
            error: authorized.error
        }), {
            status: 401,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    }

    const stats = await withTimeout(getOwnerStats(env), 8000, 'Loading owner stats timed out');
    return jsonResponse({
        success: true,
        stats: stats
    });
}

async function handleOwnerOrderLookup(request, env) {
    if (!env.OWNER_STATS) {
        return jsonResponse({ success: false, error: 'Stats storage not configured' }, 503);
    }

    const authorized = isOwnerAuthorized(request, env);
    if (!authorized.ok) {
        return new Response(JSON.stringify({
            success: false,
            error: authorized.error
        }), {
            status: 401,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    }

    const url = new URL(request.url);
    const reference = String(url.searchParams.get('ref') || '').trim();
    if (!reference) {
        return jsonResponse({ success: false, error: 'Missing payment reference' }, 400);
    }

    let record = await getPaymentRecord(env, reference);

    if (!record && env.PAYSTACK_SECRET_KEY) {
        try {
            const verifyResult = await verifyPaystackTransaction(reference, env.PAYSTACK_SECRET_KEY);
            if (verifyResult && verifyResult.status && verifyResult.data && verifyResult.data.status === 'success') {
                const transaction = verifyResult.data;
                await confirmPaystackPayment(env, {
                    transaction: transaction,
                    packageId: extractCustomFieldValue(transaction, 'package'),
                    expectedAmount: transaction.amount / 100,
                    currency: transaction.currency,
                    customer: extractCustomerFromPaystackTransaction(transaction),
                    source: 'owner_lookup'
                });
                record = await getPaymentRecord(env, reference);
            }
        } catch (error) {}
    }

    if (!record) {
        return jsonResponse({ success: false, found: false, error: 'Payment record not found' }, 404);
    }

    return jsonResponse({ success: true, found: true, record: record });
}

async function handlePaymentStatus(request, env) {
    const url = new URL(request.url);
    const reference = String(url.searchParams.get('ref') || '').trim();

    if (!reference) {
        return jsonResponse({ success: false, error: 'Missing payment reference' }, 400);
    }

    let record = await getPaymentRecord(env, reference);

    if (!record && env.PAYSTACK_SECRET_KEY) {
        try {
            const verifyResult = await verifyPaystackTransaction(reference, env.PAYSTACK_SECRET_KEY);
            if (verifyResult && verifyResult.status && verifyResult.data && verifyResult.data.status === 'success') {
                const transaction = verifyResult.data;
                await confirmPaystackPayment(env, {
                    transaction: transaction,
                    packageId: extractCustomFieldValue(transaction, 'package'),
                    expectedAmount: transaction.amount / 100,
                    currency: transaction.currency,
                    customer: extractCustomerFromPaystackTransaction(transaction),
                    source: 'status_lookup'
                });
                record = await getPaymentRecord(env, reference);
            } else if (verifyResult && verifyResult.status && verifyResult.data) {
                return jsonResponse({
                    success: false,
                    found: false,
                    retryable: true,
                    error: 'Payment status is ' + String(verifyResult.data.status || 'unknown')
                }, 409);
            } else if (verifyResult && !verifyResult.status) {
                return jsonResponse({
                    success: false,
                    found: false,
                    retryable: false,
                    error: String(verifyResult.message || 'Transaction not found')
                }, 404);
            }
        } catch (error) {
            return jsonResponse({
                success: false,
                found: false,
                retryable: true,
                error: error && error.message ? error.message : 'Status check failed'
            }, 409);
        }
    }

    if (!record) {
        return jsonResponse({ success: false, found: false, retryable: true, error: 'Payment record not found' }, 404);
    }

    return jsonResponse({
        success: true,
        found: true,
        record: record
    });
}

// =========================================================
// PAYSTACK SIGNATURE VERIFICATION
// =========================================================
async function verifyPaystackSignature(body, signature, secret) {
    if (!signature) return false;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-512' },
        false,
        ['sign']
    );

    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const computed = Array.from(new Uint8Array(sig))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    return computed === signature;
}

// =========================================================
// VERIFY PAYSTACK TRANSACTION
// =========================================================
async function verifyPaystackTransaction(reference, secret) {
    const response = await withTimeout(fetch('https://api.paystack.co/transaction/verify/' + reference, {
        headers: {
            'Authorization': 'Bearer ' + secret,
            'Content-Type': 'application/json'
        }
    }), 10000, 'Paystack verification request timed out');

    const payload = await response.json().catch(function() {
        return {
            status: false,
            message: 'Unable to read Paystack verification response'
        };
    });

    if (!response.ok && payload && typeof payload.status === 'undefined') {
        payload.status = false;
    }

    if (!payload.message && !response.ok) {
        payload.message = 'Paystack verification failed with HTTP ' + response.status;
    }

    return payload;
}

function isRetryablePaystackFailure(message) {
    const text = String(message || '').toLowerCase();
    return Boolean(
        text.includes('timeout') ||
        text.includes('timed out') ||
        text.includes('temporar') ||
        text.includes('network') ||
        text.includes('unable to read') ||
        text.includes('try again') ||
        text.includes('gateway') ||
        text.includes('server') ||
        text.includes('rate limit') ||
        text.includes('transaction not found') ||
        text.includes('not found')
    );
}

function getPaystackFailureHint(message) {
    const text = String(message || '').toLowerCase();
    if (text.includes('invalid key') || text.includes('authorization') || text.includes('transaction not found')) {
        return 'Confirm PAYSTACK_SECRET_KEY matches the Paystack public key mode (both test or both live) and is set on the deployed Worker.';
    }
    return '';
}

function handleHealthCheck(env) {
    const username = env.OWNER_DASHBOARD_USERNAME || env.OWNER_USERNAME;
    const password = env.OWNER_DASHBOARD_PASSWORD || env.OWNER_PASSWORD;
    const checks = {
        ownerStatsBound: Boolean(env.OWNER_STATS),
        paystackSecretConfigured: Boolean(env.PAYSTACK_SECRET_KEY),
        ownerEmailConfigured: Boolean(env.OWNER_EMAIL),
        ownerDashboardCredsConfigured: Boolean(username && password),
        gmailSmtpConfigured: Boolean(env.GMAIL_SMTP_USER && env.GMAIL_SMTP_PASSWORD),
        resendConfigured: Boolean(env.RESEND_API_KEY)
    };
    const missing = Object.keys(checks).filter(function(key) { return checks[key] === false; });
    let availableKeys = [];
    try {
        availableKeys = Object.keys(env || {}).sort();
    } catch (error) {
        availableKeys = [];
    }
    return jsonResponse({
        success: true,
        checks: checks,
        missing: missing,
        availableKeys: availableKeys
    });
}

// =========================================================
// SEND ORDER EMAILS
// =========================================================
async function sendOrderEmails(transaction, env, method, customerInfo, orderRecord) {
    const ownerEmail = env.OWNER_EMAIL;
    const customer = customerInfo || (transaction.metadata ? transaction.metadata.custom_fields : []);
    const customerEmail = transaction.customer ? transaction.customer.email : '';
    const fromEmail = getFromEmail(env);
    const emailContext = await getEmailContext(env);

    // Build owner email
    const ownerSubject = 'NEW ORDER - ' + transaction.reference;
    const ownerBody = buildOwnerEmail(transaction, method, customer, orderRecord);
    const ownerHtml = buildOwnerEmailHtml(transaction, method, customer, emailContext, orderRecord);

    // Build customer email
    const customerSubject = 'Order Confirmation - ' + transaction.reference;
    const customerBody = buildCustomerEmail(transaction, method, customer, orderRecord);
    const customerHtml = buildCustomerEmailHtml(transaction, method, customer, emailContext, orderRecord);

    const jobs = [];
    if (ownerEmail) {
        jobs.push(sendEmail(env, {
            from: fromEmail,
            to: ownerEmail,
            subject: ownerSubject,
            text: ownerBody,
            html: ownerHtml
        }));
    }
    if (customerEmail) {
        jobs.push(sendEmail(env, {
            from: fromEmail,
            to: customerEmail,
            subject: customerSubject,
            text: customerBody,
            html: customerHtml
        }));
    }
    if (!jobs.length) return;

    const results = await Promise.allSettled(jobs);

    const emailErrors = results
        .filter(function(result) { return result.status === 'rejected'; })
        .map(function(result) { return result.reason && result.reason.message ? result.reason.message : String(result.reason); });

    if (emailErrors.length) {
        throw new Error(emailErrors.join(' | '));
    }
}

// =========================================================
// SEND MANUAL ORDER EMAIL
// =========================================================
async function sendManualOrderEmail(data, env) {
    const ownerEmail = env.OWNER_EMAIL;

    const subject = 'NEW MANUAL PAYMENT ORDER - ' + data.order_ref;
    const body = buildManualOrderEmail(data);
    const emailContext = await getEmailContext(env);
    const html = buildManualOrderEmailHtml(data, emailContext);
    const fromEmail = getFromEmail(env);
    const attachments = [];

    if (data.receipt && data.receipt.base64) {
        attachments.push({
            filename: data.receipt.name || 'payment-receipt',
            type: data.receipt.type || 'application/octet-stream',
            contentBase64: data.receipt.base64
        });
    }

    const customerSubject = 'Order Received - ' + data.order_ref;
    const customerBody = buildManualCustomerEmail(data);
    const customerHtml = buildManualCustomerEmailHtml(data, emailContext);
    const customerEmail = data.customer && data.customer.email ? data.customer.email : '';

    const jobs = [];
    if (ownerEmail) {
        jobs.push(sendEmail(env, {
            from: fromEmail,
            to: ownerEmail,
            subject: subject,
            text: body,
            html: html,
            attachments: attachments
        }));
    }
    if (customerEmail) {
        jobs.push(sendEmail(env, {
            from: fromEmail,
            to: customerEmail,
            subject: customerSubject,
            text: customerBody,
            html: customerHtml
        }));
    }
    if (!jobs.length) return;

    const results = await Promise.allSettled(jobs);

    const emailErrors = results
        .filter(function(result) { return result.status === 'rejected'; })
        .map(function(result) { return result.reason && result.reason.message ? result.reason.message : String(result.reason); });

    if (emailErrors.length) {
        throw new Error(emailErrors.join(' | '));
    }
}

// =========================================================
// OWNER STATS STORAGE
// =========================================================
async function getOwnerStats(env) {
    if (!env.OWNER_STATS) {
        return getDefaultOwnerStats();
    }

    const stats = await env.OWNER_STATS.get('owner-dashboard-stats', { type: 'json' });
    return Object.assign(getDefaultOwnerStats(), stats || {});
}

async function updateOwnerStats(env, mutator) {
    if (!env.OWNER_STATS) return;

    const stats = await getOwnerStats(env);
    await mutator(stats);
    stats.lastUpdated = new Date().toISOString();
    await env.OWNER_STATS.put('owner-dashboard-stats', JSON.stringify(stats));
}

function getDefaultOwnerStats() {
    return {
        totalVisitors: 0,
        totalPageViews: 0,
        salesAttemptsCount: 0,
        successfulSalesCount: 0,
        successfulSalesAmount: 0,
        failedSalesCount: 0,
        abandonedCheckoutCount: 0,
        manualOrdersCount: 0,
        manualOrdersAmount: 0,
        lastUpdated: null
    };
}

function isOwnerAuthorized(request, env) {
    const expectedUsername = env.OWNER_DASHBOARD_USERNAME || env.OWNER_USERNAME;
    const expectedPassword = env.OWNER_DASHBOARD_PASSWORD || env.OWNER_PASSWORD;

    if (!expectedUsername || !expectedPassword) {
        return { ok: false, error: 'Owner dashboard credentials are not configured' };
    }

    const authHeader = request.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Basic ')) {
        return { ok: false, error: 'Authentication required' };
    }

    try {
        const encoded = authHeader.slice(6);
        const decoded = atob(encoded);
        const separatorIndex = decoded.indexOf(':');
        const username = separatorIndex >= 0 ? decoded.slice(0, separatorIndex) : decoded;
        const password = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : '';

        if (username === expectedUsername && password === expectedPassword) {
            return { ok: true };
        }
    } catch (error) {
        return { ok: false, error: 'Invalid authentication header' };
    }

    return { ok: false, error: 'Invalid username or password' };
}

async function confirmPaystackPayment(env, options) {
    const transaction = options.transaction;
    const reference = String(transaction && transaction.reference ? transaction.reference : '').trim();
    const packageId = options.packageId || extractCustomFieldValue(transaction, 'package') || '';
    const quantity = Number(options.quantity || extractCustomFieldValue(transaction, 'quantity') || 0) || 1;
    const customer = normalizeCustomerInfo(options.customer || extractCustomerFromPaystackTransaction(transaction));
    const amount = Number(options.expectedAmount || 0) || Number(transaction.amount || 0) / 100;
    const subtotal = Number(options.subtotal || 0) || 0;
    const currency = String(options.currency || transaction.currency || '').toUpperCase();
    const existing = await getPaymentRecord(env, reference);
    const warnings = [];

    if (existing && existing.paymentStatus === 'verified') {
        return { duplicate: true, warnings: existing.warnings || [] };
    }

    const record = {
        reference: reference,
        orderType: 'paystack',
        paymentStatus: 'verified',
        orderStatus: 'received',
        packageId: packageId,
        packageTitle: String(options.packageTitle || packageId),
        quantity: quantity,
        subtotal: subtotal,
        amount: amount,
        currency: currency,
        customer: customer,
        productId: String(options.productId || ''),
        productTitle: String(options.productTitle || ''),
        shippingFee: Number(options.shippingFee || 0) || 0,
        items: Array.isArray(options.items) ? options.items : undefined,
        transactionStatus: transaction.status || 'success',
        source: options.source || 'frontend_verify',
        verifiedAt: new Date().toISOString()
    };

    await putPaymentRecord(env, reference, record);
    await updateOwnerStats(env, function(stats) {
        stats.successfulSalesCount += 1;
        stats.successfulSalesAmount += Number(amount || 0);
    });

    try {
        await sendOrderEmails(transaction, env, 'paystack', customer, record);
    } catch (error) {
        warnings.push('paystack_email_failed');
        console.error('Paystack order email failed:', error && error.message ? error.message : error);
    }

    try {
        await sendOrderNotifications(env, {
            event: 'paystack_order_verified',
            title: 'New Paystack order verified',
            orderRef: transaction.reference,
            packageId: packageId,
            amount: amount,
            currency: currency,
            customer: customer,
            details: [
                'Status: ' + (transaction.status || 'success'),
                'Source: ' + (options.source || 'frontend_verify')
            ]
        });
    } catch (error) {
        warnings.push('paystack_notification_failed');
        console.error('Paystack order notification failed:', error && error.message ? error.message : error);
    }

    if (warnings.length) {
        record.warnings = warnings.slice();
        await putPaymentRecord(env, reference, record);
    }

    return { duplicate: false, warnings: warnings };
}

async function recordManualOrder(env, data) {
    const reference = String(data.order_ref || '').trim();
    const existing = await getPaymentRecord(env, reference);
    if (existing && existing.paymentStatus === 'manual_submitted') {
        return existing;
    }

    const record = {
        reference: reference,
        orderType: 'manual',
        paymentStatus: 'manual_submitted',
        orderStatus: 'awaiting_manual_verification',
        packageId: data.package_id || '',
        packageTitle: data.package_title || '',
        quantity: Number(data.quantity || 0),
        subtotal: Number(data.subtotal || 0) || 0,
        amount: Number(data.amount || 0),
        currency: data.currency || '',
        customer: normalizeCustomerInfo(data.customer),
        product: data.product || '',
        productId: data.product_id || '',
        productType: data.product_type || 'physical',
        shippingFee: Number(data.shipping_fee || 0) || 0,
        items: Array.isArray(data.items) ? data.items : undefined,
        receiptUploaded: Boolean(data.receipt),
        createdAt: new Date().toISOString()
    };

    await putPaymentRecord(env, reference, record);
    await updateOwnerStats(env, function(stats) {
        stats.manualOrdersCount += 1;
        stats.manualOrdersAmount += Number(data.amount || 0);
    });

    return record;
}

async function getPaymentRecord(env, reference) {
    if (!env.OWNER_STATS || !reference) {
        return null;
    }

    return await env.OWNER_STATS.get('payment:' + reference, { type: 'json' });
}

async function putPaymentRecord(env, reference, record) {
    if (!env.OWNER_STATS || !reference) {
        return;
    }

    await env.OWNER_STATS.put('payment:' + reference, JSON.stringify(record));
}

function extractCustomFieldValue(transaction, variableName) {
    const customFields = transaction && transaction.metadata && Array.isArray(transaction.metadata.custom_fields)
        ? transaction.metadata.custom_fields
        : [];
    const field = customFields.find(function(item) {
        return item && (item.variable_name === variableName || item.display_name === variableName);
    });
    return field ? field.value : '';
}

function extractCustomerFromPaystackTransaction(transaction) {
    const customFields = transaction && transaction.metadata && Array.isArray(transaction.metadata.custom_fields)
        ? transaction.metadata.custom_fields
        : [];
    const getField = function(variableName, displayName) {
        const match = customFields.find(function(item) {
            return item && (item.variable_name === variableName || item.display_name === displayName);
        });
        return match ? String(match.value || '') : '';
    };

    return {
        name: getField('full_name', 'Full Name') || (transaction.customer && transaction.customer.first_name ? transaction.customer.first_name + ' ' + (transaction.customer.last_name || '') : ''),
        email: transaction.customer && transaction.customer.email ? transaction.customer.email : '',
        phone: getField('phone', 'Phone'),
        address: getField('address', 'Address')
    };
}

function normalizeCustomerInfo(customer) {
    return {
        name: customer && customer.name ? String(customer.name) : '',
        email: customer && customer.email ? String(customer.email) : '',
        phone: customer && customer.phone ? String(customer.phone) : '',
        address: customer && customer.address ? String(customer.address) : '',
        state: customer && customer.state ? String(customer.state) : '',
        city: customer && customer.city ? String(customer.city) : '',
        specialRequest: customer && customer.specialRequest ? String(customer.specialRequest) : ''
    };
}

// =========================================================
// DISCORD / TELEGRAM NOTIFICATIONS
// =========================================================
async function sendOrderNotifications(env, payload) {
    const jobs = [];

    if (env.DISCORD_WEBHOOK_URL) {
        jobs.push(sendDiscordNotification(env.DISCORD_WEBHOOK_URL, payload));
    }

    if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
        jobs.push(sendTelegramNotification(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, payload));
    }

    if (!jobs.length) return;

    const results = await Promise.allSettled(jobs);
    results.forEach(function(result) {
        if (result.status === 'rejected') {
            console.error('Order notification failed:', result.reason && result.reason.message ? result.reason.message : result.reason);
        }
    });
}

async function sendDiscordNotification(webhookUrl, payload) {
    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: null,
            embeds: [
                {
                    title: payload.title || 'Order notification',
                    description: buildNotificationBody(payload),
                    color: getNotificationColor(payload.event),
                    timestamp: new Date().toISOString()
                }
            ]
        })
    });

    if (!response.ok) {
        throw new Error('Discord webhook error: ' + response.status + ' ' + await response.text());
    }
}

async function sendTelegramNotification(botToken, chatId, payload) {
    const response = await fetch('https://api.telegram.org/bot' + botToken + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: buildNotificationBody(payload),
            parse_mode: 'HTML'
        })
    });

    if (!response.ok) {
        throw new Error('Telegram API error: ' + response.status + ' ' + await response.text());
    }
}

function buildNotificationBody(payload) {
    const customer = payload.customer || {};
    const lines = [
        '<b>' + escapeHtmlText(payload.title || 'Order notification') + '</b>',
        'Order Ref: ' + escapeHtmlText(payload.orderRef || 'N/A'),
        'Package: ' + escapeHtmlText(payload.packageId || 'N/A'),
        'Amount: ' + escapeHtmlText(formatNotificationAmount(payload.amount, payload.currency)),
        'Customer: ' + escapeHtmlText(customer.name || 'N/A'),
        'Email: ' + escapeHtmlText(customer.email || 'N/A'),
        'Phone: ' + escapeHtmlText(customer.phone || 'N/A')
    ];

    if (customer.address) {
        lines.push('Address: ' + escapeHtmlText(customer.address));
    }

    if (Array.isArray(payload.details)) {
        payload.details.forEach(function(detail) {
            if (detail) lines.push(escapeHtmlText(detail));
        });
    }

    return lines.join('\n');
}

function formatNotificationAmount(amount, currency) {
    if (amount === undefined || amount === null || amount === '') {
        return 'N/A';
    }
    return String(amount) + ' ' + String(currency || '');
}

function getNotificationColor(eventName) {
    if (eventName === 'paystack_attempt_failed') return 15158332;
    if (eventName === 'paystack_attempt_abandoned') return 16753920;
    if (eventName === 'manual_order_received') return 3447003;
    return 3066993;
}

function escapeHtmlText(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

let siteModeCache = { loadedAt: 0, value: 'singleproduct', promise: null };
let siteConfigCache = { loadedAt: 0, key: '', value: null, promise: null };

async function getSiteMode(env) {
    const ttlMs = 5 * 60 * 1000;
    const now = Date.now();
    if (siteModeCache.value && now - siteModeCache.loadedAt < ttlMs) {
        return siteModeCache.value;
    }

    if (siteModeCache.promise) {
        return siteModeCache.promise;
    }

    siteModeCache.promise = (async function() {
        if (!env.ASSETS || typeof env.ASSETS.fetch !== 'function') {
            siteModeCache.value = 'singleproduct';
            siteModeCache.loadedAt = Date.now();
            return siteModeCache.value;
        }

        const response = await env.ASSETS.fetch(new Request('http://internal/js/site_selector.js'));
        if (!response || !response.ok) {
            siteModeCache.value = 'singleproduct';
            siteModeCache.loadedAt = Date.now();
            return siteModeCache.value;
        }

        const text = await response.text();
        const cleaned = stripJsComments(text);
        const regex = /const\s+WEBSITE_TYPE_SELECT\s*=\s*["']([^"']+)["']\s*;?/ig;
        const matches = Array.from(String(cleaned || '').matchAll(regex));
        const value = String(matches.length ? matches[matches.length - 1][1] : '').trim().toLowerCase();
        const mode = (value === 'multipleproducts' || value === 'affiliate' || value === 'singleproduct' || value === 'sigleproduct')
            ? (value === 'sigleproduct' ? 'singleproduct' : value)
            : 'singleproduct';

        siteModeCache.value = mode;
        siteModeCache.loadedAt = Date.now();
        return siteModeCache.value;
    })().finally(function() {
        siteModeCache.promise = null;
    });

    return siteModeCache.promise;
}

async function getEmailContext(env) {
    const site = await getSiteConfig(env);
    const business = site && site.BUSINESS ? site.BUSINESS : {};
    const brand = site && site.BRAND ? site.BRAND : {};
    const product = site && site.PRODUCT ? site.PRODUCT : {};
    const packages = site && Array.isArray(site.PACKAGES) ? site.PACKAGES : [];

    const website = String(business.website || env.BUSINESS_WEBSITE || '').trim();
    let logoUrl = '';
    if (website) {
        try {
            logoUrl = new URL('/productsimages/logo.jpg', website).toString();
        } catch (error) {
            logoUrl = '';
        }
    }

    const resolvedBrand = {
        businessName: String(business.name || env.BUSINESS_NAME || ''),
        shortName: String(business.shortName || env.BUSINESS_SHORT_NAME || ''),
        website: website,
        primary: String(brand.primaryColor || env.BRAND_PRIMARY_COLOR || '#0f172a'),
        primaryDark: String(brand.primaryDark || env.BRAND_PRIMARY_DARK || '#0b1220'),
        surface: String(brand.backgroundColor || env.BRAND_SURFACE_COLOR || '#FFFFFF'),
        background: String(brand.lightBackground || env.BRAND_BACKGROUND_COLOR || '#F8FAFC'),
        text: String(brand.textColor || env.BRAND_TEXT_COLOR || '#111827'),
        muted: String(brand.mutedTextColor || env.BRAND_MUTED_TEXT_COLOR || '#6B7280'),
        border: String(brand.borderColor || env.BRAND_BORDER_COLOR || '#E5E7EB'),
        logoUrl: logoUrl
    };

    return {
        site: {
            business: business,
            brand: brand,
            product: product,
            packages: packages
        },
        brand: resolvedBrand
    };
}

async function getSiteConfig(env) {
    const ttlMs = 5 * 60 * 1000;
    const now = Date.now();
    const mode = await getSiteMode(env);
    const configPath = mode === 'multipleproducts'
        ? '/js/config2.js'
        : (mode === 'affiliate' ? '/js/config3.js' : '/js/config.js');
    const cacheKey = mode + ':' + configPath;

    if (siteConfigCache.value && siteConfigCache.key === cacheKey && now - siteConfigCache.loadedAt < ttlMs) {
        return siteConfigCache.value;
    }

    if (siteConfigCache.promise) {
        return siteConfigCache.promise;
    }

    siteConfigCache.promise = (async function() {
        if (!env.ASSETS || typeof env.ASSETS.fetch !== 'function') {
            siteConfigCache.value = null;
            siteConfigCache.key = cacheKey;
            siteConfigCache.loadedAt = Date.now();
            return siteConfigCache.value;
        }

        const response = await env.ASSETS.fetch(new Request('http://internal' + configPath));
        if (!response || !response.ok) {
            siteConfigCache.value = null;
            siteConfigCache.key = cacheKey;
            siteConfigCache.loadedAt = Date.now();
            return siteConfigCache.value;
        }

        const text = await response.text();
        const site = {
            BUSINESS: parseJsConst(text, 'BUSINESS'),
            BRAND: parseJsConst(text, 'BRAND'),
            PRODUCT: parseJsConst(text, 'PRODUCT'),
            PACKAGES: parseJsConst(text, 'PACKAGES'),
            PRODUCTS: parseJsConst(text, 'PRODUCTS'),
            AFFILIATE_PRODUCTS: parseJsConst(text, 'AFFILIATE_PRODUCTS'),
            PAYMENT: parseJsConst(text, 'PAYMENT'),
            MANUAL_PAYMENT: parseJsConst(text, 'MANUAL_PAYMENT')
        };

        siteConfigCache.value = site;
        siteConfigCache.key = cacheKey;
        siteConfigCache.loadedAt = Date.now();
        return siteConfigCache.value;
    })().finally(function() {
        siteConfigCache.promise = null;
    });

    return siteConfigCache.promise;
}

function parseJsConst(source, name) {
    try {
        const literal = extractConstLiteral(source, name);
        if (!literal) return null;
        return parseJsLiteral(literal);
    } catch (error) {
        return null;
    }
}

function stripJsComments(value) {
    return String(value || '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function extractConstLiteral(source, name) {
    const input = String(source || '');
    const marker = 'const ' + name;
    const start = input.indexOf(marker);
    if (start < 0) return '';
    const eq = input.indexOf('=', start);
    if (eq < 0) return '';

    let i = eq + 1;
    while (i < input.length && /\s/.test(input[i])) i += 1;
    const open = input[i];
    const close = open === '{' ? '}' : (open === '[' ? ']' : '');
    if (!close) return '';

    let depth = 0;
    let inString = false;
    let quote = '';
    let escape = false;
    let endIndex = -1;

    for (; i < input.length; i += 1) {
        const ch = input[i];
        if (inString) {
            if (escape) {
                escape = false;
                continue;
            }
            if (ch === '\\\\') {
                escape = true;
                continue;
            }
            if (ch === quote) {
                inString = false;
                quote = '';
            }
            continue;
        }

        if (ch === '"' || ch === "'") {
            inString = true;
            quote = ch;
            continue;
        }

        if (ch === open) {
            depth += 1;
            continue;
        }

        if (ch === close) {
            depth -= 1;
            if (depth === 0) {
                endIndex = i + 1;
                break;
            }
        }
    }

    if (endIndex < 0) return '';
    return input.slice(eq + 1, endIndex).trim();
}

function parseJsLiteral(value) {
    let text = stripJsComments(value).trim();
    if (!text) return null;
    text = text.replace(/;\s*$/, '');
    text = text.replace(/([,{]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":');
    text = text.replace(/,(\s*[}\]])/g, '$1');
    return JSON.parse(text);
}

function buildEmailShell(context, options) {
    const brand = context.brand;
    const title = escapeHtmlText(options.title || brand.shortName || brand.businessName);
    const preheader = escapeHtmlText(options.preheader || '');
    const content = String(options.contentHtml || '');
    const year = new Date().getUTCFullYear();
    const footerLine = escapeHtmlText(options.footerLine || ('© ' + year + ' ' + (brand.businessName || brand.shortName || '') + '.'));
    const website = String(brand.website || '').trim();
    const websiteHtml = website ? ('<a href="' + escapeHtmlText(website) + '" style="color:' + escapeHtmlText(brand.primary) + ';text-decoration:none;">' + escapeHtmlText(website) + '</a>') : '';
    const logoUrl = String(brand.logoUrl || '').trim();
    const logoHtml = logoUrl
        ? ('<img src="' + escapeHtmlText(logoUrl) + '" width="44" height="44" style="display:block;width:44px;height:44px;border-radius:12px;object-fit:cover;" alt="' + escapeHtmlText(brand.shortName || brand.businessName || 'Logo') + '" />')
        : ('<div style="width:44px;height:44px;border-radius:12px;background:' + escapeHtmlText(brand.primary) + ';"></div>');

    return [
        '<!doctype html>',
        '<html>',
        '<head>',
        '<meta charset="utf-8" />',
        '<meta name="viewport" content="width=device-width,initial-scale=1" />',
        '<title>' + title + '</title>',
        '</head>',
        '<body style="margin:0;padding:0;background:' + escapeHtmlText(brand.background) + ';font-family:Inter,Segoe UI,Arial,sans-serif;color:' + escapeHtmlText(brand.text) + ';">',
        '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">' + preheader + '</div>',
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:' + escapeHtmlText(brand.background) + ';padding:24px 0;">',
        '<tr><td align="center">',
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;">',
        '<tr><td style="padding:0 16px 16px 16px;">',
        '<div style="display:flex;align-items:center;gap:12px;">',
        logoHtml,
        '<div>',
        '<div style="font-weight:800;font-size:18px;line-height:1.2;">' + escapeHtmlText(brand.shortName) + '</div>',
        '<div style="color:' + escapeHtmlText(brand.muted) + ';font-size:13px;line-height:1.4;">' + escapeHtmlText(brand.businessName) + '</div>',
        '</div>',
        '</div>',
        '</td></tr>',
        '<tr><td style="padding:0 16px;">',
        '<div style="background:' + escapeHtmlText(brand.surface) + ';border:1px solid ' + escapeHtmlText(brand.border) + ';border-radius:18px;overflow:hidden;box-shadow:0 10px 25px rgba(17,24,39,0.08);">',
        '<div style="padding:22px 22px 0 22px;">' + content + '</div>',
        '<div style="padding:18px 22px 22px 22px;color:' + escapeHtmlText(brand.muted) + ';font-size:12px;line-height:1.6;border-top:1px solid ' + escapeHtmlText(brand.border) + ';margin-top:22px;">',
        '<div>' + footerLine + '</div>',
        (websiteHtml ? ('<div style="margin-top:6px;">' + websiteHtml + '</div>') : ''),
        '</div>',
        '</div>',
        '</td></tr>',
        '</table>',
        '</td></tr>',
        '</table>',
        '</body>',
        '</html>'
    ].join('');
}

function buildEmailKeyValueRows(rows, context) {
    const brand = context.brand;
    const border = escapeHtmlText(brand.border);
    const muted = escapeHtmlText(brand.muted);
    const html = rows.map(function(row) {
        return [
            '<tr>',
            '<td style="padding:10px 12px;border-bottom:1px solid ' + border + ';color:' + muted + ';font-size:13px;width:42%;">' + escapeHtmlText(row.label) + '</td>',
            '<td style="padding:10px 12px;border-bottom:1px solid ' + border + ';font-size:13px;font-weight:600;">' + escapeHtmlText(row.value) + '</td>',
            '</tr>'
        ].join('');
    }).join('');

    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ' + border + ';border-radius:14px;border-collapse:separate;border-spacing:0;overflow:hidden;margin-top:14px;">' + html + '</table>';
}

function buildEmailLineItemsTable(items, context, currency) {
    const brand = context.brand;
    const border = escapeHtmlText(brand.border);
    const muted = escapeHtmlText(brand.muted);
    const suffix = currency ? (' ' + String(currency)) : '';
    const rows = (Array.isArray(items) ? items : []).map(function(item) {
        const title = String(item.productTitle || item.product || item.productId || '');
        const variant = String(item.packageTitle || item.package || item.packageId || '');
        const qty = String(item.qty || item.quantity || 0);
        const total = item.lineTotal !== undefined ? (String(item.lineTotal) + suffix) : '';
        return [
            '<tr>',
            '<td style="padding:10px 12px;border-bottom:1px solid ' + border + ';font-size:13px;font-weight:700;">' + escapeHtmlText(title) + '<div style="margin-top:4px;color:' + muted + ';font-weight:500;font-size:12px;">' + escapeHtmlText(variant) + '</div></td>',
            '<td style="padding:10px 12px;border-bottom:1px solid ' + border + ';font-size:13px;text-align:right;">' + escapeHtmlText(qty) + '</td>',
            '<td style="padding:10px 12px;border-bottom:1px solid ' + border + ';font-size:13px;text-align:right;font-weight:700;">' + escapeHtmlText(total) + '</td>',
            '</tr>'
        ].join('');
    }).join('');

    if (!rows) return '';

    return [
        '<div style="margin-top:16px;font-weight:800;">Items</div>',
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ' + border + ';border-radius:14px;border-collapse:separate;border-spacing:0;overflow:hidden;margin-top:10px;">',
        '<tr>',
        '<th align="left" style="padding:10px 12px;border-bottom:1px solid ' + border + ';color:' + muted + ';font-size:12px;font-weight:700;">Item</th>',
        '<th align="right" style="padding:10px 12px;border-bottom:1px solid ' + border + ';color:' + muted + ';font-size:12px;font-weight:700;">Qty</th>',
        '<th align="right" style="padding:10px 12px;border-bottom:1px solid ' + border + ';color:' + muted + ';font-size:12px;font-weight:700;">Total</th>',
        '</tr>',
        rows,
        '</table>'
    ].join('');
}

function getPackageById(packages, id) {
    const list = Array.isArray(packages) ? packages : [];
    const key = String(id || '').trim();
    if (!key) return null;
    return list.find(function(item) {
        return item && String(item.id || '').trim() === key;
    }) || null;
}

function buildAddressLine(customer) {
    if (!customer) return '';
    const parts = [];
    if (customer.address) parts.push(String(customer.address));
    if (customer.city) parts.push(String(customer.city));
    if (customer.state) parts.push(String(customer.state));
    return parts.filter(Boolean).join(', ');
}

function buildOwnerEmailHtml(transaction, method, customer, context, record) {
    const amount = String((transaction.amount || 0) / 100);
    const currency = String(transaction.currency || '');
    const packageId = extractCustomFieldValue(transaction, 'package') || '';
    const pkg = getPackageById(context.site.packages, packageId);
    const productName = context.site.product && context.site.product.name ? String(context.site.product.name) : '';

    const hasRecord = Boolean(record && record.reference);
    const displayCurrency = hasRecord ? String(record.currency || currency || '') : currency;
    const displayAmount = hasRecord ? String(record.amount || '') : amount;
    const displayShipping = hasRecord ? Number(record.shippingFee || 0) : 0;
    const displaySubtotal = hasRecord ? Number(record.subtotal || 0) : 0;
    const isCart = hasRecord && Array.isArray(record.items) && record.items.length;

    const rows = [
        { label: 'Reference', value: hasRecord ? String(record.reference || '') : (transaction.reference || '') },
        { label: 'Amount', value: displayAmount + ' ' + displayCurrency }
    ];

    if (isCart) {
        if (displaySubtotal) rows.push({ label: 'Subtotal', value: String(displaySubtotal) + ' ' + displayCurrency });
        if (displayShipping) rows.push({ label: 'Shipping', value: String(displayShipping) + ' ' + displayCurrency });
        rows.push({ label: 'Items', value: String(record.quantity || 0) });
    } else {
        const resolvedProductName = hasRecord && record.productTitle ? String(record.productTitle) : (productName || '');
        const resolvedPackageTitle = hasRecord && record.packageTitle ? String(record.packageTitle) : (pkg ? String(pkg.title || pkg.id || '') : packageId);
        const resolvedQuantity = hasRecord ? String(record.quantity || '') : String(extractCustomFieldValue(transaction, 'quantity') || (pkg && pkg.quantity ? pkg.quantity : ''));
        if (resolvedProductName) rows.push({ label: 'Product', value: resolvedProductName });
        if (resolvedPackageTitle) rows.push({ label: 'Package', value: resolvedPackageTitle });
        if (resolvedQuantity) rows.push({ label: 'Quantity', value: resolvedQuantity });
        if (displayShipping) rows.push({ label: 'Shipping', value: String(displayShipping) + ' ' + displayCurrency });
    }

    rows.push({ label: 'Payment Method', value: String(method || '') });
    rows.push({ label: 'Status', value: String(transaction.status || '') });

    const customerLines = [];
    if (customer && !Array.isArray(customer)) {
        customerLines.push('Name: ' + String(customer.name || ''));
        customerLines.push('Email: ' + String(customer.email || ''));
        customerLines.push('Phone: ' + String(customer.phone || ''));
        customerLines.push('Address: ' + buildAddressLine(customer));
        if (customer.specialRequest) customerLines.push('Special Request: ' + String(customer.specialRequest));
    } else if (Array.isArray(customer)) {
        customer.forEach(function(field) {
            if (!field) return;
            customerLines.push(String(field.display_name || field.variable_name || 'Field') + ': ' + String(field.value || ''));
        });
    }

    const customerHtml = customerLines.length
        ? '<div style="margin-top:16px;font-weight:700;">Customer details</div><div style="margin-top:8px;color:' + escapeHtmlText(context.brand.muted) + ';font-size:13px;line-height:1.7;">' + customerLines.map(function(line) { return escapeHtmlText(line); }).join('<br/>') + '</div>'
        : '';

    const headline = '<div style="font-size:18px;font-weight:800;margin:0 0 6px 0;">New order received</div>' +
        '<div style="color:' + escapeHtmlText(context.brand.muted) + ';font-size:13px;line-height:1.6;">A customer just placed an order. Please review and process it.</div>';

    return buildEmailShell(context, {
        title: 'New order - ' + String(transaction.reference || ''),
        preheader: 'New order received: ' + String(transaction.reference || ''),
        contentHtml: headline + buildEmailKeyValueRows(rows, context) + (isCart ? buildEmailLineItemsTable(record.items, context, displayCurrency) : '') + customerHtml
    });
}

function buildCustomerEmailHtml(transaction, method, customer, context, record) {
    const amount = String((transaction.amount || 0) / 100);
    const currency = String(transaction.currency || '');
    const packageId = extractCustomFieldValue(transaction, 'package') || '';
    const pkg = getPackageById(context.site.packages, packageId);
    const productName = context.site.product && context.site.product.name ? String(context.site.product.name) : '';
    const hasRecord = Boolean(record && record.reference);
    const displayCurrency = hasRecord ? String(record.currency || currency || '') : currency;
    const displayAmount = hasRecord ? String(record.amount || '') : amount;
    const displayShipping = hasRecord ? Number(record.shippingFee || 0) : 0;
    const displaySubtotal = hasRecord ? Number(record.subtotal || 0) : 0;
    const isCart = hasRecord && Array.isArray(record.items) && record.items.length;

    const rows = [
        { label: 'Order reference', value: hasRecord ? String(record.reference || '') : (transaction.reference || '') },
        { label: 'Amount paid', value: displayAmount + ' ' + displayCurrency }
    ];

    if (isCart) {
        if (displaySubtotal) rows.push({ label: 'Subtotal', value: String(displaySubtotal) + ' ' + displayCurrency });
        if (displayShipping) rows.push({ label: 'Shipping', value: String(displayShipping) + ' ' + displayCurrency });
        rows.push({ label: 'Items', value: String(record.quantity || 0) });
    } else {
        const resolvedProductName = hasRecord && record.productTitle ? String(record.productTitle) : (productName || '');
        const resolvedPackageTitle = hasRecord && record.packageTitle ? String(record.packageTitle) : (pkg ? String(pkg.title || pkg.id || '') : packageId);
        const resolvedQuantity = hasRecord ? String(record.quantity || '') : String(extractCustomFieldValue(transaction, 'quantity') || (pkg && pkg.quantity ? pkg.quantity : ''));
        if (resolvedProductName) rows.push({ label: 'Product', value: resolvedProductName });
        if (resolvedPackageTitle) rows.push({ label: 'Package', value: resolvedPackageTitle });
        if (resolvedQuantity) rows.push({ label: 'Quantity', value: resolvedQuantity });
        if (displayShipping) rows.push({ label: 'Shipping', value: String(displayShipping) + ' ' + displayCurrency });
    }

    rows.push({ label: 'Payment method', value: String(method || '') });

    const greeting = '<div style="font-size:18px;font-weight:800;margin:0 0 6px 0;">Payment received</div>' +
        '<div style="color:' + escapeHtmlText(context.brand.muted) + ';font-size:13px;line-height:1.6;">Thank you for your purchase. Your order is confirmed and will be processed shortly.</div>';

    const note = '<div style="margin-top:16px;color:' + escapeHtmlText(context.brand.muted) + ';font-size:13px;line-height:1.7;">Keep this reference handy: <span style="font-weight:700;color:' + escapeHtmlText(context.brand.text) + ';">' + escapeHtmlText(String(transaction.reference || '')) + '</span>.</div>';

    return buildEmailShell(context, {
        title: 'Order confirmation - ' + String(transaction.reference || ''),
        preheader: 'Your order is confirmed: ' + String(transaction.reference || ''),
        contentHtml: greeting + buildEmailKeyValueRows(rows, context) + (isCart ? buildEmailLineItemsTable(record.items, context, displayCurrency) : '') + note
    });
}

function buildManualOrderEmailHtml(data, context) {
    const productName = data.product || (context.site.product && context.site.product.name ? String(context.site.product.name) : '');
    const isCart = Array.isArray(data.items) && data.items.length;
    const currency = String(data.currency || '');
    const rows = [
        { label: 'Order reference', value: data.order_ref || '' }
    ];

    if (isCart) {
        if (data.subtotal !== undefined) rows.push({ label: 'Subtotal', value: String(data.subtotal || 0) + ' ' + currency });
        if (data.shipping_fee !== undefined) rows.push({ label: 'Shipping', value: String(data.shipping_fee || 0) + ' ' + currency });
        rows.push({ label: 'Items', value: String(data.quantity || 0) });
        rows.push({ label: 'Amount', value: String(data.amount || 0) + ' ' + currency });
    } else {
        rows.push({ label: 'Product', value: productName || '' });
        rows.push({ label: 'Package', value: data.package_title || '' });
        rows.push({ label: 'Quantity', value: String(data.quantity || 0) });
        if (data.shipping_fee) rows.push({ label: 'Shipping', value: String(data.shipping_fee || 0) + ' ' + currency });
        rows.push({ label: 'Amount', value: String(data.amount || 0) + ' ' + currency });
    }

    rows.push({ label: 'Receipt attached', value: data.receipt ? 'Yes' : 'No' });

    const headline = '<div style="font-size:18px;font-weight:800;margin:0 0 6px 0;">Manual order received</div>' +
        '<div style="color:' + escapeHtmlText(context.brand.muted) + ';font-size:13px;line-height:1.6;">A customer submitted a manual bank transfer order. Please verify payment and process the order.</div>';

    const addressLine = buildAddressLine(data.customer);
    const customerLines = [
        'Name: ' + String(data.customer && data.customer.name ? data.customer.name : ''),
        'Phone: ' + String(data.customer && data.customer.phone ? data.customer.phone : ''),
        'Email: ' + String(data.customer && data.customer.email ? data.customer.email : ''),
        'Address: ' + (addressLine || 'Not required'),
        'State: ' + String(data.customer && data.customer.state ? data.customer.state : ''),
        'City: ' + String(data.customer && data.customer.city ? data.customer.city : '')
    ].filter(function(line) { return !/:\s*$/.test(line); });

    const customerHtml = '<div style="margin-top:16px;font-weight:700;">Customer details</div><div style="margin-top:8px;color:' + escapeHtmlText(context.brand.muted) + ';font-size:13px;line-height:1.7;">' + customerLines.map(function(line) { return escapeHtmlText(line); }).join('<br/>') + '</div>';

    return buildEmailShell(context, {
        title: 'Manual order - ' + String(data.order_ref || ''),
        preheader: 'Manual order received: ' + String(data.order_ref || ''),
        contentHtml: headline + buildEmailKeyValueRows(rows, context) + (isCart ? buildEmailLineItemsTable(data.items, context, currency) : '') + customerHtml
    });
}

function buildManualCustomerEmailHtml(data, context) {
    const brand = context.brand;
    const name = data.customer && data.customer.name ? data.customer.name : 'Valued customer';
    const greeting = '<div style="font-size:18px;font-weight:800;margin:0 0 6px 0;">We received your order</div>' +
        '<div style="color:' + escapeHtmlText(brand.muted) + ';font-size:13px;line-height:1.6;">Thank you, ' + escapeHtmlText(name) + '. Your order has been received and is awaiting payment confirmation.</div>';

    const productName = data.product || (context.site.product && context.site.product.name ? String(context.site.product.name) : '');
    const isCart = Array.isArray(data.items) && data.items.length;
    const currency = String(data.currency || '');
    const rows = [
        { label: 'Order reference', value: data.order_ref || '' },
        { label: 'Amount', value: String(data.amount || 0) + ' ' + currency }
    ];

    if (isCart) {
        if (data.subtotal !== undefined) rows.push({ label: 'Subtotal', value: String(data.subtotal || 0) + ' ' + currency });
        if (data.shipping_fee !== undefined) rows.push({ label: 'Shipping', value: String(data.shipping_fee || 0) + ' ' + currency });
        rows.push({ label: 'Items', value: String(data.quantity || 0) });
    } else {
        rows.splice(1, 0, { label: 'Product', value: productName || '' });
        rows.splice(2, 0, { label: 'Package', value: data.package_title || '' });
    }

    const note = '<div style="margin-top:16px;color:' + escapeHtmlText(brand.muted) + ';font-size:13px;line-height:1.7;">Please complete your bank transfer and send your proof of payment. Once confirmed, we will process your order.</div>';

    return buildEmailShell(context, {
        title: 'Order received - ' + String(data.order_ref || ''),
        preheader: 'Order received: ' + String(data.order_ref || ''),
        contentHtml: greeting + buildEmailKeyValueRows(rows, context) + (isCart ? buildEmailLineItemsTable(data.items, context, currency) : '') + note
    });
}

// =========================================================
// EMAIL BUILDERS
// =========================================================
function buildOwnerEmail(transaction, method, customer, record) {
    let customerDetails = '';
    let packageLine = '';
    let quantityLine = '';
    if (Array.isArray(customer)) {
        customer.forEach(function(field) {
            customerDetails += field.display_name + ': ' + field.value + '\\n';
        });
        packageLine = String(extractCustomFieldValue(transaction, 'package') || '');
        quantityLine = String(extractCustomFieldValue(transaction, 'quantity') || '');
    } else if (customer) {
        customerDetails = 'Name: ' + (customer.name || '') + '\\n';
        customerDetails += 'Email: ' + (customer.email || '') + '\\n';
        customerDetails += 'Phone: ' + (customer.phone || '') + '\\n';
        const address = [customer.address || '', customer.city || '', customer.state || ''].filter(Boolean).join(', ');
        customerDetails += 'Address: ' + address + '\\n';
        if (customer.specialRequest) {
            customerDetails += 'Special Request: ' + customer.specialRequest + '\\n';
        }
        packageLine = String(customer.packageId || '');
        quantityLine = String(customer.quantity || '');
    }

    const lines = [];
    if (record && Array.isArray(record.items) && record.items.length) {
        lines.push('ITEMS:');
        record.items.forEach(function(item) {
            if (!item) return;
            lines.push('- ' + String(item.productTitle || item.productId || '') + ' (' + String(item.packageTitle || item.packageId || '') + ') x' + String(item.qty || 0) + ' = ' + String(item.lineTotal || '') + ' ' + String(record.currency || ''));
        });
        if (record.subtotal !== undefined) lines.push('Subtotal: ' + String(record.subtotal) + ' ' + String(record.currency || ''));
        if (record.shippingFee !== undefined) lines.push('Shipping: ' + String(record.shippingFee) + ' ' + String(record.currency || ''));
    } else if (record && (record.productTitle || record.packageTitle)) {
        if (record.productTitle) lines.push('Product: ' + String(record.productTitle));
        if (record.packageTitle) lines.push('Package: ' + String(record.packageTitle));
        if (record.quantity !== undefined) lines.push('Quantity: ' + String(record.quantity));
        if (record.shippingFee) lines.push('Shipping: ' + String(record.shippingFee) + ' ' + String(record.currency || transaction.currency || ''));
    }

    const recordAmount = record && record.amount !== undefined ? String(record.amount) : String((transaction.amount || 0) / 100);
    const recordCurrency = record && record.currency ? String(record.currency) : String(transaction.currency || '');

    return 'NEW ORDER RECEIVED\\n\\n' +
        'Reference: ' + transaction.reference + '\\n' +
        (lines.length ? (lines.join('\\n') + '\\n') : '') +
        (!lines.length && packageLine ? ('Package: ' + packageLine + '\\n') : '') +
        (!lines.length && quantityLine ? ('Quantity: ' + quantityLine + '\\n') : '') +
        'Amount: ' + recordAmount + ' ' + recordCurrency + '\\n' +
        'Payment Method: ' + method + '\\n' +
        'Status: ' + transaction.status + '\\n\\n' +
        'CUSTOMER DETAILS:\\n' +
        customerDetails + '\\n' +
        'Please process this order promptly.';
}

function buildCustomerEmail(transaction, method, customer, record) {
    const packageLine = record && record.packageTitle ? String(record.packageTitle) : String(extractCustomFieldValue(transaction, 'package') || '');
    const quantityLine = record && record.quantity !== undefined ? String(record.quantity) : String(extractCustomFieldValue(transaction, 'quantity') || '');
    const recordAmount = record && record.amount !== undefined ? String(record.amount) : String((transaction.amount || 0) / 100);
    const recordCurrency = record && record.currency ? String(record.currency) : String(transaction.currency || '');

    let itemsText = '';
    if (record && Array.isArray(record.items) && record.items.length) {
        itemsText = 'Items:\\n' + record.items.map(function(item) {
            return '- ' + String(item.productTitle || item.productId || '') + ' (' + String(item.packageTitle || item.packageId || '') + ') x' + String(item.qty || 0) + ' = ' + String(item.lineTotal || '') + ' ' + recordCurrency;
        }).join('\\n') + '\\n\\n';
    }

    return 'Thank you for your order!\\n\\n' +
        'Order Reference: ' + transaction.reference + '\\n' +
        itemsText +
        (packageLine ? ('Package: ' + packageLine + '\\n') : '') +
        (quantityLine ? ('Quantity: ' + quantityLine + '\\n') : '') +
        'Amount: ' + recordAmount + ' ' + recordCurrency + '\\n' +
        'Payment Method: ' + method + '\\n\\n' +
        'We have received your payment and will process your order shortly.\\n' +
        'Thank you for shopping with us!';
}

function buildManualOrderEmail(data) {
    const currency = String(data.currency || '');
    let itemsBlock = '';
    if (Array.isArray(data.items) && data.items.length) {
        itemsBlock = 'ITEMS:\\n' + data.items.map(function(item) {
            return '- ' + String(item.productTitle || item.productId || '') + ' (' + String(item.packageTitle || item.packageId || '') + ') x' + String(item.qty || 0) + ' = ' + String(item.lineTotal || '') + ' ' + currency;
        }).join('\\n') + '\\n\\n' +
        'Subtotal: ' + String(data.subtotal || 0) + ' ' + currency + '\\n' +
        'Shipping: ' + String(data.shipping_fee || 0) + ' ' + currency + '\\n';
    }

    return 'NEW MANUAL PAYMENT ORDER\\n\\n' +
        'Order Reference: ' + data.order_ref + '\\n' +
        'Product: ' + data.product + '\\n' +
        'Product Type: ' + (data.product_type || 'physical') + '\\n' +
        (itemsBlock ? itemsBlock : ('Package: ' + data.package_title + '\\n' + 'Quantity: ' + data.quantity + '\\n')) +
        'Amount: ' + data.amount + ' ' + data.currency + '\\n\\n' +
        'CUSTOMER DETAILS:\\n' +
        'Name: ' + (data.customer.name || '') + '\\n' +
        'Phone: ' + (data.customer.phone || '') + '\\n' +
        'Email: ' + (data.customer.email || '') + '\\n' +
        'Address: ' + (data.customer.address || 'Not required') + '\\n' +
        'State: ' + (data.customer.state || '') + '\\n' +
        'City: ' + (data.customer.city || '') + '\\n' +
        'Special Request: ' + (data.customer.specialRequest || 'None') + '\\n' +
        'Receipt Attached: ' + (data.receipt ? 'Yes - ' + data.receipt.name + ' (' + data.receipt.type + ', ' + data.receipt.size + ' bytes)' : 'No') + '\\n\\n' +
        'Payment Method: Manual Bank Transfer\\n' +
        'Please verify payment and process the order.';
}

function buildManualCustomerEmail(data) {
    const currency = String(data.currency || '');
    let itemsBlock = '';
    if (Array.isArray(data.items) && data.items.length) {
        itemsBlock = 'Items:\\n' + data.items.map(function(item) {
            return '- ' + String(item.productTitle || item.productId || '') + ' (' + String(item.packageTitle || item.packageId || '') + ') x' + String(item.qty || 0) + ' = ' + String(item.lineTotal || '') + ' ' + currency;
        }).join('\\n') + '\\n\\n' +
        'Subtotal: ' + String(data.subtotal || 0) + ' ' + currency + '\\n' +
        'Shipping: ' + String(data.shipping_fee || 0) + ' ' + currency + '\\n';
    }

    return 'Hello ' + (data.customer.name || 'Valued Customer') + ',\\n\\n' +
        'Thank you for your order!\\n\\n' +
        'Order Reference: ' + data.order_ref + '\\n' +
        (itemsBlock ? itemsBlock : ('Product: ' + data.product + '\\n' + 'Package: ' + data.package_title + '\\n')) +
        'Amount: ' + data.amount + ' ' + data.currency + '\\n\\n' +
        'Please complete your bank transfer and send proof of payment via WhatsApp or email.\\n' +
        'Your order will be processed once payment is confirmed.\\n\\n' +
        'Thank you for choosing us!';
}

// =========================================================
// SMTP EMAIL SENDER (Gmail)
// =========================================================
async function sendEmail(env, email) {
    const smtpConfigured = Boolean(env.GMAIL_SMTP_USER && env.GMAIL_SMTP_PASSWORD);
    let smtpError = null;

    if (smtpConfigured) {
        try {
            await withTimeout(sendViaGmailSmtp(env, email), 15000, 'Gmail SMTP timed out');
            return { provider: 'gmail-smtp' };
        } catch (error) {
            smtpError = error;
            console.error('Gmail SMTP send failed:', error && error.message ? error.message : error);
        }
    }

    if (env.RESEND_API_KEY) {
        try {
            await withTimeout(sendViaResend(env, email), 15000, 'Resend send timed out');
            return { provider: 'resend' };
        } catch (error) {
            console.error('Resend fallback failed:', error && error.message ? error.message : error);
            throw error;
        }
    }

    if (smtpError) {
        throw smtpError;
    }

    throw new Error('No email provider configured. Set Gmail SMTP credentials or RESEND_API_KEY.');
}

async function sendViaGmailSmtp(env, email) {
    const host = env.GMAIL_SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(env.GMAIL_SMTP_PORT || '465', 10);
    const user = env.GMAIL_SMTP_USER;
    const pass = env.GMAIL_SMTP_PASSWORD;
    const from = env.GMAIL_FROM_EMAIL || user;
    const toList = Array.isArray(email.to) ? email.to : [email.to];
    const message = buildMimeMessage({
        from: from,
        to: toList,
        subject: email.subject,
        text: email.text || '',
        html: email.html || '',
        attachments: email.attachments || []
    });

    let socket = connect(
        { hostname: host, port: port },
        { secureTransport: port === 465 ? 'on' : 'starttls' }
    );
    await socket.opened;

    let client = createSmtpClient(socket);

    try {
        await client.expect('220');
        await client.command('EHLO localhost', '250');

        if (port !== 465) {
            await client.command('STARTTLS', '220');
            client.releaseLocks();
            socket = socket.startTls();
            client = createSmtpClient(socket);
            await client.command('EHLO localhost', '250');
        }

        await client.command('AUTH LOGIN', '334', true);
        await client.command(base64Encode(user), '334', true);
        await client.command(base64Encode(pass), '235', true);
        await client.command('MAIL FROM:<' + extractEmailAddress(from) + '>', '250');

        for (const recipient of toList) {
            await client.command('RCPT TO:<' + extractEmailAddress(recipient) + '>', '250');
        }

        await client.command('DATA', '354');
        await client.writeRaw(dotStuff(message) + '\r\n.\r\n');
        await client.expect('250');
        await client.command('QUIT', '221');
    } finally {
        try {
            await client.close();
        } catch (error) {
            console.error('SMTP socket close failed:', error && error.message ? error.message : error);
        }
    }
}

async function sendViaResend(env, email) {
    const from = env.RESEND_FROM_EMAIL || env.MAIL_FROM || email.from || env.GMAIL_SMTP_USER || env.OWNER_EMAIL;
    const toList = Array.isArray(email.to) ? email.to : [email.to];
    const payload = {
        from: from,
        to: toList,
        subject: email.subject,
        text: email.text || ''
    };
    if (email.html) {
        payload.html = email.html;
    }

    if (email.attachments && email.attachments.length) {
        payload.attachments = email.attachments.map(function(attachment) {
            return {
                filename: attachment.filename,
                content: attachment.contentBase64
            };
        });
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + env.RESEND_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Resend API error: ' + response.status + ' ' + errorText);
    }

    return await response.json();
}

function createSmtpClient(socket) {
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = '';
    let reader = socket.readable.getReader();
    let writer = socket.writable.getWriter();

    async function readResponse() {
        let response = '';

        while (true) {
            while (!buffer.includes('\r\n')) {
                const result = await reader.read();
                if (result.done) {
                    if (!buffer) {
                        throw new Error('SMTP socket closed unexpectedly');
                    }
                    break;
                }
                buffer += decoder.decode(result.value, { stream: true });
            }

            const newlineIndex = buffer.indexOf('\r\n');
            let line = '';

            if (newlineIndex === -1) {
                line = buffer;
                buffer = '';
            } else {
                line = buffer.slice(0, newlineIndex);
                buffer = buffer.slice(newlineIndex + 2);
            }

            response += line + '\n';

            if (/^\d{3} /.test(line) || line === '') {
                break;
            }
        }

        return response.trim();
    }

    return {
        async expect(expectedCode) {
            const response = await readResponse();
            if (!response.startsWith(expectedCode)) {
                throw new Error('SMTP expected ' + expectedCode + ' but got: ' + response);
            }
            return response;
        },
        async command(commandText, expectedCode, sensitive) {
            if (!sensitive) {
                console.log('SMTP command:', commandText.split(' ')[0]);
            }
            await writer.write(encoder.encode(commandText + '\r\n'));
            return await this.expect(expectedCode);
        },
        async writeRaw(rawText) {
            await writer.write(encoder.encode(rawText));
        },
        releaseLocks() {
            try {
                reader.releaseLock();
            } catch (error) {}
            try {
                writer.releaseLock();
            } catch (error) {}
        },
        async close() {
            try {
                await writer.close();
            } catch (error) {
                if (error) {
                    console.error('SMTP writer close warning:', error && error.message ? error.message : error);
                }
            }
            this.releaseLocks();
            try {
                socket.close();
            } catch (error) {}
        }
    };
}

function buildMimeMessage(email) {
    const headers = [
        'From: ' + formatAddressHeader(email.from),
        'To: ' + email.to.map(formatAddressHeader).join(', '),
        'Subject: ' + encodeMimeHeader(email.subject),
        'Date: ' + new Date().toUTCString(),
        'MIME-Version: 1.0'
    ];

    const hasAttachments = Boolean(email.attachments && email.attachments.length);
    const hasHtml = Boolean(email.html && String(email.html).trim());

    if (!hasAttachments && !hasHtml) {
        headers.push('Content-Type: text/plain; charset=UTF-8');
        headers.push('Content-Transfer-Encoding: 8bit');
        return headers.join('\r\n') + '\r\n\r\n' + normalizeLineBreaks(email.text || '');
    }

    const altBoundary = '----=_PMELAB_ALT_' + Math.random().toString(16).slice(2) + Date.now();
    const writeAlternativeBody = function() {
        let part = '';
        part += '--' + altBoundary + '\r\n';
        part += 'Content-Type: text/plain; charset=UTF-8\r\n';
        part += 'Content-Transfer-Encoding: 8bit\r\n\r\n';
        part += normalizeLineBreaks(email.text || '') + '\r\n';
        if (hasHtml) {
            part += '--' + altBoundary + '\r\n';
            part += 'Content-Type: text/html; charset=UTF-8\r\n';
            part += 'Content-Transfer-Encoding: 8bit\r\n\r\n';
            part += normalizeLineBreaks(String(email.html || '')) + '\r\n';
        }
        part += '--' + altBoundary + '--';
        return part;
    };

    if (!hasAttachments) {
        headers.push('Content-Type: multipart/alternative; boundary="' + altBoundary + '"');
        return headers.join('\r\n') + '\r\n\r\n' + writeAlternativeBody();
    }

    const boundary = '----=_PMELAB_MIX_' + Math.random().toString(16).slice(2) + Date.now();
    let message = headers.join('\r\n') + '\r\n';
    message += 'Content-Type: multipart/mixed; boundary="' + boundary + '"\r\n\r\n';
    message += '--' + boundary + '\r\n';
    message += 'Content-Type: multipart/alternative; boundary="' + altBoundary + '"\r\n\r\n';
    message += writeAlternativeBody() + '\r\n';

    email.attachments.forEach(function(attachment) {
        message += '--' + boundary + '\r\n';
        message += 'Content-Type: ' + (attachment.type || 'application/octet-stream') + '; name="' + sanitizeHeaderValue(attachment.filename) + '"\r\n';
        message += 'Content-Transfer-Encoding: base64\r\n';
        message += 'Content-Disposition: attachment; filename="' + sanitizeHeaderValue(attachment.filename) + '"\r\n\r\n';
        message += chunkBase64(attachment.contentBase64 || '') + '\r\n';
    });

    message += '--' + boundary + '--';
    return message;
}

function encodeMimeHeader(value) {
    const text = String(value || '');
    if (/^[\x00-\x7F]*$/.test(text)) {
        return sanitizeHeaderValue(text);
    }
    return '=?UTF-8?B?' + base64Encode(text) + '?=';
}

function formatAddressHeader(value) {
    return sanitizeHeaderValue(String(value || '').replace(/[\r\n]+/g, ' ').trim());
}

function sanitizeHeaderValue(value) {
    return String(value || '').replace(/[\r\n]+/g, ' ').replace(/"/g, '\\"').trim();
}

function normalizeLineBreaks(value) {
    return String(value || '').replace(/\r?\n/g, '\r\n');
}

function chunkBase64(base64) {
    return String(base64 || '').replace(/.{1,76}/g, '$&\r\n').trim();
}

function dotStuff(value) {
    return String(value || '')
        .replace(/^\./, '..')
        .replace(/\r\n\./g, '\r\n..');
}

function extractEmailAddress(value) {
    const match = String(value || '').match(/<([^>]+)>/);
    return (match ? match[1] : String(value || '')).trim();
}

function getFromEmail(env) {
    if (env.GMAIL_SMTP_USER || env.GMAIL_SMTP_PASSWORD) {
        return env.GMAIL_FROM_EMAIL || env.GMAIL_SMTP_USER || env.OWNER_EMAIL;
    }
    return env.RESEND_FROM_EMAIL || env.MAIL_FROM || env.OWNER_EMAIL || env.GMAIL_FROM_EMAIL || env.GMAIL_SMTP_USER;
}

function withTimeout(promise, ms, message) {
    return Promise.race([
        promise,
        new Promise(function(_, reject) {
            setTimeout(function() {
                reject(new Error(message || 'Operation timed out'));
            }, ms);
        })
    ]);
}

function base64Encode(value) {
    const utf8 = new TextEncoder().encode(String(value || ''));
    let binary = '';
    const chunkSize = 0x8000;

    for (let i = 0; i < utf8.length; i += chunkSize) {
        const chunk = utf8.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk);
    }

    return btoa(binary);
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk);
    }

    return btoa(binary);
}

// =========================================================
// JSON RESPONSE HELPER
// =========================================================
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status: status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}
