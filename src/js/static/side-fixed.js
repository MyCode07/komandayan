import { unLockPadding } from "../utils/lockPadding.js";

document.addEventListener('click', function (e) {
    let targetEl = e.target;

    if (targetEl.classList.contains('_side-fixed')) {
        targetEl.classList.remove('_open');
        document.body.classList.remove('_noscroll');
        unLockPadding();
    }

    if (targetEl.classList.contains('_side-fixed__close')) {
        targetEl.closest('._side-fixed').classList.remove('_open');
        document.body.classList.remove('_noscroll');
        unLockPadding();
    }
})