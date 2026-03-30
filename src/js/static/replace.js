export const replaceDomElements = () => {
    const sections = document.querySelectorAll('[data-replace-width]');
    if (!sections.length) return

    sections.forEach(section => {
        let lockPosition = true;
        const replaceElem = section.querySelector('[data-replace-element]');

        const width = +section.dataset.replaceWidth;
        const newPosition = section.querySelector('[data-replace-new-position]');
        const oldPosition = section.querySelector('[data-replace-old-position]');

        const newPositionInsertType = newPosition.dataset.replaceNewPosition;
        const oldPositionInsertType = oldPosition.dataset.replaceOldPosition;


        function replace() {
            if (window.innerWidth <= width) {
                if (lockPosition == true)
                    newPosition.insertAdjacentElement(newPositionInsertType, replaceElem)
                lockPosition = false
            }
            else {
                if (lockPosition == false)
                    oldPosition.insertAdjacentElement(oldPositionInsertType, replaceElem)
                lockPosition = true
            }

        }

        replace()
        window.addEventListener('resize', replace)
    })
}