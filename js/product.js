/* =========================================================
   PMELAB PRODUCT TEMPLATE — PRODUCT & PRICING
   ========================================================= */

(function() {
    'use strict';

    let currentImageIndex = 0;
    let selectedPackageId = null;

    // =========================================================
    // RENDER PRODUCT IMAGES
    // =========================================================
    function renderProductImages() {
        const enabledImages = PRODUCT_IMAGES.filter(function(img) { return img.enabled; });
        if (enabledImages.length === 0) return;

        const mainImg = document.querySelector('.hero-gallery-main img');
        const thumbsContainer = document.querySelector('.gallery-thumbs');

        if (mainImg) {
            mainImg.src = enabledImages[0].file;
            mainImg.alt = enabledImages[0].description || PRODUCT.name;
        }

        if (thumbsContainer) {
            thumbsContainer.innerHTML = '';
            enabledImages.forEach(function(img, index) {
                const thumb = document.createElement('button');
                thumb.className = 'gallery-thumb' + (index === 0 ? ' active' : '');
                thumb.setAttribute('aria-label', 'View image ' + (index + 1));
                thumb.innerHTML = '<img src="' + img.file + '" alt="' + (img.description || '') + '" loading="lazy">';
                thumb.addEventListener('click', function() { selectImage(index); });
                thumbsContainer.appendChild(thumb);
            });
        }
    }

    function selectImage(index) {
        const enabledImages = PRODUCT_IMAGES.filter(function(img) { return img.enabled; });
        if (index < 0 || index >= enabledImages.length) return;

        currentImageIndex = index;
        const mainImg = document.querySelector('.hero-gallery-main img');
        if (mainImg) {
            mainImg.style.opacity = '0';
            setTimeout(function() {
                mainImg.src = enabledImages[index].file;
                mainImg.alt = enabledImages[index].description || PRODUCT.name;
                mainImg.style.opacity = '1';
            }, 150);
        }

        document.querySelectorAll('.gallery-thumb').forEach(function(t, i) {
            t.classList.toggle('active', i === index);
        });
    }

    function nextImage() {
        const enabledImages = PRODUCT_IMAGES.filter(function(img) { return img.enabled; });
        selectImage((currentImageIndex + 1) % enabledImages.length);
    }

    function prevImage() {
        const enabledImages = PRODUCT_IMAGES.filter(function(img) { return img.enabled; });
        selectImage((currentImageIndex - 1 + enabledImages.length) % enabledImages.length);
    }

    // =========================================================
    // RENDER PACKAGES
    // =========================================================
    function renderPackages() {
        const container = document.querySelector('.packages-grid');
        if (!container) return;

        container.innerHTML = '';

        PACKAGES.forEach(function(pkg, index) {
            const card = document.createElement('div');
            card.className = 'package-card' + (pkg.popular ? ' popular' : '');
            card.dataset.packageId = pkg.id;

            const savings = pkg.oldPrice - pkg.price;
            const hasSavings = savings > 0;

            let html = '';
            if (pkg.badge) {
                html += '<div class="package-badge">' + escapeHtml(pkg.badge) + '</div>';
            }

            html += '<h3 class="package-title">' + escapeHtml(pkg.title) + '</h3>';
            html += '<p class="package-desc">' + escapeHtml(pkg.description) + '</p>';
            html += '<div class="package-price">';
            html += '<span class="package-price-current">' + BUSINESS.currency + formatPrice(pkg.price) + '</span>';
            if (hasSavings) {
                html += '<span class="package-price-old">' + BUSINESS.currency + formatPrice(pkg.oldPrice) + '</span>';
            }
            html += '</div>';

            if (hasSavings) {
                html += '<div class="package-savings">SAVE ' + BUSINESS.currency + formatPrice(savings) + '</div>';
            } else {
                html += '<div class="package-savings" style="visibility:hidden">&nbsp;</div>';
            }

            html += '<div class="package-features">';
            html += '<div class="package-feature"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' + pkg.quantity + 'x ' + escapeHtml(PRODUCT.shortName) + '</div>';
            html += '<div class="package-feature"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Fast Delivery</div>';
            html += '<div class="package-feature"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Secure Payment</div>';
            if (pkg.quantity > 1) {
                html += '<div class="package-feature"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Best Value Deal</div>';
            }
            html += '</div>';

            html += '<button class="package-btn select" data-package-id="' + pkg.id + '">SELECT PACKAGE</button>';

            card.innerHTML = html;
            container.appendChild(card);
        });

        // Select first package by default
        selectPackage(PACKAGES[0].id);

        // Add click handlers
        container.querySelectorAll('.package-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                selectPackage(this.dataset.packageId);
                // Scroll to checkout
                const checkout = document.querySelector('#checkout');
                if (checkout) {
                    const offset = document.querySelector('.header').offsetHeight + 16;
                    const top = checkout.getBoundingClientRect().top + window.pageYOffset - offset;
                    window.scrollTo({ top: top, behavior: 'smooth' });
                }
                trackEvent('select_package', { package_id: this.dataset.packageId });
            });
        });
    }

    function selectPackage(packageId) {
        const pkg = PACKAGES.find(function(p) { return p.id === packageId; });
        if (!pkg) return;

        selectedPackageId = packageId;
        window.selectedPackage = pkg;

        // Update package cards
        document.querySelectorAll('.package-card').forEach(function(card) {
            const btn = card.querySelector('.package-btn');
            if (card.dataset.packageId === packageId) {
                card.classList.add('selected');
                btn.textContent = 'SELECTED';
                btn.classList.remove('select');
                btn.classList.add('selected');
            } else {
                card.classList.remove('selected');
                btn.textContent = 'SELECT PACKAGE';
                btn.classList.remove('selected');
                btn.classList.add('select');
            }
        });

        // Update checkout summary
        updateOrderSummary();

        // Update sticky CTA
        const stickyPrice = document.querySelector('.sticky-cta-price');
        if (stickyPrice) {
            stickyPrice.textContent = BUSINESS.currency + formatPrice(pkg.price);
        }

        // Update final CTA price
        const finalPrice = document.querySelector('.final-cta-price');
        if (finalPrice) {
            finalPrice.textContent = BUSINESS.currency + formatPrice(pkg.price);
        }
    }

    function updateOrderSummary() {
        const pkg = window.selectedPackage || PACKAGES[0];
        const currency = BUSINESS.currency;
        const summaryImage = PRODUCT_IMAGES.find(function(img) {
            return img.enabled && img.file;
        });

        const els = {
            productImage: document.querySelector('.summary-product img'),
            productName: document.querySelector('.summary-product-info h4'),
            productDesc: document.querySelector('.summary-product-info p'),
            packageName: document.querySelector('[data-summary="package"]'),
            quantity: document.querySelector('[data-summary="quantity"]'),
            subtotal: document.querySelector('[data-summary="subtotal"]'),
            discount: document.querySelector('[data-summary="discount"]'),
            total: document.querySelector('[data-summary="total"]')
        };

        if (els.productImage && summaryImage) {
            els.productImage.src = summaryImage.file;
            els.productImage.alt = summaryImage.description || PRODUCT.name;
        }
        if (els.productName) els.productName.textContent = PRODUCT.name;
        if (els.productDesc) els.productDesc.textContent = pkg.description;
        if (els.packageName) els.packageName.textContent = pkg.title;
        if (els.quantity) els.quantity.textContent = pkg.quantity;
        if (els.subtotal) els.subtotal.textContent = currency + formatPrice(pkg.oldPrice);
        if (els.discount) els.discount.textContent = '-' + currency + formatPrice(pkg.oldPrice - pkg.price);
        if (els.total) els.total.textContent = currency + formatPrice(pkg.price);

        // Update hidden form fields
        const packageInput = document.querySelector('input[name="package"]');
        if (packageInput) packageInput.value = pkg.id;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function slugifyFaqId(text) {
        return 'faq-' + String(text || '')
            .toLowerCase()
            .replace(/&/g, 'and')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // =========================================================
    // RENDER FEATURES
    // =========================================================
    function renderFeatures() {
        const container = document.querySelector('.features-grid');
        if (!container) return;

        const enabledFeatures = FEATURES.filter(function(f) { return f.enabled; });
        container.innerHTML = '';

        const iconMap = {
            battery: '<rect x="2" y="7" width="16" height="10" rx="2" ry="2"/><line x1="22" y1="11" x2="22" y2="13"/>',
            zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/>',
            shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
            smartphone: '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
            gauge: '<path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12L2.1 9.9"/>',
            gift: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
            briefcase: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
            plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8z"/>',
            'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
            'map-pin': '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
            layout: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
            heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'
        };

        enabledFeatures.forEach(function(feature) {
            const card = document.createElement('div');
            card.className = 'feature-card animate-on-scroll';
            const iconSvg = iconMap[feature.icon] || '<circle cx="12" cy="12" r="10"/>';

            card.innerHTML = 
                '<div class="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + iconSvg + '</svg></div>' +
                '<h3>' + escapeHtml(feature.title) + '</h3>' +
                '<p>' + escapeHtml(feature.description) + '</p>';

            container.appendChild(card);
        });
    }

    // =========================================================
    // RENDER SPECIFICATIONS
    // =========================================================
    function renderSpecifications() {
        const container = document.querySelector('.specs-table');
        if (!container) return;

        container.innerHTML = '';
        SPECIFICATIONS.forEach(function(spec) {
            const row = document.createElement('div');
            row.className = 'spec-row';
            row.innerHTML = 
                '<div class="spec-label">' + escapeHtml(spec.label) + '</div>' +
                '<div class="spec-value">' + escapeHtml(spec.value) + '</div>';
            container.appendChild(row);
        });
    }

    // =========================================================
    // RENDER WHY CHOOSE
    // =========================================================
    function renderWhyChoose() {
        const container = document.querySelector('.why-grid');
        if (!container) return;

        container.innerHTML = '';

        const iconMap = {
            briefcase: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
            plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8z"/>',
            'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
            'map-pin': '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
            layout: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
            heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'
        };

        WHY_CHOOSE.forEach(function(item) {
            const card = document.createElement('div');
            card.className = 'why-card animate-on-scroll';
            const iconSvg = iconMap[item.icon] || '<circle cx="12" cy="12" r="10"/>';

            card.innerHTML = 
                '<div class="why-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + iconSvg + '</svg></div>' +
                '<h3>' + escapeHtml(item.title) + '</h3>' +
                '<p>' + escapeHtml(item.description) + '</p>';

            container.appendChild(card);
        });
    }

    // =========================================================
    // RENDER VIDEOS
    // =========================================================
    function renderVideos() {
        const section = document.querySelector('.videos');
        const container = document.querySelector('.videos-grid');
        if (!section || !container) return;

        const enabledVideos = PRODUCT_VIDEOS.filter(function(v) { return v.enabled && v.url; });

        if (enabledVideos.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        container.innerHTML = '';

        enabledVideos.forEach(function(video) {
            const videoId = extractYouTubeId(video.url);
            if (!videoId) return;

            const card = document.createElement('div');
            card.className = 'video-card animate-on-scroll';
            card.innerHTML = 
                '<div class="video-wrapper">' +
                '<iframe src="https://www.youtube.com/embed/' + videoId + '" title="' + escapeHtml(video.title) + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>' +
                '</div>' +
                '<div class="video-title">' + escapeHtml(video.title) + '</div>';

            container.appendChild(card);
        });

        if (!container.children.length) {
            section.style.display = 'none';
        }
    }

    function extractYouTubeId(url) {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    // =========================================================
    // RENDER TESTIMONIALS
    // =========================================================
    function renderTestimonials() {
        const container = document.querySelector('.testimonials-grid');
        if (!container) return;

        const enabledTestimonials = TESTIMONIALS.filter(function(t) { return t.enabled; });
        container.innerHTML = '';

        enabledTestimonials.forEach(function(t) {
            const card = document.createElement('div');
            card.className = 'testimonial-card animate-on-scroll';

            let starsHtml = '';
            for (let i = 0; i < 5; i++) {
                starsHtml += '<svg viewBox="0 0 24 24"' + (i < t.rating ? '' : ' style="opacity:0.3"') + '><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
            }

            const initials = t.name.split(' ').map(function(n) { return n[0]; }).join('').substring(0, 2).toUpperCase();

            let avatarHtml = '';
            if (t.image) {
                avatarHtml = '<div class="testimonial-avatar"><img src="' + t.image + '" alt="' + escapeHtml(t.name) + '"></div>';
            } else {
                avatarHtml = '<div class="testimonial-avatar">' + initials + '</div>';
            }

            let verifiedHtml = '';
            if (t.verifiedBuyer) {
                verifiedHtml = '<div class="testimonial-verified"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Verified Buyer</div>';
            }

            card.innerHTML = 
                '<div class="testimonial-stars">' + starsHtml + '</div>' +
                '<p class="testimonial-text">"' + escapeHtml(t.text) + '"</p>' +
                '<div class="testimonial-author">' +
                avatarHtml +
                '<div>' +
                '<div class="testimonial-name">' + escapeHtml(t.name) + '</div>' +
                '<div class="testimonial-location">' + escapeHtml(t.location) + '</div>' +
                verifiedHtml +
                '</div></div>';

            container.appendChild(card);
        });
    }

    // =========================================================
    // RENDER FAQ
    // =========================================================
    function renderFAQ() {
        const container = document.querySelector('.faq-list');
        if (!container) return;

        const enabledFAQ = FAQ.filter(function(f) { return f.enabled; });
        container.innerHTML = '';

        enabledFAQ.forEach(function(item) {
            const faqItem = document.createElement('div');
            faqItem.className = 'faq-item';
            faqItem.id = item.id || slugifyFaqId(item.question);
            faqItem.innerHTML = 
                '<div class="faq-question" role="button" tabindex="0" aria-expanded="false">' +
                '<span>' + escapeHtml(item.question) + '</span>' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>' +
                '</div>' +
                '<div class="faq-answer"><p>' + escapeHtml(item.answer) + '</p></div>';

            const question = faqItem.querySelector('.faq-question');
            question.addEventListener('click', function() {
                const isActive = faqItem.classList.contains('active');

                // Close all others (accordion style)
                document.querySelectorAll('.faq-item').forEach(function(item) {
                    item.classList.remove('active');
                    item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                });

                if (!isActive) {
                    faqItem.classList.add('active');
                    question.setAttribute('aria-expanded', 'true');
                }
            });

            question.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    question.click();
                }
            });

            container.appendChild(faqItem);
        });

        function openFaqFromHash() {
            const targetId = window.location.hash ? window.location.hash.substring(1) : '';
            if (!targetId) return;

            const targetItem = document.getElementById(targetId);
            if (!targetItem || !targetItem.classList.contains('faq-item')) return;

            const targetQuestion = targetItem.querySelector('.faq-question');
            if (targetQuestion) {
                targetQuestion.click();
            }
        }

        openFaqFromHash();

        if (!window.__faqHashHandlerBound) {
            window.addEventListener('hashchange', openFaqFromHash);
            window.__faqHashHandlerBound = true;
        }
    }

    // =========================================================
    // RENDER GUARANTEE
    // =========================================================
    function renderGuarantee() {
        const section = document.querySelector('.guarantee');
        const container = document.querySelector('.guarantee-grid');
        if (!section || !container) return;

        if (!GUARANTEE.enabled) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        container.innerHTML = '';

        const iconMap = {
            'shield-check': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 12 15 16 10"/>',
            headphones: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
            lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
            truck: '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
            'refresh-cw': '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
            award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>'
        };

        GUARANTEE.items.forEach(function(item) {
            const card = document.createElement('div');
            card.className = 'guarantee-card animate-on-scroll';
            const iconSvg = iconMap[item.icon] || '<circle cx="12" cy="12" r="10"/>';

            card.innerHTML = 
                '<div class="guarantee-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + iconSvg + '</svg></div>' +
                '<h3>' + escapeHtml(item.title) + '</h3>' +
                '<p>' + escapeHtml(item.description) + '</p>';

            container.appendChild(card);
        });
    }

    // =========================================================
    // RENDER DELIVERY
    // =========================================================
    function renderDelivery() {
        const section = document.querySelector('.delivery');
        if (!section) return;

        if (!DELIVERY.enabled) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';

        const title = section.querySelector('.delivery-content h2');
        const desc = section.querySelector('.delivery-content > p');

        if (title) title.textContent = DELIVERY.title;
        if (desc) desc.textContent = DELIVERY.description;
    }

    // =========================================================
    // RENDER COMPANY
    // =========================================================
    function renderCompany() {
        const section = document.querySelector('.company');
        if (!section) return;

        if (!COMPANY.enabled) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';

        const title = section.querySelector('.company-content h2');
        const desc = section.querySelector('.company-content > p');
        const missionText = section.querySelector('.company-mission p');
        const valuesContainer = section.querySelector('.company-values');

        if (title) title.textContent = COMPANY.title;
        if (desc) desc.textContent = COMPANY.description;
        if (missionText) missionText.textContent = COMPANY.mission;

        if (valuesContainer) {
            valuesContainer.innerHTML = '';
            COMPANY.values.forEach(function(value) {
                const span = document.createElement('span');
                span.className = 'company-value';
                span.textContent = value;
                valuesContainer.appendChild(span);
            });
        }
    }

    // =========================================================
    // RENDER CONTACT
    // =========================================================
    function renderContact() {
        const section = document.querySelector('.contact');
        if (!section) return;

        if (!CONTACT.enabled) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';

        const title = section.querySelector('.section-title');
        const subtitle = section.querySelector('.section-subtitle');

        if (title) title.textContent = CONTACT.title;
        if (subtitle) subtitle.textContent = CONTACT.subtitle;

        // Update contact cards
        const phoneCard = section.querySelector('[data-contact="phone"] p');
        const emailCard = section.querySelector('[data-contact="email"] a');
        const addressCard = section.querySelector('[data-contact="address"] p');

        if (phoneCard) phoneCard.textContent = BUSINESS.phone;
        if (emailCard) {
            emailCard.textContent = BUSINESS.email;
            emailCard.href = 'mailto:' + BUSINESS.email;
        }
        if (addressCard) addressCard.textContent = BUSINESS.address;
    }

    // =========================================================
    // RENDER FOOTER
    // =========================================================
    function renderFooter() {
        const footerName = document.querySelector('.footer-brand-name');
        const footerDesc = document.querySelector('.footer-brand-desc');
        const quickLinks = document.querySelector('.footer-quick-links');
        const legalLinks = document.querySelector('.footer-legal-links');
        const socialContainer = document.querySelector('.footer-social');
        const copyright = document.querySelector('.footer-copyright');

        if (footerName) footerName.textContent = BUSINESS.name;
        if (footerDesc) footerDesc.textContent = BUSINESS.name + ' is committed to providing quality products and excellent customer service.';

        if (quickLinks) {
            quickLinks.innerHTML = '';
            FOOTER_LINKS.quickLinks.forEach(function(link) {
                const a = document.createElement('a');
                a.href = link.href;
                a.textContent = link.label;
                quickLinks.appendChild(a);
            });
        }

        if (legalLinks) {
            legalLinks.innerHTML = '';
            FOOTER_LINKS.legalLinks.forEach(function(link) {
                const a = document.createElement('a');
                a.href = link.href;
                a.textContent = link.label;
                legalLinks.appendChild(a);
            });
        }

        if (socialContainer) {
            socialContainer.innerHTML = '';
            const socialMap = {
                instagram: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
                facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
                tiktok: '<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>',
                youtube: '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.53c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>',
                twitter: '<path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>'
            };

            Object.keys(SOCIAL_LINKS).forEach(function(key) {
                const url = SOCIAL_LINKS[key];
                if (!url) return;

                const a = document.createElement('a');
                a.href = url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.setAttribute('aria-label', key);
                a.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (socialMap[key] || '') + '</svg>';
                socialContainer.appendChild(a);
            });
        }

        if (copyright) {
            copyright.innerHTML = '&copy; ' + new Date().getFullYear() + ' ' + escapeHtml(BUSINESS.name) + '. All rights reserved.';
        }
    }

    // =========================================================
    // RENDER HEADER
    // =========================================================
    function renderHeader() {
        const logoContainer = document.querySelector('.logo');
        const navContainer = document.querySelector('.nav-desktop');
        const mobileNav = document.querySelector('.mobile-nav');

        if (logoContainer) {
            if (LOGO.type === 'image' && LOGO.image) {
                logoContainer.innerHTML = '<img src="' + LOGO.image + '" alt="' + escapeHtml(LOGO.alt) + '">';
            } else {
                logoContainer.innerHTML = '<span class="logo-text">' + escapeHtml(LOGO.text) + '</span>';
            }
        }

        if (navContainer) {
            navContainer.innerHTML = '';
            NAVIGATION.forEach(function(item) {
                const a = document.createElement('a');
                a.href = item.href;
                a.className = 'nav-link';
                a.textContent = item.label;
                navContainer.appendChild(a);
            });

            // Add CTA button
            const cta = document.createElement('a');
            cta.href = '#checkout';
            cta.className = 'header-cta';
            cta.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> BUY NOW';
            navContainer.appendChild(cta);
        }

        if (mobileNav) {
            mobileNav.innerHTML = '';
            NAVIGATION.forEach(function(item) {
                const a = document.createElement('a');
                a.href = item.href;
                a.textContent = item.label;
                mobileNav.appendChild(a);
            });
        }
    }

    // =========================================================
    // RENDER HERO CONTENT
    // =========================================================
    function renderHero() {
        const badge = document.querySelector('.hero-badge');
        const title = document.querySelector('.hero-title');
        const desc = document.querySelector('.hero-desc');
        const price = document.querySelector('.hero-price');
        const oldPrice = document.querySelector('.hero-old-price');
        const discount = document.querySelector('.hero-discount');

        if (badge) badge.textContent = BUSINESS.shortName;
        if (title) title.innerHTML = escapeHtml(PRODUCT.headline).replace('PMELAB', '<span>PMELAB</span>');
        if (desc) desc.textContent = PRODUCT.subheadline;
        if (price) price.textContent = BUSINESS.currency + formatPrice(PRODUCT.currentPrice);
        if (oldPrice) oldPrice.textContent = BUSINESS.currency + formatPrice(PRODUCT.oldPrice);
        if (discount) discount.textContent = 'SAVE ' + PRODUCT.discountPercent + '%';
    }

    // =========================================================
    // RENDER ABOUT PRODUCT
    // =========================================================
    function renderAboutProduct() {
        const section = document.querySelector('.about-product');
        if (!section) return;

        if (!ABOUT_PRODUCT.enabled) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';

        const title = section.querySelector('.section-title');
        const content = section.querySelector('.about-content');
        const image = section.querySelector('.about-image img');

        if (title) title.textContent = ABOUT_PRODUCT.title;
        if (image && PRODUCT_IMAGES[0]) image.src = PRODUCT_IMAGES[0].file;

        if (content) {
            const paragraphs = content.querySelectorAll('p');
            ABOUT_PRODUCT.paragraphs.forEach(function(text, i) {
                if (paragraphs[i]) paragraphs[i].textContent = text;
            });

            const benefitsContainer = content.querySelector('.about-benefits');
            if (benefitsContainer) {
                benefitsContainer.innerHTML = '';
                ABOUT_PRODUCT.benefits.forEach(function(benefit) {
                    const div = document.createElement('div');
                    div.className = 'about-benefit';
                    div.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><span>' + escapeHtml(benefit) + '</span>';
                    benefitsContainer.appendChild(div);
                });
            }
        }
    }

    // =========================================================
    // RENDER TRUST BADGES
    // =========================================================
    function renderTrustBadges() {
        const container = document.querySelector('.hero-trust');
        if (!container) return;

        container.innerHTML = '';

        const iconMap = {
            'shield-check': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 12 15 16 10"/>',
            truck: '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
            headphones: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
            award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>'
        };

        HERO_TRUST.forEach(function(item) {
            const div = document.createElement('div');
            div.className = 'hero-trust-item';
            const iconSvg = iconMap[item.icon] || '<circle cx="12" cy="12" r="10"/>';
            div.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + iconSvg + '</svg><span>' + escapeHtml(item.text) + '</span>';
            container.appendChild(div);
        });
    }

    // =========================================================
    // INITIALIZE
    // =========================================================
    document.addEventListener('DOMContentLoaded', function() {
        renderHeader();
        renderHero();
        renderProductImages();
        renderPackages();
        renderFeatures();
        renderSpecifications();
        renderWhyChoose();
        renderVideos();
        renderTestimonials();
        renderFAQ();
        renderGuarantee();
        renderDelivery();
        renderCompany();
        renderContact();
        renderFooter();
        renderAboutProduct();
        renderTrustBadges();

        if (typeof window.refreshScrollAnimations === 'function') {
            window.refreshScrollAnimations();
        }

        // Gallery nav buttons
        const prevBtn = document.querySelector('.gallery-nav.prev');
        const nextBtn = document.querySelector('.gallery-nav.next');
        if (prevBtn) prevBtn.addEventListener('click', prevImage);
        if (nextBtn) nextBtn.addEventListener('click', nextImage);

        // Keyboard navigation for gallery
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') prevImage();
            if (e.key === 'ArrowRight') nextImage();
        });
    });
})();
