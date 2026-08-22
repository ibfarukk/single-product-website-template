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
            return typeof WEBSITE_TYPE_SELECT !== 'undefined' ? String(WEBSITE_TYPE_SELECT).trim().toLowerCase() : 'singleproduct';
        } catch (error) {
            return 'singleproduct';
        }
    }

    function getHomeHref(mode) {
        if (mode === 'multipleproducts') return 'multiple.html';
        if (mode === 'affiliate') return 'affiliate.html';
        return 'index.html';
    }

    function initBranding() {
        const badge = $('page-badge');
        const title = $('page-title');
        const subtitle = $('page-subtitle');
        const page = String(document.body.dataset.page || '').trim().toLowerCase();
        const mode = getMode();

        if (badge) badge.textContent = String((BUSINESS && (BUSINESS.shortName || BUSINESS.name)) || 'PMELAB');

        let heading = '';
        let sub = '';

        if (typeof STORE_CONTENT !== 'undefined') {
            if (page === 'about') {
                heading = String(STORE_CONTENT.aboutTitle || 'About Us');
                sub = String(STORE_CONTENT.aboutText || '');
            } else if (page === 'contact') {
                heading = String(STORE_CONTENT.contactTitle || 'Contact Us');
                sub = String(STORE_CONTENT.contactText || '');
            } else if (page === 'refund-policy') {
                heading = String(STORE_CONTENT.refundPolicyTitle || 'Refund Policy');
                sub = String(STORE_CONTENT.refundPolicyText || '');
            } else if (page === 'refund-form') {
                heading = String(STORE_CONTENT.refundFormTitle || 'Refund Request');
                sub = String(STORE_CONTENT.refundFormText || '');
            }
        }

        if (!heading) {
            if (page === 'refund-policy') heading = 'Refund Policy';
            else if (page === 'refund-form') heading = 'Refund Request';
            else if (page === 'contact') heading = 'Contact Us';
            else heading = 'About Us';
        }

        if (title) title.textContent = heading;
        if (subtitle) subtitle.textContent = sub;

        const navProducts = document.querySelectorAll('[data-nav-products]');
        navProducts.forEach(function(a) {
            a.setAttribute('href', getHomeHref(mode));
        });

        document.title = String((BUSINESS && (BUSINESS.shortName || BUSINESS.name)) || 'PMELAB') + ' — ' + heading;
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

    function renderPageContent() {
        const box = $('page-content');
        if (!box) return;
        const page = String(document.body.dataset.page || '').trim().toLowerCase();

        let text = '';
        if (typeof STORE_CONTENT !== 'undefined') {
            if (page === 'about') text = String(STORE_CONTENT.aboutText || '');
            if (page === 'contact') text = String(STORE_CONTENT.contactText || '');
            if (page === 'refund-policy') text = String(STORE_CONTENT.refundPolicyText || '');
            if (page === 'refund-form') text = String(STORE_CONTENT.refundFormText || '');
        }
        if (!text) {
            box.innerHTML = '';
            return;
        }

        const safe = String(text).split('\n').map(function(line) {
            const value = String(line || '').trim();
            if (!value) return '';
            return '<p style="margin:0 0 12px 0;line-height:1.8;color:var(--muted);">' + value.replace(/[<>&]/g, function(ch) {
                return ch === '<' ? '&lt;' : (ch === '>' ? '&gt;' : '&amp;');
            }) + '</p>';
        }).filter(Boolean).join('');
        box.innerHTML = safe;
    }

    function renderContactCard() {
        const target = $('contact-card');
        if (!target) return;
        const biz = typeof BUSINESS !== 'undefined' ? BUSINESS : {};

        target.innerHTML =
            '<div style="display:grid;gap:12px;">' +
            '<div style="display:flex;justify-content:space-between;gap:12px;"><span style="color:var(--muted);">Phone</span><span style="font-weight:700;">' + String(biz.phone || '') + '</span></div>' +
            '<div style="display:flex;justify-content:space-between;gap:12px;"><span style="color:var(--muted);">Email</span><span style="font-weight:700;">' + String(biz.email || '') + '</span></div>' +
            '<div style="display:grid;gap:6px;">' +
            '<div style="color:var(--muted);">Address</div>' +
            '<div style="font-weight:700;line-height:1.6;">' + String(biz.address || '') + '</div>' +
            '</div>' +
            '</div>';
    }

    function getApiUrl(path) {
        const cleanPath = path.startsWith('/') ? path : '/' + path;
        const base = typeof API_BASE_URL !== 'undefined' ? String(API_BASE_URL).trim() : '';
        if (!base) return cleanPath;
        return base.replace(/\/+$/, '') + cleanPath;
    }

    function renderRefundForm() {
        const form = $('refund-form');
        const result = $('refund-result');
        if (!form) return;

        function setResult(ok, message) {
            if (!result) return;
            result.classList.remove('owner-hidden');
            result.style.border = '1px solid ' + (ok ? 'rgba(22,163,74,0.35)' : 'rgba(220,38,38,0.35)');
            result.style.background = ok ? 'rgba(22,163,74,0.06)' : 'rgba(220,38,38,0.06)';
            result.style.color = ok ? 'var(--text)' : 'var(--text)';
            result.textContent = message;
        }

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (result) result.classList.add('owner-hidden');

            const payload = {
                name: String(($('refund-name').value || '')).trim(),
                email: String(($('refund-email').value || '')).trim(),
                phone: String(($('refund-phone').value || '')).trim(),
                reference: String(($('refund-reference').value || '')).trim(),
                message: String(($('refund-message').value || '')).trim()
            };

            const btn = form.querySelector('button[type="submit"]');
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'SENDING...';
            }

            try {
                const res = await fetch(getApiUrl('/api/refund-request'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json().catch(function() { return {}; });
                if (!res.ok || !data.success) {
                    throw new Error(data.error || 'Failed to submit refund request');
                }
                setResult(true, 'Refund request submitted. We will contact you shortly.');
                form.reset();
            } catch (error) {
                setResult(false, error && error.message ? error.message : 'Failed to submit refund request.');
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'SUBMIT REFUND REQUEST';
                }
            }
        });
    }

    function initMobileMenu() {
        const btn = document.querySelector('.mobile-menu-btn');
        const nav = document.querySelector('.mobile-nav');
        if (!btn || !nav) return;
        btn.addEventListener('click', function() {
            nav.classList.toggle('active');
            btn.classList.toggle('active');
        });
        nav.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                nav.classList.remove('active');
                btn.classList.remove('active');
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        const loader = window.PMELAB_SITE && typeof window.PMELAB_SITE.ensureConfigLoaded === 'function'
            ? window.PMELAB_SITE.ensureConfigLoaded()
            : Promise.resolve();

        loader.then(function() {
            injectCssVariables();
            initBranding();
            initMobileMenu();
            renderPageContent();
            renderContactCard();
            renderRefundForm();
        }).catch(function() {
            initMobileMenu();
        });
    });
})();
