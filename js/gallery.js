/* -- Carousel Navigation -- */

let activeIndex = 0;
let currentGallery = 'web'; // default gallery

const createArticleElement = (data, index, status) => {
    return `
    <article data-index="${index}" data-status="${status}">
        <div class="article-image-section article-section">
            <iframe 
                class="article-iframe"
                src="${data.url}"
                frameborder="0"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen>
            </iframe>
        </div>
        <div class="article-description-section article-section">
            <p>${data.description}</p>
        </div>
        <div class="article-title-section article-section">
            <h2>${data.title}</h2>
        </div>
        <div class="article-nav-section article-section">
            <button class="article-nav-button" type="button" onclick="handleLeftClick()">←</button>
            <button class="article-nav-button" type="button" onclick="handleRightClick()">→</button>
        </div>
    </article>
    `;
};

const createResumeElement = (data) => {
    return `
    <article class="resume-article" data-status="active">
        <div class="article-content-section article-section">
            ${data.description}
        </div>
    </article>
    `;
};

const createLandingElement = (data) => {
    return `
    <article class="landing-page" data-status="active">
        <div class="landing-content">
            ${data.description}
        </div>
    </article>
    `;
};

const loadGallery = (galleryType) => {
    // Don't return if it's the initial load of 'web'
    if (currentGallery === galleryType && document.querySelector('main').children.length > 0) return;
    
    currentGallery = galleryType;
    activeIndex = 0;
    const main = document.querySelector('main');
    
    // Clear existing articles
    main.innerHTML = '';
    
    if (galleryType === 'resume' || galleryType === 'landing') {
        // Create resume or landing article
        const data = galleryData[galleryType].items[0];
        main.innerHTML = galleryType === 'resume' ? createResumeElement(data) : createLandingElement(data);
        if (galleryType === 'resume') {
            initializeResumeToggles();
        }
    } else {
        // Create gallery articles
        const galleryItems = galleryData[galleryType];
        galleryItems.forEach((item, index) => {
            const status = index === 0 ? 'active' : 'inactive';
            main.innerHTML += createArticleElement(item, index, status);
        });
        
        // Initialize iframe loading handlers immediately
        const iframes = document.querySelectorAll('.article-iframe');
        iframes.forEach(iframe => {
            // Handle loading state
            iframe.addEventListener('load', () => {
                const articleSection = iframe.closest('.article-image-section');
                if (articleSection) {
                    articleSection.classList.add('loaded');
                }
            });

            // Reset iframe when its article becomes inactive
            const article = iframe.closest('article');
            if (article) {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.attributeName === 'data-status') {
                            const status = article.dataset.status;
                            if (status === 'before' || status === 'after') {
                                // Store the original URL
                                const originalSrc = iframe.src;
                                // Clear and reset the iframe src
                                iframe.src = '';
                                requestAnimationFrame(() => {
                                    iframe.src = originalSrc;
                                });
                                // Remove loaded class
                                const articleSection = iframe.closest('.article-image-section');
                                if (articleSection) {
                                    articleSection.classList.remove('loaded');
                                }
                            }
                        }
                    });
                });

                observer.observe(article, {
                    attributes: true
                });
            }
        });
    }
};

const handleLeftClick = () => {
    const galleryItems = galleryData[currentGallery];
    const nextIndex = activeIndex - 1 >= 0 ? activeIndex - 1 : galleryItems.length - 1;
    
    const currentSlide = document.querySelector(`[data-index="${activeIndex}"]`),
          nextSlide = document.querySelector(`[data-index="${nextIndex}"]`);
    
    currentSlide.dataset.status = "after";
    
    nextSlide.dataset.status = "becoming-active-from-before";
    
    setTimeout(() => {
        nextSlide.dataset.status = "active";
        activeIndex = nextIndex;
    });
};

const handleRightClick = () => {
    const galleryItems = galleryData[currentGallery];
    const nextIndex = activeIndex + 1 <= galleryItems.length - 1 ? activeIndex + 1 : 0;
    
    const currentSlide = document.querySelector(`[data-index="${activeIndex}"]`),
          nextSlide = document.querySelector(`[data-index="${nextIndex}"]`);
    
    currentSlide.dataset.status = "before";
    
    nextSlide.dataset.status = "becoming-active-from-after";
    
    setTimeout(() => {
        nextSlide.dataset.status = "active";
        activeIndex = nextIndex;
    });
};

// Initialize resume section toggles
const initializeResumeToggles = () => {
    const resumeSections = document.querySelectorAll('.resume-section');
    resumeSections.forEach(section => {
        const h3 = section.querySelector('h3');
        if (h3) {
            h3.addEventListener('click', () => {
                section.classList.toggle('collapsed');
            });
        }
    });
};

// Event listeners for gallery type selection
document.addEventListener('DOMContentLoaded', () => {
    // Initialize with landing page instead of web gallery
    currentGallery = 'landing';
    
    // Add click handlers for gallery type selection
    const galleryLinks = document.querySelectorAll('#nav-gallery-section a, #nav-contact-section a, .mobile-menu-overlay a');
    galleryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.classList.contains('contact-link')) return; // Skip for email link
            
            e.preventDefault();
            const galleryType = link.textContent.toLowerCase();
            if (galleryData[galleryType]) {
                loadGallery(galleryType);
                // Close mobile menu if it's open
                if (nav.dataset.toggled === "true") {
                    handleNavToggle();
                }
            }
        });
    });

    // Add click handler for logo section
    const logoSection = document.getElementById('nav-logo-section');
    if (logoSection) {
        logoSection.addEventListener('click', () => {
            loadGallery('landing');
            // Close mobile menu if it's open
            if (nav.dataset.toggled === "true") {
                handleNavToggle();
            }
        });
    }
});

/* -- Mobile Nav Toggle -- */

const nav = document.querySelector("nav");

const handleNavToggle = () => {  
    nav.dataset.transitionable = "true";
    nav.dataset.toggled = nav.dataset.toggled === "true" ? "false" : "true";
}

window.matchMedia("(max-width: 800px)").onchange = e => {
    nav.dataset.transitionable = "false";
    nav.dataset.toggled = "false";
};