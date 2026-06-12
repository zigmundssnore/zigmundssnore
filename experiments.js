/* ============================================================
   EKSPERIMENTĀLĀS IZMAIŅAS — zigmundssnore.lv
   Šo failu var droši DZĒST, lai atgrieztos pie iepriekšējā
   stāvokļa (kopā ar experiments.css, room-interior.webp un
   atzīmētajiem blokiem index.html). Galvenos failus neaiztiek.
   1) Gaismas plankums zem kursora galerijā
   2) Lightbox sīktēlu lente
   3) "Skatīt interjerā" — īsta istabas foto ar gleznu reālā mērogā
   ============================================================ */
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        var galleryItems = Array.prototype.slice.call(
            document.querySelectorAll('.gallery-container .gallery-item'));
        var lightbox = document.getElementById('lightbox');
        var lightboxImage = document.getElementById('lightbox-image');
        if (!galleryItems.length || !lightbox || !lightboxImage) return;

        /* ── 1. Gaismas plankums zem kursora ── */
        if (window.matchMedia('(pointer: fine)').matches) {
            galleryItems.forEach(function (item) {
                item.addEventListener('mousemove', function (e) {
                    var r = item.getBoundingClientRect();
                    item.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
                    item.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
                });
            });
        }

        /* kura glezna šobrīd atvērta lightboxā (pēc bildes src) */
        function currentIndex() {
            var src = (lightboxImage.getAttribute('src') || '').replace('nr2.webp', '.webp');
            for (var i = 0; i < galleryItems.length; i++) {
                var img = galleryItems[i].querySelector('img');
                if (!img) continue;
                var full = img.getAttribute('data-src') || img.getAttribute('src');
                if (src === full) return i;
            }
            return -1;
        }

        /* ── 2. Sīktēlu lente ── */
        var strip = document.createElement('div');
        strip.className = 'lb-strip';
        galleryItems.forEach(function (item) {
            var t = document.createElement('img');
            t.src = item.querySelector('img').getAttribute('src'); // mazais sīktēls
            t.loading = 'lazy';
            t.decoding = 'async';
            t.className = 'lb-thumb';
            t.alt = '';
            t.addEventListener('click', function (e) {
                e.stopPropagation();
                item.click(); // atver lightboxu tieši uz šo gleznu
            });
            strip.appendChild(t);
        });
        lightbox.appendChild(strip);

        function syncStrip() {
            var idx = currentIndex();
            var thumbs = strip.children;
            for (var i = 0; i < thumbs.length; i++) {
                thumbs[i].classList.toggle('active', i === idx);
                thumbs[i].style.display =
                    galleryItems[i].classList.contains('hidden') ? 'none' : '';
            }
            var act = thumbs[idx];
            if (act) {
                strip.scrollTo({
                    left: act.offsetLeft - strip.clientWidth / 2 + act.clientWidth / 2,
                    behavior: 'smooth'
                });
            }
        }

        new MutationObserver(syncStrip)
            .observe(lightboxImage, { attributes: true, attributeFilter: ['src'] });

        /* ── 3. "Skatīt interjerā" ──
           Fons: īsta istabas fotogrāfija (room-interior.webp, 1200×1800).
           Kalibrēts pēc dīvāna platuma = 170 cm: dīvāns foto aizņem
           x 142..1155 px no 1200 (izmērīts ar mērlīnijām), t.i., 84,4%
           no kadra → 1 cm = 0,497% no foto platuma.
           PPC  — cik liela daļa no foto platuma atbilst 1 cm pie sienas
           CX   — gleznas centrs (dīvāna vidus, daļa no platuma)
           BOT  — gleznas apakšmala (daļa no augstuma, mērot no apakšas) */
        var PPC = 0.00497;
        var CX  = 0.540;
        var BOT = 0.595;

        var overlay = null, roomArt, roomFrame, roomCaption, roomScene, roomPhoto;
        var artW = 50, artH = 40; // gleznas izmērs cm
        var roomIdx = -1;         // atvērtās gleznas indekss (faila nosaukumam)

        /* telefoniem/planšetēm — 3 s sagatavošanās ekrāns, kas noslēpj
           renderēšanas raustīšanos, kamēr foto un glezna ielādējas */
        var IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;
        var LOAD_MS = 3000;
        var loadTimer = null;

        var infoBar = lightbox.querySelector('.lightbox-info');
        if (infoBar) {
            var roomBtn = document.createElement('button');
            roomBtn.className = 'lb-room-btn';
            roomBtn.textContent = '🛋️ Skatīt interjerā';
            infoBar.insertBefore(roomBtn, document.getElementById('lightboxShare'));
            roomBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                openRoom();
            });
        }

        function buildOverlay() {
            overlay = document.createElement('div');
            overlay.className = 'room-overlay';
            overlay.innerHTML =
                '<button class="room-close" aria-label="Aizvērt">×</button>' +
                '<div class="room-scene">' +
                    '<img class="room-photo" alt="" decoding="async">' +
                    '<div class="room-frame"><img class="room-art" alt="Glezna interjerā"></div>' +
                    '<div class="room-caption"></div>' +
                    '<button class="room-dl">' +
                        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
                        '<span>Lejupielādēt foto</span>' +
                    '</button>' +
                '</div>' +
                '<div class="room-loader">' +
                    '<p class="room-loader-text">Mēs sagatavojam interjera priekšskatījumu…</p>' +
                    '<div class="room-loader-bar"></div>' +
                '</div>';
            document.body.appendChild(overlay);

            roomPhoto = overlay.querySelector('.room-photo');
            roomFrame = overlay.querySelector('.room-frame');
            roomArt = overlay.querySelector('.room-art');
            roomCaption = overlay.querySelector('.room-caption');
            roomScene = overlay.querySelector('.room-scene');

            overlay.addEventListener('click', function (e) {
                if (e.target === overlay || e.target.classList.contains('room-close')) closeRoom();
            });

            overlay.querySelector('.room-dl').addEventListener('click', function (e) {
                e.stopPropagation();
                downloadRoomShot();
            });

            /* Esc aizver tikai interjera skatu, ne lightboxu apakšā */
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && overlay.classList.contains('open')) {
                    e.stopImmediatePropagation();
                    closeRoom();
                }
            }, true);

            window.addEventListener('resize', function () {
                if (overlay.classList.contains('open')) layoutRoom();
            });
        }

        function layoutRoom() {
            var w = roomScene.clientWidth;
            var h = roomScene.clientHeight;
            var ppc = w * PPC;            // pikseļi uz centimetru pie sienas

            var aw = artW * ppc;
            var ah = artH * ppc;
            var f = Math.max(4, 3.2 * ppc); // rāmja biezums ≈ 3,2 cm

            roomFrame.style.padding = f + 'px';
            roomFrame.style.setProperty('--f', f + 'px');
            roomFrame.style.left = (w * CX - (aw / 2 + f)) + 'px';
            roomFrame.style.bottom = (h * BOT - f) + 'px';
            roomArt.style.width = aw + 'px';
            roomArt.style.height = ah + 'px';
        }

        function openRoom() {
            var idx = currentIndex();
            if (idx < 0) return;
            roomIdx = idx;
            if (!overlay) buildOverlay();

            /* foto ielādējam tikai pirmajā atvēršanas reizē */
            if (!roomPhoto.getAttribute('src')) roomPhoto.src = 'room-interior.webp';

            var item = galleryItems[idx];
            var nameEl = item.querySelector('.image-name');
            var m = (nameEl ? nameEl.textContent : '').match(/(\d+)\s*[x×]\s*(\d+)/i);
            artW = m ? parseInt(m[1], 10) : 50;
            artH = m ? parseInt(m[2], 10) : 40;

            /* ierāmētajām gleznām ramis-x ir foto ar sienu — interjerā
               liekam tīro gleznas bildi ramis-xnr2 */
            var artSrc = lightboxImage.getAttribute('src');
            if (item.dataset.category === 'ieramettas') {
                var itemImg = item.querySelector('img');
                var base = itemImg.getAttribute('data-src') || itemImg.getAttribute('src');
                artSrc = base.replace('.webp', 'nr2.webp');
            }

            /* orientācijas pārbaude pret pašas gleznas bildi: ja cm izmēri
               nesakrīt ar bildes faktisko orientāciju, apmainām tos vietām */
            roomArt.onload = function () {
                var iw = roomArt.naturalWidth, ih = roomArt.naturalHeight;
                if (iw && ih && ((iw >= ih) !== (artW >= artH))) {
                    var t = artW; artW = artH; artH = t;
                    roomCaption.textContent = 'Glezna ' + artW + ' × ' + artH + ' cm · dīvāns ≈ 170 cm (reāls mērogs)';
                }
                layoutRoom();
            };
            roomArt.src = artSrc;
            roomCaption.textContent = 'Glezna ' + artW + ' × ' + artH + ' cm · dīvāns ≈ 170 cm (reāls mērogs)';
            overlay.classList.add('open');

            if (IS_TOUCH) {
                overlay.classList.add('loading');
                clearTimeout(loadTimer);
                loadTimer = setTimeout(function () {
                    overlay.classList.remove('loading');
                }, LOAD_MS);
            }

            requestAnimationFrame(layoutRoom);
        }

        function closeRoom() {
            clearTimeout(loadTimer);
            overlay.classList.remove('loading');
            overlay.classList.remove('open');
        }

        /* detalizēts koka rāmis ar tekstūru un zelta līniju (canvas versija) */
        function drawFrame(ctx, x, y, aw, ah, f) {
            var ox = x - f, oy = y - f, ow = aw + 2 * f, oh = ah + 2 * f;

            /* pamatne ar piekārtas gleznas ēnu */
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.38)';
            ctx.shadowBlur = 34;
            ctx.shadowOffsetY = 16;
            ctx.fillStyle = '#57493a';
            ctx.fillRect(ox, oy, ow, oh);
            ctx.restore();

            /* tonālā pāreja — gaisma krīt no augšas-kreisās */
            var g = ctx.createLinearGradient(ox, oy, ox + ow, oy + oh);
            g.addColorStop(0, 'rgba(255,255,255,0.12)');
            g.addColorStop(0.45, 'rgba(0,0,0,0)');
            g.addColorStop(1, 'rgba(0,0,0,0.20)');
            ctx.fillStyle = g;
            ctx.fillRect(ox, oy, ow, oh);

            /* koka šķiedras tekstūra (tikai rāmja gredzenā) */
            ctx.save();
            ctx.beginPath();
            ctx.rect(ox, oy, ow, oh);
            ctx.rect(x, y, aw, ah);
            ctx.clip('evenodd');
            ctx.lineWidth = 1;
            for (var i = -oh; i < ow; i += 5) {
                ctx.strokeStyle = 'rgba(0,0,0,0.09)';
                ctx.beginPath();
                ctx.moveTo(ox + i, oy);
                ctx.lineTo(ox + i + oh, oy + oh);
                ctx.stroke();
                ctx.strokeStyle = 'rgba(255,255,255,0.045)';
                ctx.beginPath();
                ctx.moveTo(ox + i + 2.5, oy);
                ctx.lineTo(ox + i + 2.5 + oh, oy + oh);
                ctx.stroke();
            }
            ctx.restore();

            /* skavas: gaišā ārējā un tumšā iekšējā mala */
            ctx.strokeStyle = 'rgba(255,255,255,0.18)';
            ctx.lineWidth = 2;
            ctx.strokeRect(ox + 1, oy + 1, ow - 2, oh - 2);
            ctx.strokeStyle = 'rgba(0,0,0,0.35)';
            ctx.strokeRect(x - 1.5, y - 1.5, aw + 3, ah + 3);

            /* zeltītā līnija pa ārējo perimetru */
            ctx.strokeStyle = '#cfae73';
            ctx.lineWidth = 3;
            ctx.strokeRect(ox - 1.5, oy - 1.5, ow + 3, oh + 3);
            ctx.strokeStyle = 'rgba(122, 92, 46, 0.85)';
            ctx.lineWidth = 1;
            ctx.strokeRect(ox - 3.5, oy - 3.5, ow + 7, oh + 7);
        }

        /* uzģenerē istabas foto + gleznu vienā attēlā un lejupielādē kā JPG */
        function downloadRoomShot() {
            var canvas = document.createElement('canvas');
            canvas.width = 1200;
            canvas.height = 1800;
            var ctx = canvas.getContext('2d');

            var bg = new Image();
            bg.onload = function () {
                ctx.drawImage(bg, 0, 0, 1200, 1800);

                var art = new Image();
                art.onload = function () {
                    var ppc = 1200 * PPC;
                    var aw = artW * ppc, ah = artH * ppc;
                    var x = 1200 * CX - aw / 2;
                    var y = 1800 - 1800 * BOT - ah;
                    var f = Math.round(3.2 * ppc); // rāmja biezums ≈ 3,2 cm

                    drawFrame(ctx, x, y, aw, ah, f);

                    /* glezna ar "cover" kadrējumu, tāpat kā ekrānā */
                    var s = Math.max(aw / art.naturalWidth, ah / art.naturalHeight);
                    var sw = aw / s, sh = ah / s;
                    var sx = (art.naturalWidth - sw) / 2;
                    var sy = (art.naturalHeight - sh) / 2;
                    ctx.drawImage(art, sx, sy, sw, sh, x, y, aw, ah);

                    /* gleznas iedziļinājuma ēna gar rāmja iekšmalu */
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.26)';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(x + 1.5, y + 1.5, aw - 3, ah - 3);

                    canvas.toBlob(function (blob) {
                        if (!blob) return;
                        var a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = 'Zigmunds-Snore-glezna-Nr' + (roomIdx + 1) + '-interjera.jpg';
                        a.click();
                        setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
                    }, 'image/jpeg', 0.9);
                };
                art.src = roomArt.getAttribute('src');
            };
            bg.src = 'room-interior.webp';
        }
    });
})();
