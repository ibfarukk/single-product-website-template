(function() {
    'use strict';

    function $(id) {
        return document.getElementById(id);
    }

    function formatMoney(amount) {
        const currency = (typeof BUSINESS !== 'undefined' && BUSINESS && BUSINESS.currency) ? BUSINESS.currency : '₦';
        const value = Number(amount || 0);
        return currency + value.toLocaleString('en-NG');
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

    function getQueryParam(name) {
        const url = new URL(window.location.href);
        return url.searchParams.get(name);
    }

    function showError(message) {
        const el = $('details-error');
        const grid = $('details-grid');
        if (grid) grid.style.display = message ? 'none' : '';
        if (!el) return;
        el.textContent = message || '';
        el.classList.toggle('owner-hidden', !message);
    }

    function productSpecsHtml(specs) {
        const rows = Array.isArray(specs) ? specs : [];
        if (!rows.length) return '';
        return '<div style="font-weight:800;margin:0 0 10px 0;">Specifications</div>' + rows.map(function(row) {
            if (!row) return '';
            const label = String(row.label || '').trim();
            const value = String(row.value || '').trim();
            if (!label || !value) return '';
            return '<div class="owner-lookup-row" style="padding:8px 0;"><span style="color:var(--muted);">' + label + '</span><span style="font-weight:700;">' + value + '</span></div>';
        }).filter(Boolean).join('');
    }

    function setupGallery(wrapper, slider, thumbs, images, key) {
        if (!wrapper || !slider) return;
        const list = Array.isArray(images) && images.length ? images : [];
        wrapper.style.position = 'relative';
        wrapper.dataset.galleryKey = key;
        wrapper.dataset.galleryTotal = String(list.length);

        function setActiveThumb(activeIndex) {
            if (!thumbs) return;
            thumbs.querySelectorAll('[data-thumb]').forEach(function(btn) {
                const idx = Number(btn.getAttribute('data-thumb') || 0);
                btn.style.borderColor = idx === activeIndex ? 'var(--primary)' : 'var(--border)';
                btn.style.boxShadow = idx === activeIndex ? '0 0 0 3px rgba(22,163,74,0.18)' : 'none';
            });
        }

        function scrollToIndex(index) {
            const total = list.length;
            if (!total) return;
            const clamped = Math.max(0, Math.min(total - 1, Number(index || 0)));
            wrapper.dataset.galleryIndex = String(clamped);
            slider.scrollTo({ left: slider.clientWidth * clamped, behavior: 'smooth' });
            setActiveThumb(clamped);
        }

        let prev = wrapper.querySelector('[data-gallery-prev="' + key + '"]');
        let next = wrapper.querySelector('[data-gallery-next="' + key + '"]');
        if (!prev) {
            prev = document.createElement('button');
            prev.type = 'button';
            prev.setAttribute('data-gallery-prev', key);
            prev.textContent = '‹';
            prev.style.position = 'absolute';
            prev.style.left = '10px';
            prev.style.top = '50%';
            prev.style.transform = 'translateY(-50%)';
            prev.style.width = '40px';
            prev.style.height = '40px';
            prev.style.borderRadius = '999px';
            prev.style.border = '1px solid var(--border)';
            prev.style.background = '#fff';
            prev.style.boxShadow = 'var(--shadow-sm)';
            prev.style.display = 'inline-flex';
            prev.style.alignItems = 'center';
            prev.style.justifyContent = 'center';
            prev.style.fontSize = '22px';
            prev.style.cursor = 'pointer';
            wrapper.appendChild(prev);
        }
        if (!next) {
            next = document.createElement('button');
            next.type = 'button';
            next.setAttribute('data-gallery-next', key);
            next.textContent = '›';
            next.style.position = 'absolute';
            next.style.right = '10px';
            next.style.top = '50%';
            next.style.transform = 'translateY(-50%)';
            next.style.width = '40px';
            next.style.height = '40px';
            next.style.borderRadius = '999px';
            next.style.border = '1px solid var(--border)';
            next.style.background = '#fff';
            next.style.boxShadow = 'var(--shadow-sm)';
            next.style.display = 'inline-flex';
            next.style.alignItems = 'center';
            next.style.justifyContent = 'center';
            next.style.fontSize = '22px';
            next.style.cursor = 'pointer';
            wrapper.appendChild(next);
        }

        function getIndex() {
            return Number(wrapper.dataset.galleryIndex || 0) || 0;
        }

        prev.onclick = function() { scrollToIndex(getIndex() - 1); };
        next.onclick = function() { scrollToIndex(getIndex() + 1); };

        let scrollTimer = null;
        slider.addEventListener('scroll', function() {
            if (scrollTimer) clearTimeout(scrollTimer);
            scrollTimer = setTimeout(function() {
                const idx = Math.round(slider.scrollLeft / Math.max(1, slider.clientWidth));
                wrapper.dataset.galleryIndex = String(idx);
                setActiveThumb(idx);
            }, 100);
        }, { passive: true });

        scrollToIndex(0);
    }

    function findProduct(mode, id) {
        const pid = String(id || '').trim();
        if (!pid) return null;
        if (mode === 'multipleproducts') {
            if (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS)) {
                return PRODUCTS.find(function(p) { return p.id === pid; }) || null;
            }
        }
        if (mode === 'affiliate') {
            if (typeof AFFILIATE_PRODUCTS !== 'undefined' && Array.isArray(AFFILIATE_PRODUCTS)) {
                return AFFILIATE_PRODUCTS.find(function(p) { return p.id === pid; }) || null;
            }
        }
        return null;
    }

    function findPackage(product, packageId) {
        if (!product || !Array.isArray(product.packages)) return null;
        const pid = String(packageId || '').trim();
        return product.packages.find(function(p) { return p.id === pid; }) || null;
    }

    function render(mode, product) {
        const badge = $('details-badge');
        const title = $('details-title');
        const short = $('details-short');
        const long = $('details-long');
        const specsWrap = $('details-specs-wrap');
        const slider = $('details-slider');
        const thumbs = $('details-thumbs');

        if (badge) badge.textContent = String((BUSINESS && (BUSINESS.shortName || BUSINESS.name)) || (mode === 'affiliate' ? 'AFFILIATE' : 'STORE'));
        if (title) title.textContent = String(product.title || product.id);
        if (short) short.textContent = String(product.description || '');
        if (long) long.textContent = String(product.longDescription || product.description || '');
        if (specsWrap) specsWrap.innerHTML = productSpecsHtml(product.specs);

        const images = Array.isArray(product.images) && product.images.length ? product.images : [product.image || 'productsimages/logo.jpg'];
        if (slider) {
            slider.innerHTML = images.map(function(src) {
                return '<div style="min-width:100%;scroll-snap-align:start;"><img src="' + String(src) + '" alt="" style="width:100%;height:320px;object-fit:cover;border-radius:14px;"></div>';
            }).join('');
        }
        if (thumbs) {
            thumbs.innerHTML = images.map(function(src, idx) {
                return '<button type="button" data-thumb="' + String(idx) + '" style="border:1px solid var(--border);border-radius:12px;padding:0;background:#fff;flex:0 0 auto;"><img src="' + String(src) + '" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:12px;"></button>';
            }).join('');
            thumbs.querySelectorAll('[data-thumb]').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    const idx = Number(btn.getAttribute('data-thumb') || 0);
                    if (!slider) return;
                    slider.scrollTo({ left: slider.clientWidth * idx, behavior: 'smooth' });
                });
            });
        }
        if (slider) {
            setupGallery(slider.parentElement, slider, thumbs, images, 'details-page');
        }

        const storeActions = $('details-store-actions');
        const affiliateActions = $('details-affiliate-actions');

        if (mode === 'multipleproducts') {
            if (affiliateActions) affiliateActions.classList.add('owner-hidden');
            if (storeActions) storeActions.style.display = '';

            const pkgSelect = $('details-package');
            const qtyInput = $('details-qty');
            const addCart = $('details-add-cart');
            const checkoutBtn = $('details-checkout');
            const priceUnit = $('details-price-unit');
            const priceShipping = $('details-price-shipping');
            const priceTotal = $('details-price-total');

            function refreshPrice() {
                const pkgId = pkgSelect ? String(pkgSelect.value || '') : '';
                const pkg = findPackage(product, pkgId);
                const qty = qtyInput ? (Number(qtyInput.value || 1) || 1) : 1;
                const unit = Number(pkg && pkg.price ? pkg.price : 0);
                const shippingPerUnit = Number(product.shippingFee || 0);
                const total = (unit + shippingPerUnit) * (qty > 0 ? Math.floor(qty) : 1);

                if (priceUnit) priceUnit.textContent = formatMoney(unit);
                if (priceShipping) priceShipping.textContent = shippingPerUnit ? formatMoney(shippingPerUnit) : 'Free';
                if (priceTotal) priceTotal.textContent = formatMoney(total);
            }

            if (pkgSelect) {
                const packages = Array.isArray(product.packages) ? product.packages : [];
                pkgSelect.innerHTML = packages.map(function(p) {
                    return '<option value="' + String(p.id) + '">' + String(p.title || p.id) + ' — ' + formatMoney(p.price || 0) + '</option>';
                }).join('');
            }
            if (qtyInput) qtyInput.value = '1';
            if (pkgSelect) pkgSelect.addEventListener('change', refreshPrice);
            if (qtyInput) qtyInput.addEventListener('change', refreshPrice);
            refreshPrice();

            if (addCart) {
                addCart.addEventListener('click', function() {
                    const pkgId = pkgSelect ? String(pkgSelect.value || '') : '';
                    const qty = qtyInput ? Number(qtyInput.value || 1) : 1;
                    if (window.PMELAB_CART && typeof window.PMELAB_CART.addItem === 'function') {
                        window.PMELAB_CART.addItem(product.id, pkgId, qty);
                        if (typeof window.PMELAB_CART.open === 'function') {
                            window.PMELAB_CART.open();
                        }
                    }
                });
            }
            if (checkoutBtn) {
                checkoutBtn.addEventListener('click', function() {
                    const pkgId = pkgSelect ? String(pkgSelect.value || '') : '';
                    const qty = qtyInput ? Number(qtyInput.value || 1) : 1;
                    window.location.href = 'checkout.html?id=' + encodeURIComponent(String(product.id || '')) +
                        '&package=' + encodeURIComponent(String(pkgId || '')) +
                        '&qty=' + encodeURIComponent(String(qty || 1));
                });
            }
        } else if (mode === 'affiliate') {
            if (storeActions) storeActions.style.display = 'none';
            if (affiliateActions) affiliateActions.classList.remove('owner-hidden');

            const cta = $('details-affiliate-cta');
            const priceEl = $('details-affiliate-price');
            const link = String(product.affiliateUrl || '').trim();
            const buttonText = String(product.buttonText || 'Visit Vendor');
            if (cta) {
                cta.textContent = buttonText;
                cta.href = link || '#';
                cta.style.pointerEvents = link ? 'auto' : 'none';
                cta.style.opacity = link ? '1' : '0.5';
            }
            if (priceEl) {
                priceEl.textContent = product.price !== undefined && product.price !== null ? ('From ' + formatMoney(product.price)) : '';
            }
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        initMobileMenu();

        const loader = window.PMELAB_SITE && typeof window.PMELAB_SITE.ensureConfigLoaded === 'function'
            ? window.PMELAB_SITE.ensureConfigLoaded()
            : Promise.resolve();

        loader.then(function() {
            injectCssVariables();
            const mode = getMode();
            updateProductsLinks(mode);

            const id = getQueryParam('id');
            if (!id) {
                showError('Missing product id.');
                return;
            }

            const product = findProduct(mode, id);
            if (!product) {
                showError('Product not found.');
                return;
            }

            showError('');
            render(mode, product);

            if (window.PMELAB_CART && typeof window.PMELAB_CART.init === 'function') {
                window.PMELAB_CART.init();
            }
        }).catch(function() {
            showError('Failed to load site configuration.');
        });
    });
})();
