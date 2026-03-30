const inputItems = [...document.querySelectorAll('input ')].concat([...document.querySelectorAll('textarea ')])
if (inputItems.length) {
    inputItems.forEach(input => {
        if (input.closest('.form__item')) {
            const form__item = input.closest('.form__item')

            function styleInput(e) {
                if (input.value != '') {
                    form__item.classList.add('_active')
                }
                else {
                    form__item.classList.remove('_active')
                }

                if (input.placeholder.includes('+7')) {
                    form__item.classList.add('_active')
                }
            }

            input.addEventListener('input', styleInput)
            input.addEventListener('focus', styleInput);
            input.addEventListener('focusin', styleInput);
            input.addEventListener('focusout', styleInput);
            input.addEventListener('blur', styleInput);
        }
    })
}