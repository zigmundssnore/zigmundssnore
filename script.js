
Copy

document.addEventListener('DOMContentLoaded', () => {
 
    // =========================
    // Back button / lightbox history
    // =========================
    let lightboxOpen = false;
    history.pushState(null, document.title, location.href);
 
    window.onpopstate = function () {
        if (lightboxOpen) {
            closeLightbox();
        } else {
            history.pushState(null, document.title, location.href);
        }
    };
 
    // =========================
    // Smooth scroll
    // =========================
    const navLinks = document.querySelectorAll('header nav ul li a');
    navLinks.forEach(link => {
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
    // Gallery Lightbox ar swipe
    // =========================
    const images = Array.from(document.querySelectorAll('.gallery-container img'));
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    let currentIndex = 0;
 
    function openLightbox(index) {
        currentIndex = index;
        lightboxImage.src = images[currentIndex].getAttribute('data-src');
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
        currentIndex = (currentIndex + 1) % images.length;
        lightboxImage.style.opacity = '0';
        setTimeout(() => {
            lightboxImage.src = images[currentIndex].getAttribute('data-src');
            lightboxImage.style.opacity = '1';
        }, 150);
    }
 
    function showPrev() {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        lightboxImage.style.opacity = '0';
        setTimeout(() => {
            lightboxImage.src = images[currentIndex].getAttribute('data-src');
            lightboxImage.style.opacity = '1';
        }, 150);
    }
 
    if (lightbox && lightboxImage) {
 
        // Atvērt klikšķinot
        images.forEach((img, i) => {
            img.addEventListener('click', () => openLightbox(i));
        });
 
        // Aizvērt
        document.querySelector('.lightbox .close')?.addEventListener('click', closeLightbox);
 
        lightbox.addEventListener('click', (event) => {
            if (event.target === lightbox) closeLightbox();
        });
 
        // Prev/Next pogas
        document.querySelector('.lightbox-prev')?.addEventListener('click', (e) => {
            e.stopPropagation();
            showPrev();
        });
        document.querySelector('.lightbox-next')?.addEventListener('click', (e) => {
            e.stopPropagation();
            showNext();
        });
 
        // Keyboard bultiņas
        document.addEventListener('keydown', (event) => {
            if (!lightboxOpen) return;
            if (event.key === 'Escape') closeLightbox();
            if (event.key === 'ArrowRight') showNext();
            if (event.key === 'ArrowLeft') showPrev();
        });
 
        // =========================
        // Touch swipe
        // =========================
        let touchStartX = 0;
        let touchStartY = 0;
 
        lightbox.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
 
        lightbox.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
 
            // Ignorē ja vairāk vertikāls nekā horizontāls
            if (Math.abs(dx) < Math.abs(dy)) return;
            // Ignorē ja pārāk mazs swipe
            if (Math.abs(dx) < 50) return;
 
            if (dx < 0) showNext();
            else showPrev();
        }, { passive: true });
 
        // Transition uz bildei
        lightboxImage.style.transition = 'opacity 0.15s ease';
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
 
    document.querySelectorAll('.reveal').forEach(el => {
        revealObserver.observe(el);
    });
 
    document.querySelectorAll('.gallery-item').forEach((item, i) => {
        item.classList.add('reveal');
        item.style.setProperty('--i', i % 8);
        revealObserver.observe(item);
    });
 
});
