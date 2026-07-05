/* ============================================================
   TĒMAS PĀRSLĒGS — gaišs / tumšs
   • Noklusēti SEKO SISTĒMAI (prefers-color-scheme) — dators + telefons.
   • Lietotāja izvēle (poga) saglabājas localStorage un uzvar pār sistēmu.
   • Ielādēts sinhroni <head> (pēc lang.js), lai nav mirgoņas.
   ============================================================ */
(function () {
    'use strict';
    var mq = window.matchMedia('(prefers-color-scheme: light)');

    function resolve() {
        var q = location.search + location.hash;      // URL priekšskatījumam
        if (q.indexOf('light') > -1) return 'light';
        if (q.indexOf('dark') > -1) return 'dark';
        var saved = localStorage.getItem('site_theme');
        if (saved === 'light' || saved === 'dark') return saved;
        return mq.matches ? 'light' : 'dark';          // sistēmas režīms
    }

    function apply(t) {
        document.documentElement.setAttribute('data-theme', t);
        var m = document.querySelector('meta[name="theme-color"]');
        if (m) m.setAttribute('content', t === 'light' ? '#efe7d8' : '#0a0f1e');
    }

    apply(resolve());   // uzreiz (pirms zīmēšanas)

    // sistēmas režīma maiņa reāllaikā — tikai ja lietotājs nav manuāli izvēlējies
    try {
        mq.addEventListener('change', function (e) {
            if (!localStorage.getItem('site_theme')) apply(e.matches ? 'light' : 'dark');
        });
    } catch (e) { /* vecāki pārlūki */ }

    var SUN = '<svg class="ico-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"/></svg>';
    var MOON = '<svg class="ico-moon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

    document.addEventListener('DOMContentLoaded', function () {
        var btn = document.createElement('button');
        btn.className = 'theme-switch';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Gaišais / tumšais režīms');
        btn.innerHTML = SUN + MOON;
        btn.addEventListener('click', function () {
            var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            localStorage.setItem('site_theme', next);
            apply(next);
        });

        // Ievieto blakus valodu pārslēgam (kopīgā konteinerā)
        var lang = document.querySelector('.lang-switch');
        var wrap = document.createElement('div');
        wrap.className = 'top-controls';
        if (lang && lang.parentNode) {
            lang.parentNode.insertBefore(wrap, lang);
            wrap.appendChild(btn);
            wrap.appendChild(lang);
        } else {
            wrap.appendChild(btn);
            document.body.appendChild(wrap);
        }
    });
})();
