import SmoothScroll from "smoothscroll-for-websites"

export const smoothscroll = () => {
    SmoothScroll({
        animationTime: 800,
        stepSize: 100,
        accelerationDelta: 35,
        accelerationMax: 2,
        keyboardSupport: true,
        arrowScroll: 50,
        pulseAlgorithm: true,
        pulseScale: 4,
        pulseNormalize: 1,
        touchpadSupport: true,
    })
}