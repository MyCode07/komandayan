import gsap from "gsap/all";
import { initializePageLoadLottieAnimations } from "./Lottie-animation.js";
import { initializeSlider } from "./initializeSlider.js";


function autoplayMainSliderVideos() {
    const slider = document.querySelector('.main-slider');
    if (!slider) return;

    const videos = slider.querySelectorAll('.video-cover video');

    videos.forEach(video => {
        // Required for autoplay to work reliably
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;

        // Restart video
        video.pause();
        video.currentTime = 0;

        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // Retry slightly later (Safari / iOS fix)
                setTimeout(() => video.play(), 200);
            });
        }
    });
}

function animateSliderNavText() {
    document.querySelector('.circle-minimize-btn').addEventListener('click', () => {
        gsap.fromTo(
            '.slider-nav-text',
            { y: 0 }, // Start at y: 0
            { y: -100, delay: 0, duration: 1, ease: 'texttshow' } // Animate to y: -100 with specified ease
        );
    });

    document.querySelector('.circle-scale-btn').addEventListener('click', () => {
        gsap.fromTo(
            '.slider-nav-text',
            { y: -100 }, // Start at y: -100
            { y: 0, delay: 0.5, duration: 1, ease: 'texttshow' } // Animate to y: 0 with specified ease
        );
    });
}

function initLinkAnimations() {
    // For Menu Links
    const menuLinks = document.querySelectorAll('.menu-link');
    menuLinks.forEach(link => {
        const firstMenuLink = link.querySelector('.first-menu-link');
        const secondMenuLink = link.querySelector('.second-menu-link');
        const firstMenuLinkSocial = link.querySelector('.first-menu-link-social');
        const secondMenuLinkSocial = link.querySelector('.second-menu-link-social');

        link.addEventListener('mouseenter', () => {
            gsap.to(firstMenuLink, {
                y: '-100%',
                duration: 0.6,
                ease: "hoverin"
            });

            gsap.to(secondMenuLink, {
                y: '-100%',
                duration: 0.6,
                ease: "hoverin"
            });

            gsap.to(firstMenuLinkSocial, {
                y: '-100%',
                duration: 0.6,
                ease: "hoverin"
            });

            gsap.to(secondMenuLinkSocial, {
                y: '-100%',
                duration: 0.6,
                ease: "hoverin"
            });
        });

        link.addEventListener('mouseleave', () => {
            gsap.to(firstMenuLink, {
                y: '0%',
                duration: 1,
                ease: "hoverout"
            });

            gsap.to(secondMenuLink, {
                y: '0%',
                duration: 1,
                ease: "hoverout"
            });

            gsap.to(firstMenuLinkSocial, {
                y: '0%',
                duration: 1,
                ease: "hoverout"
            });

            gsap.to(secondMenuLinkSocial, {
                y: '0%',
                duration: 1,
                ease: "hoverout"
            });
        });
    });

    // For Button Links
    const btnLinks = document.querySelectorAll('.btn-container');
    btnLinks.forEach(link => {
        const firstBtnLink = link.querySelector('.first-btn-link');
        const plusBtn = link.querySelector('.plus-btn-container');
        const closeBtn = link.querySelector('.btn-icon-close');
        const secondBtnLink = link.querySelector('.second-btn-link');

        link.addEventListener('mouseenter', () => {
            gsap.to(firstBtnLink, {
                y: '-100%',
                duration: 0.6,
                ease: "hoverin"
            });

            gsap.to(secondBtnLink, {
                y: '-100%',
                duration: 0.6,
                ease: "hoverin"
            });
            gsap.to(plusBtn, {
                rotation: -180,
                duration: 0.6,
                ease: "hoverin"
            });
            gsap.to(closeBtn, {
                rotation: -135,
                duration: 0.6,
                ease: "hoverin"
            });

        });



        link.addEventListener('mouseleave', () => {
            gsap.to(firstBtnLink, {
                y: '0%',
                duration: 1,
                ease: "hoverout"
            });

            gsap.to(secondBtnLink, {
                y: '0%',
                duration: 1,
                ease: "hoverout"
            });
            gsap.to(plusBtn, {
                rotation: 0,
                duration: 1,
                ease: "hoverout"
            });
            gsap.to(closeBtn, {
                rotation: 45,
                duration: 1,
                ease: "hoverout"
            });
        });
    });
}

function pageLoadStartAnimation() {
    gsap.to('.header__animate-item', {
        duration: 1,
        y: '0%',
        ease: 'texttshow',
        delay: 5.4
    });


    gsap.to('.main-slider__img-wrap', {
        top: '0vh',
        duration: 1.35,
        ease: 'Pagtrans',
        delay: 4.3
    });


    gsap.to('.first-menu-link', {
        duration: 1,
        y: '0%',
        ease: 'texttshow',
        delay: 5.4
    });

    gsap.to('.circle-minimize-btn', {
        duration: 1,
        clipPath: 'inset(0% 0% 0% 0%)',
        ease: 'texttshow',
        delay: 5.4
    });

    gsap.to('.numbers__wrap', {
        duration: 1,
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
        ease: 'texttshow',
        delay: 5.4
    });

    gsap.to('.main-slider__title', {
        duration: 1.8,
        bottom: '0',
        ease: 'texttshow',
        delay: 4.8
    });

    gsap.to('.footer__animate-item', {
        duration: 1,
        y: '0%',
        ease: 'texttshow',
        delay: 5.4
    });
}

function updatePage() {
    $(window).scrollTop(0);
}

function sharedInit() {
    // initLenisScrollToTop();
    // initializeLenis();
    initLinkAnimations();
    autoplayMainSliderVideos();

    if (document.querySelector('.main-slider')) {
        initializeSlider();
        animateSliderNavText()
    }

    if (document.querySelector('.video-lazy-load')) {
        initializeVideoLazyLoad();
    }
}

function pageLoader() {
    let frontpageLoader = document.querySelector('.frontpage-loader');

    gsap.to('.loader-text', {
        duration: 1.35,
        y: '0%',
        ease: 'texttshow',
        delay: 0.5
    });

    gsap.to('.loader-text', {
        duration: 1.50,
        y: '-100%',
        ease: 'texttshow',
        delay: 3.6
    });

    // Animate frontpage-loader out
    gsap.to('.frontpage-loader', {
        duration: 1.35,
        y: '-100%',
        ease: 'Pagtrans',
        delay: 4.3, // Delay after all headers
        onComplete: () => {
            frontpageLoader.style.display = 'none'; // Hide loader after animation
        }
    });
}

function initForLoad() {
    pageLoadStartAnimation();
    initializePageLoadLottieAnimations();
    sharedInit();

    if (document.querySelector('.frontpage-loader')) {
        pageLoader();
    }
}

initForLoad();

// Functions specific to Barba.js transitions
function initForBarba() {
    sharedInit(); // Call the shared functions
}


barba.init({
    preventRunning: true,
    transitions: [
        {
            name: "opacity-transition",

            beforeLeave(data) {
                // Debug: log before destroy
                console.log('[Barba beforeLeave] Destroy slider, html classes:', document.documentElement.classList.toString());

                // Destroy slider before transition (if it exists) - MUST happen first
                // Frontpageslider-6
                if (typeof window.__frontpageSliderDestroy === 'function') {
                    try {
                        window.__frontpageSliderDestroy();
                        console.log('[Barba beforeLeave] Slider destroyed (v6)');
                    } catch (e) {
                        console.warn('[Barba beforeLeave] Slider destroy error (v6):', e);
                    }
                }

                // Frontpageslider-2
                if (typeof window.__frontpageSlider2Destroy === 'function') {
                    try {
                        window.__frontpageSlider2Destroy();
                        console.log('[Barba beforeLeave] Slider destroyed (v2)');
                    } catch (e) {
                        console.warn('[Barba beforeLeave] Slider destroy error (v2):', e);
                    }
                }

                // Force remove lenis-stopped immediately after slider destroy
                document.documentElement.classList.remove('lenis-stopped');

                // Stop Lenis before transition
                if (window.lenis && typeof window.lenis.stop === 'function') {
                    window.lenis.stop();
                    console.log('[Barba beforeLeave] Lenis stopped');
                }

                // Lower the zIndex of the current container to make it disappear behind the overlay
                return gsap.set(data.current.container, {
                    zIndex: 0 // Set zIndex to a low value to move behind the overlay
                });
            },

            leave(data) {

                // Animate the current container out (without opacity change)
                const animateOutCurrent = gsap.fromTo(
                    data.current.container,
                    { y: 0 },
                    { y: -150, ease: "Pagtrans", duration: 1 }
                );

                // Animate the overlay
                const animateOverlay = gsap.fromTo(
                    ".overlay",
                    { yPercent: 0 },
                    {
                        yPercent: -100, ease: "Pagtrans", duration: 0.8, onComplete: function () {
                            // Hide the current container when overlay animation completes
                            gsap.set(data.current.container, { display: 'none' });
                        }
                    }
                );

                return Promise.all([animateOutCurrent, animateOverlay]);
            },

            enter(data) {

                setTimeout(() => {
                    initializeBarbaLottieAnimations();
                }, 100);

                const tl = new gsap.timeline({
                    onComplete: function () {
                        updatePage();
                    }
                });

                // Animate the overlay out of the screen
                tl.to(".overlay", {
                    yPercent: -205,
                    ease: "Pagtrans",
                    duration: 1
                });

                // Animate the next container in
                tl.fromTo(data.next.container, {
                    y: 150,
                    zIndex: 3
                }, {
                    y: 0,
                    duration: 1,
                    ease: "pagein"
                }, "-=1");

                // Return the timeline and wait for a slight delay before resolving the transition
                return tl.then(() => {
                    return new Promise((resolve) => {
                        gsap.delayedCall(0.2, () => {
                            resolve();
                        });
                    });
                });
            },

            afterEnter(data) {
                // Force remove lenis-stopped IMMEDIATELY (before anything else)
                document.documentElement.classList.remove('lenis-stopped');
                console.log('[Barba afterEnter] Removed lenis-stopped immediately, html classes:', document.documentElement.classList.toString());

                // Ensure slider cleanup is complete (extra safety for both slider versions)
                // This ensures any lingering observers/RAF loops are killed before Lenis starts
                if (typeof window.__frontpageSliderDestroy === 'function') {
                    try {
                        window.__frontpageSliderDestroy();
                        console.log('[Barba afterEnter] Extra slider cleanup called (v6)');
                    } catch (e) {
                        console.warn('[Barba afterEnter] Extra slider cleanup error (v6):', e);
                    }
                }

                if (typeof window.__frontpageSlider2Destroy === 'function') {
                    try {
                        window.__frontpageSlider2Destroy();
                        console.log('[Barba afterEnter] Extra slider cleanup called (v2)');
                    } catch (e) {
                        console.warn('[Barba afterEnter] Extra slider cleanup error (v2):', e);
                    }
                }

                // Remove class again after cleanup
                document.documentElement.classList.remove('lenis-stopped');

                // Debug: check RAF status
                if (window.__lenisRafId) {
                    console.log('[Barba afterEnter] RAF already running, id:', window.__lenisRafId);
                } else {
                    console.log('[Barba afterEnter] No RAF running, will start');
                }

                // Re-bind Lenis runtime (re-attach handlers, restart RAF, reconnect ScrollTrigger)
                bindLenisRuntime();

                // Remove lenis-stopped class again after bind (double safety)
                document.documentElement.classList.remove('lenis-stopped');

                // Start Lenis FIRST, then reinitialize other components
                // This ensures Lenis is active before slider creates its Observer
                if (window.lenis && typeof window.lenis.start === 'function') {
                    // Start Lenis immediately (don't wait for timeout)
                    window.lenis.start();
                    document.documentElement.classList.remove('lenis-stopped');
                    console.log('[Barba afterEnter] Lenis started immediately, html classes:', document.documentElement.classList.toString());

                    // Also ensure it's removed after a delay (safety net)
                    setTimeout(() => {
                        document.documentElement.classList.remove('lenis-stopped');
                        console.log('[Barba afterEnter] Final class check, html classes:', document.documentElement.classList.toString());
                    }, 800);
                } else {
                    // If Lenis doesn't exist or start fails, still remove the class
                    setTimeout(() => {
                        document.documentElement.classList.remove('lenis-stopped');
                        console.log('[Barba afterEnter] Lenis not available, forced class removal');
                    }, 800);
                }

                setTimeout(() => {
                    initializeLottieAnimation({
                        containerId: 'footer-logo',
                        animationPath: 'https://cdn.prod.website-files.com/6649cbdf19aa7125580e2ccb/677aa94d40c2dd9299a1b7a9_footer-logo.json',
                        autoplay: false,
                        delay: 0,
                        inViewTrigger: true, // Trigger animation when footer is in view
                        resetAfter: 0,
                    });
                }, 200);
                // Reinitialize Barba-related content
                initForBarba();

                // Ensure scroll-to-top button is attached (safety net with delay for DOM readiness)
                setTimeout(() => {
                    initLenisScrollToTop();
                }, 200);

                // Hide the overlay after the transition
                $(".overlay").addClass("hideoverlay");
                $(data.next.container).removeClass("con-fixed");
            }
        }
    ]
});