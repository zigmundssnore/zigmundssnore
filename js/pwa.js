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
    var DISMISS_DAYS = 3;

    var INSTALL_ICON =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<rect x="5" y="2" width="14" height="20" rx="3"/><path d="M12 7.5v6.5M9 11.5l3 3 3-3"/>' +
        '<path d="M10 18.5h4"/></svg>';

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
    function markDismissed() {
        try { localStorage.setItem(STORAGE_DISMISSED, String(Date.now())); } catch (e) { /* ignore */ }
    }

    // Instalēšanas stāvokli katrā ielādē pārbaudām no jauna (isStandalone) —
    // netiek glabāts pastāvīgi, lai poga/logs atgriežas, ja lietotne tiek atinstalēta.
    if (isStandalone() || !isMobile()) return;

    document.addEventListener('DOMContentLoaded', function () {
        var overlay = document.getElementById('pwaInstallOverlay');
        if (!overlay) return;

        var okBtn = document.getElementById('pwaInstallOk');
        var dismissBtn = document.getElementById('pwaInstallDismiss');
        var subText = document.getElementById('pwaInstallSub');
        var deferredPrompt = null;
        var installed = false;

        var headerBtn = document.createElement('button');
        headerBtn.type = 'button';
        headerBtn.id = 'pwaInstallBtn';
        headerBtn.className = 'theme-switch install-btn';
        headerBtn.hidden = true;
        headerBtn.setAttribute('aria-label', 'Instalēt lietotni');
        headerBtn.title = 'Instalēt lietotni';
        headerBtn.innerHTML = INSTALL_ICON + '<span class="install-btn-label">Instalēt</span>';

        var topControls = document.querySelector('.top-controls');
        if (topControls) {
            topControls.insertBefore(headerBtn, topControls.firstChild);
        } else {
            document.body.appendChild(headerBtn);
        }

        function showHeaderButton() {
            if (!installed) headerBtn.hidden = false;
        }
        function openDialog() {
            overlay.classList.add('open');
            overlay.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
        }
        function closeDialog() {
            overlay.classList.remove('open');
            overlay.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
        }
        function onInstalled() {
            installed = true;
            headerBtn.hidden = true;
            closeDialog();
        }

        headerBtn.addEventListener('click', openDialog);
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
            showHeaderButton();
            if (!recentlyDismissed()) setTimeout(openDialog, 2200);
        } else {
            window.addEventListener('beforeinstallprompt', function (e) {
                e.preventDefault();
                deferredPrompt = e;
                showHeaderButton();
                if (!recentlyDismissed()) setTimeout(openDialog, 800);
            });

            okBtn.addEventListener('click', function () {
                closeDialog();
                if (!deferredPrompt) return;
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then(function (choice) {
                    if (choice.outcome === 'accepted') onInstalled();
                    else markDismissed();
                    deferredPrompt = null;
                });
            });

            window.addEventListener('appinstalled', onInstalled);
        }
    });
})();
