const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            observer.unobserve(entry.target)
        }
    })
})

export const lazyImages = (selector) => {
    if (selector.length) return;

    selector.forEach(img => {
        observer.observe(img)
    })
}