document.addEventListener('DOMContentLoaded', () => {
    // Prevent back button from closing the page and allow navigating between gallery and lightbox
    let lightboxOpen = false;

    history.pushState(null, document.title, location.href); // Initial state

    window.onpopstate = function () {
        if (lightboxOpen) {
            lightbox.style.display = 'none';  // Close the lightbox if open
            lightboxOpen = false;
        } else {
            history.pushState(null, document.title, location.href);  // Stay on the current page if the gallery is open
        }
    };

    // Smooth scroll for navigation links
    const links = document.querySelectorAll('header nav ul li a');
    links.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            document.querySelector(link.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
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
    // Gallery lightbox functionality
    const images = document.querySelectorAll('.gallery-container img');
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');

    images.forEach(img => {
        img.addEventListener('click', () => {
            const src = img.getAttribute('data-src');
            lightboxImage.src = src;
            lightbox.style.display = 'flex';
            lightboxOpen = true;

            // Push state to history when lightbox is opened
            history.pushState({ lightbox: true }, document.title, location.href);
        });
    });

    // Close the lightbox
    document.querySelector('.lightbox .close').addEventListener('click', () => {
        lightbox.style.display = 'none';
        lightboxOpen = false;
        history.pushState(null, document.title, location.href); // Push state when closing lightbox
    });

    // Close the lightbox when clicking outside the image
    lightbox.addEventListener('click', (event) => {
        if (event.target === lightbox) {
            lightbox.style.display = 'none';
            lightboxOpen = false;
            history.pushState(null, document.title, location.href); // Push state when closing lightbox
        }
    });

    // Optionally, close the lightbox when pressing the "Esc" key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            lightbox.style.display = 'none';
            lightboxOpen = false;
            history.pushState(null, document.title, location.href); // Push state when closing lightbox
        }
    });
});


 
// =========================
// Hamburger Menu
// =========================
const hamburger = document.getElementById('hamburger');
const mainNav = document.getElementById('mainNav');
const navOverlay = document.getElementById('navOverlay');
 
function closeNav() {
    hamburger?.classList.remove('open');
    mainNav?.classList.remove('open');
    navOverlay?.classList.remove('open');
}
 
hamburger?.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    navOverlay.classList.toggle('open', isOpen);
});
 
navOverlay?.addEventListener('click', closeNav);
 
// Close nav on link click (mobile)
document.querySelectorAll('#mainNav a').forEach(link => {
    link.addEventListener('click', closeNav);
});
 
// =========================
// Scroll Reveal
// =========================
const revealEls = document.querySelectorAll('.reveal');
 
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });
 
revealEls.forEach(el => revealObserver.observe(el));
 
// Stagger gallery items
document.querySelectorAll('.gallery-item').forEach((item, i) => {
    item.classList.add('reveal');
    item.style.setProperty('--i', i % 8); // reset every 8 so delay doesn't get huge
    revealObserver.observe(item);
});
 
