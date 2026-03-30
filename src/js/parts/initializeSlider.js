import gsap from "gsap/all";
import { Observer } from "gsap/Observer";
gsap.registerPlugin(Observer)

let slider2CleanupState = {
    smallRafId: null,
    smallSnapTimer: null,
    smallScrollEl: null,
    wheelHandler: null,
    measureSmall: null
};

// Function to initialize the slider
export function initializeSlider() {
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

    let totalSlides = $(".slider__item").length;
    let slideWidth = $(".slider__item").width();

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
        document.querySelector(".slider__wrap.w-dyn-list") ||
        document.querySelector(".slider__wrap");
    const smallList = document.querySelector(".slider__list");
    const numbersListEl = document.querySelector(".numbers__list");

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
        const items = smallList.querySelectorAll(".slider__item");
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
                const items = smallList.querySelectorAll(".slider__item");
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
        const items = smallList.querySelectorAll(".slider__item");
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
    $(".slider__item").each(function (index) {
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
                resetTitleWords(prevSlide.find(".main-slider__title"));
                resetTitleWords(nextSlide.find(".main-slider__title"));
            })
            // зазор между заголовками
            .call(() => animateTitleWords(prevSlide.find(".main-slider__title"), 0, moveAmount * -1, 0.12, 1, titleEase)) // Normal animation
            .call(() => animateTitleWords(nextSlide.find(".main-slider__title"), moveAmount, 0, 0.12, 1, titleEase)) // Normal animation
            .fromTo(
                prevSlide.find(".main-slider__img-wrap"),
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
                prevSlide.find(".main-slider__img"),
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
                nextSlide.find(".main-slider__img-wrap"),
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
                nextSlide.find(".main-slider__img"),
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
    let slides = $(".main-slider__item");
    let navItems = $(".nav__item");
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
                bottom: '56px',
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
        $(".slider__item").removeClass("current");
        let smallSlide = $(".slider__item").eq(activeSlide.index()).addClass("current");
        let fromElement = activeSlide.find(".main-slider__img-wrap");
        let toElement = smallSlide.find(".slider__link");

        gsap.defaults({ duration: 0.4, ease: "Pagtrans" });

        gsap.set(".slider__item.current", {
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
                $(".slider__wrap").addClass("show");
                gsap.fromTo(
                    ".slider__item:not(.current)",
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

                $(".main-slider, .nav__wrap").css("display", "none");
                popupOpen = false;
                transitioning = false;
            }
        });
        tl2
            .fromTo(
                activeSlide.find(".main-slider__title"),
                { yPercent: 0 },
                {
                    yPercent: -100,
                    duration: 0.8,
                    ease: "Pagtrans"// Slower animation for closing popup
                }
            )
            .to(
                ".main-slider .hero__arrow, .main-slider .minimizetool",
                {
                    scale: 0
                },
                0
            )
            .to(
                ".nav__item",
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
            .set(activeSlide, { display: "none" }) // Hide the active slide at the end of the transition
            .set(fromElement, { opacity: 1 }) // Reset opacity to 1 after transition
            .to(".numbers__list", { opacity: 1, duration: 0.4 }, 0) // Faster hide the number list
            .to(".numbers__wrap", {
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

        $(".slider__item").removeClass("current");
        let smallSlide = $(".slider__item").eq(index);
        let fromElement = activeSlide.find(".main-slider__img-wrap");
        let toElement = smallSlide.find(".slider__link");

        fromElement.css("transform", "");
        activeSlide.find(".main-slider__img").css("transform", "");

        // Reset the title words before animating
        resetTitleWords(activeSlide.find(".main-slider__title"));

        gsap.defaults({ duration: 1, ease: "Pagtrans" });

        $(".main-slider, .nav__wrap").css("display", "");

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


                gsap.to(".slider__item", {
                    duration: 1.5,
                    clipPath: 'inset(100% 0% 0% 0%)',
                    ease: 'texttshow',
                    onComplete: () => {
                        $(".slider__wrap").removeClass("show");
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
                activeSlide.find(".main-slider__title"),
                { yPercent: -100 },
                {
                    yPercent: 0,
                    delay: 0.4, // Add delay before animating the title
                    duration: 1.2, // Slower animation for opening popup
                    ease: "Pagtrans" // Set ease for opening popup
                }
            )
            .to(
                ".main-slider .hero__arrow, .main-slider .minimizetool",
                {
                    scale: 1,
                    delay: 0.8 // Add delay before animating these elements
                },
                0
            )
            .to(
                ".nav__item",
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
                        fromElement.css("opacity", 1); // Ensure the main-slider__img-wrap is visible
                    }
                },
                0
            )
            .to(smallSlide, { opacity: 1, duration: 0 }) // Show the small slide at the end of the animation
            .to(".numbers__list", { opacity: 1, duration: 0.4, delay: 0.8 }, 0.5) // Faster show the number list
            .to(".numbers__wrap", {
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
        const n = $(".numbers__item").length;
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