function initializeToggle(toggleElement) {
  const $originalToggle = $CSD(toggleElement);

  // Create wrapper and switch element
  const wrapper = document.createElement("div");
  wrapper.className = "csd-toggle-wrapper";

  const switchLabel = document.createElement("label");

  if (!switchLabel) {
    return;
  }

  switchLabel.className = "csd-toggle-switch";
  

  // Add special classes and data if needed
  const iconChecked = toggleElement.getAttribute("icon-checked");
  const iconUnchecked = toggleElement.getAttribute("icon-unchecked");
  const textChecked = toggleElement.getAttribute("text-checked");
  const textUnchecked = toggleElement.getAttribute("text-unchecked");

  if (iconChecked && iconUnchecked) {
    switchLabel.classList.add("with-icons");
    switchLabel.setAttribute("data-icon-checked", iconChecked);
    switchLabel.setAttribute("data-icon-unchecked", iconUnchecked);
  }
  if (textChecked && textUnchecked) {
    switchLabel.classList.add("with-text");
    switchLabel.setAttribute("data-text-checked", textChecked);
    switchLabel.setAttribute("data-text-unchecked", textUnchecked);
  }

  // Create toggle group if label is present
  const label = toggleElement.getAttribute("label");
  const position = toggleElement.getAttribute("position") || "end";

  if (label) {
    wrapper.className = "csd-toggle-group";

    const labelSpan = document.createElement("span");
    labelSpan.className = "csd-toggle-label";
    labelSpan.textContent = label;

    // Add elements in correct order based on position
    if (position === "start") {
      wrapper.appendChild(labelSpan);
      wrapper.appendChild(switchLabel);
    } else {
      wrapper.appendChild(switchLabel);
      wrapper.appendChild(labelSpan);
    }
  } else {
    wrapper.appendChild(switchLabel);
  }

  // Move original toggle into wrapper and hide it
  const originalElement = $originalToggle.elements[0];
  originalElement.style.display = "none";
  originalElement.parentNode.replaceChild(wrapper, originalElement);
  wrapper.appendChild(originalElement);

  // Get CSD wrappers
  const $wrapper = $CSD(wrapper);
  const $switch = $CSD(switchLabel);

  // Add click handler
  $switch.on("click", function (e) {
    if (!originalElement.disabled) {
      originalElement.checked = !originalElement.checked;
      // Trigger change event
      originalElement.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  // Listen for changes to update UI
  $originalToggle.on("change", function () {
    $switch.toggleClass("checked", originalElement.checked);
  });

  // Initial state
  $switch.toggleClass("checked", originalElement.checked);

  // Override val method for toggle
  const originalVal = _CSD_UTILS.prototype.val;
  _CSD_UTILS.prototype.val = function (value) {
    const el = this.elements[0];
    if (el && el.classList.contains("csd-toggle")) {
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

export { initializeToggle };