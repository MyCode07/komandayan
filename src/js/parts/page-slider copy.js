import gsap from "gsap/all";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from 'gsap/ScrollTrigger.js'
import { initializeCaseReadMoreCursorToggle, initializeCustomCursor, initializeSpecialCursorFrontpage } from "./Customcursor.js";
import { initializeBarbaLottieAnimations, initializeLottieAnimation, initializePageLoadLottieAnimations } from "./Lottie-animation.js";
import { initializeLenis, initLenisScrollToTop } from "./lenis-scroll.js";
import { Observer } from "gsap/Observer";
gsap.registerPlugin(ScrollTrigger, Observer);


// Global cleanup state (accessible to destroy function)
let slider2CleanupState = {
    smallRafId: null,
    smallSnapTimer: null,
    smallScrollEl: null,
    wheelHandler: null,
    measureSmall: null
};

// Function to initialize the slider
function initializeSlider() {
    // ✅ Kill previous instance (Barba re-enter) - CRITICAL for preventing multiple RAF loops
    if (slider2CleanupState.smallRafId) {
        cancelAnimationFrame(slider2CleanupState.smallRafId);
        slider2CleanupState.smallRafId = null;
    }

    if (slider2CleanupState.smallSnapTimer) {
        clearTimeout(slider2CleanupState.smallSnapTimer);
        slider2CleanupState.smallSnapTimer = null;
    }

    if (slider2CleanupState.smallScrollEl && slider2CleanupState.wheelHandler) {
        slider2CleanupState.smallScrollEl.removeEventListener("wheel", slider2CleanupState.wheelHandler);
        slider2CleanupState.smallScrollEl = null;
    }

    if (slider2CleanupState.measureSmall) {
        window.removeEventListener("resize", slider2CleanupState.measureSmall);
        slider2CleanupState.measureSmall = null;
    }

    let totalSlides = $(".slider_item").length;
    let slideWidth = $(".slider_item").width();

    let sliderListWidth = slideWidth * totalSlides;
    let moveDistance = (totalSlides - 1) * -100;
    let popupOpen = true;
    let transitioning = false;
    let object = { value: 0 };
    let currSlide = 0;


    // Ensure moveDistance does not exceed 600
    let adjustedMoveDistance = Math.max(moveDistance, "-596");

    // prevent drag>click
    let mouseDown = false;
    let canClickCard = true;
    $(document.body)
        .on("mousedown", function () {
            mouseDown = true;
        })
        .on("mousemove", function () {
            canClickCard = !mouseDown;
        })
        .on("mouseup", function () {
            mouseDown = false;
            setTimeout(function () {
                canClickCard = true;
            }, 100);
        });

    $(".slidelink.w-inline-block").each(function () {
        $(this).on("click", function (ev) {
            if (!canClickCard) {
                ev.preventDefault();
            }
        });
    });

    // ============================================================
    // ✅ Small slider (minimized) — NO TIMELINE, smooth translateX
    // Trigger area: .small-scroll-container (optimized from Frontpageslider-6)
    // ============================================================
    const smallScrollEl = document.querySelector(".small-scroll-container");
    const smallWrap =
        document.querySelector(".slider_wrap.w-dyn-list") ||
        document.querySelector(".slider_wrap");
    const smallList = document.querySelector(".slider_list");
    const numbersListEl = document.querySelector(".numbers_list");

    let smallMaxX = 0; // negative
    let smallCurrentX = 0;
    let smallTargetX = 0;
    let isMoving = false; // Track if slider is actively moving
    let velocity = 0; // Momentum/velocity for natural deceleration

    // Store in cleanup state for destroy function
    slider2CleanupState.smallRafId = null;
    slider2CleanupState.smallSnapTimer = null;

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function measureSmall() {
        if (!smallWrap || !smallList) return;

        const w = smallWrap.clientWidth;
        const sw = smallList.scrollWidth;

        smallMaxX = Math.min(0, w - sw); // negative travel
        smallCurrentX = clamp(smallCurrentX, smallMaxX, 0);
        smallTargetX = clamp(smallTargetX, smallMaxX, 0);

        gsap.set(smallList, { x: smallCurrentX });
        updateNumbersFromX();
    }

    function getProgress01FromX() {
        const maxTravel = Math.abs(smallMaxX);
        return maxTravel <= 0 ? 0 : Math.abs(smallCurrentX) / maxTravel;
    }

    function updateNumbersFromX() {
        // When fullscreen popup is open, always lock numbers to the actual slide index.
        // This prevents laggy / drifting numbers and keeps them in sync with looping navigation.
        if (popupOpen) {
            if (numbersListEl) {
                const toWhole = currSlide * -100;
                numbersListEl.style.transform = `translateY(${toWhole}%)`;
            }
            return;
        }

        const progress01 = getProgress01FromX();
        const progressNumber = progress01 * moveDistance; // moveDistance is negative
        const toWhole = Math.round(progressNumber / 100) * 100;

        if (numbersListEl) numbersListEl.style.transform = `translateY(${toWhole}%)`;

        // keep your existing "feel" when minimized
        currSlide = Math.max(
            0,
            Math.min(totalSlides - 1, Math.round(-progressNumber / 100 + 0.5))
        );
    }

    // Direct transform (no quickTo for instant, natural feel like Lenis)
    // Using direct gsap.set for immediate response

    function deltaPixels(e) {
        const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (e.deltaMode === 1) return raw * 18; // lines -> px
        if (e.deltaMode === 2) return raw * innerHeight; // pages -> px
        // Add multiplier for more responsive feel (like Lenis)
        return raw * 1.5; // More responsive, natural scroll feel
    }

    function snapToNearest() {
        if (!smallList) return;
        const items = smallList.querySelectorAll(".slider_item");
        if (!items.length) return;

        // Use current position (not target) for more natural snap
        const leftPos = Math.abs(smallCurrentX);

        let closest = items[0];
        let best = Infinity;

        items.forEach((item) => {
            const d = Math.abs(item.offsetLeft - leftPos);
            if (d < best) {
                best = d;
                closest = item;
            }
        });

        // Only snap if VERY close to an item (very tight threshold for free feel)
        const itemWidth = closest.offsetWidth;
        if (best < itemWidth * 0.15) { // Only snap if within 15% of item width
            smallTargetX = clamp(-closest.offsetLeft, smallMaxX, 0);
            velocity = 0; // Clear velocity when snapping

            // Restart RAF loop if it was stopped (for smooth snap animation)
            if (!slider2CleanupState.smallRafId) {
                slider2CleanupState.smallRafId = requestAnimationFrame(tick);
            }
        }
        // If not close enough, don't snap - stay where you are (free scrolling)
    }

    function wheelHandler(e) {
        if (popupOpen) return; // only when minimized
        if (!smallList) return;

        // ✅ prevent page scroll ONLY when minimized + wheel is on the small area
        e.preventDefault();

        const d = deltaPixels(e);

        // Add velocity for momentum/inertia effect
        velocity = -d * 0.3; // Scale velocity for natural feel
        smallTargetX = clamp(smallTargetX - d, smallMaxX, 0);

        // Restart RAF loop if it was stopped
        if (!slider2CleanupState.smallRafId) {
            slider2CleanupState.smallRafId = requestAnimationFrame(tick);
        }

        // Clear any pending snap - allow completely free scrolling
        clearTimeout(slider2CleanupState.smallSnapTimer);
        slider2CleanupState.smallSnapTimer = null;

        // Very lenient snap - only after long pause AND only if very close to an item
        // This allows free scrolling without forcing positions
        slider2CleanupState.smallSnapTimer = setTimeout(() => {
            // Only snap if velocity has completely stopped
            if (Math.abs(velocity) < 0.05) {
                // Only snap if VERY close to an item (within 15% of item width)
                const items = smallList.querySelectorAll(".slider_item");
                if (items.length > 0) {
                    const itemWidth = items[0].offsetWidth;
                    const snapThreshold = itemWidth * 0.15; // Very tight threshold - only snap if very close

                    let shouldSnap = false;
                    let closestItem = null;
                    let bestDistance = Infinity;

                    items.forEach((item) => {
                        const itemLeft = item.offsetLeft;
                        const distance = Math.abs(Math.abs(smallCurrentX) - itemLeft);
                        if (distance < snapThreshold && distance < bestDistance) {
                            bestDistance = distance;
                            closestItem = item;
                            shouldSnap = true;
                        }
                    });

                    // Only snap if very close to an item - otherwise stay where you are
                    if (shouldSnap && closestItem) {
                        snapToNearest();
                        velocity = 0;
                    }
                }
            }
        }, 1500); // Very long delay - 1.5 seconds of no scrolling before considering snap
    }

    // Store wheelHandler for cleanup
    slider2CleanupState.wheelHandler = wheelHandler;

    function tick() {
        // ✅ Safety check: stop if element removed or cleanup state cleared
        if (!document.body.contains(smallList) || !slider2CleanupState.smallRafId) {
            return;
        }

        // Slower easing for smoother, more natural feel
        const ease = 0.2;
        const diff = Math.abs(smallTargetX - smallCurrentX);

        // Apply momentum/velocity for natural deceleration
        if (velocity !== 0) {
            smallCurrentX += velocity;
            velocity *= 0.92; // Friction - gradually slow down

            // Clamp to bounds
            smallCurrentX = clamp(smallCurrentX, smallMaxX, 0);

            // Update target to match current when velocity is low
            if (Math.abs(velocity) < 0.1) {
                velocity = 0;
                smallTargetX = smallCurrentX;
            }
        } else if (diff > 0.01) {
            // Normal easing when moving to target
            isMoving = true;
            smallCurrentX += (smallTargetX - smallCurrentX) * ease;
        }

        // Direct transform for instant feel
        gsap.set(smallList, { x: smallCurrentX });
        updateNumbersFromX();

        // Continue RAF loop if there's movement or velocity
        if (diff > 0.01 || Math.abs(velocity) > 0.1) {
            isMoving = true;
            if (slider2CleanupState.smallRafId) {
                slider2CleanupState.smallRafId = requestAnimationFrame(tick);
            }
        } else {
            // Movement complete - stop RAF
            if (isMoving) {
                isMoving = false;
                velocity = 0;
            }

            // Stop RAF loop when stable
            if (slider2CleanupState.smallRafId) {
                cancelAnimationFrame(slider2CleanupState.smallRafId);
                slider2CleanupState.smallRafId = null;
            }
        }
    }

    // expose helper for syncing from fullscreen → minimized
    function scrollSmallToIndex(index, smoothDuration = null) {
        if (!smallList || !smallWrap) return;
        const items = smallList.querySelectorAll(".slider_item");
        const target = items[index];
        if (!target) return;

        // Calculate target position to center the item in the viewport
        const itemLeft = target.offsetLeft;
        const itemWidth = target.offsetWidth;
        const wrapWidth = smallWrap.clientWidth;

        // Center the item: position item so its center aligns with viewport center
        // Viewport center is at wrapWidth/2
        // Item center is at itemLeft + itemWidth/2
        // We need to scroll so item center aligns with viewport center
        // Scroll amount = itemLeft + itemWidth/2 - wrapWidth/2
        const scrollAmount = itemLeft + (itemWidth / 2) - (wrapWidth / 2);
        const targetX = clamp(-scrollAmount, smallMaxX, 0);

        // If smoothDuration is provided, use GSAP for smooth, slower animation
        if (smoothDuration && smoothDuration > 0) {
            // Create animation object for GSAP
            const animObj = { value: smallCurrentX };

            // Use GSAP for smooth, controlled animation
            gsap.to(animObj, {
                value: targetX,
                duration: smoothDuration,
                ease: "power2.out",
                onUpdate: function () {
                    smallCurrentX = animObj.value;
                    smallTargetX = smallCurrentX; // Keep target in sync
                    gsap.set(smallList, { x: smallCurrentX });
                    updateNumbersFromX();
                },
                onComplete: function () {
                    smallCurrentX = targetX;
                    smallTargetX = targetX;
                    gsap.set(smallList, { x: smallCurrentX });
                    updateNumbersFromX();
                    isMoving = false;
                }
            });
        } else {
            // Normal fast sync (for changeSlide, etc.)
            smallTargetX = targetX;

            // Restart RAF loop for smooth animation to position
            if (!slider2CleanupState.smallRafId) {
                slider2CleanupState.smallRafId = requestAnimationFrame(tick);
            }
            isMoving = true;
            velocity = 0; // Clear velocity for smooth animation
        }
    }

    // init small slider
    if (smallScrollEl && smallWrap && smallList) {
        // Reset positions to prevent drift
        smallCurrentX = 0;
        smallTargetX = 0;
        isMoving = false;
        gsap.set(smallList, { x: 0 });

        requestAnimationFrame(() => requestAnimationFrame(measureSmall));

        // Store measureSmall for cleanup
        slider2CleanupState.measureSmall = measureSmall;
        window.addEventListener("resize", measureSmall);

        // Store smallScrollEl for cleanup
        slider2CleanupState.smallScrollEl = smallScrollEl;

        // ✅ Attach wheel handler to .small-scroll-container (not window) - prevents Lenis interference
        smallScrollEl.addEventListener("wheel", wheelHandler, { passive: false });

        // Don't start RAF loop initially - it will start on first user interaction
        // This prevents continuous smooth scrolling when slider is idle
    }



    // open fullscreen with button when the slider is minified
    $(".slider_item").each(function (index) {
        let $elt = $(this);
        $elt.find(".btn-fullscreen").on("click", function () {
            openPopup(index);
        });
    });

    // Function to reset the title spans
    function resetTitleWords(element) {
        let originalText = element.data('originalText');
        if (originalText) {
            element.html(originalText);
        } else {
            element.data('originalText', element.html());
        }
        element.css('transform', ''); // Reset transform on p tag
        element.find('span').each(function () {
            $(this).css('transform', ''); // Reset transform on each span
        });
    }

    // Function to animate the title words
    function animateTitleWords(element, yPercentStart, yPercentEnd, delay, duration, ease) {
        let titleText = element.text().split(' ');
        element.html(''); // Clear existing text
        titleText.forEach((word, index) => {
            let wordSpan = $('<span>').text(word).css('display', 'inline-block');
            element.append(wordSpan);
            if (index < titleText.length - 1) {
                element.append(' '); // Add space between words
            }
            gsap.fromTo(wordSpan, {
                yPercent: yPercentStart,
            }, {
                yPercent: yPercentEnd,
                duration: duration, // Set the duration parameter
                ease: ease,
                delay: index * delay,
            });
        });
    }

    // Larger slider
    function changeSlide(prevSlide, nextSlide, forwards, titleEase = "Pagtrans") {
        transitioning = true;
        // Keep track of the logical slide index for number display (supports looping)
        currSlide = nextSlide.index();

        // ✅ Keep small slider synced (no timeline now)
        scrollSmallToIndex(nextSlide.index());

        // Set the duration for the slide transition
        let sliderDuration = 1.1; // Adjust this value if needed

        // Determine movement direction
        let moveAmount = forwards ? 100 : -100;

        // Create the slider timeline
        let slider = gsap.timeline({
            onComplete: () => {
                transitioning = false;
            }
        });

        slider
            .set(slides, { display: "none" })
            .set(nextSlide, { display: "block" })
            .set(prevSlide, { display: "block" })
            .call(() => {
                resetTitleWords(prevSlide.find(".main-slider_title"));
                resetTitleWords(nextSlide.find(".main-slider_title"));
            })
            .call(() => animateTitleWords(prevSlide.find(".main-slider_title"), 0, moveAmount * -1, 0.12, 1, titleEase)) // Normal animation
            .call(() => animateTitleWords(nextSlide.find(".main-slider_title"), moveAmount, 0, 0.12, 1, titleEase)) // Normal animation
            .fromTo(
                prevSlide.find(".main-slider_img-wrap"),
                {
                    xPercent: 0
                },
                {
                    xPercent: moveAmount * -1,
                    duration: sliderDuration,
                    ease: "Pagtrans"
                },
                0
            )
            .fromTo(
                prevSlide.find(".main-slider_img"),
                {
                    xPercent: 0
                },
                {
                    xPercent: moveAmount,
                    duration: sliderDuration,
                    ease: "Pagtrans"
                },
                0
            )
            .fromTo(
                nextSlide.find(".main-slider_img-wrap"),
                {
                    xPercent: moveAmount
                },
                {
                    xPercent: 0,
                    duration: sliderDuration,
                    ease: "Pagtrans"
                },
                0
            )
            .fromTo(
                nextSlide.find(".main-slider_img"),
                {
                    xPercent: moveAmount * -1
                },
                {
                    xPercent: 0,
                    duration: sliderDuration,
                    ease: "Pagtrans"
                },
                0
            );
    }

    // Helper: get next slide index with wrap-around (infinite loop)
    function getWrappedIndex(currentIndex, forwards) {
        const total = slides.length;
        if (!total || currentIndex < 0) return 0;
        if (forwards) {
            return (currentIndex + 1) % total;
        } else {
            return (currentIndex - 1 + total) % total;
        }
    }

    // Control large slider in fullscreen
    Observer.create({
        target: window,
        type: "wheel,touch,pointer",
        wheelSpeed: -0.6,
        onChange: (self) => {
            if (!popupOpen || transitioning) return; // Check for popupOpen and transitioning

            let deltaY = self.deltaY;
            let prevSlide = slides.filter(".active");
            let currentIndex = prevSlide.index();
            if (currentIndex < 0) return;

            if (deltaY < 0) { // Scroll up → next slide (wrap at end)
                const nextIndex = getWrappedIndex(currentIndex, true);
                currSlide = nextIndex;
                const nextSlide = slides.eq(nextIndex);
                prevSlide.removeClass("active");
                nextSlide.addClass("active");
                switchNav(navItems.eq(nextIndex));
                changeSlide(prevSlide, nextSlide, true);
            } else if (deltaY > 0) { // Scroll down → previous slide (wrap at start)
                const nextIndex = getWrappedIndex(currentIndex, false);
                currSlide = nextIndex;
                const nextSlide = slides.eq(nextIndex);
                prevSlide.removeClass("active");
                nextSlide.addClass("active");
                switchNav(navItems.eq(nextIndex));
                changeSlide(prevSlide, nextSlide, false);
            }
        }
    });

    // page load
    let slides = $(".main-slider_item");
    let navItems = $(".nav_item");
    slides.first().addClass("active");
    switchNav(navItems.first());

    // on click of next slide button
    $(".btn-nextslide").on("click", function () {
        if (transitioning === false) {
            let prevSlide = slides.filter(".active");
            let currentIndex = prevSlide.index();
            if (currentIndex < 0) return;

            const nextIndex = getWrappedIndex(currentIndex, true);
            currSlide = nextIndex;
            const nextSlide = slides.eq(nextIndex);
            prevSlide.removeClass("active");
            nextSlide.addClass("active");
            switchNav(navItems.eq(nextIndex));
            changeSlide(prevSlide, nextSlide, true, "power2.inOut");
        }
    });

    // on click of prev slide button
    $(".btn-prevslide").on("click", function () {
        if (transitioning === false) {
            let prevSlide = slides.filter(".active");
            let currentIndex = prevSlide.index();
            if (currentIndex < 0) return;

            const nextIndex = getWrappedIndex(currentIndex, false);
            currSlide = nextIndex;
            const nextSlide = slides.eq(nextIndex);
            prevSlide.removeClass("active");
            nextSlide.addClass("active");
            switchNav(navItems.eq(nextIndex));
            changeSlide(prevSlide, nextSlide, false, "power2.inOut");
        }
    });

    $(".minimizetool").on("click", function () {
        if (transitioning === false) {
            closePopup();

            // Move .slider-toggle-nav down 180px and hide the bottom border just before the animation ends
            gsap.to(".slider-toggle-nav", {
                bottom: '2.8rem',
                duration: 1.2,
                ease: "power3.inOut",
                onStart: function () {
                    setTimeout(function () {
                        $(".slider-footer").addClass("transparent-border");
                    }, 880); // 1.18 seconds
                }
            });

            // Change the buttons after the slider is minimized
            setTimeout(function () {
                $('.minimizetool').css('display', 'none');
                $('.btn-fullscreen-global').css('display', 'block');
            }, 1500); // 1.5 second delay to match the slider animation

            // Trigger the animation directly
            // playMinimizeAnimation();
        }
    });

    $(".btn-fullscreen-global").on("click", function () {
        if (transitioning === false) {
            openPopupGlobal();

            // Move .slider-toggle-nav back up to its original position and show the bottom border 0.5 seconds after click
            gsap.to(".slider-toggle-nav", {
                bottom: '16.2rem',
                duration: 1.2,
                ease: "power3.inOut",
                delay: 0.8
            });
            setTimeout(function () {
                $(".slider-footer").removeClass("transparent-border");
            }, 200); // 0.2 seconds

            // Change the buttons after the slider is maximized
            setTimeout(function () {
                $('.btn-fullscreen-global').css('display', 'none');
                $('.minimizetool').css('display', 'block');
            }, 1500); // 1.5 second delay to match the slider animation

            // Trigger the animation directly
            playFullscreenAnimation();
        }
    });

    // on click of main slider nav
    navItems.on("click", function () {
        if (transitioning === false) {
            switchNav($(this));
            let prevSlide = slides.filter(".active");
            let nextSlide = slides.eq($(this).index());
            currSlide = nextSlide.index();
            prevSlide.removeClass("active");
            nextSlide.addClass("active");
            if (prevSlide.index() < nextSlide.index()) {
                changeSlide(prevSlide, nextSlide, true, "power3.Out");
            } else {
                changeSlide(prevSlide, nextSlide, false, "power3.Out");
            }
        }
    });

    // switch currently active nav item
    function switchNav(currentItem) {
        navItems.removeClass("current");
        currentItem.addClass("current");
    }

    function closePopup() {
        if (transitioning) return;
        transitioning = true;

        let activeSlide = slides.filter(".active");
        $(".slider_item").removeClass("current");
        let smallSlide = $(".slider_item").eq(activeSlide.index()).addClass("current");
        let fromElement = activeSlide.find(".main-slider_img-wrap");
        let toElement = smallSlide.find(".slider_link");

        gsap.defaults({ duration: 0.4, ease: "Pagtrans" });

        gsap.set(".slider_item.current", {
            clipPath: 'inset(0% 0% 0% 0%)',
            scale: 1
        });

        let tl2 = gsap.timeline({
            onComplete: () => {
                gsap.set(fromElement, {
                    width: "100%",
                    height: "100%",
                    x: 0,
                    y: 0
                });
                $(".slider_wrap").addClass("show");
                gsap.fromTo(
                    ".slider_item:not(.current)",
                    { clipPath: 'inset(100% 0% 0% 0%)', },
                    {
                        duration: 1,
                        clipPath: 'inset(0% 0% 0% 0%)',
                        ease: 'pagetrans',
                    }
                );

                gsap.fromTo(
                    ".small-slider-text-container",
                    { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', },
                    {
                        duration: 2,
                        delay: 0,
                        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                        ease: 'pagetrans',
                    }
                );

                $(".main-slider, .nav_wrap").css("display", "none");
                popupOpen = false;
                transitioning = false;
            }
        });
        tl2
            .fromTo(
                activeSlide.find(".main-slider_title"),
                { yPercent: 0 },
                {
                    yPercent: -100,
                    duration: 0.8,
                    ease: "Pagtrans"// Slower animation for closing popup
                }
            )
            .to(
                ".main-slider .hero_arrow, .main-slider .minimizetool",
                {
                    scale: 0
                },
                0
            )
            .to(
                ".nav_item",
                {
                    y: "1.5em",
                    opacity: 0,
                    duration: 0.3,
                    stagger: { each: 0.05, from: activeSlide.index() }
                },
                0
            )
            .to(
                fromElement,
                {
                    x: toElement.offset().left - fromElement.offset().left,
                    y: toElement.offset().top - fromElement.offset().top,
                    width: toElement.innerWidth(),
                    height: toElement.innerHeight(),
                    duration: 0.8,
                    onComplete: () => {
                        fromElement.css("opacity", 0); // Hide the element to prevent overlap
                    }
                },
                0
            )
            .to(".slider-border", { opacity: 0, duration: 0.8, ease: "slowoutfade" }, 0) // Animate slider border to 0 opacity
            .to(".slider-footer-border", { opacity: 0, duration: 0.8, ease: "slowoutfade" }, 0) // Animate slider footer border to 0 opacity
            .set(activeSlide, { display: "none" }) // Hide the active slide at the end of the transition
            .set(fromElement, { opacity: 1 }) // Reset opacity to 1 after transition
            .to(".numbers_list", { opacity: 1, duration: 0.4 }, 0) // Faster hide the number list
            .to(".numbers_wrap", {
                clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
                duration: 0.8
            }, 0); // Animate clip-path to small slider
    }

    function openPopup(index) {
        if (transitioning) return;
        transitioning = true;

        slides.removeClass("active");
        slides.css("display", "none");

        let activeSlide = slides.eq(index);
        activeSlide.addClass("active");
        activeSlide.css("display", "block");

        currSlide = index;

        // ✅ FIRST: Animate small list position to target item BEFORE scaling up
        // This prevents lag in the scale animation
        // Use slower, smoother animation (0.8s duration) for better feel
        scrollSmallToIndex(index, 0.7);

        // Wait for small list to reach position before starting scale animation
        // Delay matches animation duration + small buffer
        const positionSyncDelay = 850; // Wait for 0.8s animation + 50ms buffer

        setTimeout(() => {
            // Now proceed with the scale-up animation
            performOpenPopupAnimation(activeSlide, index);
        }, positionSyncDelay);
    }

    function performOpenPopupAnimation(activeSlide, index) {

        $(".slider_item").removeClass("current");
        let smallSlide = $(".slider_item").eq(index);
        let fromElement = activeSlide.find(".main-slider_img-wrap");
        let toElement = smallSlide.find(".slider_link");

        fromElement.css("transform", "");
        activeSlide.find(".main-slider_img").css("transform", "");

        // Reset the title words before animating
        resetTitleWords(activeSlide.find(".main-slider_title"));

        gsap.defaults({ duration: 1, ease: "Pagtrans" });

        $(".main-slider, .nav_wrap").css("display", "");

        let tl2 = gsap.timeline({
            onStart: () => {

                gsap.fromTo(
                    ".small-slider-text-container",
                    { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', },
                    {
                        duration: 2,

                        clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
                        ease: 'texttshow',
                    }
                );


                gsap.to(".slider_item", {
                    duration: 1.5,
                    clipPath: 'inset(100% 0% 0% 0%)',
                    ease: 'texttshow',
                    onComplete: () => {
                        $(".slider_wrap").removeClass("show");
                    }
                });
            },
            onComplete: () => {
                popupOpen = true;
                transitioning = false;
            }
        });

        tl2
            .set(smallSlide, { opacity: 0 }) // Hide the small slide at the start of the animation
            .fromTo(
                activeSlide.find(".main-slider_title"),
                { yPercent: -100 },
                {
                    yPercent: 0,
                    delay: 0.4, // Add delay before animating the title
                    duration: 1.2, // Slower animation for opening popup
                    ease: "Pagtrans" // Set ease for opening popup
                }
            )
            .to(
                ".main-slider .hero_arrow, .main-slider .minimizetool",
                {
                    scale: 1,
                    delay: 0.8 // Add delay before animating these elements
                },
                0
            )
            .to(
                ".nav_item",
                {
                    y: "1.5em",
                    opacity: 1,
                    delay: 0.8, // Add delay before animating nav items
                    duration: 0.3,
                    stagger: { each: 0.05, from: activeSlide.index() }
                },
                0
            )
            .fromTo(
                fromElement,
                {
                    x: toElement.offset().left - fromElement.offset().left,
                    y: toElement.offset().top - fromElement.offset().top,
                    width: toElement.innerWidth(),
                    height: toElement.innerHeight(),
                    xPercent: 0
                },
                {
                    width: "100%",
                    height: "100%",
                    x: 0,
                    y: 0,
                    xPercent: 0,
                    duration: 0.8,
                    onStart: () => {
                        fromElement.css("opacity", 1); // Show the element at the start of the animation
                    },
                    onComplete: () => {
                        smallSlide.css("opacity", 0); // Hide small slide during the transition
                        fromElement.css("opacity", 1); // Ensure the main-slider_img-wrap is visible
                    }
                },
                0
            )
            .to(smallSlide, { opacity: 1, duration: 0 }) // Show the small slide at the end of the animation
            .to(".slider-border", { opacity: 1, duration: 0.8, ease: "slowoutfade" }, 0) // Animate slider border to 100% opacity
            .to(".slider-footer-border", { opacity: 1, duration: 0.8, ease: "slowoutfade" }, 0) // Animate slider footer border to 100% opacity
            .to(".numbers_list", { opacity: 1, duration: 0.4, delay: 0.8 }, 0.5) // Faster show the number list
            .to(".numbers_wrap", {
                clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
                duration: 0.8
            }, 0.8); // Animate clip-path to big slider
    }

    function openPopupGlobal() {
        openPopup(currSlide);
    }

    $(".btn-fullscreen-global").on("click", function () {
        openPopupGlobal();
    });

    $(document).ready(function () {
        const n = $(".numbers_item").length;
        $(".totalprojects").text(n);
    });

    // ============================================================
    // ✅ GLOBAL DESTROY for Barba (prevents multiple RAF loops)
    // ============================================================
    window.__frontpageSlider2Destroy = function () {
        try {
            // Cancel RAF loop
            if (slider2CleanupState.smallRafId) {
                cancelAnimationFrame(slider2CleanupState.smallRafId);
                slider2CleanupState.smallRafId = null;
            }

            // Clear snap timer
            if (slider2CleanupState.smallSnapTimer) {
                clearTimeout(slider2CleanupState.smallSnapTimer);
                slider2CleanupState.smallSnapTimer = null;
            }

            // Remove wheel listener
            if (slider2CleanupState.smallScrollEl && slider2CleanupState.wheelHandler) {
                slider2CleanupState.smallScrollEl.removeEventListener("wheel", slider2CleanupState.wheelHandler);
                slider2CleanupState.smallScrollEl = null;
            }

            // Remove resize listener
            if (slider2CleanupState.measureSmall) {
                window.removeEventListener("resize", slider2CleanupState.measureSmall);
                slider2CleanupState.measureSmall = null;
            }
        } catch (e) {
            console.warn('FrontpageSlider2 destroy error:', e);
        }
    };
}

// Function to update current class on page links
function updateCurrentClass() {
    $(".page_link").removeClass("w--current");
    $(".page_link").each(function (index) {
        if ($(this).attr("href") === window.location.pathname) {
            $(this).addClass("w--current");
        }
    });
}

// Function to update page (scroll to top, hide overlay)
function updatePage() {
    $(window).scrollTop(0);
}


//end of slider


CustomEase.create("Pagtrans", ".645,.045,.355,1");
CustomEase.create("texttshow", "0.35,0.15,0.35,1");
CustomEase.create("linedraw", ".65,.05,.36,1");
CustomEase.create("hoverout", ".23, 1, .32, 1");
CustomEase.create("hoverin", ".65,.05,.36,1");
CustomEase.create("slowoutfade", "1,0,1,.93");
CustomEase.create("fastinfade", "0,.89,.63,1");




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


var swiperInstance; // Store swiper instance globally

function getVW(value) {
    return window.innerWidth * (value / 100);
}

function initSwiper() {
    swiperInstance = new Swiper('.toolbox-swiper-container', {
        slidesPerView: 'auto',
        spaceBetween: 0,
        grabCursor: true,
        freeMode: true,
        freeModeMomentum: true,
        freeModeMomentumRatio: 0.2,
        freeModeMomentumBounce: false,
        freeModeSticky: false,
        resistanceRatio: 0.2,
        touchRatio: 0.5,
        speed: 1500,
        slidesOffsetBefore: getVW(10),
        slidesOffsetAfter: getVW(10),
    });
}

function destroySwiper() {
    if (swiperInstance && swiperInstance.destroy) {
        swiperInstance.destroy(true, true);  // Destroy Swiper, remove styles
        swiperInstance = null;               // Reset the instance
    }
}

function updateSwiperOnResize() {
    // Destroy and reinitialize the swiper on window resize
    destroySwiper();
    initSwiper();
}

// Handle window resize separately
function setupResizeListener() {
    window.addEventListener('resize', function () {
        updateSwiperOnResize();
    });
}




// Centralized place to define animations
const animationDefinitions = {
    '.footer-case-item': {
        duration: 1.4,
        clipPath: 'inset(0% 0% 0% 0%)',
        ease: 'texttshow',
        delay: 0
    },
    '.breaker-border': {
        width: '100vw',
        duration: 1.25,
        ease: 'linedraw',
        delay: 0
    },
    '.headline-word': {
        duration: 1.4,
        y: '0%',
        ease: 'Pagtrans',
        stagger: 0.15,  // Stagger each word animation by 0.2 seconds
        delay: 0
    },
    '.full-case-number': {
        duration: 1.2,
        y: '0%',
        ease: 'texttshow',
        delay: 0.4
    },
    '.plus-btn-container': {
        duration: 0.5,
        rotation: 0,  // Rotate to 0 degrees
        ease: 'texttshow',
        delay: 0.4
    },
    '.btn-tran': {
        duration: 0.5,
        y: '0%',
        ease: 'texttshow',
        delay: 0.4
    },
    '.case-index-content': {
        duration: 1,
        clipPath: 'inset(0% 0% 0% 0%)',
        ease: 'texttshow',
        delay: (index) => 0.10 + index * 0.025
    },
    '.case-index-text': {
        duration: 0.8,
        y: '0%',
        ease: 'texttshow',
        delay: 0.5
    },
    '.footer-text': {
        duration: 0.8,
        y: '0%',
        ease: 'texttshow',
        delay: 0.5
    },
    '.footer-link-text': {
        duration: 0.8,
        y: '0%',
        ease: 'texttshow',
        delay: 0.5
    }
};

// Function to apply animations only to elements whose parents are in view
function animateElementsInView(parent) {
    Object.keys(animationDefinitions).forEach(selector => {
        const elements = parent.querySelectorAll(selector); // Only select elements inside the parent

        if (elements.length) {
            const animationConfig = animationDefinitions[selector];

            // Apply stagger for headline-word elements
            if (selector === '.headline-word') {
                gsap.to(elements, {
                    ...animationConfig,
                    stagger: 0.15,  // Apply staggered animation to the entire group of words
                });
            } else {
                // Apply individual animations for other elements
                elements.forEach((element, index) => {
                    gsap.to(element, {
                        ...animationConfig,
                        delay: typeof animationConfig.delay === 'function' ? animationConfig.delay(index) : animationConfig.delay
                    });
                });
            }
        }
    });
}


function initCaseAnimation() {
    const caseWrapper = document.querySelector('.case-full-info-wrapper');
    const caseSection = document.querySelector('.case-full-info-section');
    const caseBtn = document.querySelector('.rm-case-btn');

    if (!caseWrapper || !caseSection) return; // Exit if elements don't exist

    // Open animation
    function openCase() {
        setTimeout(() => {
            setTimeout(() => {
                animateFullCaseHeaderLines();
                animateFullCaseTextAllAtOnce();
            }, 500);

            // Set display block first to make it visible
            gsap.set(caseWrapper, { display: 'block' });

            // Animate background from transparent to black overlay
            gsap.to(caseWrapper, {
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                duration: 0.5,
                ease: 'hoverin',
            });

            gsap.to('.case-img-tran', {
                duration: 1.4,
                clipPath: 'inset(0% 0% 0% 0%)',
                ease: 'texttshow',
                delay: 0.2,
            });

            gsap.to('.br-first-tran', {
                width: '100%',
                duration: 1,
                ease: 'linedraw',
                delay: 0.2,
            });

            gsap.to('.case-number-tran', {
                y: '0%',
                duration: 0.8,
                ease: 'texttshow',
                delay: 0.8,
            });

            gsap.to('.small-case-discriptor-text', {
                y: '0%',
                duration: 0.8,
                ease: 'texttshow',
                delay: 0.8,
            });

            // Animate the content section sliding in from the right
            gsap.fromTo(caseSection, { x: '100%' }, { x: '0%', duration: 1, ease: 'hoverin' });

            // Stop the main page Lenis scroll
            if (window.lenis && typeof window.lenis.stop === 'function') {
                window.lenis.stop();
            }

            // Initialize and start Lenis for the modal
            initializeLenisModal();
            lenisModal.start();
        }, 200); // Delay to ensure DOM is fully ready
    }

    // Close animation
    function closeCase() {
        gsap.to(caseSection, {
            x: '100%',
            duration: 1,
            ease: 'hoverin',
        });

        gsap.to(caseWrapper, {
            backgroundColor: 'rgba(0, 0, 0, 0.0)',
            duration: 0.5,
            ease: 'hoverin',
            delay: 0.5,
            onComplete: () => {
                gsap.set(caseWrapper, { display: 'none' });
                lenisModal.stop(); // Stop Lenis for modal
                if (window.lenis && typeof window.lenis.start === 'function') {
                    window.lenis.start(); // Restart Lenis for the main page
                }
            },
        });

        caseWrapper.style.overflowY = 'hidden';
    }

    // Remove any existing event listeners before attaching new ones
    if (caseBtn) {
        caseBtn.removeEventListener('click', openCase); // Remove existing listeners
        caseWrapper.removeEventListener('click', closeCase); // Remove existing listeners

        // Attach event listeners to the buttons
        caseBtn.addEventListener('click', openCase);
        caseWrapper.addEventListener('click', closeCase);
    }
}


function replaceCaseFullInfoWrapper() {
    // Check for an existing .case-full-info-wrapper outside of .page-wrapper
    const existingWrapperOutside = document.querySelector('body > .case-full-info-wrapper');

    // Remove the existing one if it exists
    if (existingWrapperOutside) {
        existingWrapperOutside.remove();
    }

    // Find the new .case-full-info-wrapper inside .page-wrapper
    const newWrapperInsidePage = document.querySelector('.page-wrapper .case-full-info-wrapper');

    if (newWrapperInsidePage) {
        // Move the new one outside the .page-wrapper to just after the <body> tag
        document.body.insertBefore(newWrapperInsidePage, document.body.firstChild);
    }
}


// removes transition effect from case hero module

function removeTransition(elementClass, classToRemove) {
    const elements = document.getElementsByClassName(elementClass);

    for (let element of elements) {
        // Remove the class after 1.5 seconds
        setTimeout(() => {
            element.classList.remove(classToRemove);
        }, 1500);
    }
}

function splitTextIntoWords(selector, tag, wordClass) {
    const elements = document.querySelectorAll(selector);

    // First observer: Handles splitting the text into word-breaks
    const splitObserverOptions = {
        root: null,
        rootMargin: '500px 0px',
        threshold: 0,
    };

    const splitObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('text-split')) {
                elements.forEach(element => {
                    if (element.classList.contains('text-split')) return;

                    const text = element.innerHTML.replace(/&nbsp;/g, ' ');
                    const words = text.split(' ');

                    element.innerHTML = '';

                    // Create the word-break spans and add span-text-tran inside each word-break span
                    words.forEach(word => {
                        const wordTag = document.createElement(tag);
                        wordTag.classList.add(wordClass); // Add the word-break class
                        wordTag.style.display = 'inline-block'; // Inline-block for word wrapping
                        wordTag.style.overflow = 'hidden'; // Ensure words stay hidden during animation

                        // Create the inner span with .span-text-tran class
                        const innerSpan = document.createElement('span');
                        innerSpan.classList.add('span-text-tran');
                        innerSpan.style.display = 'inline-block';
                        innerSpan.style.transform = 'translateY(100%)'; // Initially off-screen
                        innerSpan.innerHTML = word;

                        // Append the inner span to the word-break span
                        wordTag.appendChild(innerSpan);
                        element.appendChild(wordTag);
                        element.appendChild(document.createTextNode(' ')); // Add space between words
                    });

                    element.classList.add('text-split');

                    // Skip animation for specific elements
                    if (element.closest('.full-case-header') || element.closest('.full-case-text')) {
                        return;
                    }

                    // Ensure the browser renders before starting animations
                    requestAnimationFrame(() => {
                        observeForAnimation(element);
                    });
                });

                observer.unobserve(entry.target);
            }
        });
    }, splitObserverOptions);

    elements.forEach(element => {
        splitObserver.observe(element);
    });
}

// Observer to handle triggering animations
function observeForAnimation(element) {
    const animationObserverOptions = {
        root: null,
        rootMargin: '0px 0px -5% 0px',
        threshold: 0.10,
    };

    const animationObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateWordBreak(entry.target); // Animate .span-text-tran inside word-break
                observer.unobserve(entry.target);
            }
        });
    }, animationObserverOptions);

    animationObserver.observe(element);
}

// Function to animate word-break spans
function animateWordBreak(element) {
    const wordBreaks = element.querySelectorAll('.word-break'); // Target word-break spans
    let currentLineTop = null;
    let lineGroup = [];
    const lineOffsets = new Set();

    // Group words by lines based on vertical position
    wordBreaks.forEach(wordBreak => {
        const wordTop = wordBreak.offsetTop;
        lineOffsets.add(wordTop);

        if (currentLineTop === null || wordTop === currentLineTop) {
            lineGroup.push(wordBreak);
            currentLineTop = wordTop;
        } else {
            animateLine(lineGroup);
            lineGroup = [wordBreak];
            currentLineTop = wordTop;
        }
    });

    if (lineGroup.length > 0) {
        animateLine(lineGroup);
    }
}

// Function to animate a line group
function animateLine(lineGroup) {
    const baseDelay = 0.08;

    lineGroup.forEach((wordBreak, wordIndex) => {
        const spanTextTran = wordBreak.querySelector('.span-text-tran');
        const delay = baseDelay + wordIndex * 0.015;

        // Temporarily adjust padding to prevent clipping
        wordBreak.style.paddingBottom = '5px'; // Add padding during animation

        gsap.to(spanTextTran, {
            duration: 0.75,
            y: '0%',
            ease: 'texttshow',
            delay: delay,
            onComplete: () => {
                // Remove animation properties and ensure layout stability

                wordBreak.style.paddingBottom = '5px'; // Reset padding after animation
            }
        });
    });
}

// Function to manually animate .span-text-tran for .full-case-header
function animateFullCaseHeaderLines() {
    const elements = document.querySelectorAll('.full-case-header .span-text-tran');
    elements.forEach((span, index) => {
        gsap.to(span, {
            duration: 0.75,
            y: '0%',
            ease: 'texttshow',
            delay: index * 0.02,
        });
    });
}

// Function to animate all .span-text-tran for .full-case-text
function animateFullCaseTextAllAtOnce() {
    const elements = document.querySelectorAll('.full-case-text .span-text-tran');
    gsap.to(elements, {
        duration: 0.75,
        y: '0%',
        ease: 'texttshow',
        stagger: 0,
        delay: 0.3,
    });
}




// Function to animate background position on scroll for any class or element
function animateBackgroundOnScroll(selector) {
    const bgElements = document.querySelectorAll(selector);

    if (bgElements.length > 0) {
        bgElements.forEach((element) => {
            // Create a GSAP timeline for each background element
            gsap.timeline({
                scrollTrigger: {
                    trigger: element,
                    start: 'top bottom', // When the top of the element hits the bottom of the viewport
                    end: 'bottom top',   // When the bottom of the element hits the top of the viewport
                    scrub: true,         // Smooth scrolling effect
                    onUpdate: (self) => {
                        // Calculate scroll progress and adjust background position
                        const scrollProgress = self.progress;
                        const yPos = scrollProgress * 100; // Adjust the background position
                        element.style.backgroundPosition = `center ${yPos}%`; // Simulates fixed
                    }
                }
            });
        });
    }
}

// Function to animate transform (move up) on scroll for any element
function animateTransformOnScroll(selector, movement = 200) {
    const elements = document.querySelectorAll(selector);

    if (elements.length > 0) {
        elements.forEach((element) => {
            // Create a GSAP timeline for each element
            gsap.timeline({
                scrollTrigger: {
                    trigger: element,
                    start: 'top bottom', // When the top of the element hits the bottom of the viewport
                    end: 'bottom top',   // When the bottom of the element hits the top of the viewport
                    scrub: true,         // Smooth scrolling effect
                    onUpdate: (self) => {
                        // Calculate scroll progress and apply negative transform based on progress
                        const scrollProgress = self.progress;
                        const translateY = -scrollProgress * movement; // Move up as the user scrolls down
                        element.style.transform = `translateY(${translateY}px)`; // Apply vertical movement
                    }
                }
            });
        });
    }
}


// split headline

function splitAllHeaderHeadlines() {
    const headers = document.querySelectorAll('.header-headline');
    headers.forEach(header => {
        const text = header.innerHTML.trim();
        const words = text.split(' ').map(word => `<span class="headline-word">${word}</span>`).join(' ');
        header.innerHTML = words;  // Replace the original text with the wrapped words
    });
}
// Barba.js page transitions
function BarbaPageTransitions() {
    const baseDelay = 0.5;  // Base delay of 0.5 seconds for specific elements
    const parentClasses = ['.case-container', '.text-header', '.footer', '.footer-info-wrapper', '.footer-text-container'];  // Only include necessary parent classes

    // Function to check if a parent element is in view (partially in view with a 100px buffer)
    function isInView(element) {
        const rect = element.getBoundingClientRect();
        const buffer = 100;  // Allow elements within 100px of the viewport to animate
        const inView = (rect.top < window.innerHeight + buffer && rect.bottom > -buffer); // 100px buffer added
        return inView;
    }

    // Function to animate elements only if their parent is in view
    function animateIfInView() {
        parentClasses.forEach(parentClass => {
            const containers = document.querySelectorAll(parentClass);

            containers.forEach((container, containerIndex) => {
                if (isInView(container) && !container.classList.contains('animated')) {
                    container.classList.add('animated');  // Mark as animated to prevent repeat animations

                    // Animate case-index-content elements with base delay
                    const contents = container.querySelectorAll('.case-index-content');
                    if (contents.length) {
                        contents.forEach((content, index) => {
                            gsap.to(content, {
                                duration: 1,
                                clipPath: 'inset(0% 0% 0% 0%)',
                                ease: 'texttshow',  // Match easing to scroll function
                                delay: baseDelay + (0.10 + index * 0.025)  // Correct delay calculation
                            });
                        });
                    }

                    // Animate case-index-text elements with base delay
                    const texts = container.querySelectorAll('.case-index-text');
                    if (texts.length) {
                        texts.forEach((text, index) => {
                            gsap.to(text, {
                                duration: 0.8,
                                y: '0%',
                                ease: 'texttshow',  // Match easing to scroll function
                                delay: 0.5 + baseDelay   // Correct delay calculation
                            });
                        });
                    }

                    // Animate headline-word elements without base delay
                    const words = container.querySelectorAll('.headline-word');
                    gsap.to(words, {
                        duration: 1.2,
                        y: '0%',
                        ease: 'texttshow',  // Same easing
                        stagger: 0.15,  // Same stagger
                        delay: 0 + containerIndex * 0.2  // No baseDelay
                    });


                    // Animate header headline number without base delay
                    gsap.to(container.querySelectorAll('.footer-text'), {
                        duration: 0.8,
                        y: '0%',
                        ease: 'texttshow'
                    });


                    // Animate full case number without base delay
                    gsap.to(container.querySelectorAll('.full-case-number'), {
                        duration: 0.65,
                        y: '0%',
                        ease: 'texttshow',
                        delay: 0.5 + containerIndex * 0.2  // No baseDelay
                    });

                    gsap.to('.about-lottie-symbol-loop', {
                        duration: 1.2,
                        y: '0%',
                        ease: 'texttshow',
                        delay: 0.45
                    });

                    gsap.registerPlugin(ScrollTrigger);

                    // Animate opacity when scrolling around 280vh
                    gsap.to(".about-hero-image", {
                        scrollTrigger: {
                            trigger: ".about-hero-image", // Trigger the animation based on the document scroll
                            start: () => `${window.innerHeight * 0.2}px`, // Dynamically calculate 280vh
                            end: () => `${window.innerHeight * 1.2}px`, // Dynamically calculate 300vh
                            scrub: true,
                            markers: false,
                            ease: "Pagtrans",// Optional: Add markers for debugging
                        },
                        opacity: 0,
                    });


                    // Animate header headline number without base delay
                    gsap.to(container.querySelectorAll('.header-headline-number'), {
                        duration: 1.2,
                        y: '0%',
                        ease: 'Pagtrans',
                        delay: 0 + containerIndex * 0.2  // No baseDelay
                    });

                    // Animate breaker border without base delay
                    gsap.to(container.querySelectorAll('.breaker-border'), {
                        width: '100vw',
                        duration: 1,
                        ease: 'linedraw',
                        delay: 0.2 + containerIndex * 0.2  // No baseDelay
                    });
                }
            });
        });
    }

    // Function to play videos when they are in view
    function playVideosInView() {
        const videos = document.querySelectorAll('.video-lazy-load');
        videos.forEach(videoElement => {
            if (isInView(videoElement) && !videoElement.classList.contains('video-playing')) {
                const video = videoElement.querySelector('video');
                if (video) {
                    // Check if video has sources loaded before trying to play
                    const hasSource = video.src ||
                        (video.querySelector('source') && video.querySelector('source').src) ||
                        videoElement.dataset.loaded === 'true';

                    if (hasSource) {
                        // Ensure mobile autoplay requirements
                        video.muted = true;
                        video.playsInline = true;

                        const playPromise = video.play();
                        if (playPromise && typeof playPromise.then === 'function') {
                            playPromise
                                .then(() => {
                                    videoElement.classList.add('video-playing');
                                })
                                .catch(() => {
                                    // Autoplay blocked - this is normal on some devices
                                });
                        } else {
                            videoElement.classList.add('video-playing');
                        }
                    }
                    // If no source, the lazy loader will handle it when it loads
                }
            }
        });
    }

    // Call the animation function after Barba.js transition
    animateIfInView();

    // Call the function to play videos in view after transition
    playVideosInView();
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


function BarbaSliderAnimation() {
    gsap.to('.main-slider_img-wrap', {
        top: '0vh',
        duration: 0.1,
        ease: 'Pagtrans',
        delay: 0
    });

    gsap.to('.slider-nav-border', {
        duration: 1.5,
        width: '100%',
        ease: 'linedraw',
        delay: 0
    });

    gsap.to('.slider-footer-border', {
        duration: 1.5,
        width: '100vw',
        ease: 'linedraw',
        delay: 0.1
    });

    gsap.to('.circle-minimize-btn', {
        duration: 1,
        clipPath: 'inset(0% 0% 0% 0%)',
        ease: 'texttshow',
        delay: 0.55
    });
    gsap.to('.first-menu-link', {
        duration: 1,
        y: '0%',
        ease: 'texttshow',
        delay: 0.55
    });



    gsap.to('.first-menu-link-social', {
        duration: 1,
        y: '0%',
        ease: 'texttshow',
        delay: 0.5
    });

    gsap.to('.slider-footer-text', {
        duration: 1,
        y: '0%',
        ease: 'texttshow',
        delay: 0.5
    });



    gsap.to('.numbers_wrap', {
        duration: 1,
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
        ease: 'texttshow',
        delay: 0
    });

    gsap.to('.main-slider_title', {
        duration: 1.8,
        bottom: '0',
        ease: 'texttshow',
        delay: 0
    });
}


function pageLoadStartAnimation() {
    gsap.to('.main-slider_img-wrap', {
        top: '0vh',
        duration: 1.35,
        ease: 'Pagtrans',
        delay: 4.3
    });

    gsap.to('.slider-nav-border', {
        duration: 1.5,
        width: '100%',
        ease: 'linedraw',
        delay: 4.4
    });

    gsap.to('.slider-footer-border', {
        duration: 1.5,
        width: '100vw',
        ease: 'linedraw',
        delay: 4.8
    });

    gsap.to('.circle-minimize-btn', {
        duration: 1,
        clipPath: 'inset(0% 0% 0% 0%)',
        ease: 'texttshow',
        delay: 5.4
    });

    gsap.to('.first-menu-link', {
        duration: 1,
        y: '0%',
        ease: 'texttshow',
        delay: 5.4
    });

    gsap.to('.first-menu-link-social', {
        duration: 1,
        y: '0%',
        ease: 'texttshow',
        delay: 5.4
    });

    gsap.to('.slider-footer-text', {
        duration: 1,
        y: '0%',
        ease: 'texttshow',
        delay: 5.4
    });

    gsap.to('.nav-clock-dot', {
        duration: 1,
        y: '0%',
        ease: 'texttshow',
        delay: 5.4
    });

    gsap.to('.nav-clock', {
        duration: 1,
        y: '0%',
        ease: 'texttshow',
        delay: 5.4
    });

    gsap.to('.nav-clock-infomation', {
        duration: 1,
        y: '0%',
        ease: 'texttshow',
        delay: 5.4
    });

    gsap.to('.numbers_wrap', {
        duration: 1,
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
        ease: 'texttshow',
        delay: 5.4
    });

    gsap.to('.main-slider_title', {
        duration: 1.8,
        bottom: '0',
        ease: 'texttshow',
        delay: 4.8
    });
}


// Animation for page loader

function pageLoader() {


    // Animate header in
    gsap.to('.loader-header', {
        duration: 1.35,
        y: '0%',
        ease: 'texttshow',
        delay: 0.5
    });
    gsap.to('.loader-header-2', {
        duration: 1.35,
        y: '0%',
        ease: 'texttshow',
        delay: 0.6
    });

    gsap.to('.loader-header', {
        duration: 1.50,
        y: '-100%',
        ease: 'texttshow',
        delay: 3.6
    });
    gsap.to('.loader-header-2', {
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

// Lottie functions moved to Lottie-animation.js



//Function init calls


function sharedInit() {
    initLenisScrollToTop();

    initializeLenis();
    initLinkAnimations();
    autoplayMainSliderVideos();

    if (document.querySelector('.swiper-wrapper')) {
        setupResizeListener();
    }


    if (document.querySelector('.toolbox-swiper-container')) {

        setTimeout(() => {
            destroySwiper();
        }, 100);

        setTimeout(() => {
            initSwiper();
        }, 300);

    }

    if (document.querySelector('.rm-case-btn')) {
        setTimeout(() => {
            initCaseAnimation();
        }, 300);
    }

    if (document.querySelector('.main-slider')) {
        initializeSlider();
        animateSliderNavText()
    }



    if (document.querySelector('.video-lazy-load')) {
        initializeVideoLazyLoad();
    }

    if (document.querySelector('.case-full-info-wrapper')) {
        replaceCaseFullInfoWrapper();
    }

    if (document.querySelector('.case-img-hero-container')) {
        removeTransition('case-img-hero-container', 'with-transition');
    }

    if (document.querySelector('.case-bg-img')) {
        animateBackgroundOnScroll('.case-bg-img');
    }



    if (document.querySelector('.case-high-header')) {
        splitTextIntoWords('.case-high-header', 'span', 'word-break');
    }

    if (document.querySelector('.case-high-text')) {
        splitTextIntoWords('.case-high-text', 'span', 'word-break');
    }

    if (document.querySelector('.case-split-discriptor')) {
        splitTextIntoWords('.case-split-discriptor', 'span', 'word-break');
    }

    if (document.querySelector('.case-big-discription-text')) {
        splitTextIntoWords('.case-big-discription-text', 'span', 'word-break');
    }


    if (document.querySelector('.case-text-split-tran')) {
        splitTextIntoWords('.case-text-split-tran', 'span', 'word-break');
    }


}

// Functions specific to Barba.js transitions
function initForBarba() {

    sharedInit(); // Call the shared functions


}

// Functions specific to document load
function initForLoad() {
    if (document.querySelector('.case-theme')) {
        updateTheme(document);
    }
    initializeCustomCursor();
    initializeCaseReadMoreCursorToggle();
    initializeSpecialCursorFrontpage();

    if (document.querySelector('.header-headline')) {
        splitAllHeaderHeadlines();
    }
    pageLoadStartAnimation();

    if (document.querySelector('.frontpage-loader')) {
        pageLoader();
    }

    initializePageLoadLottieAnimations();
    sharedInit(); // Call the shared functions
}


// Reset Webflow function
function resetWebflow(data) {
    let parser = new DOMParser();
    let dom = parser.parseFromString(data.next.html, "text/html");
    let webflowPageId = $(dom).find("html").attr("data-wf-page");
    $("html").attr("data-wf-page", webflowPageId);

    // Reinitialize Webflow
    if (window.Webflow) {
        window.Webflow.destroy(); // Clean up existing Webflow interactions
        window.Webflow.ready();   // Reinitialize Webflow ready scripts
        window.Webflow.require("ix2").init(); // Reinitialize IX2 interactions
    }
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

                // Set the next container to be fixed during the transition
                $(data.next.container).addClass("con-fixed");

                ;
                if (document.querySelector('.case-img-hero-container')) {
                    animateTransformOnScroll('.case-img-hero-container', 200);
                }
                initializeSpecialCursorFrontpage();
                initializeCaseReadMoreCursorToggle();
                if (document.querySelector('.case-theme')) {
                    updateTheme(data.next.container);
                }

                if (document.querySelector('.header-headline')) {
                    splitAllHeaderHeadlines();
                }
                initializeCustomCursor();
                if (document.querySelector('.main-slider')) {
                    setTimeout(() => {
                        BarbaSliderAnimation();
                    }, 2);
                }
                setTimeout(() => {

                    BarbaPageTransitions();
                    initializeBarbaLottieAnimations();
                }, 100);


                const tl = new gsap.timeline({
                    onComplete: function () {
                        updateCurrentClass();
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

                // Additional animations
                gsap.to('.frontpage-loader-border-overlay', {
                    left: '0vw',
                    duration: 0.8,
                    ease: 'linedraw'
                });

                gsap.to('.frontpage-loader-border-overlay', {
                    opacity: 0,
                    duration: 1.25,
                    ease: 'linedraw',
                    delay: 1.3
                });

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

                resetWebflow(data);

                // Hide the overlay after the transition
                $(".overlay").addClass("hideoverlay");
                $(data.next.container).removeClass("con-fixed");

                // Reset frontpage loader border overlay after a short delay
                gsap.delayedCall(0.5, () => {
                    gsap.set('.frontpage-loader-border-overlay', {
                        left: '-100vw',
                        opacity: 1
                    });
                });
            }
        }
    ]
});



// Initial slider setup
$(document).ready(function () {
    initForLoad();

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

    setTimeout(() => {
        if (document.querySelector('.case-section')) {
            BarbaPageTransitions();
            initializeBarbaLottieAnimations();
        }

        if (document.querySelector('.about-hero-wrapper')) {
            BarbaPageTransitions();
            initializeBarbaLottieAnimations();
        }

        if (document.querySelector('.case-item-section')) {
            BarbaPageTransitions();
            initializeBarbaLottieAnimations();
        }

    }, 4600);



});
