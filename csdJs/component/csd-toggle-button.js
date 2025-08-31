function initializeToggleButton(buttonElement) {
  const $originalButton = $CSD(buttonElement);

  // Create wrapper and label
  const wrapper = document.createElement("div");
  wrapper.className = "csd-toggle-button-wrapper";

  const label = document.createElement("div");
  label.className = "csd-toggle-button-label";

  // Handle icons and text for different states
  const icon = buttonElement.getAttribute("icon");
  const onIcon = buttonElement.getAttribute("onicon");
  const offIcon = buttonElement.getAttribute("officon");
  const onLabel = buttonElement.getAttribute("onlabel");
  const offLabel = buttonElement.getAttribute("offlabel");

  // Calculate minimum width based on text content
  if (onLabel || offLabel) {
    // Create temporary span to measure text width
    const tempSpan = document.createElement("span");
    tempSpan.style.visibility = "hidden";
    tempSpan.style.position = "absolute";
    tempSpan.style.whiteSpace = "nowrap";
    tempSpan.style.fontSize = "14px"; // Match button font size
    document.body.appendChild(tempSpan);

    // Measure both labels
    const texts = [onLabel, offLabel].filter(Boolean);
    let maxWidth = 0;
    texts.forEach((text) => {
      tempSpan.textContent = text;
      maxWidth = Math.max(maxWidth, tempSpan.offsetWidth);
    });

    // Remove temporary span
    document.body.removeChild(tempSpan);

    // Add padding (1rem = 16px) and convert to rem
    const totalWidthPx = maxWidth + 32 * 2; // 2rem padding (1rem per side)
    // Round up to nearest rem
    const widthInRem = Math.ceil(totalWidthPx / 16);

    // Set minimum width on label
    label.style.minWidth = widthInRem + "rem";
  }

  // Create icon element if needed
  if (icon || onIcon || offIcon) {
    const iconElement = document.createElement("ion-icon");
    if (icon) {
      iconElement.setAttribute("name", icon);
    } else {
      // Set initial icon based on checked state
      iconElement.setAttribute(
        "name",
        buttonElement.checked ? onIcon || offIcon : offIcon || onIcon
      );
    }
    label.appendChild(iconElement);
  }

  // Create text button if needed
  if (onLabel || offLabel) {
    const textButton = document.createElement("button");
    textButton.type = "button";
    textButton.className = "csd-toggle-button-text";
    // Set initial text based on checked state
    textButton.textContent = buttonElement.checked
      ? onLabel || offLabel
      : offLabel || onLabel;
    label.appendChild(textButton);
  }

  // Build structure

  // Replace original with wrapper
  buttonElement.parentNode.replaceChild(wrapper, buttonElement);
  wrapper.appendChild(buttonElement);
  wrapper.appendChild(label);

  // Get CSD wrappers
  const $wrapper = $CSD(wrapper);
  const $label = $CSD(label);

  // Add click handler
  $label.on("click", function (e) {
    if (!buttonElement.disabled) {
      buttonElement.checked = !buttonElement.checked;
      // Trigger change event
      buttonElement.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  // Listen for changes to update UI
  $originalButton.on("change", function () {
    const isChecked = this.checked;
    const iconEl = label.querySelector("ion-icon");
    const textEl = label.querySelector(".csd-toggle-button-text");

    if (iconEl) {
      if (isChecked && (onIcon || icon)) {
        iconEl.setAttribute("name", onIcon || icon);
      } else if (!isChecked && (offIcon || icon)) {
        iconEl.setAttribute("name", offIcon || icon);
      }
    }

    if (textEl) {
      if (isChecked && (onLabel || offLabel)) {
        textEl.textContent = onLabel || offLabel;
      } else if (!isChecked && (offLabel || onLabel)) {
        textEl.textContent = offLabel || onLabel;
      }
    }
  });

  // Override val method for toggle button
  const originalVal = _CSD_UTILS.prototype.val;
  _CSD_UTILS.prototype.val = function (value) {
    const el = this.elements[0];
    if (el && el.classList.contains("csd-toggle-button")) {
      if (arguments.length === 0) {
        return el.checked;
      }

      // Convert value to boolean and update
      el.checked =
        value === true || value === "true" || value === 1 || value === "1";
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return this;
    }
    return originalVal.apply(this, arguments);
  };
}

export { initializeToggleButton };