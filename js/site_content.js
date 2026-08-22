(function() {
    'use strict';

    const cache = { promise: null, mode: null, configPath: null };

    function getMode() {
        try {
            const raw = typeof WEBSITE_TYPE_SELECT !== 'undefined' ? String(WEBSITE_TYPE_SELECT) : 'singleproduct';
            const value = raw.trim().toLowerCase();
            if (value === 'multipleproducts') return 'multipleproducts';
            if (value === 'affiliate') return 'affiliate';
            return 'singleproduct';
        } catch (error) {
            return 'singleproduct';
        }
    }

    function getConfigPath(mode) {
        if (mode === 'multipleproducts') return 'js/config2.js';
        if (mode === 'affiliate') return 'js/config3.js';
        return 'js/config.js';
    }

    function loadScript(src) {
        return new Promise(function(resolve, reject) {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = function() { resolve(); };
            script.onerror = function() { reject(new Error('Failed to load ' + src)); };
            document.head.appendChild(script);
        });
    }

    function ensureConfigLoaded() {
        if (cache.promise) return cache.promise;
        cache.mode = getMode();
        cache.configPath = getConfigPath(cache.mode);
        cache.promise = loadScript(cache.configPath);
        return cache.promise;
    }

    window.PMELAB_SITE = {
        getMode: getMode,
        getConfigPath: getConfigPath,
        ensureConfigLoaded: ensureConfigLoaded
    };
})();

