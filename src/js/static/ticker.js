import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger.js";
import { isMobile } from "../utils/isMobile.js";

gsap.registerPlugin(ScrollTrigger)


function scroll(target, options, reverse) {
    const timeline = gsap.timeline({
        repeat: -1,
        onReverseComplete() {
            this.totalTime(this.rawTime() + this.duration() * 10);
        }
    });
    options = options || {};
    options.ease || (options.ease = "none");
    timeline.to(target, {
        xPercent: reverse ? 100 : -100,
        ...options,
    }, 0);

    return timeline;
}

export const runTicker = () => {
    const ticker = document.querySelector('._ticker');
    const tickers = document.querySelectorAll('._ticker-text');

    if (!ticker) return;

    let time = ticker.dataset.speed ?? 20

    tickers.forEach(line => {
        let direction = 1;
        const roll = scroll(line, { duration: time })

        // if (!isMobile.any())
        //     ScrollTrigger.create({
        //         onUpdate(self) {
        //             if (self.direction !== direction) {
        //                 direction *= -1;
        //                 gsap.to(roll, {
        //                     timeScale: direction,
        //                     overwrite: true,
        //                 });
        //             }
        //             roll.timeScale(self.direction * 2)

        //             setTimeout(() => {
        //                 roll.timeScale(self.direction)
        //             }, 100);
        //         }
        //     });
    })
}