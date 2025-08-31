/**
 * Triggers a custom accordion event with detailed state information
 * @param $item - The accordion item that triggered the event
 * @param {string} action - The action that was performed (show, hide, show-all, hide-all)
 * @param {boolean} fromFunction - Whether the event was triggered from showAccordion function
 * @private
 */
function _triggerAccordionEvent($item, action, fromFunction = false) {
  const $accordion = $item.closest(".csd-accordion");
  const $allItems = $accordion.find(".csd-accordion-item");
  const $openItems = $allItems.filter(".open");

  // Create event object with all details
  const eventData = {
    type: "csd_accordion_change", // - type: "csd_accordion_change"
    action: action, // - action: "show", "hide", "show-all", o "hide-all"
    fromFunction: fromFunction, // - fromFunction: true if the event was triggered from showAccordion function
    targetValue: $item.attr("value"), // - targetValue: value of the target element
    isMultiple: $accordion.hasClass("multiple"), // - isMultiple: if the accordion is multiple
    totalItems: $allItems.length, // - totalItems: total number of items
    openItems: $openItems.length, // - openItems: number of open items
    allOpen: $allItems.length === $openItems.length, // - allOpen: true if all items are open
    allClosed: $openItems.length === 0, // - allClosed: true if all items are closed
    openValues: (() => {
      // - openValues: array of open item values
      const array = [];
      $openItems.each(function () {
        array.push($CSD(this).attr("value"));
      });
      return array;
    })(),
  };

  // Trigger the event using CSD library on the accordion element
  $accordion.trigger(eventData);
}

/**
 * Destroys an accordion instance, removing all event handlers and data attributes
 * @param {HTMLElement} element - The root DOM element of the accordion
 */
function destroyAccordion(element) {
  if (!element) return;

  const $element = $CSD(element);
  
  // Check if the element is already initialized
  if (!$element.attr('data-csd-accordion-initialized')) {
    return; // Not initialized, nothing to destroy
  }
  
  // Carefully remove only our event listeners
  const $headers = $element.find(".csd-accordion-header");
  $headers.each(function() {
    const $header = $CSD(this);
    // Clona il contenuto dell'header senza eventi ma mantenendo i figli
    const $newHeader = $header.clone(false, true);
    // Rimuovi solo l'icona accordion che abbiamo aggiunto
    $newHeader.find(".csd-accordion-icon").remove();
    // Sostituisci il vecchio header con quello nuovo (senza eventi)
    $header.replaceWith($newHeader);
  });
  
  // Remove the initialized flag
  $element.removeAttr('data-csd-accordion-initialized');
}

/**
 * Accordion Component
 * Initializes the accordion behavior on a DOM element
 * @param {HTMLElement} element - The root DOM element of the accordion
 */
function initializeAccordion(element) {
  // Check if element exists, otherwise terminate
  if (!element) return;

  const $element = $CSD(element);
  
  // Check if the element is already initialized
  if ($element.attr('data-csd-accordion-initialized')) {
    // If already initialized, destroy it first
    destroyAccordion(element);
  }

  const $accordionItems = $element.find(".csd-accordion-item");
  // Check if the accordion allows multiple items to be open
  const isMultiple = $element.hasClass("multiple");

  // Iterate over each accordion item
  $accordionItems.each(function (item) {
    const $item = $CSD(item);
    // Find the header of the current item
    const $header = $item.find(".csd-accordion-header");
    // Create chevron icon using ion-icons
    const $icon = $CSD(
      '<ion-icon name="chevron-down-outline" class="csd-accordion-icon"></ion-icon>'
    );

    // If header exists and is not disabled
    if ($header.length && !$header.prop("disabled")) {
      // Add the icon to the header
      $header.append($icon);
      // Add click event handler
      $header.on("click", function () {
        // Find the closest accordion-item to the clicked header
        const $currentItem = $CSD(this).closest(".csd-accordion-item");

        // If multiple open items are not allowed, close all other items
        if (!isMultiple) {
          $accordionItems.not($currentItem).removeClass("open");
        }

        // Toggle the 'open' class on the current item
        $currentItem.toggleClass("open");

        // Trigger event with the new state
        _triggerAccordionEvent(
          $currentItem,
          $currentItem.hasClass("open") ? "show" : "hide"
        );
      });
    }
  });
  
  // Mark the element as initialized
  $element.attr('data-csd-accordion-initialized', 'true');
}

/**
 * Function to handle accordion actions
 * @param {string} param - Action parameter:
 *   - 'show-all': Opens all items in multiple accordion
 *   - 'hide-all': Closes all items in multiple accordion
 *   - any other value: Toggles item with matching value attribute
 * @throws {TypeError} When parameter is missing or of wrong type
 * @throws {ReferenceError} When required elements are not found
 * @throws {SyntaxError} When action is not allowed for accordion type
 */
function showAccordion(param) {
  try {
    // Validate input parameter type
    if (!param || (typeof param !== "string" && typeof param !== "number")) {
      throw new TypeError(
        "Missing or invalid parameter type for showAccordion function"
      );
    }

    // Get all accordion items with value attribute
    const $items = $CSD(".csd-accordion-item[value]");
    if ($items.length === 0) {
      throw new ReferenceError("No accordion items found with value attribute");
    }

    // Normalize param by removing quotes if present
    const normalizedParam = param.replace(/^['"](.+)['"]$/, "$1");

    // Handle show-all action
    if (normalizedParam === "show-all") {
      const $multipleItems = $items.filter(function () {
        return $CSD(this).closest(".csd-accordion").hasClass("multiple");
      });

      if ($multipleItems.length === 0) {
        throw new ReferenceError(
          "show-all is not allowed for single-accordion"
        );
      }

      $multipleItems.addClass("open");
      // Trigger event for show-all
      _triggerAccordionEvent($multipleItems.first(), "show-all", true);
      return;
    }

    // Handle hide-all action
    if (normalizedParam === "hide-all") {
      const $multipleItems = $items.filter(function () {
        return $CSD(this).closest(".csd-accordion").hasClass("multiple");
      });

      if ($multipleItems.length === 0) {
        throw new ReferenceError(
          "hide-all is not allowed for single-accordion"
        );
      }

      $multipleItems.removeClass("open");
      // Trigger event for hide-all
      _triggerAccordionEvent($multipleItems.first(), "hide-all", true);
      return;
    }

    // Handle individual item toggle
    const $item = $CSD(".csd-accordion-item").filter(
      `[value="${normalizedParam}"]`
    );
    if ($item.length === 0) {
      throw new ReferenceError(
        `No accordion item found with value "${normalizedParam}"`
      );
    }

    // Get accordion type and handle toggle
    const isMultiple = $item.closest(".csd-accordion").hasClass("multiple");
    if (!isMultiple) {
      $items.not($item).removeClass("open");
    }

    // Toggle the item and trigger event
    const wasOpen = $item.hasClass("open");
    $item.toggleClass("open");
    _triggerAccordionEvent($item, wasOpen ? "hide" : "show", true);
  } catch (error) {
    if (
      error instanceof TypeError ||
      error instanceof ReferenceError ||
      error instanceof SyntaxError
    ) {
      throw error;
    }
    throw new Error(`Accordion error: ${error.message}`);
  }
}

export { initializeAccordion, showAccordion };
