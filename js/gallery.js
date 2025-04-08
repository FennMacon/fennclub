/* -- Carousel Navigation -- */

let activeIndex = 0;
let currentGallery = 'web'; // default gallery

const createArticleElement = (data, index, status) => {
    // Special handling for music gallery with Bandcamp embeds
    if (currentGallery === 'music' && data.bandcampId) {
        // Determine the embed type (album, track, etc.)
        const embedType = data.bandcampType || 'album';
        
        // Set background style if available
        const backgroundStyle = data.backgroundImage ? 
            `style="background-image: url('${data.backgroundImage}');"` : '';
        
        return `
        <article data-index="${index}" data-status="${status}">
            <div class="article-image-section article-section bandcamp-container" ${backgroundStyle}>
                <div class="bandcamp-embed-wrapper">
                    <iframe 
                        class="bandcamp-iframe"
                        src="https://bandcamp.com/EmbeddedPlayer/${embedType}=${data.bandcampId}/size=large/bgcol=333333/linkcol=9a64ff/minimal=true/transparent=true/"
                        seamless
                        frameborder="0"
                        loading="lazy">
                        <a href="${data.url}">${data.title}</a>
                    </iframe>
                </div>
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
    }
    
    // Check if the URL is an image by file extension
    const isImage = /\.(jpeg|jpg|png|gif|webp)(\?.*)?$/i.test(data.url);
    
    // Special handling for image files
    if (isImage) {
        return `
        <article data-index="${index}" data-status="${status}">
            <div class="article-image-section article-section image-container">
                <div class="image-wrapper">
                    <img 
                        class="article-image"
                        src="${data.url}"
                        alt="${data.title}"
                        data-title="${data.title}"
                        data-description="${data.description}"
                        loading="lazy"
                        onclick="openLightbox(this)">
                </div>
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
    }
    
    // Regular handling for other galleries
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

const createOverviewElement = (data) => {
    // Generate section contents dynamically from galleryData
    const musicItems = galleryData.music.map(item => `
        <div class="overview-item" data-url="${item.url}" data-gallery="music" data-index="${galleryData.music.indexOf(item)}">
            <a href="#" class="overview-link">${item.title}</a>
        </div>
    `).join('');
    
    const webItems = galleryData.web.map(item => `
        <div class="overview-item" data-url="${item.url}" data-gallery="web" data-index="${galleryData.web.indexOf(item)}">
            <a href="#" class="overview-link">${item.title}</a>
        </div>
    `).join('');
    
    const digitalItems = galleryData.digital.map(item => `
        <div class="overview-item" data-url="${item.url}" data-gallery="digital" data-index="${galleryData.digital.indexOf(item)}">
            <a href="#" class="overview-link">${item.title}</a>
        </div>
    `).join('');

    return `
    <article class="overview-article" data-status="active">
        <div class="article-content-section article-section">
            <div class="overview-content">
                <h2>Fenn Macon</h2>
                <div class="overview-grid">
                    <div class="overview-section">
                        <h3><a href="#" class="section-link" data-gallery="music">Music</a></h3>
                        <div class="overview-items">
                            ${musicItems}
                        </div>
                    </div>
                    <div class="overview-section">
                        <h3><a href="#" class="section-link" data-gallery="web">Web</a></h3>
                        <div class="overview-items">
                            ${webItems}
                        </div>
                    </div>
                    <div class="overview-section">
                        <h3><a href="#" class="section-link" data-gallery="digital">Digital</a></h3>
                        <div class="overview-items">
                            ${digitalItems}
                        </div>
                    </div>
                </div>
                <div class="contact-info">
                    <a href="mailto:fennmacon@gmail.com">Email</a>
                    <a href="https://www.linkedin.com/in/fenn-macon" target="_blank">LinkedIn</a>
                    <a href="#" class="section-link" data-gallery="resume">Resume</a>
                </div>
            </div>
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
    
    // Reset main element styles
    main.style.overflow = 'hidden';
    main.style.height = '';
    
    if (galleryType === 'resume' || galleryType === 'landing' || galleryType === 'overview') {
        // Create resume, landing, or overview article
        const data = galleryData[galleryType].items[0];
        let content = '';
        
        if (galleryType === 'resume') {
            content = createResumeElement(data);
        } else if (galleryType === 'landing') {
            content = createLandingElement(data);
        } else if (galleryType === 'overview') {
            content = createOverviewElement(data);
        }
        
        main.innerHTML = content;
        
        if (galleryType === 'resume') {
            initializeResumeToggles();
        } else if (galleryType === 'overview') {
            initializeOverviewButtons();
        }
    } else {
        // Create gallery articles
        const galleryItems = galleryData[galleryType];
        galleryItems.forEach((item, index) => {
            const status = index === 0 ? 'active' : 'inactive';
            main.innerHTML += createArticleElement(item, index, status);
        });
        
        // Initialize iframe loading handlers immediately
        const iframes = document.querySelectorAll('.article-iframe, .bandcamp-iframe');
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
        
        // Initialize image loading handlers
        const images = document.querySelectorAll('.article-image');
        images.forEach(image => {
            // Handle loading state
            image.addEventListener('load', () => {
                const articleSection = image.closest('.article-image-section');
                if (articleSection) {
                    articleSection.classList.add('loaded');
                }
            });
            
            // Set loading state for already cached images
            if (image.complete) {
                const articleSection = image.closest('.article-image-section');
                if (articleSection) {
                    articleSection.classList.add('loaded');
                }
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

// Initialize overview buttons and items
const initializeOverviewButtons = () => {
    // Initialize overview section buttons
    const overviewButtons = document.querySelectorAll('.overview-button');
    overviewButtons.forEach(button => {
        button.addEventListener('click', () => {
            const galleryType = button.getAttribute('data-gallery');
            if (galleryData[galleryType]) {
                loadGallery(galleryType);
            }
        });
    });
    
    // Initialize section title links
    const sectionLinks = document.querySelectorAll('.section-link');
    sectionLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const galleryType = link.getAttribute('data-gallery');
            if (galleryData[galleryType]) {
                loadGallery(galleryType);
            }
        });
    });
    
    // Initialize overview item clicks
    const overviewItems = document.querySelectorAll('.overview-item');
    overviewItems.forEach(item => {
        const link = item.querySelector('.overview-link');
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const galleryType = item.getAttribute('data-gallery');
                const index = parseInt(item.getAttribute('data-index'));
                
                if (galleryData[galleryType]) {
                    // First load the gallery
                    loadGallery(galleryType);
                    
                    // Then set the active index and update the display
                    if (!isNaN(index) && index >= 0 && index < galleryData[galleryType].length) {
                        // Only handle this for non-special gallery types
                        if (galleryType !== 'resume' && galleryType !== 'landing' && galleryType !== 'overview') {
                            // Set the active index
                            activeIndex = index;
                            
                            // Update the active slide
                            const slides = document.querySelectorAll(`article[data-index]`);
                            slides.forEach(slide => {
                                const slideIndex = parseInt(slide.dataset.index);
                                if (slideIndex === index) {
                                    slide.dataset.status = "active";
                                } else if (slideIndex < index) {
                                    slide.dataset.status = "before";
                                } else {
                                    slide.dataset.status = "after";
                                }
                            });
                        }
                    }
                }
            });
        }
    });
};

// Lightbox functionality
let lightbox, lightboxImg, lightboxCaption, closeLightbox;

// Function to initialize lightbox elements
function initLightbox() {
    lightbox = document.getElementById('lightbox');
    lightboxImg = document.getElementById('lightbox-image');
    closeLightbox = document.querySelector('.close-lightbox');
}

// Open lightbox when an image is clicked
function openLightbox(img) {
    // Initialize on first use
    if (!lightbox) initLightbox();
    
    // Set image source
    lightboxImg.src = img.src;
    
    // Display lightbox with animation
    lightbox.style.display = 'block';
    setTimeout(() => {
        lightbox.classList.add('active');
    }, 10);
    
    // Add event listeners
    document.addEventListener('keydown', handleLightboxKeydown);
}

// Close the lightbox
function closeLightboxFn() {
    if (!lightbox) return;
    
    lightbox.classList.remove('active');
    setTimeout(() => {
        lightbox.style.display = 'none';
        lightboxImg.src = '';
    }, 300);
    
    // Remove event listeners
    document.removeEventListener('keydown', handleLightboxKeydown);
}

// Handle keydown events for lightbox (escape key)
function handleLightboxKeydown(e) {
    if (e.key === 'Escape') {
        closeLightboxFn();
    }
}

// Handle keyboard navigation
function handleKeyboardNavigation(e) {
    // Only handle navigation when not in lightbox mode
    if (!lightbox || !lightbox.classList.contains('active')) {
        // Skip if user is typing in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Check for arrow keys
        if (e.key === 'ArrowLeft') {
            handleLeftClick();
        } else if (e.key === 'ArrowRight') {
            handleRightClick();
        }
    }
}

// Add event listeners after DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize with landing page instead of web gallery
    currentGallery = 'landing';
    
    // Initialize lightbox elements
    initLightbox();
    
    // Add keyboard navigation listener
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // Add click handlers for gallery type selection
    const galleryLinks = document.querySelectorAll('#nav-gallery-section a, #nav-contact-section a, .mobile-menu-overlay a');
    galleryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (link.classList.contains('overview-link')) {
                loadGallery('overview');
            } else if (!link.classList.contains('contact-link')) {
                const galleryType = link.textContent.toLowerCase();
                if (galleryData[galleryType]) {
                    loadGallery(galleryType);
                }
            }
            
            // Close mobile menu if it's open
            if (nav.dataset.toggled === "true") {
                handleNavToggle();
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
    
    // Add lightbox close event
    if (closeLightbox) {
        closeLightbox.addEventListener('click', closeLightboxFn);
    }
    
    // Close lightbox when clicking outside the image
    if (lightbox) {
        lightbox.addEventListener('click', function(e) {
            if (e.target === this) {
                closeLightboxFn();
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