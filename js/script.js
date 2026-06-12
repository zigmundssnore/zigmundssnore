// =========================
// Firebase Likes
// =========================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getDatabase, ref, runTransaction, onValue } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
 
const firebaseConfig = {
    databaseURL: 'https://zigmunds-majaslapa-default-rtdb.europe-west1.firebasedatabase.app'
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
 
const NTFY_TOPIC = 'zigmunds-like-gleznas';
 
async function sendNtfyNotification(gleznaNum) {
    console.log('ntfy: sūtu par gleznu', gleznaNum);
    try {
        const res = await fetch('https://ntfy.sh/' + NTFY_TOPIC, {
            method: 'POST',
            headers: {
                'Title': 'Jauns like!',
                'Priority': 'default',
                'Content-Type': 'text/plain'
            },
            body: 'Kāds nolaikoja gleznu Nr. ' + gleznaNum
        });
        console.log('ntfy status:', res.status);
    } catch (e) {
        console.error('ntfy kļūda:', e);
    }
}
 
// =========================
// Like skaņa (WebAudio — bez failiem, maigs "pop")
// =========================
let likeAudioCtx = null;

function playLikeSound(up) {
    try {
        likeAudioCtx = likeAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
        if (likeAudioCtx.state === 'suspended') likeAudioCtx.resume();
        const t = likeAudioCtx.currentTime;
        const osc = likeAudioCtx.createOscillator();
        const gain = likeAudioCtx.createGain();
        osc.type = 'sine';
        if (up) {
            // like: jautrs čivinošs uzrāviens
            osc.frequency.setValueAtTime(660, t);
            osc.frequency.exponentialRampToValueAtTime(1320, t + 0.12);
        } else {
            // unlike: kluss lejupejošs blips
            osc.frequency.setValueAtTime(520, t);
            osc.frequency.exponentialRampToValueAtTime(330, t + 0.10);
        }
        gain.gain.setValueAtTime(0.0001, t);
        /* 0.32 sīnusam ir droši zem clipping sliekšņa (1.0) */
        gain.gain.exponentialRampToValueAtTime(0.32, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + (up ? 0.20 : 0.14));
        osc.connect(gain).connect(likeAudioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
    } catch (e) { /* skaņa nav kritiska — klusējam */ }
}

function setupLikes(item, globalIndex) {
    const key = 'glezna_' + (globalIndex + 1);
    const likeRef = ref(db, 'likes/' + key);
    const storageKey = 'liked_' + key;
    const info = item.querySelector('.image-info');
    if (!info) return;
 
    const likeWrapper = document.createElement('div');
    likeWrapper.className = 'like-wrapper';
 
    const likeBtn = document.createElement('button');
    likeBtn.className = 'btn-like';
    likeBtn.innerHTML = '<svg class="like-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
 
    const likeCount = document.createElement('span');
    likeCount.className = 'like-count';
    likeCount.textContent = '0';
 
    likeWrapper.appendChild(likeBtn);
    likeWrapper.appendChild(likeCount);
    info.appendChild(likeWrapper);
 
    let liked = localStorage.getItem(storageKey) === 'true';
    if (liked) likeBtn.classList.add("liked");
 
    onValue(likeRef, (snapshot) => {
        likeCount.textContent = snapshot.val() || 0;
    }, (err) => {
        console.warn('Firebase lasīšana liegta — pārbaudi datubāzes Rules:', err.message);
    });
 
    likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!liked) {
            runTransaction(likeRef, (current) => (current || 0) + 1);
            liked = true;
            localStorage.setItem(storageKey, 'true');
            likeBtn.classList.add("liked");
            playLikeSound(true);
            sendNtfyNotification(globalIndex + 1);
        } else {
            runTransaction(likeRef, (current) => Math.max((current || 0) - 1, 0));
            liked = false;
            localStorage.removeItem(storageKey);
            likeBtn.classList.remove("liked");
            playLikeSound(false);
        }
    });
}
 
document.addEventListener('DOMContentLoaded', () => {
 
    // =========================
    // Gallery numuri + WhatsApp poga
    // =========================
    const waNumber = '37122811564';
    document.querySelectorAll('.gallery-container .gallery-item').forEach((item, i) => {
        const num = i + 1;
        const info = item.querySelector('.image-info');
        if (!info) return;
 
        const numEl = document.createElement('p');
        numEl.className = 'gallery-number';
        numEl.textContent = 'Nr. ' + num;
        info.insertBefore(numEl, info.firstChild);

        // jēgpilns alt teksts Google Attēliem un ekrāna lasītājiem
        const itemImg = item.querySelector('img');
        const sizeTxt = info.querySelector('.image-name')?.textContent || '';
        if (itemImg) itemImg.alt = 'Zigmunda Šnores akvarelis Nr. ' + num + (sizeTxt ? ', ' + sizeTxt : '');

        const btn = document.createElement('button');
        btn.className = 'btn-inquire';
        btn.textContent = 'Uzzināt vairāk';
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openDeliveryModal(num);
        });
        info.appendChild(btn);
 
        setupLikes(item, i);

        // share + download pogas like rindā
        const likeRow = info.querySelector('.like-wrapper');
        if (likeRow && itemImg) {
            const rowShare = document.createElement('button');
            rowShare.className = 'btn-mini';
            rowShare.setAttribute('aria-label', 'Dalīties ar gleznu Nr. ' + num);
            rowShare.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';
            rowShare.addEventListener('click', (e) => {
                e.stopPropagation();
                shareGlezna(num);
            });

            const rowDl = document.createElement('a');
            rowDl.className = 'btn-mini';
            rowDl.setAttribute('aria-label', 'Lejupielādēt gleznu Nr. ' + num);
            rowDl.href = (itemImg.getAttribute('data-src') || itemImg.getAttribute('src')).replace('.webp', '.jpg');
            rowDl.download = 'Zigmunds-Snore-akvarelis-Nr' + num + '.jpg';
            rowDl.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
            rowDl.addEventListener('click', (e) => e.stopPropagation());

            likeRow.appendChild(rowShare);
            likeRow.appendChild(rowDl);
        }
    });
 
    // =========================
    // Dalīšanās ar gleznu (native share / saites kopēšana)
    // =========================
    let toastEl, toastTimer;
    function showToast(msg) {
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.className = 'share-toast';
            document.body.appendChild(toastEl);
        }
        toastEl.textContent = msg;
        requestAnimationFrame(() => toastEl.classList.add('show'));
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
    }

    async function shareGlezna(num) {
        const url = location.origin + location.pathname + '#glezna-' + num;
        const title = 'Zigmunda Šnores akvarelis Nr. ' + num;
        if (navigator.share) {
            try { await navigator.share({ title: title, url: url }); } catch (e) { /* lietotājs atcēla */ }
        } else if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(url);
                showToast('Saite nokopēta!');
            } catch (e) {
                showToast(url);
            }
        }
    }

    // =========================
    // Delivery Modal
    // =========================
    const deliveryOverlay = document.getElementById('deliveryOverlay');
    const modalKlatiene = document.getElementById('modalKlatiene');
    const modalOmniva = document.getElementById('modalOmniva');
 
    function openDeliveryModal(num) {
        const msgKlatiene = encodeURIComponent('Sveiki, vēlos iegādāties un saņemt klātienē gleznu Nr.' + num + '. Vai tā ir pieejama?');
        const msgOmniva = encodeURIComponent('Sveiki, vēlos iegādāties un saņemt ar pakomātu gleznu Nr.' + num + '. Vai tā ir pieejama?');
        modalKlatiene.href = 'https://wa.me/' + waNumber + '?text=' + msgKlatiene;
        modalOmniva.href = 'https://wa.me/' + waNumber + '?text=' + msgOmniva;
 
        const frameNote = document.getElementById('modalFrameNote');
        const modalIeramet = document.getElementById('modalIeramet');
        const allGalleryItems = Array.from(document.querySelectorAll('.gallery-container .gallery-item'));
        const clickedItem = allGalleryItems[num - 1];
        const isFramed = clickedItem?.dataset.category === 'ieramettas';
        if (frameNote) frameNote.style.display = isFramed ? 'none' : 'block';
        if (modalIeramet) {
            const msgIeramet = encodeURIComponent('Sveiki, vēlos iegādāties gleznu Nr.' + num + ' rāmī. Vai tā būtu pieejama?');
            modalIeramet.href = 'https://wa.me/' + waNumber + '?text=' + msgIeramet;
        }
 
        deliveryOverlay.classList.add('open');
        document.body.classList.add('modal-open');
        history.pushState({ modal: true }, document.title, location.href);
    }
 
    function closeDeliveryModal() {
        deliveryOverlay.classList.remove('open');
        document.body.classList.remove('modal-open');
    }
 
    document.getElementById('deliveryModalClose')?.addEventListener('click', closeDeliveryModal);
    deliveryOverlay?.addEventListener('click', (e) => {
        if (e.target === deliveryOverlay) closeDeliveryModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDeliveryModal();
    });
 
    // =========================
    // Gallery Tabs
    // =========================
    const tabs = document.querySelectorAll('.gallery-tab');
    const allItems = document.querySelectorAll('.gallery-container .gallery-item');
 
    function switchTab(tabName) {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
        allItems.forEach(item => {
            const hide = item.dataset.category !== tabName;
            item.classList.toggle('hidden', hide);
            if (!hide) item.classList.add('visible');
        });
        updateLightboxItems();
    }
 
    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // sākuma stāvoklis: rādām tikai aktīvās cilnes gleznas (ierāmētās
    // neparādās "Gleznas" sadaļas apakšā). Reveal animāciju neaiztiekam.
    const startTab = document.querySelector('.gallery-tab.active');
    if (startTab) {
        allItems.forEach(item => {
            item.classList.toggle('hidden', item.dataset.category !== startTab.dataset.tab);
        });
    }
 
    // =========================
    // Smooth scroll
    // =========================
    document.querySelectorAll('header nav ul li a').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });
 
    // =========================
    // Before/After Slider
    // =========================
    const slider = document.getElementById("slider");
    const afterImg = document.getElementById("afterImg");
    const compareBox = document.querySelector(".compare");
    if (slider && afterImg) {
        slider.addEventListener("input", () => {
            afterImg.style.clipPath = `inset(0 ${100 - slider.value}% 0 0)`;
            if (compareBox) compareBox.style.setProperty('--pos', slider.value + '%');
        });
    }

    // =========================
    // Slidera demo: pirmoreiz ieraugot, tas pats pakustas
    // (parāda, ka to var vilkt), tad nostājas pa vidu
    // =========================
    if (slider && afterImg && compareBox &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {

        let demoDone = false;
        let demoRaf = null;

        const setSlider = (v) => {
            slider.value = v;
            afterImg.style.clipPath = `inset(0 ${100 - v}% 0 0)`;
            compareBox.style.setProperty('--pos', v + '%');
        };

        // ja lietotājs pats pieskaras sliderim, demo apstājas
        slider.addEventListener('input', () => {
            demoDone = true;
            if (demoRaf) cancelAnimationFrame(demoRaf);
            demoRaf = null;
        });

        const demoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting || demoDone) return;
                demoDone = true;
                demoObserver.disconnect();

                // ceļš: vidus -> pa labi -> pa kreisi -> atpakaļ vidū
                const keyframes = [[0, 50], [900, 74], [2100, 26], [3000, 50]];
                const ease = t => 0.5 - Math.cos(Math.PI * t) / 2;
                const start = performance.now();

                const step = (now) => {
                    if (demoRaf === false) return;
                    const t = now - start;
                    let i = 1;
                    while (i < keyframes.length && keyframes[i][0] < t) i++;
                    if (i >= keyframes.length) {
                        setSlider(50);
                        demoRaf = null;
                        return;
                    }
                    const t0 = keyframes[i - 1][0], v0 = keyframes[i - 1][1];
                    const t1 = keyframes[i][0], v1 = keyframes[i][1];
                    const p = ease(Math.max(0, (t - t0) / (t1 - t0)));
                    setSlider(v0 + (v1 - v0) * p);
                    demoRaf = requestAnimationFrame(step);
                };
                demoRaf = requestAnimationFrame(step);
            });
        }, { threshold: 0.6 });

        demoObserver.observe(compareBox);
    }

    // =========================
    // "Uz augšu" poga
    // =========================
    const toTop = document.getElementById('toTop');
    if (toTop) {
        const toggleToTop = () => toTop.classList.toggle('show', window.scrollY > 600);
        window.addEventListener('scroll', toggleToTop, { passive: true });
        toggleToTop();
        toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // =========================
    // Scrollspy — izgaismo aktīvo sadaļu navigācijā
    // =========================
    const navLinks = document.querySelectorAll('header nav ul li a');
    const sectionLinkMap = {};
    navLinks.forEach(link => {
        const id = (link.getAttribute('href') || '').slice(1);
        const sec = document.getElementById(id);
        if (sec) sectionLinkMap[id] = link;
    });
    const spyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(l => l.classList.remove('active'));
                sectionLinkMap[entry.target.id]?.classList.add('active');
            }
        });
    }, { rootMargin: '-35% 0px -55% 0px' });
    Object.keys(sectionLinkMap).forEach(id => spyObserver.observe(document.getElementById(id)));

    // =========================
    // Galerijas bilžu fade-in pēc ielādes
    // =========================
    document.querySelectorAll('.gallery-container .gallery-item img').forEach(img => {
        const markLoaded = () => img.classList.add('img-loaded');
        if (img.complete && img.naturalWidth > 0) markLoaded();
        else img.addEventListener('load', markLoaded, { once: true });
    });

    // =========================
    // 3D tilt galerijas kartiņām (tikai ar peli)
    // =========================
    if (window.matchMedia('(pointer: fine)').matches &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.querySelectorAll('.gallery-container .gallery-item').forEach(item => {
            item.addEventListener('mousemove', (e) => {
                const r = item.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                item.style.transition = 'transform 0.12s ease-out';
                item.style.transform =
                    'perspective(900px) rotateX(' + (-py * 6).toFixed(2) + 'deg)' +
                    ' rotateY(' + (px * 6).toFixed(2) + 'deg) translateY(-4px)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.transition = '';
                item.style.transform = '';
            });
        });
    }
 
    // =========================
    // Gallery Lightbox + Swipe
    // =========================
    const galleryItems = Array.from(document.querySelectorAll('.gallery-container .gallery-item'));
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
 
    if (!lightbox || !lightboxImage || galleryItems.length === 0) return;
 
    let currentIndex = 0;
    let lightboxOpen = false;
    let isZoomed = false;
 
    lightboxImage.style.transition = 'opacity 0.15s ease';
 
    const zoomBtn = document.getElementById('lightboxZoom');

    // zoom poga dzīvo apakšējā info joslā kopā ar pārējām pogām —
    // tur tā vienmēr ir redzama gan telefonā, gan datorā
    const lbInfoBar = document.querySelector('.lightbox-info');
    if (zoomBtn && lbInfoBar) {
        lbInfoBar.insertBefore(zoomBtn, document.getElementById('lightboxInquire'));
    }

    // =========================
    // Dubultklikšķis uz gleznas = like + liela sirds pār ekrānu
    // =========================
    let bigHeartEl = null;

    function showBigHeart(target) {
        if (!bigHeartEl) {
            bigHeartEl = document.createElement('div');
            bigHeartEl.className = 'big-heart';
            bigHeartEl.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
            document.body.appendChild(bigHeartEl);
        }
        // sirds parādās virs konkrētās gleznas, ne ekrāna vidū
        const svg = bigHeartEl.firstChild;
        let cx = window.innerWidth / 2, cy = window.innerHeight / 2, size = 200;
        if (target && target.getBoundingClientRect) {
            const r = target.getBoundingClientRect();
            if (r.width > 0) {
                cx = r.left + r.width / 2;
                cy = r.top + r.height / 2;
                size = Math.max(70, Math.min(210, r.width * 0.55));
            }
        }
        bigHeartEl.style.left = cx + 'px';
        bigHeartEl.style.top = cy + 'px';
        svg.style.width = size + 'px';
        bigHeartEl.classList.remove('pop');
        void bigHeartEl.offsetWidth; // restartē animāciju
        bigHeartEl.classList.add('pop');
    }

    function likeGalleryItem(item, heartTarget) {
        if (!item) return;
        const btn = item.querySelector('.btn-like');
        if (btn && !btn.classList.contains('liked')) {
            btn.click(); // pilnais like cikls: Firebase, skaņa, sirsniņa
        } else {
            playLikeSound(true); // jau ielaikota — tikai skaņa un lielā sirds
        }
        showBigHeart(heartTarget || item);
        updateLbLike();
    }

    function likeCurrentPainting() {
        likeGalleryItem(galleryItems[currentIndex], lightboxImage);
    }

    // like poga lightbox joslā (blakus "Uzzināt vairāk" un share)
    let lbLikeBtn = null;
    if (lbInfoBar) {
        lbLikeBtn = document.createElement('button');
        lbLikeBtn.className = 'lightbox-like';
        lbLikeBtn.setAttribute('aria-label', 'Patīk šī glezna');
        lbLikeBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
        lbInfoBar.insertBefore(lbLikeBtn, document.getElementById('lightboxShare'));
        lbLikeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = galleryItems[currentIndex];
            const btn = item && item.querySelector('.btn-like');
            if (!btn) return;
            const wasLiked = btn.classList.contains('liked');
            btn.click(); // pilnais cikls abos virzienos (like/unlike)
            if (!wasLiked) showBigHeart(lightboxImage);
            updateLbLike();
        });
    }

    function updateLbLike() {
        if (!lbLikeBtn) return;
        const item = galleryItems[currentIndex];
        lbLikeBtn.classList.toggle('liked', !!(item && item.querySelector('.btn-like.liked')));
    }

    let lbTapTime = 0;
    lightboxImage.addEventListener('click', () => {
        const now = Date.now();
        if (now - lbTapTime < 350) {
            lbTapTime = 0;
            likeCurrentPainting();
        } else {
            lbTapTime = now;
        }
    });
    const lbCounter = document.getElementById('lightboxCounter');
    const lbName = document.getElementById('lightboxName');
    const lbPrice = document.getElementById('lightboxPrice');
    const lbInquire = document.getElementById('lightboxInquire');

    function visibleGalleryItems() {
        return galleryItems.filter(it => !it.classList.contains('hidden'));
    }

    function updateLightboxInfo() {
        const item = galleryItems[currentIndex];
        if (!item) return;
        const name = item.querySelector('.image-name')?.textContent || '';
        const price = item.querySelector('.image-size')?.textContent || '';
        if (lbName) lbName.textContent = 'Nr. ' + (currentIndex + 1) + ' · ' + name;
        if (lbPrice) lbPrice.textContent = price;
        const vis = visibleGalleryItems();
        const pos = vis.indexOf(item);
        if (lbCounter) lbCounter.textContent = (pos >= 0 ? pos + 1 : 1) + ' / ' + vis.length;
    }

    // izsaukts arī no switchTab — atjauno info, ja lightbox atvērts cilnes maiņas brīdī
    function updateLightboxItems() {
        if (lightboxOpen) updateLightboxInfo();
    }

    lbInquire?.addEventListener('click', (e) => {
        e.stopPropagation();
        openDeliveryModal(currentIndex + 1);
    });

    document.getElementById('lightboxShare')?.addEventListener('click', (e) => {
        e.stopPropagation();
        shareGlezna(currentIndex + 1);
    });
 
    function updateZoomButton() {
        const item = galleryItems[currentIndex];
        const isFramed = item?.dataset.category === 'ieramettas';
        if (zoomBtn) {
            zoomBtn.style.display = isFramed ? 'block' : 'none';
            zoomBtn.textContent = '🔍 Pietuvināt';
            isZoomed = false;
        }
    }
 
    if (zoomBtn) {
        zoomBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = galleryItems[currentIndex];
            const img = item.querySelector('img');
            const mainSrc = img.getAttribute('data-src') || img.getAttribute('src');
            if (!isZoomed) {
                const zoomSrc = mainSrc.replace('.webp', 'nr2.webp');
                lightboxImage.style.opacity = '0';
                setTimeout(() => {
                    lightboxImage.src = zoomSrc;
                    lightboxImage.style.opacity = '1';
                }, 150);
                zoomBtn.textContent = '← Atpakaļ';
                isZoomed = true;
            } else {
                lightboxImage.style.opacity = '0';
                setTimeout(() => {
                    lightboxImage.src = mainSrc;
                    lightboxImage.style.opacity = '1';
                }, 150);
                zoomBtn.textContent = '🔍 Pietuvināt';
                isZoomed = false;
            }
        });
    }
 
    function openLightbox(index) {
        currentIndex = index;
        lbTapTime = 0; // tīrs starts dubultklikšķa uztveršanai lightboxā
        const img = galleryItems[currentIndex].querySelector('img');
        lightboxImage.src = img.getAttribute('data-src') || img.getAttribute('src');
        lightbox.style.display = 'flex';
        lightboxOpen = true;
        document.body.classList.add('lightbox-open');
        updateZoomButton();
        updateLightboxInfo();
        updateLbLike();
        const openedItem = galleryItems[index];
        if (openedItem?.dataset.category === 'ieramettas') {
            const preload = new Image();
            preload.src = (img.getAttribute('data-src') || img.getAttribute('src')).replace('.webp', 'nr2.webp');
        }
        history.pushState({ lightbox: true }, document.title, location.href);
    }
 
    function closeLightbox() {
        lightbox.style.display = 'none';
        lightboxOpen = false;
        document.body.classList.remove('lightbox-open');
        history.pushState(null, document.title, location.href);
    }
 
    function stepLightbox(dir) {
        const vis = visibleGalleryItems();
        if (!vis.length) return;
        let pos = vis.indexOf(galleryItems[currentIndex]);
        if (pos < 0) pos = 0;
        pos = (pos + dir + vis.length) % vis.length;
        currentIndex = galleryItems.indexOf(vis[pos]);
        lightboxImage.style.opacity = '0';
        setTimeout(() => {
            const img = galleryItems[currentIndex].querySelector('img');
            lightboxImage.src = img.getAttribute('data-src') || img.getAttribute('src');
            lightboxImage.style.opacity = '1';
            updateZoomButton();
            updateLightboxInfo();
            updateLbLike();
        }, 150);
    }

    function showNext() { stepLightbox(1); }
 
    function showPrev() { stepLightbox(-1); }
 
    // viens klikšķis (pēc 280 ms nogaides) = atvērt; dubultklikšķis = like
    galleryItems.forEach((item, i) => {
        item.style.cursor = 'pointer';
        let pressTimer = null;
        item.addEventListener('click', () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
                likeGalleryItem(item);
            } else {
                pressTimer = setTimeout(() => {
                    pressTimer = null;
                    openLightbox(i);
                }, 280);
            }
        });
    });
 
    document.querySelector('.lightbox .close')?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeLightbox();
    });
 
    lightbox.addEventListener('click', (event) => {
        if (event.target === lightbox) closeLightbox();
    });
 
    document.addEventListener('keydown', (event) => {
        if (!lightboxOpen) return;
        if (event.key === 'Escape') closeLightbox();
        if (event.key === 'ArrowRight') showNext();
        if (event.key === 'ArrowLeft') showPrev();
    });
 
    history.pushState(null, document.title, location.href);
    window.onpopstate = () => {
        if (deliveryOverlay?.classList.contains('open')) {
            closeDeliveryModal();
        } else if (lightboxOpen) {
            closeLightbox();
        } else {
            history.pushState(null, document.title, location.href);
        }
    };
 
    document.querySelector('.lightbox-prev')?.addEventListener('click', (e) => {
        e.stopPropagation();
        showPrev();
    });
    document.querySelector('.lightbox-next')?.addEventListener('click', (e) => {
        e.stopPropagation();
        showNext();
    });
 
    let touchStartX = 0;
    let touchStartY = 0;
 
    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
 
    lightbox.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) < Math.abs(dy) || Math.abs(dx) < 50) return;
        if (dx < 0) showNext();
        else showPrev();
    }, { passive: true });
 
    // =========================
    // Tiešā saite: #glezna-N atver konkrēto gleznu lightboxā
    // =========================
    const deepLink = location.hash.match(/^#glezna-(\d+)$/);
    if (deepLink) {
        const idx = parseInt(deepLink[1], 10) - 1;
        if (galleryItems[idx]) {
            const cat = galleryItems[idx].dataset.category;
            if (galleryItems[idx].classList.contains('hidden')) switchTab(cat);
            setTimeout(() => openLightbox(idx), 350);
        }
    }

    // =========================
    // Scroll Reveal
    // =========================
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });
 
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
 
    document.querySelectorAll('.gallery-item').forEach((item, i) => {
        item.classList.add('reveal');
        item.style.setProperty('--i', i % 8);
        revealObserver.observe(item);
    });
 
});


/* ============================================================
   PAPILDU FUNKCIJAS — zigmundssnore.lv
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

        /* telefoniem/planšetēm — 2 s sagatavošanās ekrāns, kas noslēpj
           renderēšanas raustīšanos, kamēr foto un glezna ielādējas */
        var IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;
        var LOAD_MS = 2000;
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
            if (!roomPhoto.getAttribute('src')) roomPhoto.src = 'img/room-interior.webp';

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
            bg.src = 'img/room-interior.webp';
        }
    });
})();
