document.addEventListener('DOMContentLoaded', () => {
 
    // =========================
    // Back button / lightbox history
    // =========================
    let lightboxOpen = false;
    history.pushState(null, document.title, location.href);
 
    window.onpopstate = function () {
        if (lightboxOpen) {
            lightbox.style.display = 'none';
            lightboxOpen = false;
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
    // Gallery Lightbox
    // =========================
    const images = document.querySelectorAll('.gallery-container img');
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
 
    if (lightbox && lightboxImage) {
        images.forEach(img => {
            img.addEventListener('click', () => {
                const src = img.getAttribute('data-src');
                lightboxImage.src = src;
                lightbox.style.display = 'flex';
                lightboxOpen = true;
                history.pushState({ lightbox: true }, document.title, location.href);
            });
        });
 
        document.querySelector('.lightbox .close')?.addEventListener('click', () => {
            lightbox.style.display = 'none';
            lightboxOpen = false;
            history.pushState(null, document.title, location.href);
        });
 
        lightbox.addEventListener('click', (event) => {
            if (event.target === lightbox) {
                lightbox.style.display = 'none';
                lightboxOpen = false;
                history.pushState(null, document.title, location.href);
            }
        });
 
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                lightbox.style.display = 'none';
                lightboxOpen = false;
                history.pushState(null, document.title, location.href);
            }
        });
    }
 
});
 
