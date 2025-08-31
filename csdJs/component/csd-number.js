// Funzione per inizializzare gli input number
function initializeNumber(inputElement) {
  const $input = $CSD(inputElement);

  // Store the original val method
  const originalVal = $input.val.bind($input);

  // Override val method for this specific input
  $input.val = function(value) {
    if (arguments.length === 0) {
      // Getter
      const rawValue = $input.data("rawValue");
      if (rawValue) {
        return stripCurrency(rawValue, $input).replace(",", ".");
      }
      const currentValue = originalVal();
      return stripCurrency(currentValue, $input).replace(",", ".");
    } else {
      // Setter
      if (value !== "") {
        const rawValue = formatNumber(
          $input,
          value.toString().replace(".", ",")
        );
        $input.data("rawValue", rawValue);
        const formattedValue = buildFormattedValue($input, rawValue);
        return originalVal(formattedValue);
      } else {
        $input.data("rawValue", "");
        return originalVal("");
      }
    }
  };

  // Aggiungi le frecce per incremento e decremento
  const $arrows = $CSD(`
      <div class="csd-input-arrows">
        <button type="button" class="csd-arrow-btn up"><ion-icon name="chevron-up-outline"></ion-icon></button>
        <button type="button" class="csd-arrow-btn down"><ion-icon name="chevron-down-outline"></ion-icon></button>
      </div>
    `);

  // Imposto il posizionamento relativo per il contenitore delle frecce
  $input.css("position", "relative");
  $input.after($arrows);

  // Converto l'input in tipo testo per gestire la virgola
  $input.attr("type", "text");

  // Funzioni per recuperare dinamicamente le configurazioni
  function getCurrencySymbol($el) {
    return $el.attr("currency") || "";
  }

  function getFixedDecimals($el) {
    return $el.attr("decimal") !== undefined
      ? parseInt($el.attr("decimal"))
      : 0;
  }

  function getStep($el) {
    return $el.attr("step") ? $el.attr("step") : 1;
  }

  function getMinVal($el) {
    return $el.attr("min") !== undefined ? parseFloat($el.attr("min")) : null;
  }

  function getMaxVal($el) {
    return $el.attr("max") !== undefined ? parseFloat($el.attr("max")) : null;
  }

  function getDecimalSeparator($el) {
    return $el.attr("decimal-separator") || ",";
  }

  function getDecimalSeparatorReplaced($el) {
    return getDecimalSeparator($el) === "," ? "." : ",";
  }

  function getPrefix($el) {
    return $el.attr("prefix") || "";
  }

  function getSuffix($el) {
    return $el.attr("suffix") || "";
  }

  // Controllo se il campo è disabilitato o in sola lettura
  function isDisabled($el) {
    return $el.prop("disabled") || $el.prop("readonly");
  }

  function formatNumber($el, value, change = false) {
    if (!value && value !== 0) return buildFormattedValue($el, "");
    const num =
      typeof value === "string"
        ? parseFloat(stripCurrency(value, $el).replace(",", "."))
        : value;
    if (isNaN(num)) return buildFormattedValue($el, "");

    // Applica limiti min e max
    const minVal = getMinVal($el);
    const maxVal = getMaxVal($el);
    if (minVal !== null && num < minVal)
      return formatNumber($el, minVal, change);
    if (maxVal !== null && num > maxVal)
      return formatNumber($el, maxVal, change);

    // Durante la digitazione, non completare i decimali
    if (!change) {
      const formattedNum = value.toString().replace(".", ",");
      return buildFormattedValue($el, formattedNum);
    }

    // Aggiungi decimali solo quando necessario (es. al blur)
    const fixedDecimals = getFixedDecimals($el);
    const formattedNum = num.toFixed(fixedDecimals).replace(".", ",");
    return buildFormattedValue($el, formattedNum);
  }

  function buildFormattedValue($el, value) {
    const prefix = getPrefix($el);
    const suffix = getSuffix($el);
    const currency = getCurrencySymbol($el);

    let formattedValue = "";

    if (prefix) formattedValue += `${prefix} `;
    if (currency) formattedValue += `${currency} `;
    formattedValue += stripCurrency(value, $el);
    if (suffix) formattedValue += ` ${suffix}`;

    return formattedValue.trim();
  }

  // Mi occupo di rimuovere il simbolo valuta dal valore
  function stripCurrency(value, $el) {
    if (!value) return "";

    const currency = getCurrencySymbol($el);
    const prefix = getPrefix($el);
    const suffix = getSuffix($el);

    // Escapa prefissi e suffissi
    const escapedCurrency = currency.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedSuffix = suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Costruisci il regex per rimuovere prefissi, suffissi e valuta
    const regexSuffix = new RegExp(`\\s*${escapedSuffix}$`);
    const regexPrefix = new RegExp(`^${escapedPrefix}\\s*`);
    const regexCurrency = new RegExp(`^${escapedCurrency}\\s*`);

    value = value.replace(regexPrefix, "").trim();
    value = value.replace(regexCurrency, "").trim();
    value = value.replace(regexSuffix, "").trim();
    return value;
  }

  // Mi occupo di gestire l'incremento/decremento del valore
  function incrementValue(increment, $el) {
    if (isDisabled($el)) return;

    const cursorPos = $el.elements[0].selectionStart;

    let currentValue = parseFloat(stripCurrency($el.data("rawValue")?.toString().replace(",", ".") || "0", $el)) || 0;
    currentValue += parseFloat(increment);

    // Applico i vincoli di min/max
    const minVal = getMinVal($el);
    const maxVal = getMaxVal($el);
    if (minVal !== null && currentValue < minVal) currentValue = minVal;
    if (maxVal !== null && currentValue > maxVal) currentValue = maxVal;

    const rawValue = currentValue.toFixed(getFixedDecimals($el));

    $el.data("rawValue", rawValue);
    $el.val(formatNumber($el, rawValue, true));

    $el.trigger({
      type: "change",
      internal: true,
    });

    // Riposiziona il cursore tenendo conto di prefisso e suffisso
    let totalPrefixSuffixLength = 1;
    const prefixLength = getPrefix($el) ? getPrefix($el).length + 2 : 0;
    const currencyLength = getCurrencySymbol($el)
      ? getCurrencySymbol($el).length + 2
      : 0;
    const suffixLength = getSuffix($el) ? getSuffix($el).length - 2 : 0;

    if (prefixLength > 0 && currencyLength > 0 && suffixLength > 0) {
      totalPrefixSuffixLength = prefixLength + currencyLength - 1;
    } else if (prefixLength > 0 && currencyLength > 0) {
      totalPrefixSuffixLength = prefixLength + currencyLength;
    } else if (prefixLength > 0 && suffixLength > 0) {
      totalPrefixSuffixLength = prefixLength;
    } else if (currencyLength > 0 && suffixLength > 0) {
      totalPrefixSuffixLength = currencyLength;
    } else if (prefixLength > 0) {
      totalPrefixSuffixLength = prefixLength;
    } else if (currencyLength > 0) {
      totalPrefixSuffixLength = currencyLength;
    }

    const newPos = Math.max(cursorPos, totalPrefixSuffixLength);
    $el.elements[0].setSelectionRange(newPos, newPos);
  }

  $input.on("focus", function (e) {
    if (!isDisabled($CSD(e.target)) && !$arrows.is(":visible")) {
      var inputWidth = $CSD(e.target).outerWidth();
      if (inputWidth < 100) return;

      // $arrows.toggle();

      // var inputHeight = $CSD(e.target).outerHeight();
      // var arrowsHeight = $arrows.outerHeight();
      // var topPosition = 0; 
      // var rightPosition = 16;

      // var $label = $CSD(e.target).closest(".csd-field").find("label");
      // var labelHeight = 0;
      // var labelMargin = 0;

      // if ($label.elements.length > 0) {
      //   labelMargin = parseFloat($label.css("margin-bottom")) || 0;
      // }

      // var paddingInput =
      //   $CSD(e.target).css("padding-block").split(" ")[0].replace("px", "") * 2;

      // // Calcolo l'altezza dell'etichetta se è visibile e non inline
      // if ($label.is(":visible") && $label.closest(".csd-field-inline").elements > 0) {
      //   labelHeight = $label.outerHeight(true);
      //   topPosition =
      //     (inputHeight - arrowsHeight) / 2 +
      //     labelHeight -
      //     paddingInput +
      //     labelMargin +
      //     "px";
      // } else {
      //   topPosition = paddingInput + labelMargin + "px";
      // }

      // // Posiziono le frecce
      // $arrows.css({
      //   display: "inline-flex",
      //   position: "absolute",
      //   top: topPosition,
      //   right: rightPosition + "px",
      // });

      // Aggiungo padding a destra per evitare sovrapposizioni
      //$input.css("padding-right", rightPosition + $arrows.outerWidth() + "px");
    }
  });

  // Mi occupo di validare l'input mentre l'utente digita
  $input.on("input", function (e) {
    if (isDisabled($CSD(e.target))) return;

    let value = e.target.value;
    const cursorPos = this.selectionStart;
    const $el = $CSD(e.target);

    // Rimuovi prefissi, suffissi e valuta
    let cleanValue = stripCurrency(value, $el);
    cleanValue = cleanValue.replace(/[^\d,.-]/g, "");

    // Controlla se i decimali sono abilitati
    const allowDecimals = getFixedDecimals($el) > 0;
    if (!allowDecimals) {
      cleanValue = cleanValue.replace(/[,\.]/g, "");
    } else {
      const lastChar = value.slice(-1);
      const isComma = lastChar === ",";
      if (isComma && !cleanValue.includes(",")) {
        cleanValue += ",";
      }
    }

    // Controlla se ci sono separatori decimali multipli
    const separatorCount = (cleanValue.match(/[,\.]/g) || []).length;
    if (separatorCount > 1) {
      $el.val(buildFormattedValue($el, ""));
      $el.data("rawValue", "");
      return;
    }

    // Costruisci il valore formattato
    const formattedValue = buildFormattedValue($el, cleanValue);
    $el.val(formattedValue);
    $el.data("rawValue", cleanValue.replace(",", "."));

    // Riposiziona il cursore tenendo conto di prefisso e suffisso
    let totalPrefixSuffixLength = 0;
    const prefixLength = getPrefix($el) ? getPrefix($el).length + 2 : 0;
    const currencyLength = getCurrencySymbol($el)
      ? getCurrencySymbol($el).length + 2
      : 0;
    const suffixLength = getSuffix($el) ? getSuffix($el).length - 2 : 0;

    if (prefixLength > 0 && currencyLength > 0 && suffixLength > 0) {
      totalPrefixSuffixLength = prefixLength + currencyLength - 1;
    } else if (prefixLength > 0 && currencyLength > 0) {
      totalPrefixSuffixLength = prefixLength + currencyLength;
    } else if (prefixLength > 0 && suffixLength > 0) {
      totalPrefixSuffixLength = prefixLength;
    } else if (currencyLength > 0 && suffixLength > 0) {
      totalPrefixSuffixLength = currencyLength;
    } else if (prefixLength > 0) {
      totalPrefixSuffixLength = prefixLength;
    } else if (currencyLength > 0) {
      totalPrefixSuffixLength = currencyLength;
    }

    const newPos = Math.max(cursorPos, totalPrefixSuffixLength);
    this.setSelectionRange(newPos, newPos);
  });

  $input.on("blur", function (e) {
    if (isDisabled($CSD(e.target))) return;

    let value = stripCurrency($CSD(e.target).val(), $CSD(e.target));
    if (!value) {
      $CSD(e.target).val("");
      $CSD(e.target).data("rawValue", "");
      //$arrows.hide();
      $input.css("padding-right", "");
      return;
    }

    // Completa i decimali se necessario
    const num = parseFloat(value.replace(",", "."));
    if (!isNaN(num)) {
      const fixedDecimals = getFixedDecimals($CSD(e.target));
      const rawValue = num.toFixed(fixedDecimals);
      const formattedValue = rawValue.replace(".", ",");
      
      $CSD(e.target).data("rawValue", rawValue);
      $CSD(e.target).val(buildFormattedValue($CSD(e.target), formattedValue));
    } else {
      // In caso di valore non valido, resetta il campo
      $CSD(e.target).val("");
      $CSD(e.target).data("rawValue", "");
    }

    //$arrows.hide();
    $input.css("padding-right", "");
  });

  // Mi occupo di gestire gli eventi di cambio valore
  $input.on("change", function (e) {
    if (isDisabled($CSD(e.target))) return;

    let value = stripCurrency($CSD(e.target).val(), $CSD(e.target));
    if (!value) {
      $CSD(e.target).val("");
      $CSD(e.target).data("rawValue", "");
      return;
    }

    // Completa i decimali se necessario
    const num = parseFloat(value.replace(",", "."));
    if (!isNaN(num)) {
      const fixedDecimals = getFixedDecimals($CSD(e.target));
      const rawValue = num.toFixed(fixedDecimals);
      const formattedValue = rawValue.replace(".", ",");
      
      $CSD(e.target).data("rawValue", rawValue);
      $CSD(e.target).val(buildFormattedValue($CSD(e.target), formattedValue));
    }
  });

  // Mi occupo di gestire le frecce da tastiera
  $input.on("keydown", function (event) {
    if (isDisabled($CSD(event.target))) return;
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const increment =
        event.key === "ArrowUp"
          ? getStep($CSD(event.target))
          : -getStep($CSD(event.target));
      incrementValue(increment, $CSD(event.target));
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const cursorPos = this.selectionStart;
      const value = $CSD(this).val();
      const prefix = getPrefix($CSD(this));
      const suffix = getSuffix($CSD(this));
      const currency = getCurrencySymbol($CSD(this));

      const prefixLength = prefix ? prefix.length + 1 : 0;
      const currencyLength = currency ? currency.length + 2 : 0;
      const suffixLength = suffix ? suffix.length + 1 : 0;

      const startPos = prefixLength + currencyLength;
      const endPos = value.length - suffixLength;

      let newPos = cursorPos;
      if (event.key === "ArrowLeft" && cursorPos <= startPos) {
        newPos = startPos;
      } else if (event.key === "ArrowRight" && cursorPos >= endPos) {
        newPos = endPos;
      }
      if (cursorPos < startPos || cursorPos > endPos) {
        newPos = event.key === "ArrowLeft" ? startPos : endPos;
      }

      if (newPos !== cursorPos) {
        event.preventDefault();
        this.setSelectionRange(newPos, newPos);
      }
    }
  });

  // Inizializzo il valore iniziale del campo
  const initialValue = $input.val();
  if (initialValue) {
    const currencySymbol = getCurrencySymbol($input);
    const decimalSeparator = getDecimalSeparator($input);
    let numValue = stripCurrency(initialValue, $input);

    // Converte e formatta il valore iniziale
    numValue = parseFloat(numValue.replace(decimalSeparator, ".")).toFixed(
      getFixedDecimals($input)
    );
    $input.data("rawValue", numValue);
    $input.val(formatNumber($input, numValue, true));
  }

  $arrows.find(".csd-arrow-btn").on("click", function (event) {
    $CSD(event.target).closest(".csd-input-group").find(".csd-number").focus(); // Mantengo il focus sull'input
    if (isDisabled($CSD(event.target))) return;
    const increment = $CSD(this).hasClass("up")
      ? getStep($CSD(event.target).closest(".csd-input-group").find(".csd-number"))
      : -getStep(
          $CSD(event.target).closest(".csd-input-group").find(".csd-number")
        );
    incrementValue(
      increment,
      $CSD(event.target).closest(".csd-input-group").find(".csd-number")
    );
  });
}


export { initializeNumber };