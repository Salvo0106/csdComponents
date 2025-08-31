function initializeToast() {
  const toastContainer = $CSD("<div>").addClass("csd-toast-container");
  $CSD("body").append(toastContainer);

  function createToast(message, type = "info", duration = 3000) {
    const toast = $CSD("<div>")
      .addClass("csd-toast")
      .addClass(`csd-toast-${type}`)
      .text(message);

    toastContainer.append(toast);

    setTimeout(() => {
      toast.addClass("show");
    }, 50);

    setTimeout(() => {
      toast.removeClass("show");
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);

    return toast;
  }

  return {
    show: createToast,
  };
}

export { initializeToast };