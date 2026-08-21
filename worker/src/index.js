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
        const { reference, package_id, expected_amount, currency, customer } = data;
        const expectedAmount = Number(expected_amount || 0);
        const expectedCurrency = String(currency || '').toUpperCase();

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
            packageId: package_id,
            expectedAmount: expectedAmount,
            currency: expectedCurrency,
            customer: customer,
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
            currency: form.get('currency') || '',
            payment_method: form.get('payment_method') || 'manual',
            order_ref: form.get('order_ref') || '',
            product_type: form.get('product_type') || 'physical'
        };

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
    return jsonResponse({
        success: true,
        checks: {
            ownerStatsBound: Boolean(env.OWNER_STATS),
            paystackSecretConfigured: Boolean(env.PAYSTACK_SECRET_KEY),
            ownerEmailConfigured: Boolean(env.OWNER_EMAIL),
            ownerDashboardCredsConfigured: Boolean(username && password),
            gmailSmtpConfigured: Boolean(env.GMAIL_SMTP_USER && env.GMAIL_SMTP_PASSWORD),
            resendConfigured: Boolean(env.RESEND_API_KEY)
        }
    });
}

// =========================================================
// SEND ORDER EMAILS
// =========================================================
async function sendOrderEmails(transaction, env, method, customerInfo) {
    const ownerEmail = env.OWNER_EMAIL;
    const customer = customerInfo || (transaction.metadata ? transaction.metadata.custom_fields : []);
    const customerEmail = transaction.customer ? transaction.customer.email : '';
    const fromEmail = getFromEmail(env);

    // Build owner email
    const ownerSubject = 'NEW ORDER - ' + transaction.reference;
    const ownerBody = buildOwnerEmail(transaction, method, customer);

    // Build customer email
    const customerSubject = 'Order Confirmation - ' + transaction.reference;
    const customerBody = buildCustomerEmail(transaction, method, customer);

    const jobs = [];
    if (ownerEmail) {
        jobs.push(sendEmail(env, {
            from: fromEmail,
            to: ownerEmail,
            subject: ownerSubject,
            text: ownerBody
        }));
    }
    if (customerEmail) {
        jobs.push(sendEmail(env, {
            from: fromEmail,
            to: customerEmail,
            subject: customerSubject,
            text: customerBody
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
    const customerEmail = data.customer && data.customer.email ? data.customer.email : '';

    const jobs = [];
    if (ownerEmail) {
        jobs.push(sendEmail(env, {
            from: fromEmail,
            to: ownerEmail,
            subject: subject,
            text: body,
            attachments: attachments
        }));
    }
    if (customerEmail) {
        jobs.push(sendEmail(env, {
            from: fromEmail,
            to: customerEmail,
            subject: customerSubject,
            text: customerBody
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
    const quantity = Number(extractCustomFieldValue(transaction, 'quantity') || 0);
    const customer = normalizeCustomerInfo(options.customer || extractCustomerFromPaystackTransaction(transaction));
    const amount = Number(options.expectedAmount || 0) || Number(transaction.amount || 0) / 100;
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
        packageTitle: packageId,
        quantity: quantity,
        amount: amount,
        currency: currency,
        customer: customer,
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
        await sendOrderEmails(transaction, env, 'paystack', customer);
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
        amount: Number(data.amount || 0),
        currency: data.currency || '',
        customer: normalizeCustomerInfo(data.customer),
        product: data.product || '',
        productType: data.product_type || 'physical',
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

// =========================================================
// EMAIL BUILDERS
// =========================================================
function buildOwnerEmail(transaction, method, customer) {
    let customerDetails = '';
    if (Array.isArray(customer)) {
        customer.forEach(function(field) {
            customerDetails += field.display_name + ': ' + field.value + '\\n';
        });
    } else if (customer) {
        customerDetails = 'Name: ' + (customer.name || '') + '\\n';
        customerDetails += 'Phone: ' + (customer.phone || '') + '\\n';
        customerDetails += 'Address: ' + (customer.address || '') + '\\n';
    }

    return 'NEW ORDER RECEIVED\\n\\n' +
        'Reference: ' + transaction.reference + '\\n' +
        'Amount: ' + (transaction.amount / 100) + ' ' + transaction.currency + '\\n' +
        'Payment Method: ' + method + '\\n' +
        'Status: ' + transaction.status + '\\n\\n' +
        'CUSTOMER DETAILS:\\n' +
        customerDetails + '\\n' +
        'Please process this order promptly.';
}

function buildCustomerEmail(transaction, method, customer) {
    return 'Thank you for your order!\\n\\n' +
        'Order Reference: ' + transaction.reference + '\\n' +
        'Amount: ' + (transaction.amount / 100) + ' ' + transaction.currency + '\\n\\n' +
        'We have received your payment and will process your order shortly.\\n' +
        'You will receive another email once your order has been shipped.\\n\\n' +
        'Thank you for shopping with us!';
}

function buildManualOrderEmail(data) {
    return 'NEW MANUAL PAYMENT ORDER\\n\\n' +
        'Order Reference: ' + data.order_ref + '\\n' +
        'Product: ' + data.product + '\\n' +
        'Product Type: ' + (data.product_type || 'physical') + '\\n' +
        'Package: ' + data.package_title + '\\n' +
        'Quantity: ' + data.quantity + '\\n' +
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
    return 'Hello ' + (data.customer.name || 'Valued Customer') + ',\\n\\n' +
        'Thank you for your order!\\n\\n' +
        'Order Reference: ' + data.order_ref + '\\n' +
        'Product: ' + data.product + '\\n' +
        'Package: ' + data.package_title + '\\n' +
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

    if (!email.attachments || !email.attachments.length) {
        headers.push('Content-Type: text/plain; charset=UTF-8');
        headers.push('Content-Transfer-Encoding: 8bit');
        return headers.join('\r\n') + '\r\n\r\n' + normalizeLineBreaks(email.text || '');
    }

    const boundary = '----=_PMELAB_' + Math.random().toString(16).slice(2) + Date.now();
    let message = headers.join('\r\n') + '\r\n';
    message += 'Content-Type: multipart/mixed; boundary="' + boundary + '"\r\n\r\n';
    message += '--' + boundary + '\r\n';
    message += 'Content-Type: text/plain; charset=UTF-8\r\n';
    message += 'Content-Transfer-Encoding: 8bit\r\n\r\n';
    message += normalizeLineBreaks(email.text || '') + '\r\n';

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
