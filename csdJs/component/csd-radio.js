/**
 * Triggers a custom radio event with detailed state information
 * @param $radio - The radio item that triggered the event
 * @private
 */
function _triggerRadioEvent($radio) {  
  // Create event object with all details
  const $wrapper = $radio.closest(".csd-field");
  const $allItems = $wrapper.find(".csd-radio-input");
  const $checkedItem = $allItems.find(".csd-radio-input:checked");

  const eventData = {
    type: "csd_change",
    action: "change",
    item: $radio,
    targetValue: $radio.attr("value"),
    totalItems: $allItems.length,
    selectedValue: $checkedItem.length ? $checkedItem.attr("value") :  null,
    selectedLabel: $checkedItem.length ? 
      $checkedItem.closest(".csd-radio-wrapper").find(".csd-radio-label").text() : null,
    hasSelection: $checkedItem.length > 0
  };

  // Trigger the event using CSD library on the radio element
  $radio.trigger(eventData);
}

// Funzione per ottenere il valore del radio selezionato
function getRadioValue(name) {
  const values = [];
  const $radios = $CSD(`.csd-radio-wrapper input[name="${name}"]`);

  $radios.each(function () {
    const $input = $CSD(this);
    values.push({
      value: $input.val() || "on",
      checked: $input.elements[0].checked,
      disabled: $input.elements[0].disabled,
      label: $input
        .closest(".csd-radio-wrapper")
        .find(".csd-radio-label")
        .text(),
    });
  });

  return values;
};

function initializeRadio(radioElement) {
  const $originalRadio = $CSD(radioElement);
  const label = $originalRadio.attr("label") || "";
  const id =
    $originalRadio.attr("id") ||
    "radio-" + Math.random().toString(36).substr(2, 9);

  const $wrapper = $CSD('<div class="csd-radio-wrapper"></div>');
  const $radio = $CSD('<div class="csd-radio"></div>');
  const $input = $CSD('<input type="radio" class="csd-radio-input">').attr(
    "id",
    id
  );
  const $box = $CSD(
    '<div class="csd-radio-box"><div class="csd-radio-dot"></div></div>'
  );

  // Copia le proprietà dall'originale
  if ($originalRadio.elements[0].checked) $input.elements[0].checked = true;
  if ($originalRadio.elements[0].disabled) $input.elements[0].disabled = true;
  if ($originalRadio.attr("name"))
    $input.attr("name", $originalRadio.attr("name"));
  if ($originalRadio.attr("value"))
    $input.attr("value", $originalRadio.attr("value"));

  // Copia le classi, escludendo csd-radio
  const originalClass = $originalRadio.attr("class");
  if (originalClass) {
    const newClass = originalClass
      .split(" ")
      .filter((cls) => cls !== "csd-radio")
      .join(" ");
    if (newClass) $input.addClass(newClass);
  }

  // Copia altri attributi
  const originalElement = $originalRadio.elements[0];
  for (let i = 0; i < originalElement.attributes.length; i++) {
    const attr = originalElement.attributes[i];
    if (!["type", "class", "id"].includes(attr.name)) {
      $input.attr(attr.name, attr.value);
    }
  }

  $radio.append($input);
  $radio.append($box);
  $wrapper.append($radio);

  if (label) {
    const $label = $CSD('<label class="csd-radio-label"></label>')
      .text(label)
      .attr("for", id);
    $wrapper.append($label);
  }

  $originalRadio.replaceWith($wrapper);

  $wrapper.find('.csd-radio-label').on("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!$wrapper.find('.csd-radio-input').prop("disabled")) {
      $wrapper.find('.csd-radio-input').prop("checked", true);
      _triggerRadioEvent($wrapper.find('.csd-radio-input'));
    }
  });

  $wrapper.find('.csd-radio-box').on("click", function (e) {
    e.preventDefault();
    if (!$wrapper.find('.csd-radio-input').prop("disabled")) {
      $wrapper.find('.csd-radio-input').prop("checked", true);
      _triggerRadioEvent($wrapper.find('.csd-radio-input'));
    }
  });
}

// Aggiungiamo la funzione a window se siamo in ambiente browser
if (typeof window !== 'undefined') {
  window.getRadioValue = getRadioValue;
}

export { initializeRadio, getRadioValue };