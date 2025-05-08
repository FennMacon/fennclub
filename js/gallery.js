/* -- Carousel Navigation -- */

let activeIndex = 0;
let currentGallery = 'web'; // default gallery

// Helper function to detect mobile devices
function isMobileDevice() {
    return (window.innerWidth <= 800) || 
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

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
        // Check if it has an external link
        const imageClickHandler = data.externalLink ? 
            `onclick="window.open('${data.externalLink}', '_blank')" style="cursor: pointer;"` : 
            `onclick="openLightbox(this)"`;
            
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
                        ${imageClickHandler}>
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
            <div class="iframe-wrapper">
                <iframe 
                    class="article-iframe"
                    src="${data.url}"
                    frameborder="0"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen>
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
};

const createResumeElement = (data) => {
    const { contact, objective, education, skills, experience } = data;

    // Helper to create list items
    const createListItems = (items) => items.map(item => `<li>${item}</li>`).join('');

    // Build contact section
    const contactHTML = `
        <div class="resume-section">
            <h3>Contact Information</h3>
            <p>${contact.address}</p>
            <p>Phone: ${contact.phone} | Email: <a href="mailto:${contact.email}">${contact.email}</a></p>
            <p><a href="${contact.linkedin}" target="_blank">LinkedIn</a> | <a href="${contact.website}" target="_blank">Personal Website</a></p>
        </div>
    `;

    // Build objective section
    const objectiveHTML = `
        <div class="resume-section">
            <h3>Objective</h3>
            <p>${objective}</p>
        </div>
    `;

    // Build education section
    const educationHTML = `
        <div class="resume-section">
            <h3>Education</h3>
            ${education.map(edu => `
                <div class="resume-item">
                    <h4>${edu.degree}</h4>
                    <p>${edu.institution} (${edu.year})</p>
                    ${edu.details ? `<p>${edu.details}</p>` : ''}
                </div>
            `).join('')}
        </div>
    `;

    // Build skills section
    const skillsHTML = `
        <div class="resume-section">
            <h3>Skills</h3>
            ${skills.map(skill => `
                <div class="resume-item">
                    <h4>${skill.category}</h4>
                    <ul>
                        ${createListItems(skill.points)}
                    </ul>
                </div>
            `).join('')}
        </div>
    `;

    // Build experience section
    const experienceHTML = `
        <div class="resume-section">
            <h3>Experience</h3>
            ${experience.map(exp => `
                <div class="resume-item">
                    <h4>${exp.title}</h4>
                    <p>${exp.company} | ${exp.period}</p>
                    <ul>
                        ${createListItems(exp.points)}
                    </ul>
                </div>
            `).join('')}
        </div>
    `;

    return `
    <article class="resume-article" data-status="active">
        <div class="article-content-section article-section">
            <div class="resume-content">
                ${contactHTML}
                ${objectiveHTML}
                ${educationHTML}
                ${skillsHTML}
                ${experienceHTML}
            </div>
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
    const { welcomeTitle, sections, contact } = data;

    // Build gallery sections
    const sectionsHTML = sections.map(section => `
        <div class="overview-section">
            <h3>${section.title}</h3>
            <button class="overview-button" data-gallery="${section.galleryKey}">${section.buttonText}</button>
        </div>
    `).join('');

    // Build contact info
    const contactHTML = `
        <div class="contact-info">
            <h3>${contact.title}</h3>
            <p>Email: <a href="mailto:${contact.email}">${contact.email}</a></p>
            <p>LinkedIn: <a href="${contact.linkedin}" target="_blank">${contact.linkedin.replace('https://', '')}</a></p>
        </div>
    `;

    return `
    <article class="overview-article" data-status="active">
        <div class="article-content-section article-section">
            <div class="overview-content">
                <h2>${welcomeTitle}</h2>
                <div class="overview-grid">
                    ${sectionsHTML}
                </div>
                ${contactHTML}
            </div>
        </div>
    </article>
    `;
};

// Setup Intersection Observer for monitoring iframe visibility
let iframeObserver;

function setupIframeObserver() {
    if (!iframeObserver && isMobileDevice()) {
        iframeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const iframe = entry.target;
                    const articleSection = iframe.closest('.article-image-section');
                    
                    // If the iframe is visible but not loaded, force refresh it
                    if (articleSection && !articleSection.classList.contains('loaded')) {
                        forceRefreshIframe(iframe);
                    }
                }
            });
        }, { threshold: 0.1 }); // Trigger when at least 10% of the iframe is visible
    }
    return iframeObserver;
}

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
        const data = galleryType === 'resume' ? galleryData.resume.data : 
                     galleryType === 'landing' ? galleryData.landing.items[0] : 
                     galleryType === 'overview' ? galleryData.overview.data : 
                     null; // Default case, although should not happen for these types
                     
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
                            // Store original src for all iframes for easy recovery if not already set
                            if (!iframe.getAttribute('data-original-src') && iframe.src) {
                                iframe.setAttribute('data-original-src', iframe.src);
                            }
                            
                            if (status === 'before' || status === 'after') {
                                // For all iframe types, keep track of loading state but don't reload on mobile
                                const articleSection = iframe.closest('.article-image-section');
                                if (articleSection) {
                                    articleSection.classList.remove('loaded');
                                }
                                
                                // Only clear src on desktop - on mobile this can cause loading issues
                                if (!isMobileDevice()) {
                                    const originalSrc = iframe.src;
                                    iframe.src = '';
                                    requestAnimationFrame(() => {
                                        iframe.src = originalSrc;
                                    });
                                }
                            } else if (status === 'active' || status === 'becoming-active-from-before' || status === 'becoming-active-from-after') {
                                // When becoming active again, ensure iframe is visible and reloaded if needed
                                // Ensure iframe has content
                                if (!iframe.src || iframe.src === 'about:blank') {
                                    const originalSrc = iframe.getAttribute('data-original-src') || iframe.src;
                                    if (originalSrc) {
                                        iframe.src = originalSrc;
                                    }
                                }
                                
                                // Force the article section to be marked as loaded
                                const articleSection = iframe.closest('.article-image-section');
                                if (articleSection) {
                                    // Short delay to ensure visibility after animation
                                    setTimeout(() => {
                                        articleSection.classList.add('loaded');
                                    }, 50);
                                }
                            }
                        }
                    });
                });

                observer.observe(article, {
                    attributes: true
                });
                
                // Store original src for all iframes for easy recovery
                if (iframe.src) {
                    iframe.setAttribute('data-original-src', iframe.src);
                }
            }
            
            // Add to intersection observer on mobile
            const observer = setupIframeObserver();
            if (observer) {
                observer.observe(iframe);
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

// Helper function to force refresh an iframe
function forceRefreshIframe(iframe) {
    if (!iframe) return;
    
    // Store the original source
    const originalSrc = iframe.getAttribute('data-original-src') || iframe.src;
    if (!originalSrc) return;
    
    // On mobile, just ensure the src is set correctly
    if (isMobileDevice()) {
        if (!iframe.src || iframe.src === 'about:blank') {
            iframe.src = originalSrc;
        }
        
        // Mark as loaded after a short delay
        const articleSection = iframe.closest('.article-image-section');
        if (articleSection) {
            setTimeout(() => {
                articleSection.classList.add('loaded');
            }, 100);
        }
    } else {
        // On desktop, perform a full refresh
        iframe.src = '';
        setTimeout(() => {
            iframe.src = originalSrc;
        }, 50);
    }
}

const handleLeftClick = () => {
    const galleryItems = galleryData[currentGallery];
    const nextIndex = activeIndex - 1 >= 0 ? activeIndex - 1 : galleryItems.length - 1;
    
    const currentSlide = document.querySelector(`[data-index="${activeIndex}"]`),
          nextSlide = document.querySelector(`[data-index="${nextIndex}"]`);
    
    currentSlide.dataset.status = "after";
    
    nextSlide.dataset.status = "becoming-active-from-before";
    
    // Check if the next slide has iframes that need refreshing
    const iframes = nextSlide.querySelectorAll('iframe');
    iframes.forEach(iframe => {
        if (iframe.getAttribute('data-original-src')) {
            forceRefreshIframe(iframe);
        }
    });
    
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
    
    // Check if the next slide has iframes that need refreshing
    const iframes = nextSlide.querySelectorAll('iframe');
    iframes.forEach(iframe => {
        if (iframe.getAttribute('data-original-src')) {
            forceRefreshIframe(iframe);
        }
    });
    
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
                                    
                                    // Force refresh any iframes in this slide
                                    const iframes = slide.querySelectorAll('iframe');
                                    iframes.forEach(iframe => {
                                        if (iframe.src || iframe.getAttribute('data-original-src')) {
                                            forceRefreshIframe(iframe);
                                        }
                                    });
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

// Drag/Swipe functionality for gallery
let isDragging = false;
let hasMovedEnough = false; // Track if we've moved enough to consider it a drag
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;
let translateX = 0;
const dragThreshold = 100; // Minimum drag distance to trigger slide change
const minimumMovementThreshold = 10; // pixels

function initDragHandlers() {
    const main = document.querySelector('main');
    
    // Mouse events
    main.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    
    // Touch events - use passive: true when possible for better performance
    main.addEventListener('touchstart', handleDragStart, { passive: true });
    // Only touchmove needs passive: false to conditionally prevent default
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd, { passive: true });
}

function handleDragStart(e) {
    // Skip if we're in a special gallery or in lightbox
    if (currentGallery === 'resume' || currentGallery === 'landing' || currentGallery === 'overview' ||
        (lightbox && lightbox.classList.contains('active'))) {
        return;
    }
    
    // Skip if user is clicking on a button or link
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('iframe')) {
        return;
    }
    
    isDragging = true;
    hasMovedEnough = false; // Reset the movement flag
    
    // Get starting positions
    if (e.type === 'touchstart') {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    } else {
        startX = e.clientX;
        startY = e.clientY;
    }
    
    currentX = startX;
    currentY = startY;
    
    // Get the current active slide
    const activeSlide = document.querySelector('article[data-status="active"]');
    if (activeSlide) {
        // Add a class for drag effect styles
        activeSlide.classList.add('dragging');
    }
}

function handleDragMove(e) {
    if (!isDragging) return;
    
    // Update current position
    if (e.type === 'touchmove') {
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
    } else {
        currentX = e.clientX;
        currentY = e.clientY;
    }
    
    // Calculate distances moved
    const deltaX = Math.abs(currentX - startX);
    const deltaY = Math.abs(currentY - startY);
    translateX = currentX - startX;
    
    // Determine if movement is primarily horizontal
    const isHorizontalDrag = deltaX > deltaY;
    
    // Only prevent default on touch devices when clearly dragging horizontally
    // This allows vertical scrolling when needed
    if (e.type === 'touchmove' && isHorizontalDrag && deltaX > minimumMovementThreshold) {
        e.preventDefault();
    }
    
    // Check if we've moved enough horizontally to consider this a drag operation
    if (Math.abs(translateX) > minimumMovementThreshold) {
        hasMovedEnough = true;
    }
    
    // Only apply transform effect if primarily moving horizontally
    if (isHorizontalDrag) {
        // Get the current active slide
        const activeSlide = document.querySelector('article[data-status="active"]');
        if (activeSlide) {
            // Apply a transform to follow the cursor (limited effect)
            const translateAmount = translateX * 0.2; // Dampen the effect
            activeSlide.style.transform = `translateX(${translateAmount}px)`;
            
            // Check if mouse is over an iframe - if so, end the drag early
            if (e.type === 'mousemove') {
                const elementUnderPointer = document.elementFromPoint(currentX, currentY);
                if (elementUnderPointer && (
                    elementUnderPointer.tagName === 'IFRAME' || 
                    elementUnderPointer.closest('iframe')
                )) {
                    // Handle as if the drag ended
                    finishDrag(activeSlide, translateX);
                }
            }
        }
    }
}

function handleDragEnd(e) {
    if (!isDragging) return;
    
    // Calculate overall drag direction
    const deltaX = Math.abs(currentX - startX);
    const deltaY = Math.abs(currentY - startY);
    const isHorizontalDrag = deltaX > deltaY;
    
    // Get the current active slide
    const activeSlide = document.querySelector('article[data-status="active"]');
    if (activeSlide) {
        // Only finish the drag if it was a horizontal movement
        if (isHorizontalDrag) {
            finishDrag(activeSlide, translateX);
        } else {
            // Just reset the transform without triggering a slide change
            activeSlide.style.transform = '';
            activeSlide.classList.remove('dragging');
        }
    }
    
    // Reset flags
    isDragging = false;
    hasMovedEnough = false;
}

// Helper function to finish drag operation
function finishDrag(activeSlide, translateDistance) {
    // Reset dragging state
    isDragging = false;
    
    // Reset transform
    activeSlide.style.transform = '';
    activeSlide.classList.remove('dragging');
    
    // Only trigger slide change if there was meaningful movement (not just a click)
    if (hasMovedEnough) {
        // Check if the drag was significant enough to change slides
        if (Math.abs(translateDistance) > dragThreshold) {
            if (translateDistance > 0) {
                // Dragged right, go to previous slide
                handleLeftClick();
            } else {
                // Dragged left, go to next slide
                handleRightClick();
            }
        }
    }
    
    // Reset the movement flag
    hasMovedEnough = false;
}

// Add event listeners after DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize with landing page instead of web gallery
    currentGallery = 'landing';
    
    // Initialize lightbox elements
    initLightbox();
    
    // Initialize drag handlers
    initDragHandlers();
    
    // Add keyboard navigation listener
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // Setup Intersection Observer for iframes on mobile to load when visible
    if (isMobileDevice()) {
        const observer = setupIframeObserver();
        if (observer) {
            // Observe all iframes
            document.querySelectorAll('.article-iframe, .bandcamp-iframe').forEach(iframe => {
                observer.observe(iframe);
            });
        }
    }
    
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