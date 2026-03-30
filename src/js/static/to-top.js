function scrollToTop() {
    const toTopBtn = document.querySelector('.to-top');

    if (!toTopBtn) return

    if (window.scrollY >= 1000) {
        toTopBtn.classList.add('_active');
    }
    else {
        toTopBtn.classList.remove('_active');
    }

    toTopBtn.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo(0, 0)
    })
}

export const toTop = () => {
    scrollToTop();
    window.addEventListener('scroll', scrollToTop);
} 