/**
 * Destroys a custom select instance, removing all event handlers and custom DOM elements
 * @param {HTMLElement} selectElement - The original select element
 */
function destroyCustomSelect(selectElement) {
  if (!selectElement) return;
  
  const $select = $CSD(selectElement);
  
  // Check if the element is already initialized
  if (!$select.attr('data-csd-select-initialized')) {
    return; // Not initialized, nothing to destroy
  }
  
  // Find the wrapper that was created during initialization
  const $wrapper = $select.closest('.csd-select-wrapper').length ? 
                  $select.closest('.csd-select-wrapper') : 
                  $select.next('.csd-select-wrapper');
  
  // Remove document event listeners with namespace
  const eventNamespace = $select.data('event-namespace');
  if (eventNamespace) {
    $CSD(document).off(eventNamespace);
  }
                  
  if ($wrapper.length) {
    // Remove event listeners by replacing elements with clones
    $wrapper.find('.csd-select-display, .csd-select-option, .csd-select-arrow, .csd-select-clearbutton, .delete-chip')
      .each(function() {
        const $element = $CSD(this);
        const $newElement = $element.clone(false, true); // Clone without events but with children
        $element.replaceWith($newElement);
      });
    
    // Show the original select again
    $select.css('display', '');
    
    // Remove the wrapper
    $wrapper.remove();
  }
  
  // Remove the initialized flag
  $select.removeAttr('data-csd-select-initialized');
}

function initializeCustomSelect(selectElement) {
  // Check if element exists, otherwise terminate
  if (!selectElement) return;
  const $select = $CSD(selectElement);

  // Check if the element is already initialized
  if ($select.attr('data-csd-select-initialized')) {
    // If already initialized, destroy it first
    destroyCustomSelect(selectElement);
  }
  const groupOptions = $select.find("optgroup");
  const options = $select.find("option");
  const idSelect = $select.attr("id");
  const placeholder =
    $select.attr("placeholder") ||
    options.filter('[selected][value=""]').text() ||
    "Seleziona un'opzione";
  const classCssExtra = [];
  selectElement.classList.contains("compact")
    ? classCssExtra.push("csd-select-compact")
    : "";
  selectElement.classList.contains("checkmark")
    ? classCssExtra.push("csd-select-checkmark")
    : "";
  selectElement.classList.contains("checkmark-all")
    ? classCssExtra.push("csd-select-checkmark")
    : "";
  selectElement.classList.contains("chips")
    ? classCssExtra.push("csd-select-chips")
    : "";

  // Crea il wrapper personalizzato
  const $wrapper = $CSD('<div class="csd-select-wrapper"></div>');
  const $customSelect = $CSD(
    '<div class="csd-custom-select ' + classCssExtra.join(" ") + '"></div>'
  );
  const isMultipleSelect = selectElement.hasAttribute("multiple");
  let $display = $CSD('<div class="csd-select-display"></div>');
  $display.html('<label class="csd-label-select">' + placeholder + "</label>");
  
  if (selectElement.classList.contains("editable")) {
    $display = $CSD(
      '<input type="text" class="csd-searchbar-input csd-select-display csd-select-editable csd-input" placeholder="Seleziona un\'opzione">'
    );
  }

  let checkmark = false;
  if (
    selectElement.classList.contains("checkmark") ||
    selectElement.classList.contains("checkmark-all")
  ) {
    checkmark = '<ion-icon name="checkmark-sharp"></ion-icon>';
  }

  const searchbarHtml = selectElement.classList.contains("checkmark-all")
    ? '<div class="csd-select-searchbar-checkbox"></div><input type="text" class="csd-searchbar-input csd-input" placeholder="Cerca..." id="searchInput">'
    : '<input type="text" class="csd-searchbar-input csd-input" placeholder="Cerca..." id="searchInput"><ion-icon class="csd-searchbar-icon" name="search-sharp">';

  const $searchbar = $CSD('<div class="csd-select-searchbar">').html(
    searchbarHtml
  );
  const $arrow = $CSD(
    '<div class="csd-select-arrow"><ion-icon class="csd-select-arrow-icon" name="chevron-down-sharp"></ion-icon></div>'
  );
  const $clearButton = $CSD(
    '<div class="csd-select-clearbutton"><ion-icon name="close-sharp"></ion-icon></div>'
  );
  const $optionsContainer = $CSD(
    '<div class="csd-select-options ' + classCssExtra.join(" ") + '"></div>'
  );

  // Hide original select
  $select.css('display', 'none');

  if (selectElement.classList.contains("searchable")) {
    $optionsContainer.append($searchbar);
  }

  // Add option groups
  groupOptions.each(function () {
    const $group = $CSD(this);
    const $groupLabel = $CSD(
      '<div class="csd-select-group-label"><div class="csd-select-group-label-text">' +
        $group.attr("label") +
        "</div></div>"
    );
    const $groupOptions = $CSD('<div class="csd-select-group-options"></div>');
    
    $group.find("option").each(function () {
      const $option = $CSD(this);
      const value = $option.attr('value');
      const text = $option.text();
      let htmlText = text;
      if (checkmark) htmlText = checkmark + text;
      const $customOption = $CSD(
        `<div class="csd-select-option" data-value="${value}">${htmlText}</div>`
      );
      $groupOptions.append($customOption);
    });
    
    $groupOptions.prepend($groupLabel);
    $optionsContainer.append($groupOptions);
  });

  // Add individual options
  if (groupOptions.length === 0) {
    options.each(function () {
      const $option = $CSD(this);
      const value = $option.val();
      const text = $option.text();
      let htmlText = text;
      if (checkmark) htmlText = checkmark + text;

      if (value) {
        const $customOption = $CSD(
          `<div class="csd-select-option" data-value="${value}">${htmlText}</div>`
        );
        $optionsContainer.append($customOption);
      }
    });
  }

  // Add components to wrapper
  $customSelect.append($display);
  $customSelect.append($arrow).append($clearButton);
  $wrapper.append($customSelect);
  $wrapper.append($optionsContainer);

  // Insert wrapper into DOM
  $select.after($wrapper);

  // Add keyboard navigation
  $CSD(document).off("keydown").on("keydown", function (e) {
    const $activeWrapper = $CSD(".csd-select-wrapper").filter(function () {
      return $CSD(this).find(".csd-select-options").hasClass("visible");
    });

    if ($activeWrapper.length) {
      handleKeyboardNavigation($activeWrapper, e);
    }
  });

  // Close all options when clicking outside
  $CSD(document).on("click", function (e) {
    if (!e.target.closest('.csd-select-wrapper')) {
      $CSD(".csd-select-options").removeClass("visible");
      filterOptions($CSD(".csd-select-wrapper"), "");
      $CSD(".csd-searchbar-input:not(.csd-select-editable)").val("");
    }
  });

  // Add event listeners using event delegation
  if (!selectElement.classList.contains("editable")) {
    $wrapper.on("click", ".csd-select-display", function (e) {
      e.stopPropagation();
      const $thisWrapper = $CSD(this).closest(".csd-select-wrapper");
      const $thisOptionsContainer = $thisWrapper.find(".csd-select-options");
      
      $CSD(".csd-select-options").not($thisOptionsContainer).removeClass("visible");
      
      calculateDropdownPosition($CSD(this), $thisOptionsContainer);
      
      $thisOptionsContainer.toggleClass("visible");
      if ($searchbar.length) $searchbar.find("input").focus();
    });
  }

  $wrapper.on("click", ".csd-select-arrow", function (e) {
    e.stopPropagation();
    const $thisWrapper = $CSD(this).closest(".csd-select-wrapper");
    const $thisDisplay = $thisWrapper.find(".csd-select-display");
    const $thisOptionsContainer = $thisWrapper.find(".csd-select-options");
    
    calculateDropdownPosition($thisDisplay, $thisOptionsContainer);
    
    $CSD(".csd-select-options").not($thisOptionsContainer).removeClass("visible");
    $thisOptionsContainer.toggleClass("visible");
  });

  $wrapper.on("click", ".csd-select-clearbutton", function (e) {
    e.stopPropagation();
    const $thisWrapper = $CSD(this).closest(".csd-select-wrapper");
    selectOption($thisWrapper, "", placeholder, idSelect);
  });

  $wrapper.on("click", ".csd-select-searchbar", function (e) {
    e.stopPropagation();
  });

  // Add events for both searchbar and display
  $wrapper.on("input", ".csd-searchbar-input", function (e) {
    e.stopPropagation();
    const $thisWrapper = $CSD(this).closest(".csd-select-wrapper");
    const searchValue = $CSD(this).val();
    filterOptions($thisWrapper, searchValue);
  });

  $wrapper.on("input", ".csd-select-editable", function (e) {
    e.stopPropagation();
    const $thisWrapper = $CSD(this).closest(".csd-select-wrapper");
    const $thisOptionsContainer = $thisWrapper.find(".csd-select-options");
    
    calculateDropdownPosition($CSD(this), $thisOptionsContainer);
    
    $thisOptionsContainer.addClass("visible");
    const searchValue = $CSD(this).val();
    filterOptions($thisWrapper, searchValue);
  });

  // Handle option events
  $wrapper.on("mouseenter", ".csd-select-option", function () {
    const $thisWrapper = $CSD(this).closest(".csd-select-wrapper");
    $thisWrapper.find(".csd-select-option").removeClass("option-focus");
    $CSD(this).addClass("option-focus");
  });

  $wrapper.on("mouseleave", ".csd-select-option", function () {
    $CSD(this).removeClass("option-focus");
  });

  $wrapper.on("click", ".csd-select-option", function (e) {
    e.stopPropagation();
    const $thisWrapper = $CSD(this).closest(".csd-select-wrapper");
    const value = $CSD(this).data("value");
    const text = $CSD(this).text().replace(/^✓\s*/, "");
    selectOption($thisWrapper, value, text, idSelect, isMultipleSelect);
  });

  // Add events for checkbox in searchbar if present
  if (selectElement.classList.contains("checkmark-all")) {
    // Aggiungiamo la checkbox al searchbar di questo specifico select
    const $thisSearchbar = $wrapper.find(".csd-select-searchbar");
    const $checkbox = $thisSearchbar.find(".csd-select-searchbar-checkbox");

    $wrapper.on("click", ".csd-select-searchbar-checkbox", function (e) {
      e.stopPropagation();
      const $thisWrapper = $CSD(this).closest(".csd-select-wrapper");
      const $thisSearchbarCheckbox = $CSD(this);
      const $allOptions = $thisWrapper.find(".csd-select-option");
      const $visibleOptions = $allOptions.filter(":visible");
      const allSelected = $allOptions.length === $allOptions.filter(".selected").length;

      if (allSelected) {
        $allOptions.each(function () {
          const $option = $CSD(this);
          if ($option.hasClass("selected")) {
            const value = $option.data("value").toString();
            const text = $option.text().replace(/^✓\s*/, "");
            selectOption($thisWrapper, value, text, idSelect, isMultipleSelect);
          }
        });
      } else {
        $visibleOptions.each(function () {
          const $option = $CSD(this);
          if (!$option.hasClass("selected")) {
            const value = $option.data("value").toString();
            const text = $option.text().replace(/^✓\s*/, "");
            selectOption($thisWrapper, value, text, idSelect, isMultipleSelect);
          }
        });
      }

      // Aggiorniamo solo la checkbox di questo select
      updateCheckboxIcon($thisSearchbarCheckbox, $thisWrapper);
    });

    // Delegate click event for chips
    $wrapper.on("click", ".delete-chip", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const $thisWrapper = $CSD(this).closest(".csd-select-wrapper");
      const $chip = $CSD(this).closest(".csd-select-chip");
      const text = $chip.find(".csd-label-select").text();
      selectOption($thisWrapper, $chip.data("value").toString(), text, idSelect, isMultipleSelect);
    });
  }

  // Searchbar with clear button
  const searchInput = $wrapper.find("#searchInput");
  const clearButton = $wrapper.find("#clearButton");

  // Mark the element as initialized
  $select.attr('data-csd-select-initialized', 'true');

  if (searchInput.length && clearButton.length) {
    searchInput.on("input", function () {
      clearButton.toggleClass("visible", this.value !== "");
    });

    clearButton.on("click", function () {
      searchInput.val("");
      $CSD(this).removeClass("visible");
    });
  }
}

// Funzione per aggiornare l'icona della checkbox
function updateCheckboxIcon($checkbox, $wrapper) {
  const $allOptions = $wrapper.find(".csd-select-option");
  const selectedCount = $allOptions.filter(".selected").length;

  if (selectedCount === 0) {
    $checkbox.find("ion-icon").remove();
  } else if (selectedCount === $allOptions.length) {
    $checkbox.html("<ion-icon name='checkmark-outline'></ion-icon>");
  } else {
    $checkbox.html("<ion-icon name='remove-outline'></ion-icon>");
  }
}

function handleKeyboardNavigation($wrapper, e) {
  const $optionsContainer = $wrapper.find(".csd-select-options");
  const $options = $wrapper.find(".csd-select-option:visible");
  
  // Miglioriamo la selezione dell'elemento corrente
  let $currentHovered = $wrapper.find(".csd-select-option.option-focus");
  if (!$currentHovered.length) {
    // Prima cerchiamo un elemento con hover
    $currentHovered = $wrapper.find(".csd-select-option:hover");
    
    // Se non c'è hover, cerchiamo l'elemento selezionato
    if (!$currentHovered.length) {
      $currentHovered = $wrapper.find(".csd-select-option.selected");
      if ($currentHovered.length) {
        $currentHovered.addClass("option-focus");
      }
    }
  }

  if (!$optionsContainer.hasClass("visible") || !$options.length) return;

  const updateHover = ($newHovered) => {
    // Rimuoviamo la classe da tutti gli elementi
    $options.each(function() {
      $CSD(this).removeClass("option-focus");
    });
    
    if ($newHovered && $newHovered.length) {
      $newHovered.addClass("option-focus");
      
      const container = $optionsContainer.elements[0];
      const hoveredOption = $newHovered.elements[0];

      // Calcoliamo la posizione relativa dell'elemento rispetto al container
      const containerTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const optionTop = hoveredOption.offsetTop;
      const optionHeight = hoveredOption.offsetHeight;
      const extraScrollPixels = 5;

      // Scroll verso l'alto se necessario
      if (optionTop < containerTop) {
        container.scrollTop = Math.max(0, optionTop - extraScrollPixels);
      }
      // Scroll verso il basso se necessario
      else if (optionTop + optionHeight > containerTop + containerHeight) {
        container.scrollTop = Math.min(
          container.scrollHeight - containerHeight,
          optionTop + optionHeight - containerHeight + extraScrollPixels
        );
      }
    }
  };

  const getVisibleOptions = () => {
    const visibleOptions = [];
    $options.each(function() {
      visibleOptions.push($CSD(this));
    });
    return visibleOptions;
  };

  const getCurrentIndex = () => {
    const visibleOptions = getVisibleOptions();
    const currentFocused = $wrapper.find(".csd-select-option.option-focus");
    
    if (!currentFocused.length) return -1;
    
    for (let i = 0; i < visibleOptions.length; i++) {
      if (visibleOptions[i].elements[0] === currentFocused.elements[0]) {
        return i;
      }
    }
    return -1;
  };

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      const visibleOptionsDown = getVisibleOptions();
      const currentDownIndex = getCurrentIndex();
      
      if (currentDownIndex === -1) {
        // Se non c'è focus, partiamo dall'elemento selezionato o dal primo
        const $selected = $wrapper.find(".csd-select-option.selected");
        if ($selected.length) {
          const selectedIndex = visibleOptionsDown.findIndex(opt => 
            opt.elements[0] === $selected.elements[0]
          );
          if (selectedIndex > -1) {
            updateHover(visibleOptionsDown[selectedIndex]);
          } else {
            updateHover(visibleOptionsDown[0]);
          }
        } else {
          updateHover(visibleOptionsDown[0]);
        }
      } else if (currentDownIndex === visibleOptionsDown.length - 1) {
        updateHover(visibleOptionsDown[0]); // Torna al primo
      } else {
        updateHover(visibleOptionsDown[currentDownIndex + 1]);
      }
      break;

    case "ArrowUp":
      e.preventDefault();
      const visibleOptionsUp = getVisibleOptions();
      const currentUpIndex = getCurrentIndex();
      
      if (currentUpIndex === -1) {
        // Se non c'è focus, partiamo dall'elemento selezionato o dall'ultimo
        const $selected = $wrapper.find(".csd-select-option.selected");
        if ($selected.length) {
          const selectedIndex = visibleOptionsUp.findIndex(opt => 
            opt.elements[0] === $selected.elements[0]
          );
          if (selectedIndex > -1) {
            updateHover(visibleOptionsUp[selectedIndex]);
          } else {
            updateHover(visibleOptionsUp[visibleOptionsUp.length - 1]);
          }
        } else {
          updateHover(visibleOptionsUp[visibleOptionsUp.length - 1]);
        }
      } else if (currentUpIndex === 0) {
        updateHover(visibleOptionsUp[visibleOptionsUp.length - 1]); // Vai all'ultimo
      } else {
        updateHover(visibleOptionsUp[currentUpIndex - 1]);
      }
      break;

    case "Enter":
    case "Tab":
      const currentFocused = $wrapper.find(".csd-select-option.option-focus");
      if (currentFocused.length) {
        e.preventDefault();
        const value = currentFocused.data("value");
        const text = currentFocused.text().replace(/^✓\s*/, "");
        const idSelect = $wrapper.prev(".csd-select").attr("id");
        const isMultipleSelect = $wrapper.prev(".csd-select").prop("multiple");

        selectOption($wrapper, value, text, idSelect, isMultipleSelect);
        currentFocused.removeClass("option-focus");
        $optionsContainer.removeClass("visible");
      }
      break;

    case "Escape":
      $options.each(function() {
        $CSD(this).removeClass("option-focus");
      });
      $optionsContainer.removeClass("visible");
      break;
  }
}

function calculateDropdownPosition($display, $optionsContainer) {
  const position = $display.offset();
  const viewportHeight = $CSD(window).height();
  const scrollTop = $CSD(window).scrollTop();
  const displayHeight = $display.outerHeight();
  const optionsHeight = $optionsContainer.outerHeight(); // Altezza effettiva del dropdown

  // Calcola lo spazio disponibile sotto
  const spaceBelow =
    viewportHeight - (position.top - scrollTop + displayHeight);

  // Se lo spazio sotto è minore dell'altezza delle opzioni, posiziona sopra
  if (spaceBelow < optionsHeight) {
    $optionsContainer.addClass("position-above").removeClass("position-below");
  } else {
    $optionsContainer.addClass("position-below").removeClass("position-above");
  }
}

function selectOption(
  $wrapper,
  value,
  text,
  idSelect,
  isMultipleSelect = false
) {
  const isEditable = $wrapper.find(".csd-select-editable").length > 0;
  const isChipsSelect = $wrapper.find(".csd-select-chips").length > 0;
  value = value.toString();

  let $display = $wrapper.find(".csd-select-display");
  if (isEditable) $display = $wrapper.find(".csd-select-editable");

  const $originalSelect = $wrapper.prev(".csd-select");
  const $clearButton = $wrapper.find(".csd-select-clearbutton");
  const $originalSelectById = $CSD("#" + idSelect);

  // Recupera i valori precedenti, assicurandosi che siano un array
  let oldValue = $originalSelect.val() || (isMultipleSelect ? [] : "");
  if (!Array.isArray(oldValue))
    oldValue = oldValue.split(",").filter((v) => v); // Assicura che sia un array

  const placeholder =
    $originalSelect.attr("data-placeholder") || "Seleziona un'opzione";
  const oldText = $display.find(".csd-label-select").text() || "";

  let newValue = [...oldValue]; // Copy existing values
  let newText = oldText;

  if (isMultipleSelect) {
    if (newValue.includes(value)) {
      // Remove value and text if already present
      newValue = newValue.filter((v) => v !== value);
      newText = newText
        .split(",")
        .filter((t) => t.trim() !== text)
        .join(", ");
    } else {
      // Add value and text if not present
      if (newValue.includes(placeholder)) {
        newValue = newValue.filter((v) => v !== placeholder);
        newText = newText.replace(placeholder, "").trim();
      }
      if (newText.includes(placeholder)) {
        newValue = newValue.filter((v) => v !== placeholder);
        newText = newText.replace(placeholder, "").trim();
      }
      newValue.push(value);
      newText = (newText ? newText + ", " : "") + text;
    }
  } else {
    // For single select, replace the value
    newValue = [value];
    newText = text;
  }

  $originalSelect.val(newValue).trigger("change");

  // Update display
  if (!isChipsSelect || newValue.length == 0 || newValue[0] == "") {
    $display.html(
      '<label class="csd-label-select">' + (newText || placeholder) + "</label>"
    );
  } else {
    let newHTML = "";
    let $options = $wrapper.find(".csd-select-options");
    newValue.forEach((value) => {
      const text = $options
        .find('.csd-select-option[data-value="' + value + '"]')
        .text();
      newHTML +=
        '<div class="csd-select-chip" data-value="' +
        value +
        '"><label class="csd-label-select">' +
        text +
        '</label><ion-icon class="delete-chip" name="close-circle-outline"></ion-icon></div>';
    });
    if (newHTML == "") {
      $display.html(
        '<label class="csd-label-select">' + placeholder + "</label>"
      );
    } else {
      $display.html('<div class="csd-select-chips">' + newHTML + "</div>");
    }

    $display.find(".delete-chip").on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const $chip = $CSD(this).closest(".csd-select-chip");
      const text = $chip.find(".csd-label-select").text();
      selectOption(
        $wrapper,
        $chip.data("value").toString(),
        text,
        idSelect,
        isMultipleSelect
      );
    });
  }
  if (isEditable) $display.val(newText || "");
  if (isEditable && newValue.length === 0) $display.val("");

  // Handle reset button visibility
  const hasValue = newValue.length > 0 && newValue[0] !== "";
  toggleVisibility($clearButton, hasValue);

  // Update options state
  $wrapper.find(".csd-select-option").each(function () {
    const $option = $CSD(this);
    const optionValue = $option.data("value").toString();
    if (newValue.includes(optionValue)) {
      $option.addClass("selected");
    } else {
      $option.removeClass("selected");
    }
  });

  // Update checkbox state if present
  const $searchbarCheckbox = $wrapper.find(".csd-select-searchbar-checkbox");
  if ($searchbarCheckbox && $searchbarCheckbox.length) {
    updateCheckboxIcon($searchbarCheckbox, $wrapper);
  }

  if (!isMultipleSelect)
    $wrapper.find(".csd-select-options").removeClass("visible");
}

function toggleVisibility($element, condition) {
  $element.toggleClass("visible", condition);
}

function filterOptions($wrapper, searchValue) {
  // Converte il valore di ricerca in minuscolo per un confronto case-insensitive
  searchValue = searchValue.toLowerCase();
  // Conta quante opzioni corrispondono al filtro
  let matchCount = 0;

  // Filtra le opzioni della select
  $wrapper.find(".csd-select-option").each(function () {
    const optionText = $CSD(this).text().toLowerCase();
    const isMatch = optionText.includes(searchValue);
    $CSD(this).toggle(isMatch); // Mostra o nasconde l'opzione
    if (isMatch) matchCount++;
  });

  // Gestione del messaggio "Nessun risultato trovato"
  let $noResultsMessage = $wrapper.find(".csd-no-results");
  if ($noResultsMessage.length === 0) {
    // Se il messaggio non esiste, lo crea
    $noResultsMessage = $CSD(
      '<div class="csd-no-results" style="display:none">Nessun risultato trovato</div>'
    );
    $wrapper.find(".csd-select-options").append($noResultsMessage);
  }

  // Mostra o nasconde il messaggio in base al risultato
  $noResultsMessage.toggle(matchCount === 0);
}

export { initializeCustomSelect };