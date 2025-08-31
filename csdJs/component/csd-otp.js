function initializeOTP($input, mask) {
  // Pulisci la maschera dagli spazi
  mask = mask.replace(/\s+/g, "");

  // Crea il contenitore per i campi OTP
  const $container = $CSD('<div class="csd-otp-container"></div>');
  $input.after($container);

  // Nascondi l'input originale
  $input.hide();

  // Crea un input per ogni carattere della maschera
  const inputs = [];
  for (let i = 0; i < mask.length; i++) {
    const maskChar = mask[i];
    const $digit = $CSD("<input>")
      .addClass("csd-otp-digit")
      .attr("type", "text")
      .attr("maxlength", 1)
      .attr("inputmode", "numeric")
      .attr("data-index", i)
      .attr("pattern", maskChar === "1" ? "[0-9]" : null);

    $container.append($digit);
    inputs.push($digit);

    // Gestisci l'input
    $digit.on("input", function () {
      const value = this.value;
      const index = $CSD(this).data("index");

      // Valida il carattere in base alla maschera
      if (maskChar === "1" && !/[0-9]/.test(value)) {
        this.value = "";
        return;
      }

      // Aggiorna il valore nell'input originale
      let originalValue = $input.val();
      originalValue = originalValue.split("");
      originalValue[index] = value;
      $input.val(originalValue.join("")).trigger("change");

      // Passa al prossimo input se è stato inserito un carattere valido
      if (value && index < inputs.length - 1) {
        inputs[parseInt(index) + 1].elements[0].focus();
      }
    });

    // Gestisci il backspace
    $digit.on("keydown", function (e) {
      const index = $CSD(this).data("index");

      if (e.key === "Backspace") {
        // Cancella il valore corrente
        this.value = "";
        // Aggiorna l'input originale
        let originalValue = $input.val();
        originalValue = originalValue.split("");
        originalValue[index] = "";
        $input.val(originalValue.join("")).trigger("change");

        // Torna indietro se non siamo al primo input
        if (index > 0) {
          const prevInput = inputs[index - 1].elements[0];
          prevInput.focus();
          // Posiziona il cursore alla fine
          const len = prevInput.value.length;
          prevInput.setSelectionRange(len, len);
          e.preventDefault();
        }
      }
    });
  }

  // Gestisci l'incolla
  $container.on("paste", function (e) {
    e.preventDefault();
    const clipboardData = e.clipboardData || (typeof window !== 'undefined' ? window.clipboardData : null);
    const paste = clipboardData ? clipboardData.getData("text") : "";

    // Filtra solo i numeri se la maschera è numerica
    const isNumeric = mask.includes("1");
    const filtered = isNumeric
      ? paste.replace(/\D/g, "")
      : paste.split("").slice(0, mask.length);

    filtered.forEach((char, i) => {
      if (i < inputs.length) {
        const maskChar = mask[i];
        if (maskChar === "1" && !/[0-9]/.test(char)) {
          return;
        }

        inputs[i].val(char);
        if (i === filtered.length - 1) {
          inputs[i].elements[0].focus();
        }
      }
    });

    // Aggiorna l'input originale
    $input.val(filtered.join("")).trigger("change");
  });

  // Valida al blur del contenitore
  $container.on("focusout", function (e) {
    // Aspetta un momento per vedere se il focus va a un altro input nel contenitore
    setTimeout(() => {
      if (!$container.find(":focus").length) {
        const value = $input.val();
        const isValid = value.length === mask.length;
        $input.elements[0].setCustomValidity(
          isValid ? "" : "Please enter all digits"
        );
      }
    }, 100);
  });
}

export { initializeOTP };