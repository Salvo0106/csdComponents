/**
 * Triggers a custom checkbox event with detailed state information
 * @param $checkbox - The checkbox item that triggered the event
 * @private
 */
function _triggerCheckboxEvent($checkbox) {  
  // Create event object with all details
  const $wrapper = $checkbox.closest(".csd-field");
  const $allItems = $wrapper.find(".csd-checkbox-input");
  const $checkedItems = $allItems.find(".csd-checkbox-input:checked");

  const eventData = {
    type: "csd_change", // - type: "change"
    action: "change", // - action: "change"
    item: $checkbox, // - item triggered
    targetValue: $checkbox.attr("value"), // - targetValue: value of the target element
    totalItems: $allItems.length, // - totalItems: total number of items
    checkedItems: $checkedItems.length, // - checkedItems: number of checked items
    allChecked: $allItems.length === $checkedItems.length, // - allChecked: true if all items are checked
    allUnchecked: $checkedItems.length === 0, // - allUnchecked: true if all items are unchecked
    checkedValues: (() => {
      // - checkedValues: array of checked item values
      const array = [];
      $checkedItems.each(function () {
        array.push($CSD(this).attr("value"));
      });
      return array;
    })(),
  };

  // Trigger the event using CSD library on the button element
  $checkbox.trigger(eventData);
}

function initializeCheckbox(checkboxElement) {
  const $originalCheckbox = $CSD(checkboxElement);
  const label = $originalCheckbox.attr("label") || "";
  const id =
    $originalCheckbox.attr("id") ||
    "checkbox-" + Math.random().toString(36).substr(2, 9);

  const $wrapper = $CSD('<div class="csd-checkbox-wrapper"></div>');
  const $checkbox = $CSD('<div class="csd-checkbox"></div>');
  const $input = $CSD(
    '<input type="checkbox" class="csd-checkbox-input">'
  ).attr("id", id);
  const $box = $CSD(
    '<div class="csd-checkbox-box"><ion-icon name="checkmark-sharp"></ion-icon></div>'
  );

  // Copia le proprietà dall'originale
  if ($originalCheckbox.elements[0].checked) $input.elements[0].checked = true;
  if ($originalCheckbox.elements[0].disabled)
    $input.elements[0].disabled = true;
  if ($originalCheckbox.attr("name"))
    $input.attr("name", $originalCheckbox.attr("name"));
  if ($originalCheckbox.attr("value"))
    $input.attr("value", $originalCheckbox.attr("value"));

  // Copia le classi, escludendo csd-checkbox
  const originalClass = $originalCheckbox.attr("class");
  if (originalClass) {
    const newClass = originalClass
      .split(" ")
      .filter((cls) => cls !== "csd-checkbox")
      .join(" ");
    if (newClass) $input.addClass(newClass);
  }

  // Copia altri attributi
  const originalElement = $originalCheckbox.elements[0];
  for (let i = 0; i < originalElement.attributes.length; i++) {
    const attr = originalElement.attributes[i];
    if (!["type", "class", "id"].includes(attr.name)) {
      $input.attr(attr.name, attr.value);
    }
  }

  $checkbox.append($input);
  $checkbox.append($box);
  $wrapper.append($checkbox);

  if (label) {
    const $label = $CSD('<label class="csd-checkbox-label"></label>')
      .text(label)
      .attr("for", id);
    $wrapper.append($label);
  }

  $originalCheckbox.replaceWith($wrapper);

  $wrapper.find('.csd-checkbox-label').on("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!$wrapper.find('.csd-checkbox-input').prop("disabled")) {
      const checked = $wrapper.find('.csd-checkbox-input').prop("checked");
      $wrapper.find('.csd-checkbox-input').prop("checked", !checked);
      _triggerCheckboxEvent($wrapper.find('.csd-checkbox-input'));
    }
  });

  $wrapper.find('.csd-checkbox-box').on("click", function (e) {
    e.preventDefault();
    if (!$wrapper.find('.csd-checkbox-input').prop("disabled")) {
      const checked = $wrapper.find('.csd-checkbox-input').prop("checked");
      $wrapper.find('.csd-checkbox-input').prop("checked", !checked);
      _triggerCheckboxEvent($wrapper.find('.csd-checkbox-input'));
    }
  });
}

// Funzione per ottenere i valori dei checkbox
function getCheckboxValues(name) {
  const values = [];
  const $checkboxes = $CSD(`.csd-checkbox-wrapper input[name="${name}"]`);

  $checkboxes.each(function () {
    const $input = $CSD(this);
    values.push({
      value: $input.val() || "on",
      checked: $input.elements[0].checked,
      disabled: $input.elements[0].disabled,
      label: $input
        .closest(".csd-checkbox-wrapper")
        .find(".csd-checkbox-label")
        .text(),
    });
  });

  return values;
};

// Esponi globalmente solo se window è disponibile
if (typeof window !== 'undefined') {
  window.getCheckboxValues = getCheckboxValues;
}

export { initializeCheckbox, getCheckboxValues };
