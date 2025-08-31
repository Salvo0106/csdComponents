function initializeTextArea(textareaElement) {
  const $textarea = $CSD(textareaElement);
  const maxLength = $textarea.attr("maxlength");
  const minRows = $textarea.attr("min-rows");
  const isAutoResize = $textarea.hasClass("csd-textarea-auto");

  // Gestione conteggio caratteri
  if (maxLength) {
    const $counter = $textarea.siblings(".csd-textarea-counter");

    $textarea.on("input", function () {
      const count = this.value.length;
      $counter.text(`${count}/${maxLength}`);
    });
  }

  // Gestione altezza minima
  if (minRows && typeof window !== 'undefined') {
    const lineHeight = parseInt(
      window.getComputedStyle($textarea.elements[0]).lineHeight
    );
    const paddingTop = parseInt(
      window.getComputedStyle($textarea.elements[0]).paddingTop
    );
    const paddingBottom = parseInt(
      window.getComputedStyle($textarea.elements[0]).paddingBottom
    );
    const minHeight = lineHeight * minRows + paddingTop + paddingBottom;
    $textarea.css("min-height", `${minHeight}px`);
  }

  // Gestione auto-resize
  if (isAutoResize) {
    $textarea.on("input", function () {
      const el = $textarea.elements[0];
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    });

    // Imposta altezza iniziale
    $textarea.trigger("input");
  }
}

export { initializeTextArea };