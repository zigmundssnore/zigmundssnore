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
