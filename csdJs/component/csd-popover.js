function initializePopover(element) {
  if (!element) return;

  const $popover = $CSD(element);
  const $trigger = $CSD($popover.data("trigger"));
  const placement = $popover.data("placement") || "bottom";
  const trigger = $popover.data("trigger-event") || "click";
  const isConfirm = $popover.hasClass("csd-popover-confirm");
  let resolvePromise;
  let $currentPopover = null;

  function createPopover() {
    // Remove any existing popover
    if ($currentPopover) {
      $currentPopover.remove();
    }

    // Clone the template
    $currentPopover = $popover.clone(true);

    // Add to body
    $CSD("body").append($currentPopover);

    return $currentPopover;
  }

  function positionPopover($p) {
    if (!$trigger.length || !$p) return;

    const triggerRect = $trigger[0].getBoundingClientRect();
    const popoverRect = $p[0].getBoundingClientRect();
    const spacing = 12;

    let top, left;

    switch (placement) {
      case "top":
        top = triggerRect.top - popoverRect.height - spacing;
        left = triggerRect.left + triggerRect.width / 2 - popoverRect.width / 2;
        break;
      case "bottom":
        top = triggerRect.bottom + 0;
        left = triggerRect.left + triggerRect.width / 2 - popoverRect.width / 2;
        break;
      case "left":
        top = triggerRect.top + triggerRect.height / 2 - popoverRect.height / 2;
        left = triggerRect.left - popoverRect.width - spacing;
        break;
      case "right":
        top = triggerRect.top + triggerRect.height / 2 - popoverRect.height / 2;
        left = triggerRect.right + spacing;
        break;
    }

    // Aggiungere lo scroll solo se siamo in un browser
    if (typeof window !== 'undefined') {
      top += window.scrollY;
      left += window.scrollX;
    }

    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024; // Default fallback
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768; // Default fallback

    if (left < spacing) {
      left = spacing;
    } else if (left + popoverRect.width > viewportWidth - spacing) {
      left = viewportWidth - popoverRect.width - spacing;
    }

    if (top < spacing) {
      top = spacing;
    } else if (top + popoverRect.height > viewportHeight - spacing) {
      top = viewportHeight - popoverRect.height - spacing;
    }

    $p.css({
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
    });
  }

  function showPopover() {
    // Remove any existing popovers
    $CSD(".csd-popover.show").remove();

    // Create new popover
    const $p = createPopover();

    // Show and position it
    $p.addClass("show");
    requestAnimationFrame(() => positionPopover($p));

    // Set focus handlers
    setupFocusHandlers($p);
  }

  function setupFocusHandlers($p) {
    let isProcessing = false;

    function handleConfirmAction(isConfirm) {
      if (isProcessing) return;
      isProcessing = true;

      if (resolvePromise) {
        resolvePromise(isConfirm);
        resolvePromise = null;
      }

      if (typeof window !== 'undefined' && window.toast) {
        window.toast.show(
          isConfirm ? "Operazione confermata" : "Operazione annullata",
          isConfirm ? "success" : "info"
        );
      }

      hidePopover();
    }

    // Track focus within popover
    const checkFocus = (e) => {
      if (isConfirm) {
        // Check if clicked element is confirm or cancel button
        const isConfirmBtn = e.target.classList.contains(
          "csd-popover-confirm-btn"
        );
        const isCancelBtn = e.target.classList.contains(
          "csd-popover-cancel-btn"
        );

        if (isConfirmBtn) {
          handleConfirmAction(true);
          return;
        }

        if (isCancelBtn) {
          handleConfirmAction(false);
          return;
        }
      }

      // For non-confirm popovers, hide when clicking outside
      if (!$p[0].contains(e.target) && !$trigger[0].contains(e.target)) {
        hidePopover();
      }
    };

    // Add click handlers for confirm/cancel buttons
    if (isConfirm) {
      $p.find(".csd-popover-confirm-btn").on("click", () =>
        handleConfirmAction(true)
      );
      $p.find(".csd-popover-cancel-btn").on("click", () =>
        handleConfirmAction(false)
      );
    }

    // Use both mousedown and focusin for better coverage
    document.addEventListener("mousedown", checkFocus);
    document.addEventListener("focusin", checkFocus);

    // Cleanup when popover is hidden
    const cleanup = () => {
      document.removeEventListener("mousedown", checkFocus);
      document.removeEventListener("focusin", checkFocus);
      $p.off("hidden.csd.popover", cleanup);
      if (isConfirm) {
        $p.find(".csd-popover-confirm-btn").off("click");
        $p.find(".csd-popover-cancel-btn").off("click");
      }
    };

    $p.on("hidden.csd.popover", cleanup);
  }

  function hidePopover() {
    if ($currentPopover) {
      // Trigger cleanup event to remove all listeners
      $currentPopover.trigger("hidden.csd.popover");

      $currentPopover.removeClass("show");
      setTimeout(() => {
        // Remove all event listeners
        $currentPopover.off();
        $CSD(document).off("mousedown.csd.popover");
        $CSD(document).off("focusin.csd.popover");
        $CSD(window).off("resize.csd.popover scroll.csd.popover");

        $currentPopover.remove();
        $currentPopover = null;
      }, 200); // Match transition duration

      if (resolvePromise) {
        resolvePromise(false);
        resolvePromise = null;
      }
    }
  }

  function confirmAction() {
    if (resolvePromise) {
      resolvePromise(true);
      resolvePromise = null;
    }
    hidePopover();
  }

  // Hide original template
  $popover.remove();

  // Event Bindings
  if (trigger === "hover") {
    let hideTimeout;

    $trigger.on("mouseenter", () => {
      clearTimeout(hideTimeout);
      showPopover();
    });

    $trigger.on("mouseleave", (e) => {
      const toElement = e.relatedTarget;
      if ($currentPopover && !$currentPopover[0].contains(toElement)) {
        hideTimeout = setTimeout(hidePopover, 100);
      }
    });

    // Hover handlers will be set up on the new popover when created
  } else {
    $trigger.on("click", (e) => {
      e.stopPropagation();
      if (isConfirm) {
        showPopover();
        return new Promise((resolve) => {
          resolvePromise = resolve;
        });
      } else {
        const isVisible = $currentPopover && $currentPopover.hasClass("show");
        if (isVisible) {
          hidePopover();
        } else {
          showPopover();
        }
      }
    });
  }

  // Update position on window resize and scroll
  $CSD(window).on("resize.csd.popover scroll.csd.popover", () => {
    if ($currentPopover && $currentPopover.hasClass("show")) {
      debounce(() => positionPopover($currentPopover), 100)();
    }
  });

  // Store the popover instance on the element
  element.csdPopover = {
    show: showPopover,
    hide: hidePopover,
    updatePosition: () => $currentPopover && positionPopover($currentPopover),
  };

  return element.csdPopover;
}

export { initializePopover };