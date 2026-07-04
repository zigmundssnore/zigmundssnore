/* ============================================================
   VALODU PĀRSLĒGS (LV / EN) — zigmundssnore.lv
   Lapa HTML ir latviski. Ja izvēlēta EN, šis fails pārtulko:
   1) statiskos elementus ar data-i18n atribūtu,
   2) atkārtotās frāzes (galerijas teksts),
   3) dinamiskos JS tekstus caur window.T().
   Pārslēdzot valodu — saglabā izvēli un pārlādē lapu.
   ============================================================ */
(function () {
    'use strict';

    window.SITE_LANG = localStorage.getItem('site_lang') || 'lv';
    document.documentElement.lang = window.SITE_LANG;

    // ── Dinamiskie JS teksti (script.js sauc window.T('latviešu teksts')) ──
    var DYN = {
        'Nr. ': 'No. ',
        'JAUNUMS': 'NEW',
        'Pārdota': 'Sold',
        'Saņemšana': 'Delivery',
        'Saņemšana & ierāmēšana': 'Delivery & framing',
        '🛋️ Skatīt interjerā': '🛋️ View in room',
        'Lejupielādēt foto': 'Download photo',
        '🔍 Pietuvināt': '🔍 Zoom',
        '← Atpakaļ': '← Back',
        'Glezna': 'Painting',
        'reāls mērogs': 'real scale',
        'dīvāns ≈ 170 cm': 'sofa ≈ 170 cm',
        'Mēs sagatavojam interjera priekšskatījumu…': 'Preparing the room preview…',
        'Noklausīties biogrāfiju': 'Listen to biography',
        'Apturēt': 'Stop',
        'Audio nav pieejams': 'Audio unavailable',
        'Saite nokopēta!': 'Link copied!',
        'Kārtot': 'Sort',
        'Kārtot: ': 'Sort: ',
        'Lētākās': 'Cheapest',
        'Dārgākās': 'Most expensive',
        'Mazākās': 'Smallest',
        'Lielākās': 'Largest'
    };
    window.T = function (lv) {
        return (window.SITE_LANG === 'en' && DYN[lv] != null) ? DYN[lv] : lv;
    };

    // ── Statiskie elementi ar data-i18n="key" (EN versija; LV jau ir HTML) ──
    var EN = {
        'nav.about': 'About the artist',
        'nav.news': 'News',
        'nav.contacts': 'Contacts',
        'nav.works': 'Available works',

        'bio.listen': 'Listen to biography',
        'bio.p1': '<strong>Zigmunds Šnore</strong> was born on 3 November <strong>1942</strong>.',
        'bio.p2': 'He spent his childhood and youth in <strong>Jūrmala</strong>, where he studied at <strong>Majori School</strong>, later continuing his education at the <strong>Riga School of Applied Arts</strong>, interior design department.',
        'bio.p3': 'After his military service, he refined his skills in the studio of the painter <strong>Ilze Strekavina</strong>.',
        'bio.p4': 'His dominant technique is <strong>watercolour</strong>. Alongside it, he has also worked in applied graphics.',
        'bio.p5': 'He has taken part in exhibitions since <strong>1968</strong>. He gained wider recognition in 1969, when his works were exhibited at the <strong>Jūrmala Museum, in Majori, Jomas Street</strong>.',
        'bio.p6': 'Since 1995 he has been a <strong>member of the Artists’ Union of Latvia</strong>, as well as a <strong>member of the Jūrmala Artists’ Society</strong>.',
        'bio.p7': 'He has held solo exhibitions at the Riga Latvian Society House, as well as at the Jūrmala and Madona museums.',
        'bio.p8': 'He has participated in <strong>several international exhibitions</strong> – the Baltic States Watercolour Biennial in Kaunas, the International Watercolour Biennial in Fulda, Germany, and the world watercolour exhibition in Fabriano, Italy.',
        'bio.p9': '<strong>Zigmunds Šnore’s works are held in private collections both in Latvia and abroad.</strong>',

        'news.title': 'News',
        'news.exhib.h': 'Watercolour exhibition <strong>"FAR SHORES"</strong>',
        'news.exhib.p1': 'can be seen at the Ainaži Naval School Museum — <strong>Valdemāra Street 47, Ainaži</strong>',
        'news.exhib.p2': 'The watercolours on display <strong>are available for purchase</strong>. If interested, please contact the museum staff.',
        'news.comm.h': 'Commissioned painting',
        'news.comm.p1': 'Would you like a unique work of art created just for you?',
        'news.comm.p2': 'The artist offers commissioned painting, with a possible visit in person',
        'news.comm.p3': 'to photograph the chosen object, landscape or place, as well as work based on photographs you send.',
        'news.comm.p4': 'If you are interested in this service, click “Contact us” and write on WhatsApp,',
        'news.comm.p5': 'to agree on the details and create a unique work of art.',
        'news.comm.example': 'See an example below!',
        'news.series.h': 'The series "Life Stories"',
        'news.series.p1': 'The previously expressed idea of creating a series of life stories with the artist Zigmunds Šnore has <strong>come true</strong>.',
        'news.series.p2': 'Now everyone can <strong>watch</strong> these episodes',
        'news.series.p3': 'The series can be viewed on <strong>YouTube by clicking the button below.</strong>',
        'news.series.btn': 'The series "Life Stories"',
        'news.exh2.h': 'Exhibitions',
        'news.exh2.p1': 'The artist is open to offers for organising new exhibitions.',
        'news.exh2.p2': 'If you would like to host a painting exhibition, please contact us.',

        'contacts.title': 'Contacts',

        'gallery.title': 'Available works',
        'gallery.tab1': 'Paintings',
        'gallery.tab2': 'Framed paintings',
        'gallery.tab3': 'Small paintings',
        'sort.label': 'Sort',
        'sort.none': 'No sorting',
        'sort.priceAsc': 'Cheapest first',
        'sort.priceDesc': 'Most expensive first',
        'sort.sizeAsc': 'Smallest first',
        'sort.sizeDesc': 'Largest first',

        'update.text': 'Didn’t find what you were looking for? <strong>Contact us and we’ll expand the selection!</strong>',
        'wa.text': 'Contact us!',

        'modal.frameH': 'We can frame this painting on request',
        'modal.frameP': 'Contact us and we’ll <strong>frame this painting</strong> in the frame you want, or choose one at the artist’s discretion.',
        'modal.frameBtn': '🖼️ Get it framed',
        'modal.deliveryH': 'Delivery and pickup',
        'modal.deliveryP': 'This painting can be <strong>picked up free of charge in Jūrmala and Riga</strong>, or shipped via <strong>DPD / Omniva</strong> to any parcel locker in the Baltics. For shipping outside the Baltics, please contact us.',
        'modal.pickup': '📍 Pick up in person',
        'modal.ship': '📦 Ship via Omniva / DPD',
        'modal.soldH': 'This painting is sold',
        'modal.soldP': 'It can no longer be delivered or framed.',

        'lightboxInquire': 'Delivery & framing',
        'lightboxZoom': '🔍 Zoom'
    };

    function applyStatic() {
        if (window.SITE_LANG !== 'en') return;
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var v = EN[el.getAttribute('data-i18n')];
            if (v != null) el.innerHTML = v;
        });
    }

    // ── Frāžu aizstāšana galerijas tekstā (garākās frāzes vispirms) ──
    var PHRASES = [
        ['Rāmis ar stiklu un paspartū', 'Frame with glass and passe-partout'],
        ['Akvarelis uz papīra', 'Watercolor on paper'],
        ['Eļļa uz audekla', 'Oil on canvas'],
        ['Akrils uz audekla', 'Acrylic on canvas'],
        ['Guaša uz papīra', 'Gouache on paper'],
        ['Glezna ', 'Painting '],
        ['Rāmis ', 'Frame ']
    ];
    function applyPhrases() {
        if (window.SITE_LANG !== 'en') return;
        var nodes = document.querySelectorAll('#gallery .image-name, #gallery .image-size');
        nodes.forEach(function (el) {
            var t = el.textContent;
            PHRASES.forEach(function (p) { t = t.split(p[0]).join(p[1]); });
            if (t !== el.textContent) el.textContent = t;
        });
    }

    // ── Valodas pārslēgs (mazs, augšējā labajā stūrī) ──
    var LV_FLAG = '<svg viewBox="0 0 20 12" aria-hidden="true"><rect width="20" height="12" fill="#9d1b32"/><rect y="5" width="20" height="2" fill="#fff"/></svg>';
    var EN_FLAG = '<svg viewBox="0 0 60 30" aria-hidden="true"><clipPath id="ukc"><path d="M0 0v30h60V0z"/></clipPath><path d="M0 0v30h60V0z" fill="#012169"/><path d="M0 0l60 30M60 0L0 30" stroke="#fff" stroke-width="6"/><path d="M0 0l60 30M60 0L0 30" clip-path="url(#ukc)" stroke="#c8102e" stroke-width="4"/><path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#c8102e" stroke-width="6"/></svg>';

    function buildSwitcher() {
        var box = document.createElement('div');
        box.className = 'lang-switch';
        box.innerHTML =
            '<button class="lang-opt' + (window.SITE_LANG === 'lv' ? ' active' : '') + '" data-lang="lv" aria-label="Latviski">' + LV_FLAG + '<span>LV</span></button>' +
            '<button class="lang-opt' + (window.SITE_LANG === 'en' ? ' active' : '') + '" data-lang="en" aria-label="English">' + EN_FLAG + '<span>EN</span></button>';
        box.addEventListener('click', function (e) {
            var b = e.target.closest('.lang-opt');
            if (!b) return;
            var lang = b.dataset.lang;
            if (lang === window.SITE_LANG) return;
            localStorage.setItem('site_lang', lang);
            location.reload();
        });
        document.body.appendChild(box);
    }

    document.addEventListener('DOMContentLoaded', function () {
        applyStatic();
        applyPhrases();
        buildSwitcher();
    });
})();
