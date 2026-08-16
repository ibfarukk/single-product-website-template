/* =========================================================
   PMELAB PRODUCT TEMPLATE — MAIN JAVASCRIPT
   ========================================================= */

(function() {
    'use strict';

    // =========================================================
    // CSS VARIABLES INJECTION
    // =========================================================
    function injectCSSVariables() {
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

    // =========================================================
    // HEADER SCROLL EFFECT
    // =========================================================
    function initHeader() {
        const header = document.querySelector('.header');
        if (!header) return;

        let ticking = false;
        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    if (window.scrollY > 20) {
                        header.classList.add('scrolled');
                    } else {
                        header.classList.remove('scrolled');
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // =========================================================
    // MOBILE MENU
    // =========================================================
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

    // =========================================================
    // SMOOTH SCROLL
    // =========================================================
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#') return;

                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    const offset = document.querySelector('.header').offsetHeight + 16;
                    const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                    window.scrollTo({ top: top, behavior: 'smooth' });
                }
            });
        });
    }

    // =========================================================
    // SCROLL ANIMATIONS
    // =========================================================
    let scrollAnimationObserver = null;

    function initScrollAnimations() {
        if (!('IntersectionObserver' in window)) {
            document.querySelectorAll('.animate-on-scroll').forEach(function(el) {
                el.classList.add('visible');
            });
            return;
        }

        if (!scrollAnimationObserver) {
            scrollAnimationObserver = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        scrollAnimationObserver.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });
        }

        document.querySelectorAll('.animate-on-scroll').forEach(function(el) {
            if (!el.classList.contains('visible')) {
                scrollAnimationObserver.observe(el);
            }
        });
    }

    function refreshScrollAnimations() {
        initScrollAnimations();
    }

    // =========================================================
    // STICKY CTA PRICE UPDATE
    // =========================================================
    function updateStickyCTA() {
        const stickyName = document.querySelector('.sticky-cta-name');
        const stickyPrice = document.querySelector('.sticky-cta-price');
        if (!stickyName || !stickyPrice) return;

        stickyName.textContent = PRODUCT.shortName;

        const selectedPackage = window.selectedPackage || PACKAGES[0];
        const currency = BUSINESS.currency;
        stickyPrice.textContent = currency + formatPrice(selectedPackage.price);
    }

    // =========================================================
    // ANALYTICS TRACKING
    // =========================================================
    function trackEvent(eventName, params) {
        // Google Analytics 4
        if (typeof gtag !== 'undefined' && ANALYTICS.googleAnalyticsId) {
            gtag('event', eventName, params || {});
        }

        // Meta Pixel
        if (typeof fbq !== 'undefined' && ANALYTICS.metaPixelId) {
            fbq('track', eventName, params || {});
        }

        // Google Tag Manager
        if (typeof dataLayer !== 'undefined' && ANALYTICS.googleTagManagerId) {
            dataLayer.push({
                event: eventName,
                ...params
            });
        }
    }

    // =========================================================
    // INITIALIZE ANALYTICS
    // =========================================================
    function initAnalytics() {
        // Google Analytics
        if (ANALYTICS.googleAnalyticsId) {
            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ANALYTICS.googleAnalyticsId;
            document.head.appendChild(script);

            window.dataLayer = window.dataLayer || [];
            window.gtag = function() { dataLayer.push(arguments); };
            gtag('js', new Date());
            gtag('config', ANALYTICS.googleAnalyticsId);
        }

        // Meta Pixel
        if (ANALYTICS.metaPixelId) {
            !function(f,b,e,v,n,t,s) {
                if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window,document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', ANALYTICS.metaPixelId);
            fbq('track', 'PageView');
        }

        // Google Tag Manager
        if (ANALYTICS.googleTagManagerId) {
            (function(w,d,s,l,i){
                w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});
                var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
                j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;
                f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer',ANALYTICS.googleTagManagerId);
        }

        // Track page view
        trackEvent('page_view', { page_title: document.title, page_location: window.location.href });
        trackEvent('view_product', { 
            currency: BUSINESS.currencyCode,
            value: PRODUCT.currentPrice,
            items: [{ item_name: PRODUCT.name }]
        });
    }

    function getApiUrl(path) {
        const cleanPath = path.startsWith('/') ? path : '/' + path;
        const base = typeof API_BASE_URL !== 'undefined' ? String(API_BASE_URL).trim() : '';
        if (!base) return cleanPath;
        return base.replace(/\/+$/, '') + cleanPath;
    }

    function initOwnerVisitTracking() {
        if (window.location.pathname.toLowerCase().endsWith('/owner.html')) {
            return;
        }

        try {
            let visitorId = localStorage.getItem('pmelab_visitor_id');
            if (!visitorId) {
                visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
                localStorage.setItem('pmelab_visitor_id', visitorId);
            }

            fetch(getApiUrl('/api/track-visit'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    visitorId: visitorId,
                    path: window.location.pathname,
                    referrer: document.referrer || ''
                })
            }).catch(function() {});
        } catch (error) {
            console.warn('Visit tracking unavailable:', error);
        }
    }

    // =========================================================
    // UTILITY FUNCTIONS
    // =========================================================
    window.formatPrice = function(price) {
        return price.toLocaleString('en-NG');
    };

    window.trackEvent = trackEvent;
    window.refreshScrollAnimations = refreshScrollAnimations;

    // =========================================================
    // INITIALIZE
    // =========================================================
    document.addEventListener('DOMContentLoaded', function() {
        injectCSSVariables();
        initHeader();
        initMobileMenu();
        initSmoothScroll();
        initScrollAnimations();
        initAnalytics();
        initOwnerVisitTracking();
        updateStickyCTA();
    });
})();
