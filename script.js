document.addEventListener('DOMContentLoaded', () => {
 
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
 
    // Transition
    lightboxImage.style.transition = 'opacity 0.15s ease';
 
    function openLightbox(index) {
        currentIndex = index;
        const img = galleryItems[currentIndex].querySelector('img');
        lightboxImage.src = img.getAttribute('data-src') || img.getAttribute('src');
        lightbox.style.display = 'flex';
        lightboxOpen = true;
        history.pushState({ lightbox: true }, document.title, location.href);
    }
 
    function closeLightbox() {
        lightbox.style.display = 'none';
        lightboxOpen = false;
        history.pushState(null, document.title, location.href);
    }
 
    function showNext() {
        currentIndex = (currentIndex + 1) % galleryItems.length;
        lightboxImage.style.opacity = '0';
        setTimeout(() => {
            const img = galleryItems[currentIndex].querySelector('img');
            lightboxImage.src = img.getAttribute('data-src') || img.getAttribute('src');
            lightboxImage.style.opacity = '1';
        }, 150);
    }
 
    function showPrev() {
        currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
        lightboxImage.style.opacity = '0';
        setTimeout(() => {
            const img = galleryItems[currentIndex].querySelector('img');
            lightboxImage.src = img.getAttribute('data-src') || img.getAttribute('src');
            lightboxImage.style.opacity = '1';
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
        if (lightboxOpen) closeLightbox();
        else history.pushState(null, document.title, location.href);
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
