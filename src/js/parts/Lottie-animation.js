// Lottie Animation Functions
// Handles all Lottie animation initialization and management

export function initializeLottieAnimation({
    containerId,
    animationPath,
    triggerClass = null,
    delay = 0,
    resetAfter = 3000,
    autoplay = false,
    inViewTrigger = false // New flag to enable in-view animation
}) {
    const container = document.getElementById(containerId);

    if (!container) {
        console.error(`Container with ID '${containerId}' not found.`);
        return null;
    }

    // Load the Lottie animation
    const animation = lottie.loadAnimation({
        container: container, // DOM element to contain the animation
        renderer: 'svg', // Renderer type
        loop: false, // Do not loop
        autoplay: autoplay, // Control autoplay based on parameter
        path: animationPath, // Path to the Lottie animation JSON file
    });

    // Function to play the animation from the start
    const playAnimationFromStart = () => {
        animation.goToAndStop(0, true); // Reset animation to the beginning
        setTimeout(() => {
            animation.play(); // Start playing the animation
        }, delay);

        // Reset animation after the specified duration
        setTimeout(() => {
            animation.goToAndStop(0, true);
        }, resetAfter);
    };

    // Handle in-view trigger for the animation (IntersectionObserver)
    if (inViewTrigger) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Play the Lottie animation when it comes into view
                    if (!animation.isPlaying) {
                        animation.play();
                    }
                }
            });
        }, { threshold: 0.95 }); // Trigger when 95% of the container is visible

        observer.observe(container);
    }

    // Attach event listeners if a triggerClass is provided
    if (triggerClass) {
        document.querySelectorAll(`.${triggerClass}`).forEach((item) => {
            item.addEventListener('click', playAnimationFromStart);
        });
    }

    // Return the play function for manual control
    return playAnimationFromStart;
}

// Initialize Lottie animations for page load
export function initializePageLoadLottieAnimations() {

    initializeLottieAnimation({
        containerId: 'circle-minimize-btn',
        animationPath: 'https://cdn.prod.website-files.com/6649cbdf19aa7125580e2ccb/67701fba2c2b1563bdf59578_btn-open-3.json',
        triggerClass: 'minimizetool',
        delay: 0,
        resetAfter: 2500,
    });

    initializeLottieAnimation({
        containerId: 'circle-scale-btn',
        animationPath: 'https://cdn.prod.website-files.com/6649cbdf19aa7125580e2ccb/677022b2174fc6d87af967b6_btn-close-2.json',
        triggerClass: 'btn-fullscreen-global',
        delay: 0,
        resetAfter: 2500,
    });
}

// Reinitialize Lottie animations for Barba.js transitions
export function initializeBarbaLottieAnimations() {
    initializeLottieAnimation({
        containerId: 'about-lottie-symbol-loop',
        animationPath: 'https://cdn.prod.website-files.com/6649cbdf19aa7125580e2ccb/67766d4c18a6613ec8cbf9aa_logo-loop-6.json',
        autoplay: true,
        delay: 0,
    });

    const playMinimize = initializeLottieAnimation({
        containerId: 'circle-minimize-btn',
        animationPath: 'https://cdn.prod.website-files.com/6649cbdf19aa7125580e2ccb/67701fba2c2b1563bdf59578_btn-open-3.json',
        triggerClass: 'minimizetool',
        delay: 0,
        resetAfter: 2500,
    });

    const playFullscreen = initializeLottieAnimation({
        containerId: 'circle-scale-btn',
        animationPath: 'https://cdn.prod.website-files.com/6649cbdf19aa7125580e2ccb/677022b2174fc6d87af967b6_btn-close-2.json',
        triggerClass: 'btn-fullscreen-global',
        delay: 0,
        resetAfter: 2500,
    });

    // Attach play functions manually to avoid conflicts
    document.querySelector('.minimizetool')?.addEventListener('click', playMinimize);
    document.querySelector('.btn-fullscreen-global')?.addEventListener('click', playFullscreen);
}