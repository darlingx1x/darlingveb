/**
 * page-transition.js
 * Enhanced page transitions with reliable resource loading and smooth animations
 */

// Execute when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load the resource loader if needed
    if (!window.ResourceLoader) {
        const script = document.createElement('script');
        script.src = 'js/resource-loader.js';
        script.onload = initializePageTransition;
        document.head.appendChild(script);
    } else {
        initializePageTransition();
    }
});

/**
 * Main initialization function for page transitions
 */
function initializePageTransition() {
    console.log('Initializing page transition system...');
    
    // Add styles for page transition effects
    addTransitionStyles();
    
    // Initialize current page handlers
    initializePageHandlers();
    
    // Setup link click handling for SPA navigation
    setupLinkHandlers();
    
    // Setup browser navigation handling (back/forward)
    setupPopStateHandler();
    
    console.log('Page transition system initialized');
}

/**
 * Add CSS styles for transitions
 */
function addTransitionStyles() {
    if (document.getElementById('transition-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'transition-styles';
    styleElement.textContent = `
        /* Page loading indicator */
        .page-loading {
            cursor: progress !important;
            opacity: 0.7;
            transition: opacity 0.3s ease;
        }
        
        .page-loading * {
            pointer-events: none !important;
        }
        
        /* Page transition animations */
        .page-transition-fade-out {
            opacity: 0;
            transform: translateY(-10px);
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        .page-transition-fade-in {
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        /* Loading indicator */
        .loader-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        
        .loader-active {
            opacity: 1;
            pointer-events: all;
        }
        
        .loader-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255, 215, 0, 0.3);
            border-radius: 50%;
            border-top-color: #FFD700;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    
    document.head.appendChild(styleElement);
}

/**
 * Get the current page type based on content or URL
 */
function getCurrentPageType() {
    const path = window.location.pathname;
    const url = window.location.href;
    
    if (url.includes('books.html') || document.querySelector('.books-grid')) {
        return 'books';
    }
    
    if (url.includes('book-details.html') || document.querySelector('.book-details')) {
        return 'book-details';
    }
    
    if (url.includes('posts.html') || document.querySelector('.post-grid')) {
        return 'posts';
    }
    
    if (url.includes('open-questions.html') || document.querySelector('.article-content')) {
        return 'open-questions';
    }
    
    if (url.includes('lists.html')) {
        return 'lists';
    }
    
    if (url.includes('projects.html')) {
        return 'projects';
    }
    
    if (url.includes('cv.html')) {
        return 'cv';
    }
    
    return 'home';
}

/**
 * Initialize page-specific handlers
 */
function initializePageHandlers(pageType = null, url = null) {
    // Если тип страницы не передан, определяем его
    const currentPageType = pageType || getCurrentPageType();
    const currentUrl = url || window.location.href;
    
    console.log(`Initializing handlers for page type: ${currentPageType}`);
    
    // Ensure all required resources are loaded
    window.ResourceLoader.loadPageResources(currentPageType, { url: currentUrl, cache: false })
        .then(() => {
            // Initialize specific page functionality
            switch (currentPageType) {
                case 'books':
                    initializeBooksPage();
                    break;
                case 'book-details':
                    initializeBookDetailsPage();
                    break;
                case 'open-questions':
                    // Специальная обработка для open-questions.html
                    initializeOpenQuestionsPage();
                    break;
                default:
                    // For other pages, just initialize common elements
                    ensureImagesSize();
            }
        })
        .catch(error => {
            console.error('Error loading page resources:', error);
        });
}

/**
 * Initialize open-questions page functionality
 */
function initializeOpenQuestionsPage() {
    console.log('Initializing open-questions page...');
    
    // Ensure cyber-oracle.js is loaded and initialized
    if (typeof window.cyber_oracle_initialized === 'undefined') {
        console.log('Manually loading cyber-oracle.js');
        const scriptElem = document.createElement('script');
        scriptElem.src = 'js/cyber-oracle.js?' + Date.now(); // Cache busting
        scriptElem.onload = function() {
            window.cyber_oracle_initialized = true;
            console.log('cyber-oracle.js loaded successfully');
        };
        document.head.appendChild(scriptElem);
    } else {
        console.log('cyber-oracle.js already loaded');
    }
    
    // Initialize any other elements
    ensureImagesSize();
}

/**
 * Initialize books page functionality
 */
function initializeBooksPage() {
    console.log('Initializing books page...');
    
    // Initialize books grid
    if (typeof window.initializeBooksGrid === 'function') {
        window.initializeBooksGrid();
    } else if (typeof initializeBooksGrid === 'function') {
        initializeBooksGrid();
    }
    
    // Initialize book cover toggle
    const checkbox = document.getElementById('coverToggle');
    const booksGrid = document.getElementById('booksGrid');
    const switchLabel = document.querySelector('.switch');
    
    if (checkbox && booksGrid && switchLabel) {
        // Restore saved state
        const showCovers = localStorage.getItem('showCovers') !== 'false';
        checkbox.checked = showCovers;
        
        if (!showCovers) {
            booksGrid.classList.add('hide-covers');
        }
        
        // Add toggle handler
        switchLabel.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            checkbox.checked = !checkbox.checked;
            
            if (checkbox.checked) {
                booksGrid.classList.remove('hide-covers');
            } else {
                booksGrid.classList.add('hide-covers');
            }
            
            localStorage.setItem('showCovers', checkbox.checked);
        });
    }
    
    // Initialize sort select
    const sortSelect = document.querySelector('.sort-select');
    if (sortSelect) {
        // Restore saved sort
        const savedSort = localStorage.getItem('bookSort');
        if (savedSort) {
            sortSelect.value = savedSort;
        }
        
        // Add change handler
        sortSelect.addEventListener('change', function() {
            localStorage.setItem('bookSort', this.value);
            
            // Apply sorting
            if (typeof window.sortBooks === 'function') {
                window.sortBooks(this.value);
            } else if (typeof sortBooks === 'function') {
                sortBooks(this.value);
            }
        });
    }
    
    // Fix image sizes
    ensureImagesSize();
}

/**
 * Initialize book details page
 */
function initializeBookDetailsPage() {
    console.log('Initializing book details page...');
    
    // Get book ID from URL
    const bookId = new URLSearchParams(window.location.search).get('id');
    
    // Check if book database is available
    if (typeof window.bookDatabase !== 'undefined' || typeof bookDatabase !== 'undefined') {
        displayBookData();
    } else {
        // Load book details script if not available
        window.ResourceLoader.loadScript('js/book-details.js')
            .then(() => {
                displayBookData();
            })
            .catch(error => {
                console.error('Error loading book details script:', error);
            });
    }
    
    // Fix image sizes
    ensureImagesSize();
}

/**
 * Display book data from database
 */
function displayBookData() {
    // Get book ID from URL
    const bookId = new URLSearchParams(window.location.search).get('id');
    if (!bookId) return;
    
    // Get book data
    const db = window.bookDatabase || bookDatabase;
    const bookData = db[bookId];
    
    if (!bookData) {
        console.error(`Book with ID ${bookId} not found`);
        return;
    }
    
    // Update DOM elements
    const elements = {
        cover: document.getElementById('bookCover'),
        title: document.getElementById('bookTitle'),
        author: document.getElementById('bookAuthor'),
        dateRead: document.getElementById('dateRead'),
        description: document.getElementById('bookDescription'),
        pageCount: document.getElementById('pageCount'),
        publishDate: document.getElementById('publishDate'),
        genre: document.getElementById('genre')
    };
    
    // Update elements if they exist
    if (elements.cover) {
        elements.cover.src = bookData.coverImage;
        elements.cover.alt = bookData.title;
    }
    
    if (elements.title) elements.title.textContent = bookData.title;
    if (elements.author) elements.author.textContent = `By ${bookData.author}`;
    if (elements.dateRead) elements.dateRead.textContent = `Finished reading: ${bookData.dateRead}`;
    if (elements.description) elements.description.textContent = bookData.description;
    if (elements.pageCount) elements.pageCount.textContent = bookData.pages;
    if (elements.publishDate) elements.publishDate.textContent = bookData.publishDate;
    if (elements.genre) elements.genre.textContent = bookData.genre;
}

/**
 * Fix image sizes to ensure consistent display
 */
function ensureImagesSize() {
    console.log('Ensuring image sizes are consistent');
    
    // Process book covers
    const bookCovers = document.querySelectorAll('.book-cover');
    bookCovers.forEach(cover => {
        if (!cover.hasAttribute('data-sized')) {
            cover.setAttribute('data-sized', 'true');
            
            // Set base styles
            cover.style.width = '100%';
            cover.style.maxWidth = '100%';
            cover.style.height = 'auto';
            
            // Add load handler
            cover.addEventListener('load', function() {
                this.style.width = '100%';
                this.style.height = 'auto';
            });
            
            // Apply styles immediately if already loaded
            if (cover.complete) {
                cover.style.width = '100%';
                cover.style.height = 'auto';
            }
        }
    });
    
    // Special handling for book details page
    const detailsCover = document.querySelector('.book-details .book-cover');
    if (detailsCover) {
        detailsCover.style.width = '300px';
        detailsCover.style.maxWidth = '100%';
        detailsCover.style.height = 'auto';
        detailsCover.classList.add('detail-view');
    }
    
    // Mark books grid as initialized
    const booksGrid = document.getElementById('booksGrid');
    if (booksGrid) {
        booksGrid.classList.add('initialized');
    }
    
    // Add dynamic styles if not already present
    if (!document.getElementById('dynamic-image-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'dynamic-image-styles';
        styleElement.textContent = `
            .book-cover {
                width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
                transition: all 0.3s ease;
            }
            
            .book-details .book-cover {
                width: 300px !important;
                max-width: 100% !important;
                height: auto !important;
            }
            
            @media (max-width: 768px) {
                .book-details .book-cover {
                    width: 100% !important;
                    max-width: 300px !important;
                    margin: 0 auto;
                }
            }
        `;
        document.head.appendChild(styleElement);
    }
}

/**
 * Setup link handlers for SPA navigation
 */
function setupLinkHandlers() {
    document.addEventListener('click', function(event) {
        // Find closest link element
        const link = event.target.closest('a');
        if (!link) return;
        
        // Skip external links, hash links, and links with target="_blank"
        if (!link.href || 
            !link.href.startsWith(window.location.origin) || 
            link.href.includes('#') || 
            link.target === '_blank' || 
            link.hasAttribute('download')) {
            return;
        }
        
        // Prevent default navigation
        event.preventDefault();
        
        // Navigate to the linked page
        navigateToPage(link.href);
    });
}

/**
 * Handle browser navigation (back/forward)
 */
function setupPopStateHandler() {
    window.addEventListener('popstate', function(event) {
        console.log('Navigation state changed', event.state);
        
        // Load the current URL
        loadPage(window.location.href, false);
    });
}

/**
 * Navigate to a new page via history API
 */
function navigateToPage(url) {
    console.log(`Navigating to: ${url}`);
    
    // Update history state
    window.history.pushState({ url }, '', url);
    
    // Load the page
    loadPage(url, true);
}

/**
 * Load a page via fetch and update content
 */
function loadPage(url, updateHistory = true) {
    // Show loading indicator
    showLoader();
    document.body.classList.add('page-loading');
    
    // Определяем тип страницы из URL (предварительное определение)
    const prelimPageType = getPageTypeFromUrl(url);
    console.log(`Preliminary page type from URL: ${prelimPageType}`);
    
    // Fade out content
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.classList.add('page-transition-fade-out');
    }
    
    // Fetch the page content
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            // Parse the HTML
            const parser = new DOMParser();
            const newDocument = parser.parseFromString(html, 'text/html');
            
            // Get the new page type - explicitly pass the URL
            const pageType = getPageTypeFromDocument(newDocument, url);
            console.log(`Page type detected: ${pageType} for URL: ${url}`);
            
            // Принудительная очистка кэша перед загрузкой ресурсов
            window.ResourceLoader.invalidateCache('all');
            
            // Load required resources - pass the URL as an option
            return window.ResourceLoader.loadPageResources(pageType, { url: url, cache: false })
                .then(() => {
                    // Update title
                    document.title = newDocument.title;
                    
                    // Update the main content after the fade out
                    setTimeout(() => {
                        const newMainContent = newDocument.querySelector('main');
                        
                        if (mainContent && newMainContent) {
                            mainContent.innerHTML = newMainContent.innerHTML;
                            mainContent.classList.remove('page-transition-fade-out');
                            mainContent.classList.add('page-transition-fade-in');
                            
                            // Trigger fade in
                            setTimeout(() => {
                                mainContent.classList.remove('page-transition-fade-in');
                                mainContent.style.opacity = '1';
                                mainContent.style.transform = 'translateY(0)';
                                
                                // Initialize page handlers for new content
                                initializePageHandlers(pageType, url);
                                
                                // Hide loading indicators
                                document.body.classList.remove('page-loading');
                                hideLoader();
                            }, 50);
                        } else {
                            // Fallback if elements not found - reload the page
                            window.location.href = url;
                        }
                    }, 300); // Match the CSS transition duration
                });
        })
        .catch(error => {
            console.error('Error loading page:', error);
            
            // Hide indicators
            document.body.classList.remove('page-loading');
            hideLoader();
            
            // Fall back to standard navigation on error
            window.location.href = url;
        });
}

/**
 * Determine page type from a document object
 */
function getPageTypeFromDocument(doc, url) {
    if (!doc) return 'home';
    
    // Проверяем URL для точного определения
    if (url.includes('books.html')) return 'books';
    if (url.includes('book-details.html')) return 'book-details';
    if (url.includes('posts.html')) return 'posts';
    if (url.includes('open-questions.html')) return 'open-questions';
    if (url.includes('lists.html')) return 'lists';
    if (url.includes('projects.html')) return 'projects';
    if (url.includes('cv.html')) return 'cv';
    
    // Проверяем DOM если URL не дал результатов
    if (doc.querySelector('.books-grid')) return 'books';
    if (doc.querySelector('.book-details')) return 'book-details';
    if (doc.querySelector('.post-grid')) return 'posts';
    if (doc.querySelector('.article-content')) return 'open-questions';
    
    return 'home';
}

/**
 * Определение типа страницы по URL
 */
function getPageTypeFromUrl(url) {
    if (url.includes('books.html')) return 'books';
    if (url.includes('book-details.html')) return 'book-details';
    if (url.includes('posts.html')) return 'posts';
    if (url.includes('open-questions.html')) return 'open-questions';
    if (url.includes('lists.html')) return 'lists';
    if (url.includes('projects.html')) return 'projects';
    if (url.includes('cv.html')) return 'cv';
    return 'home';
}

/**
 * Create and show a loading indicator
 */
function showLoader() {
    let loader = document.querySelector('.loader-overlay');
    
    if (!loader) {
        loader = document.createElement('div');
        loader.className = 'loader-overlay';
        loader.innerHTML = '<div class="loader-spinner"></div>';
        document.body.appendChild(loader);
        
        // Force reflow
        loader.offsetWidth;
    }
    
    // Show the loader
    loader.classList.add('loader-active');
}

/**
 * Hide the loading indicator
 */
function hideLoader() {
    const loader = document.querySelector('.loader-overlay');
    if (loader) {
        loader.classList.remove('loader-active');
    }
}

// Export functionality for global access
window.PageTransition = {
    navigate: navigateToPage,
    initializeHandlers: initializePageHandlers,
    ensureImagesSize: ensureImagesSize
};