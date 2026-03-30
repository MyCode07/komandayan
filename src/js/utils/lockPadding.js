import { isMobile } from "./isMobile.js";

const fixedElems = document.querySelectorAll('._fixed');
const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
const body = document.body;

export const lockPadding = () => {
    if (!isMobile.any()) {
        if (fixedElems.length)
            fixedElems.forEach(item => {
                item.style.paddingRight = scrollbarWidth + 'px';
            });

        body.style.paddingRight = scrollbarWidth + 'px';
    }

    body.classList.add('_noscroll')
}

export const unLockPadding = () => {
    if (!isMobile.any()) {
        if (fixedElems.length)
            fixedElems.forEach(item => {
                item.style.paddingRight = 0 + 'px';
            });

        body.style.paddingRight = 0 + 'px';
    }

    body.classList.remove('_noscroll')
}