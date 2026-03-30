import inputmask from "inputmask/dist/inputmask.es6.js";

export const maskInputs = (mask, selector) => {
    if (!mask || !selector) return;

    inputmask({
        mask: mask,
        greedy: false,
        clearIncomplete: true,
        showMaskOnHover: true,
    }).mask(selector);
}