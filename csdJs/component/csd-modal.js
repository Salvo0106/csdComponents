// Layout Components
function initializeModal(element) {
  if (!element) return;

  const $modal = $CSD(element);
  const $closeButtons = $modal.find(".csd-modal-close");
  const $overlay = $modal.find(".csd-modal-overlay");

  function closeModal() {
    $modal.removeClass("show");
    setTimeout(() => {
      $modal.hide();
    }, 300);
  }

  function openModal() {
    $modal.show();
    setTimeout(() => {
      $modal.addClass("show");
    }, 50);
  }

  $closeButtons.on("click", closeModal);
  $overlay.on("click", closeModal);

  // Store the modal instance on the element
  element.csdModal = {
    open: openModal,
    close: closeModal,
  };

  return element.csdModal;
}

function initializeConfirmDialog(element) {
  if (!element) return;

  const $dialog = $CSD(element);
  const $confirmBtn = $dialog.find(".csd-confirm-btn");
  const $cancelBtn = $dialog.find(".csd-cancel-btn, .csd-modal-close");
  const $overlay = $dialog.find(".csd-modal-overlay");
  let resolvePromise;

  function closeDialog(result) {
    $dialog.removeClass("show");
    setTimeout(() => {
      $dialog.hide();
      if (resolvePromise) {
        resolvePromise(result);
        resolvePromise = null;
      }
    }, 300);
  }

  function openDialog() {
    $dialog.show();
    setTimeout(() => {
      $dialog.addClass("show");
    }, 50);

    return new Promise((resolve) => {
      resolvePromise = resolve;
    });
  }

  $confirmBtn.on("click", () => closeDialog(true));
  $cancelBtn.on("click", () => closeDialog(false));
  $overlay.on("click", () => closeDialog(false));

  // Store the dialog instance on the element
  element.csdConfirmDialog = {
    open: openDialog,
    close: closeDialog,
  };

  return element.csdConfirmDialog;
}

export { initializeModal, initializeConfirmDialog };
