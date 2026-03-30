import { ScrollTrigger } from 'gsap/ScrollTrigger.js'

// Lenis smooth scroll initialization and management

// Global modal Lenis instance
let lenisModal;

// Part A: Ensure Lenis instance exists (create only once)
export function ensureLenisExists() {
    if (!window.lenis) {
        window.lenis = new Lenis({
            lerp: 0.08,
            wheelMultiplier: 1
        });
    }
}

// Part B: Bind Lenis runtime (ALWAYS re-attach after DOM changes)
export function bindLenisRuntime() {
    if (!window.lenis) {
        console.warn('bindLenisRuntime: window.lenis not found, calling ensureLenisExists()');
        ensureLenisExists();
    }

    // Remove existing scroll handler to avoid duplicates
    window.lenis.off('scroll', unifiedOnScroll);
    // Re-attach unified scroll handler
    window.lenis.on('scroll', unifiedOnScroll);

    // Cancel existing RAF loop if running
    if (window.__lenisRafId) {
        cancelAnimationFrame(window.__lenisRafId);
        window.__lenisRafId = null;
        console.log('bindLenisRuntime: Cancelled existing RAF loop');
    }

    // Start RAF loop (only one globally)
    function raf(time) {
        if (window.lenis) {
            window.lenis.raf(time);
        }
        window.__lenisRafId = requestAnimationFrame(raf);
    }
    window.__lenisRafId = requestAnimationFrame(raf);
    console.log('bindLenisRuntime: Started RAF loop, id:', window.__lenisRafId);

    // Reconnect ScrollTrigger sync
    ScrollTrigger.refresh();
}

// Initialize the main page Lenis instance - use window.lenis as single source of truth
export function initializeLenis() {
    ensureLenisExists();
    bindLenisRuntime();
}

// Initialize scroll-to-top button
export function initLenisScrollToTop() {
    // Ensure Lenis exists (don't create RAF here - bindLenisRuntime handles that)
    ensureLenisExists();

    // Bind scroll-to-top
    const btn = document.querySelector('.scrolltotop');
    if (!btn) return;

    // Remove previous listener (safe re-init)
    btn.onclick = null;

    btn.addEventListener('click', (e) => {
        e.preventDefault();

        if (window.lenis) {
            window.lenis.scrollTo(0, {
                duration: 1.2,
                easing: (t) => 1 - Math.pow(1 - t, 4)
            });
        }
    });
}

// Initialize the modal-specific Lenis instance (destroys existing if present, then creates new)
export function initializeLenisModal() {
    if (lenisModal) {
        lenisModal.destroy(); // Destroy any existing instance before creating a new one
    }

    const caseWrapper = document.querySelector('.case-full-info-wrapper');
    const caseSection = document.querySelector('.case-full-info-section');

    if (caseWrapper && caseSection) {
        lenisModal = new Lenis({
            lerp: 0.08,
            wheelMultiplier: 1,
            wrapper: caseWrapper,
            content: caseSection,
        });

        // Add the unified scroll handler to the modal Lenis instance
        lenisModal.on('scroll', unifiedOnScroll);

        function rafModal(time) {
            lenisModal.raf(time);
            requestAnimationFrame(rafModal);
        }
        requestAnimationFrame(rafModal);
    }
}

// Unified scroll handler that works for both Lenis instances and checks multiple parent classes
export function unifiedOnScroll() {
    const parentClasses = ['.case-container', '.btn-placement-bottom', '.text-header', '.footer-case-items-holder', '.case-high-section', '.case-big-discription-text-container ', '.footer', '.footer-info-wrapper']; // Add modal-specific classes if needed
    const threshold = window.innerHeight * 0.95;  // Adjust this value to trigger earlier

    parentClasses.forEach(parentClass => {
        const sections = document.querySelectorAll(parentClass);

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= threshold && rect.bottom >= 0) {
                if (!section.classList.contains('show')) {
                    section.classList.add('show');
                    animateElementsInView(section);  // Animate elements only inside the visible section
                }
            }
        });
    });

    ScrollTrigger.update();  // Synchronize ScrollTrigger with Lenis scroll
}