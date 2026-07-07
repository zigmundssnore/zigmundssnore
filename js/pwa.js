if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch((err) => {
            console.error('SW registration failed:', err);
        });
    });
}

(function () {
    'use strict';

    var STORAGE_DISMISSED = 'pwa_prompt_dismissed_at';
    var STORAGE_INSTALLED = 'pwa_installed';
    var DISMISS_DAYS = 14;

    function isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
    }
    function isMobile() {
        return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }
    function isIOS() {
        return /iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.MSStream;
    }
    function recentlyDismissed() {
        var t = localStorage.getItem(STORAGE_DISMISSED);
        if (!t) return false;
        return (Date.now() - parseInt(t, 10)) / 86400000 < DISMISS_DAYS;
    }
    function markInstalled() {
        try { localStorage.setItem(STORAGE_INSTALLED, '1'); } catch (e) { /* ignore */ }
    }
    function markDismissed() {
        try { localStorage.setItem(STORAGE_DISMISSED, String(Date.now())); } catch (e) { /* ignore */ }
    }

    if (isStandalone()) markInstalled();

    var alreadyHandled = isStandalone() ||
        localStorage.getItem(STORAGE_INSTALLED) === '1' ||
        recentlyDismissed();

    if (!isMobile() || alreadyHandled) return;

    document.addEventListener('DOMContentLoaded', function () {
        var overlay = document.getElementById('pwaInstallOverlay');
        if (!overlay) return;

        var okBtn = document.getElementById('pwaInstallOk');
        var dismissBtn = document.getElementById('pwaInstallDismiss');
        var subText = document.getElementById('pwaInstallSub');
        var deferredPrompt = null;

        function openDialog() {
            overlay.classList.add('open');
            overlay.setAttribute('aria-hidden', 'false');
        }
        function closeDialog() {
            overlay.classList.remove('open');
            overlay.setAttribute('aria-hidden', 'true');
        }

        dismissBtn.addEventListener('click', function () {
            closeDialog();
            markDismissed();
        });

        if (isIOS()) {
            // Safari (iOS) nepiedāvā automātisku instalēšanas API — jāparāda instrukcija.
            subText.textContent = 'Pieskaries "Kopīgot" ⌃ pārlūka joslā un izvēlies "Pievienot sākuma ekrānam".';
            okBtn.textContent = 'Sapratu';
            okBtn.addEventListener('click', function () {
                closeDialog();
                markDismissed();
            });
            setTimeout(openDialog, 2200);
        } else {
            window.addEventListener('beforeinstallprompt', function (e) {
                e.preventDefault();
                deferredPrompt = e;
                setTimeout(openDialog, 800);
            });

            okBtn.addEventListener('click', function () {
                closeDialog();
                if (!deferredPrompt) return;
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then(function (choice) {
                    if (choice.outcome === 'accepted') markInstalled();
                    else markDismissed();
                    deferredPrompt = null;
                });
            });

            window.addEventListener('appinstalled', function () {
                closeDialog();
                markInstalled();
            });
        }
    });
})();
