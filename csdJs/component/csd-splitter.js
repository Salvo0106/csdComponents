function initializeSplitter(element) {
  if (!element || element.initialized) return;

  const $splitter = $CSD(element);
  let activeSplitter = null;
  let startPosition = null;
  let startSizes = null;

  function updatePanelSize($panel, size) {
    $panel.data("size", size);
    $panel.css("flex", `0 0 ${size}%`);
  }

  function handleMouseMove(e) {
    if (!activeSplitter) return;

    const { $prevPanel, $nextPanel, isHorizontal } = activeSplitter;
    const splitRect = $splitter[0].getBoundingClientRect();
    const currentPosition = isHorizontal ? e.clientX : e.clientY;
    const startOffset = isHorizontal ? splitRect.left : splitRect.top;
    const totalSize = isHorizontal ? splitRect.width : splitRect.height;

    // Calculate the position relative to the splitter
    const position = currentPosition - startOffset;
    const percentage = (position / totalSize) * 100;

    // Calculate new sizes ensuring they sum to 100%
    const totalPercentage = startSizes.prev + startSizes.next;
    let newPrevSize = percentage;
    let newNextSize = totalPercentage - percentage;

    // Enforce minimum size (10%)
    const minSize = 10;
    if (newPrevSize < minSize) {
      newPrevSize = minSize;
      newNextSize = totalPercentage - minSize;
    } else if (newNextSize < minSize) {
      newNextSize = minSize;
      newPrevSize = totalPercentage - minSize;
    }

    // Update panel sizes
    updatePanelSize($prevPanel, newPrevSize);
    updatePanelSize($nextPanel, newNextSize);

    // Prevent text selection while dragging
    e.preventDefault();
  }

  function handleMouseUp(e) {
    if (!activeSplitter) return;

    // Remove dragging class and cursor
    activeSplitter.$gutter.removeClass("dragging");
    $CSD("body").css("cursor", "");

    // Unbind move and up handlers
    $CSD(document).off("mousemove.csd.splitter").off("mouseup.csd.splitter");

    // Clear state
    activeSplitter = null;
    startPosition = null;
    startSizes = null;

    // Prevent any pending events
    e.preventDefault();
  }

  // Initialize nested splitters
  $splitter.find(".csd-splitter").each(function () {
    if (!this.initialized) {
      initializeSplitter(this);
    }
  });

  // Set initial sizes for panels
  const $panels = $splitter.find(".csd-split-panel");
  const $gutter = $splitter.find(".csd-split-gutter");
  const isHorizontal = $splitter.hasClass("horizontal");

  $panels.each(function () {
    const $panel = $CSD(this);
    if (!$panel.data("size")) {
      $panel.data("size", 50); // Default to 50% each
    }
    updatePanelSize($panel, $panel.data("size"));
  });

  // Handle gutter mousedown
  $gutter.on("mousedown", function (e) {
    e.preventDefault();

    activeSplitter = {
      $gutter: $CSD(this),
      $prevPanel: $CSD(this).prev(".csd-split-panel"),
      $nextPanel: $CSD(this).next(".csd-split-panel"),
      isHorizontal: isHorizontal,
    };

    startPosition = isHorizontal ? e.clientX : e.clientY;
    startSizes = {
      prev: activeSplitter.$prevPanel.data("size"),
      next: activeSplitter.$nextPanel.data("size"),
    };

    activeSplitter.$gutter.addClass("dragging");
    $CSD("body").css("cursor", isHorizontal ? "col-resize" : "row-resize");

    // Bind move and up handlers directly to document
    $CSD(document).on("mousemove", handleMouseMove);
    $CSD(document).on("mouseup", handleMouseUp);
  });

  // Update position on window resize and scroll
  $CSD(window).on("resize.csd.splitter scroll.csd.splitter", () => {
    if ($splitter.find(".csd-split-panel").length) {
      $splitter.find(".csd-split-panel").each(function () {
        updatePanelSize($CSD(this), $CSD(this).data("size"));
      });
    }
  });

  // Mark as initialized
  element.initialized = true;

  // Return cleanup function
  return function destroy() {
    $gutter.off(".csd.splitter");
    $CSD(document).off("mousemove").off("mouseup");
    element.initialized = false;
  };
}

export { initializeSplitter };