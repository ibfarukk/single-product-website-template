/* =========================================================
   PMELAB PRODUCT TEMPLATE — GALLERY & LIGHTBOX
   ========================================================= */

(function() {
    'use strict';

    let lightboxIndex = 0;
    let touchStartX = 0;
    let touchEndX = 0;

    // =========================================================
    // LIGHTBOX
    // =========================================================
    function openLightbox(index) {
        const enabledImages = PRODUCT_IMAGES.filter(function(img) { return img.enabled; });
        if (index < 0 || index >= enabledImages.length) return;

        lightboxIndex = index;
        const lightbox = document.querySelector('.lightbox');
        const img = lightbox.querySelector('img');
        const caption = lightbox.querySelector('.lightbox-caption');

        img.src = enabledImages[index].file;
        img.alt = enabledImages[index].description || PRODUCT.name;
        caption.textContent = enabledImages[index].description || '';

        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';

        trackEvent('view_image', { image_index: index });
    }

    function closeLightbox() {
        const lightbox = document.querySelector('.lightbox');
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    function nextLightboxImage() {
        const enabledImages = PRODUCT_IMAGES.filter(function(img) { return img.enabled; });
        lightboxIndex = (lightboxIndex + 1) % enabledImages.length;
        updateLightboxImage();
    }

    function prevLightboxImage() {
        const enabledImages = PRODUCT_IMAGES.filter(function(img) { return img.enabled; });
        lightboxIndex = (lightboxIndex - 1 + enabledImages.length) % enabledImages.length;
        updateLightboxImage();
    }

    function updateLightboxImage() {
        const enabledImages = PRODUCT_IMAGES.filter(function(img) { return img.enabled; });
        const lightbox = document.querySelector('.lightbox');
        const img = lightbox.querySelector('img');
        const caption = lightbox.querySelector('.lightbox-caption');

        img.style.opacity = '0';
        setTimeout(function() {
            img.src = enabledImages[lightboxIndex].file;
            img.alt = enabledImages[lightboxIndex].description || PRODUCT.name;
            caption.textContent = enabledImages[lightboxIndex].description || '';
            img.style.opacity = '1';
        }, 150);
    }

    // =========================================================
    // TOUCH SWIPE FOR GALLERY
    // =========================================================
    function initTouchSwipe() {
        const gallery = document.querySelector('.hero-gallery');
        if (!gallery) return;

        gallery.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        gallery.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
    }

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left - next image
                if (typeof window.selectImage === 'function') {
                    const enabledImages = PRODUCT_IMAGES.filter(function(img) { return img.enabled; });
                    const currentIndex = window.currentImageIndex || 0;
                    window.selectImage((currentIndex + 1) % enabledImages.length);
                }
            } else {
                // Swipe right - prev image
                if (typeof window.selectImage === 'function') {
                    const enabledImages = PRODUCT_IMAGES.filter(function(img) { return img.enabled; });
                    const currentIndex = window.currentImageIndex || 0;
                    window.selectImage((currentIndex - 1 + enabledImages.length) % enabledImages.length);
                }
            }
        }
    }

    // =========================================================
    // INITIALIZE
    // =========================================================
    document.addEventListener('DOMContentLoaded', function() {
        // Lightbox click on main image
        const mainImage = document.querySelector('.hero-gallery-main');
        if (mainImage) {
            mainImage.style.cursor = 'zoom-in';
            mainImage.addEventListener('click', function() {
                openLightbox(window.currentImageIndex || 0);
            });
        }

        // Lightbox controls
        const lightbox = document.querySelector('.lightbox');
        if (lightbox) {
            lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
            lightbox.querySelector('.lightbox-nav.prev').addEventListener('click', function(e) {
                e.stopPropagation();
                prevLightboxImage();
            });
            lightbox.querySelector('.lightbox-nav.next').addEventListener('click', function(e) {
                e.stopPropagation();
                nextLightboxImage();
            });

            // Close on background click
            lightbox.addEventListener('click', function(e) {
                if (e.target === lightbox) closeLightbox();
            });
        }

        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (!lightbox.classList.contains('active')) return;

            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') prevLightboxImage();
            if (e.key === 'ArrowRight') nextLightboxImage();
        });

        initTouchSwipe();
    });
})();
