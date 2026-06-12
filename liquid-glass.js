/* ============================================================
   LIQUID GLASS ENGINE — zigmundssnore.lv
   Generates SVG displacement-map filters for true glass
   refraction (edge bending + chromatic aberration).
   Chromium-only; other browsers keep the plain-blur fallback.
   ============================================================ */
(function () {
    'use strict';

    // SVG-referenced backdrop-filter renders only in Chromium engines.
    var isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
    var isChromium = !!window.chrome && !isIOS;
    if (!isChromium || !CSS.supports('backdrop-filter', 'url(#x)')) return;

    // Telefoniem SVG refrakcijas filtri ir par dārgu — efekts paliek tikai datoros.
    if (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 900) return;

    /* Build a displacement map for a rounded rectangle.
       Pixels near the edge get a vector pointing toward the centre,
       so the backdrop is sampled from further inside — this produces
       the magnifying "lens bezel" look of real thick glass.
       R channel = X displacement, G channel = Y displacement, 128 = neutral. */
    function makeMap(w, h, r, bezel) {
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        var img = ctx.createImageData(w, h);
        var d = img.data;

        function sdf(x, y) { // signed distance to rounded-rect edge (<0 inside)
            var qx = Math.abs(x - w / 2) - (w / 2 - r);
            var qy = Math.abs(y - h / 2) - (h / 2 - r);
            var ax = Math.max(qx, 0), ay = Math.max(qy, 0);
            return Math.min(Math.max(qx, qy), 0) + Math.hypot(ax, ay) - r;
        }

        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var s = sdf(x, y);
                var dx = 0, dy = 0;
                if (s > -bezel && s <= 0) {
                    var t = 1 + s / bezel;   // 1 at edge → 0 at inner bezel limit
                    var fall = t * t;        // quadratic falloff, like a curved bevel
                    var gx = sdf(x + 1, y) - sdf(x - 1, y);
                    var gy = sdf(x, y + 1) - sdf(x, y - 1);
                    var len = Math.hypot(gx, gy) || 1;
                    dx = -(gx / len) * fall; // pull sample toward the centre
                    dy = -(gy / len) * fall;
                }
                var i = (y * w + x) * 4;
                d[i] = 128 + dx * 127;
                d[i + 1] = 128 + dy * 127;
                d[i + 2] = 128;
                d[i + 3] = 255;
            }
        }
        ctx.putImageData(img, 0, 0);
        return canvas.toDataURL();
    }

    /* One filter = refraction (split per RGB channel for chromatic
       aberration at the bezel) + soft blur + saturation boost. */
    function filterXML(id, mapURL, scale) {
        var ab = scale * 0.07; // chromatic aberration spread
        return '' +
        '<filter id="' + id + '" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">' +
            '<feImage href="' + mapURL + '" preserveAspectRatio="none" x="0%" y="0%" width="100%" height="100%" result="map"/>' +
            '<feDisplacementMap in="SourceGraphic" in2="map" scale="' + (scale + ab) + '" xChannelSelector="R" yChannelSelector="G" result="dR"/>' +
            '<feColorMatrix in="dR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cR"/>' +
            '<feDisplacementMap in="SourceGraphic" in2="map" scale="' + scale + '" xChannelSelector="R" yChannelSelector="G" result="dG"/>' +
            '<feColorMatrix in="dG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cG"/>' +
            '<feDisplacementMap in="SourceGraphic" in2="map" scale="' + (scale - ab) + '" xChannelSelector="R" yChannelSelector="G" result="dB"/>' +
            '<feColorMatrix in="dB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="cB"/>' +
            '<feComposite in="cR" in2="cG" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="cRG"/>' +
            '<feComposite in="cRG" in2="cB" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="refracted"/>' +
            '<feGaussianBlur in="refracted" stdDeviation="2.5" result="blurred"/>' +
            '<feColorMatrix in="blurred" type="saturate" values="1.5"/>' +
        '</filter>';
    }

    // Card-shaped glass (bio card, jaunumi container, kontakti, delivery modal)
    var cardMap = makeMap(560, 400, 28, 56);
    // Pill-shaped glass (buttons, tabs, floating WhatsApp)
    var pillMap = makeMap(360, 76, 38, 24);

    var holder = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    holder.setAttribute('width', '0');
    holder.setAttribute('height', '0');
    holder.setAttribute('style', 'position:absolute;overflow:hidden');
    holder.setAttribute('aria-hidden', 'true');
    holder.innerHTML = '<defs>' +
        filterXML('lg-card', cardMap, 64) +
        filterXML('lg-pill', pillMap, 26) +
    '</defs>';
    document.body.appendChild(holder);

    // Gate the CSS — only browsers that got this far use the SVG filters.
    document.documentElement.classList.add('lg-on');
})();
