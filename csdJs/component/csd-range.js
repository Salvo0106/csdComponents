function initializeRange(rangeElement) {
  const $originalRange = $CSD(rangeElement);
  const min = parseFloat($originalRange.attr("min") || 0);
  const max = parseFloat($originalRange.attr("max") || 100);
  const step = parseFloat($originalRange.attr("step") || 1);
  const isDouble = $originalRange.attr("range") === "true";
  const showInput = $originalRange.attr("show-input") === "true";
  let values = isDouble
    ? $originalRange
        .val()
        .split(",")
        .map((v) => parseFloat(v))
    : [parseFloat($originalRange.val() || 50)];

  // Create wrapper
  const wrapper = document.createElement("div");
  wrapper.className = "csd-range-wrapper";

  // Add icons if specified
  const iconDown = rangeElement.getAttribute("icon-down");
  const iconUp = rangeElement.getAttribute("icon-up");

  if (iconDown && iconUp && !showInput) {
    const downIcon = document.createElement("ion-icon");
    downIcon.className = "range-icon down";
    downIcon.setAttribute("name", iconDown);
    wrapper.appendChild(downIcon);
  }

  const rangeContainer = document.createElement("div");
  rangeContainer.className = "csd-range-container";

  const track = document.createElement("div");
  track.className = "csd-range-track";

  const fill = document.createElement("div");
  fill.className = "csd-range-fill";

  const handles = isDouble
    ? [document.createElement("div"), document.createElement("div")]
    : [document.createElement("div")];

  handles.forEach((handle, i) => {
    handle.className = "csd-range-handle";
    handle.setAttribute("data-handle", i);
  });

  // Build structure
  rangeContainer.appendChild(track);
  rangeContainer.appendChild(fill);
  handles.forEach((handle) => rangeContainer.appendChild(handle));
  wrapper.appendChild(rangeContainer);

  // Add input if needed
  let inputs = [];
  if (showInput) {
    if (isDouble) {
      const inputGroup = document.createElement("div");
      inputGroup.className = "csd-range-input-group";

      const input1 = document.createElement("input");
      input1.type = "number";
      input1.className = "csd-input csd-range-input";
      input1.setAttribute("data-handle", "0");
      input1.min = min;
      input1.max = max;
      input1.step = step;

      const input2 = document.createElement("input");
      input2.type = "number";
      input2.className = "csd-input csd-range-input";
      input2.setAttribute("data-handle", "1");
      input2.min = min;
      input2.max = max;
      input2.step = step;

      const separator = document.createElement("span");
      separator.className = "csd-range-input-separator";
      separator.textContent = "-";

      inputGroup.appendChild(input1);
      inputGroup.appendChild(separator);
      inputGroup.appendChild(input2);
      wrapper.appendChild(inputGroup);
      inputs = [input1, input2];
    } else {
      const input = document.createElement("input");
      input.type = "number";
      input.className = "csd-input csd-range-input";
      input.setAttribute("data-handle", "0");
      input.min = min;
      input.max = max;
      input.step = step;
      wrapper.appendChild(input);
      inputs = [input];
    }
  }

  // Move original range into wrapper and hide it
  const originalElement = $originalRange.elements[0];
  originalElement.style.display = "none";
  originalElement.parentNode.replaceChild(wrapper, originalElement);
  wrapper.appendChild(originalElement);

  if (iconDown && iconUp && !showInput) {
    const upIcon = document.createElement("ion-icon");
    upIcon.className = "range-icon up";
    upIcon.setAttribute("name", iconUp);
    wrapper.appendChild(upIcon);

  }

  // Get CSD wrappers for DOM elements
  const $wrapper = $CSD(wrapper);
  const $rangeContainer = $CSD(rangeContainer);
  const $track = $CSD(track);
  const $fill = $CSD(fill);
  const $handles = handles.map((h) => $CSD(h));
  const $inputs = inputs.map((i) => $CSD(i));

  // Update visual state
  function updateUI(newValues = values, changeVal = true) {
    values = newValues;
    const range = max - min;

    if (isDouble) {
      const leftPercent = ((values[0] - min) / range) * 100;
      const rightPercent = ((values[1] - min) / range) * 100;
      $fill.css("left", leftPercent + "%");
      $fill.css("width", rightPercent - leftPercent + "%");
      $handles[0].css("left", leftPercent + "%");
      $handles[1].css("left", rightPercent + "%");
      if (showInput) {
        $inputs[0].val(values[0]);
        $inputs[1].val(values[1]);
      }
    } else {
      const percent = ((values[0] - min) / range) * 100;
      $fill.css("width", percent + "%");
      $handles[0].css("left", percent + "%");
      if (showInput) {
        $inputs[0].val(values[0]);
      }
    }

    // Trigger change event
    if (changeVal)
      $originalRange
        .val(isDouble ? values.join(",") : values[0])
        .trigger("change");
  }

  // Handle drag functionality
  let isDragging = false;
  let activeHandle = null;
  const $document = $CSD(document);

  function getValueFromPosition(clientX) {
    const rect = rangeContainer.getBoundingClientRect();
    const position = (clientX - rect.left) / rect.width;
    let value = min + (max - min) * position;
    value = Math.round(value / step) * step;
    return Math.max(min, Math.min(max, value));
  }

  function moveHandler(e) {
    if (!isDragging) return;

    const newValue = getValueFromPosition(e.clientX);
    let newValues = [...values];

    if (isDouble) {
      if (activeHandle === 0) {
        if (newValue <= values[1]) newValues[0] = newValue;
      } else {
        if (newValue >= values[0]) newValues[1] = newValue;
      }
    } else {
      newValues[0] = newValue;
    }

    updateUI(newValues);
    e.preventDefault();
  }

  function upHandler() {
    if (!isDragging) return;
    isDragging = false;
    activeHandle = null;
    $document.off("mousemove", moveHandler);
    $document.off("mouseup", upHandler);
  }

  function touchMoveHandler(e) {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches[0];
    const newValue = getValueFromPosition(touch.clientX);
    let newValues = [...values];

    if (isDouble) {
      if (activeHandle === 0) {
        if (newValue <= values[1]) newValues[0] = newValue;
      } else {
        if (newValue >= values[0]) newValues[1] = newValue;
      }
    } else {
      newValues[0] = newValue;
    }

    updateUI(newValues);
  }

  function touchEndHandler(e) {
    if (!isDragging) return;
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    isDragging = false;
    activeHandle = null;

    document.removeEventListener("touchmove", touchMoveHandler);
    document.removeEventListener("touchend", touchEndHandler);
    document.removeEventListener("touchcancel", touchEndHandler);
  }

  // Track click handler
  track.addEventListener("mousedown", function (e) {
    const newValue = getValueFromPosition(e.clientX);

    if (isDouble) {
      const handle0Distance = Math.abs(newValue - values[0]);
      const handle1Distance = Math.abs(newValue - values[1]);
      activeHandle = handle0Distance < handle1Distance ? 0 : 1;
    } else {
      activeHandle = 0;
    }

    isDragging = true;
    updateUI(
      isDouble
        ? activeHandle === 0
          ? [newValue, values[1]]
          : [values[0], newValue]
        : [newValue]
    );

    $document.on("mousemove", moveHandler);
    $document.on("mouseup", upHandler);
    e.preventDefault();
  });

  track.addEventListener("touchstart", function (e) {
    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches[0];
    const newValue = getValueFromPosition(touch.clientX);

    if (isDouble) {
      const distanceToFirst = Math.abs(newValue - values[0]);
      const distanceToSecond = Math.abs(newValue - values[1]);
      activeHandle = distanceToFirst < distanceToSecond ? 0 : 1;
    } else {
      activeHandle = 0;
    }

    isDragging = true;
    updateUI([
      ...values.slice(0, activeHandle),
      newValue,
      ...values.slice(activeHandle + 1),
    ]);

    document.addEventListener("touchmove", touchMoveHandler, {
      passive: false,
    });
    document.addEventListener("touchend", touchEndHandler, { passive: false });
    document.addEventListener("touchcancel", touchEndHandler, {
      passive: false,
    });
  });

  // Handle drag events
  handles.forEach((handle, index) => {
    handle.addEventListener("mousedown", function (e) {
      isDragging = true;
      activeHandle = index;
      $document.on("mousemove", moveHandler);
      $document.on("mouseup", upHandler);
      e.stopPropagation();
      e.preventDefault();
    });

    // Touch events
    handle.addEventListener("touchstart", function (e) {
      e.preventDefault();
      e.stopPropagation();
      isDragging = true;
      activeHandle = index;

      document.addEventListener("touchmove", touchMoveHandler, {
        passive: false,
      });
      document.addEventListener("touchend", touchEndHandler, {
        passive: false,
      });
      document.addEventListener("touchcancel", touchEndHandler, {
        passive: false,
      });
    });
  });

  // Handle input changes
  if (showInput) {
    inputs.forEach((input, index) => {
      input.addEventListener("input", function () {
        const newValue = parseFloat(this.value);
        if (isNaN(newValue)) return;

        let newValues = [...values];
        if (isDouble) {
          if (index === 0 && newValue <= values[1]) {
            newValues[0] = newValue;
          } else if (index === 1 && newValue >= values[0]) {
            newValues[1] = newValue;
          }
        } else {
          newValues[0] = Math.max(min, Math.min(max, newValue));
        }

        updateUI(newValues);
      });
    });
  }

  // Override val method for range input
  const rangeData = {
    element: originalElement,
    isDouble,
    min,
    max,
    step,
    values,
    updateUI: (values, changeVal) => updateUI(values, changeVal),
  };
  originalElement._rangeData = rangeData;

  // Extend CSD prototype for range inputs
  if (!_CSD_UTILS.prototype._originalVal) {
    _CSD_UTILS.prototype._originalVal = _CSD_UTILS.prototype.val;
    _CSD_UTILS.prototype.val = function (value) {
      const el = this.elements[0];
      if (el && el._rangeData) {
        if (arguments.length === 0) {
          return this._originalVal();
        }

        const result = this._originalVal(value);
        const {
          isDouble,
          min,
          max,
          step,
          values: currentValues,
          updateUI,
        } = el._rangeData;

        function roundToStep(value) {
          return Math.round(value / step) * step;
        }

        // Update UI when value is set
        if (isDouble) {
          const parts = value.toString().split(",");
          let newValues = [...currentValues];

          if (parts.length === 1) {
            // Se viene fornito un solo valore, aggiorna solo il primo handle
            const val = parseFloat(parts[0]);
            if (!isNaN(val)) {
              const roundedVal = roundToStep(Math.max(min, Math.min(max, val)));
              if (roundedVal <= newValues[1]) {
                newValues[0] = roundedVal;
              }
            }
          } else {
            // Se vengono forniti entrambi i valori, aggiornali
            const [val1, val2] = parts.map((v) => {
              const parsed = parseFloat(v);
              return isNaN(parsed)
                ? min
                : roundToStep(Math.max(min, Math.min(max, parsed)));
            });
            if (val1 <= val2) {
              newValues = [val1, val2];
            }
          }
          updateUI(newValues, false);
        } else {
          const val = parseFloat(value);
          const newVal = isNaN(val)
            ? min
            : roundToStep(Math.max(min, Math.min(max, val)));
          updateUI([newVal], false);
        }

        return result;
      }
      return this._originalVal.apply(this, arguments);
    };
  }

  // Initial UI update
  updateUI();
}

export { initializeRange };