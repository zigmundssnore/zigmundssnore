document.addEventListener('DOMContentLoaded', () => {
 
 
    // =========================
    // Gallery numuri + WhatsApp poga
    // =========================
    const waNumber = '37122811564';
    document.querySelectorAll('.gallery-container .gallery-item').forEach((item, i) => {
        const num = i + 1;
        const info = item.querySelector('.image-info');
        if (!info) return;
 
        // Pievieno numuru
        const numEl = document.createElement('p');
        numEl.className = 'gallery-number';
        numEl.textContent = 'Nr. ' + num;
        info.insertBefore(numEl, info.firstChild);
 
        // Pievieno pogu kas atver modālu
        const btn = document.createElement('button');
        btn.className = 'btn-inquire';
        btn.textContent = 'Uzzināt vairāk';
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openDeliveryModal(num);
        });
        info.appendChild(btn);
    });
 
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
            // Ja bilde tiek atkal parādīta - pārliecinās ka reveal ir aktīvs
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
    if (slider && afterImg) {
        slider.addEventListener("input", () => {
            afterImg.style.clipPath = `inset(0 ${100 - slider.value}% 0 0)`;
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
 
    // Transition
    lightboxImage.style.transition = 'opacity 0.15s ease';
 
    const zoomBtn = document.getElementById('lightboxZoom');
 
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
                const zoomSrc = mainSrc.replace('.jpg', 'nr2.jpg');
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
        // Preload nr2 fonā
        const openedItem = galleryItems[index];
        if (openedItem?.dataset.category === 'ieramettas') {
            const preload = new Image();
            preload.src = (img.getAttribute('data-src') || img.getAttribute('src')).replace('.jpg', 'nr2.jpg');
        }
        history.pushState({ lightbox: true }, document.title, location.href);
    }
 
    function closeLightbox() {
        lightbox.style.display = 'none';
        lightboxOpen = false;
        document.body.classList.remove('lightbox-open');
        history.pushState(null, document.title, location.href);
    }
 
    function showNext() {
        currentIndex = (currentIndex + 1) % galleryItems.length;
        lightboxImage.style.opacity = '0';
        setTimeout(() => {
            const img = galleryItems[currentIndex].querySelector('img');
            lightboxImage.src = img.getAttribute('data-src') || img.getAttribute('src');
            lightboxImage.style.opacity = '1';
            updateZoomButton();
        }, 150);
    }
 
    function showPrev() {
        currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
        lightboxImage.style.opacity = '0';
        setTimeout(() => {
            const img = galleryItems[currentIndex].querySelector('img');
            lightboxImage.src = img.getAttribute('data-src') || img.getAttribute('src');
            lightboxImage.style.opacity = '1';
            updateZoomButton();
        }, 150);
    }
 
    // Click uz gallery item (ne tikai img — viss bloks klikšķināms)
    galleryItems.forEach((item, i) => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => openLightbox(i));
    });
 
    // Aizvērt
    document.querySelector('.lightbox .close')?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeLightbox();
    });
 
    lightbox.addEventListener('click', (event) => {
        if (event.target === lightbox) closeLightbox();
    });
 
    // Keyboard
    document.addEventListener('keydown', (event) => {
        if (!lightboxOpen) return;
        if (event.key === 'Escape') closeLightbox();
        if (event.key === 'ArrowRight') showNext();
        if (event.key === 'ArrowLeft') showPrev();
    });
 
    // Back button
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
 
    // Prev/Next pogas
    document.querySelector('.lightbox-prev')?.addEventListener('click', (e) => {
        e.stopPropagation();
        showPrev();
    });
    document.querySelector('.lightbox-next')?.addEventListener('click', (e) => {
        e.stopPropagation();
        showNext();
    });
 
    // Touch swipe
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
 
