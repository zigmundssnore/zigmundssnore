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
            sendNtfyNotification(globalIndex + 1);
        } else {
            runTransaction(likeRef, (current) => Math.max((current || 0) - 1, 0));
            liked = false;
            localStorage.removeItem(storageKey);
            likeBtn.classList.remove("liked");
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
        const img = galleryItems[currentIndex].querySelector('img');
        lightboxImage.src = img.getAttribute('data-src') || img.getAttribute('src');
        lightbox.style.display = 'flex';
        lightboxOpen = true;
        document.body.classList.add('lightbox-open');
        updateZoomButton();
        updateLightboxInfo();
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
        }, 150);
    }

    function showNext() { stepLightbox(1); }
 
    function showPrev() { stepLightbox(-1); }
 
    galleryItems.forEach((item, i) => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => openLightbox(i));
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
