import A11yDialog from './node_modules/a11y-dialog/dist/a11y-dialog.esm.js';

(() => {
    const dialogEl = document.getElementById('credits-dialog');
    new A11yDialog(dialogEl);

    /**
     * Example for hooking into 'show' event for modal.
     */
    // const dialog = new A11yDialog(dialogEl);
    // dialog.on('show', event => {
    //     const container = event.target;
    //     // And if the event is the result of a UI interaction (i.e. was not triggered
    //     // programmatically via `.show(..)`), the `detail` prop contains the original
    //     // event
    //     const target = event.detail.target;
    //     const opener = target.closest('[data-a11y-dialog-show]');
    //     console.log(container, target, opener);
    // });
})();