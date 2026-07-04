/* ============================================================
   SEO — strukturētie dati (JSON-LD) gleznām.
   Auto-ģenerē no galerijas DOM, tāpēc atjaunojas, kad pievieno/
   dzēš gleznas. Palīdz Google saprast gleznas kā preces (attēls,
   izmērs, cena) un rādīt tās meklējumos / attēlu rezultātos.
   ============================================================ */
(function () {
    'use strict';

    function build() {
        try {
            var BASE = 'https://zigmundssnore.github.io/zigmundssnore/';
            var items = document.querySelectorAll('.gallery-container .gallery-item');
            if (!items.length) return;

            var artist = { '@type': 'Person', 'name': 'Zigmunds Šnore' };
            var elements = [];

            items.forEach(function (it) {
                var img = it.querySelector('img');
                if (!img) return;
                var src = img.getAttribute('data-src') || img.getAttribute('src') || '';
                if (!src) return;

                var names = it.querySelectorAll('.image-name');
                var sizeTxt = names[0] ? names[0].textContent.trim() : '';
                var typeTxt = names.length > 1 ? names[names.length - 1].textContent.trim() : '';
                var priceEl = it.querySelector('.image-size');
                var priceRaw = priceEl ? priceEl.textContent.trim() : '';
                var priceM = priceRaw.match(/[0-9]+(?:[.,][0-9]+)?/);

                var product = {
                    '@type': ['VisualArtwork', 'Product'],
                    'name': 'Zigmunds Šnore — akvarelis' + (sizeTxt ? ' ' + sizeTxt : ''),
                    'image': BASE + src,
                    'artist': artist,
                    'creator': artist,
                    'artform': 'Painting',
                    'artMedium': typeTxt || 'Watercolor on paper',
                    'url': BASE
                };

                var dim = sizeTxt.match(/(\d+)\s*[x×]\s*(\d+)/);
                if (dim) {
                    product.width = { '@type': 'QuantitativeValue', 'value': +dim[1], 'unitCode': 'CMT' };
                    product.height = { '@type': 'QuantitativeValue', 'value': +dim[2], 'unitCode': 'CMT' };
                }
                if (priceM) {
                    product.offers = {
                        '@type': 'Offer',
                        'price': priceM[0].replace(',', '.'),
                        'priceCurrency': 'EUR',
                        'availability': 'https://schema.org/InStock',
                        'url': BASE
                    };
                }

                elements.push({ '@type': 'ListItem', 'position': elements.length + 1, 'item': product });
            });

            if (!elements.length) return;

            var data = {
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                'name': 'Zigmunda Šnores gleznas',
                'numberOfItems': elements.length,
                'itemListElement': elements
            };

            var s = document.createElement('script');
            s.type = 'application/ld+json';
            s.textContent = JSON.stringify(data);
            document.head.appendChild(s);
        } catch (e) {
            /* SEO dati nav kritiski — klusi ignorējam, lai nekad nelauztu lapu */
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', build);
    } else {
        build();
    }
})();
