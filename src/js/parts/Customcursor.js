// Guard to prevent duplicate event listeners on Barba transitions
let __customCursorInitialized = false;

export function initializeCustomCursor() {
    // Prevent duplicate listeners - only initialize once
    if (__customCursorInitialized) return;

    const cursor = document.querySelector('.custom-cursor');
    const cursorDot = document.querySelector('.custom-cursor-dot');
    const casecursorDot = document.querySelector('.custom-cursor-dot-case');
    if (!cursor || !cursorDot) {
        console.error('Custom cursor element not found!');
        return;
    }

    __customCursorInitialized = true;

    // Move cursor with mouse
    const updateCursorPosition = (e) => {
        // Slightly faster/snapper cursor following
        gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.05, ease: "none" });
    };

    // Check if element or parent has a class
    const hasParentWithClass = (element, className) => {
        while (element) {
            if (element.classList && element.classList.contains(className)) {
                return true;
            }
            element = element.parentElement;
        }
        return false;
    };

    let isHovered = false;
    let hoverOutTimeout = null;

    // Hover in
    const handleMouseOver = (e) => {
        if (hasParentWithClass(e.target, 'cursor-hover-state') && !isHovered) {
            clearTimeout(hoverOutTimeout);
            isHovered = true;
            gsap.to(cursorDot, {
                scale: 1.1,
                backgroundColor: "rgba(255,255,255,0)",
                duration: 0.35,
                ease: "hoverin",
            });
        }
    };

    // Hover out (with delay, and skips if entering special zone)
    const handleMouseOut = (e) => {
        if (hasParentWithClass(e.target, 'cursor-hover-state') && isHovered) {
            const relatedTarget = e.relatedTarget;

            clearTimeout(hoverOutTimeout);

            // Skip hover-out if cursor is moving into a special zone
            const isHoveringSpecial =
                relatedTarget?.closest('.cursor-special-frontpage, .cursor-special-close, .cursor-special-aboutpage');

            if (isHoveringSpecial) return;

            if (!hasParentWithClass(relatedTarget, 'cursor-hover-state')) {
                hoverOutTimeout = setTimeout(() => {
                    isHovered = false;
                    gsap.to(cursorDot, {
                        scale: 1,
                        backgroundColor: "rgba(255,255,255,1)",
                        duration: 0.8,
                        ease: "hoverout",
                    });
                }, 100); // Delay in ms
            }
        }
    };

    // Click pulse animation
    const handleClick = () => {
        gsap.to(cursorDot, {
            scale: 1.5,
            duration: 0.35,
            ease: "hoverin",
            onComplete: () => {
                gsap.to(cursorDot, { scale: 1, duration: 0.8, ease: "hoverout" });
            },

        });
        // Only animate casecursorDot if it exists (safe null check)
        if (casecursorDot) {
            gsap.to(casecursorDot, {
                scale: 1.5,
                duration: 0.35,
                ease: "hoverin",
                onComplete: () => {
                    gsap.to(casecursorDot, { scale: 1, duration: 0.8, ease: "hoverout" });
                },
            });
        }
    };

    // Event listeners
    document.addEventListener('mousemove', updateCursorPosition);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('click', handleClick);

    // Cleanup (optional if needed)
    return () => {
        document.removeEventListener('mousemove', updateCursorPosition);
        document.removeEventListener('mouseover', handleMouseOver);
        document.removeEventListener('mouseout', handleMouseOut);
        document.removeEventListener('click', handleClick);
    };
}

export function initializeCaseReadMoreCursorToggle() {
    const cursor = document.querySelector('.custom-cursor');
    const cursorDot = document.querySelector('.custom-cursor-dot');
    const casecursorDot = document.querySelector('.custom-cursor-dot-case');
    const readMoreBtn = document.querySelector('.btn-case-rm');
    const closeText = document.querySelector('.close-text-p');
    const closeArea = document.querySelector('.case-full-info-wrapper');

    if (!cursor || !cursorDot || !readMoreBtn || !closeArea) return;

    // Click: Read more в†’ add class + delayed animation
    readMoreBtn.addEventListener('click', () => {
        cursor.classList.add('cursor-case-active');

        // Wait for DOM + layout paint
        gsap.to(closeText, {
            top: "0",
            duration: 1,
            ease: 'texttshow',
        });
        setTimeout(() => {
            cursorDot.style.display = 'none';
            casecursorDot.style.display = 'block';
            if (cursor.classList.contains('cursor-case-active')) {
                gsap.to(casecursorDot, {
                    scale: 1.1,

                    backgroundColor: 'rgba(255,255,255,0)',
                    duration: 0.5,
                    ease: 'hoverin',
                });


            }
        }, 150); // 50ms after DOM paint

    });


    // Click: Close в†’ remove class + delayed hover-out
    closeArea.addEventListener('click', () => {
        cursor.classList.remove('cursor-case-active');

        gsap.to(closeText, {
            top: "100",
            duration: 1,
            ease: 'texttshow',
        });


        setTimeout(() => {
            gsap.to(casecursorDot, {
                scale: 1,

                backgroundColor: 'rgba(255,255,255,1)',
                duration: 0.5,
                ease: 'hoverout',
            });
        }, 500); // 50ms after DOM paint

        setTimeout(() => {
            cursorDot.style.display = 'block';
            casecursorDot.style.display = 'none';
        }, 1000); // 50ms after DOM paint
    });
}

export function initializeSpecialCursorFrontpage() {
    const cursorDot = document.querySelector('.custom-cursor-dot');
    const el = document.querySelector('.cursor-special-frontpage');
    if (!cursorDot || !el) return;

    el.addEventListener('mouseenter', () => {
        // Immediate effect
        gsap.to(cursorDot, {
            scale: 1.1,
            backgroundColor: 'rgba(255,255,255,0.0)',
            duration: 0.35,
            ease: 'hoverin',
        });

        // Fallback check after 200ms in case a normal hover-out interfered
        setTimeout(() => {
            // Check if still hovered (use matches(':hover'))
            if (el.matches(':hover')) {
                gsap.to(cursorDot, {
                    scale: 1.1,
                    backgroundColor: 'rgba(255,255,255,0.0)',
                    duration: 0.35,
                    ease: 'hoverin',
                });
            }
        }, 200);
    });
}