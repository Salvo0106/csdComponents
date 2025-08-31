import { initializeOTP } from "./csd-otp.js";

function initializeMask(inputElement) {
  const $input = $CSD(inputElement);
  const mask = $input.data("mask");

  // Se è un input OTP, inizializza il campo OTP
  if ($input.hasClass("csd-otp")) {
    initializeOTP($input, mask);
    return;
  }

  $input.on("input", function (e) {
    const value = e.target.value; // Valore immesso
    let maskedValue = ""; // Valore con maschera applicata
    let valueIndex = 0; // Indice del carattere immesso
    let optional = false; // Flag per gestire il facoltativo

    // Itera attraverso la maschera
    for (let i = 0; i < mask.length; i++) {
      const maskChar = mask[i]; // Carattere corrente della maschera
      const inputChar = value[valueIndex]; // Carattere immesso

      if (maskChar === "?") {
        optional = true; // Tutti i caratteri dopo questo sono facoltativi
        continue;
      }

      if (!inputChar && optional) {
        break; // Se l'input è terminato e siamo in una parte facoltativa, esci
      }

      if (!inputChar) {
        break; // Interrompi se non ci sono più caratteri da verificare
      }

      if (/\d/.test(maskChar)) {
        // Se il carattere della maschera è un numero (es. 123456)
        if (/\d/.test(inputChar)) {
          maskedValue += inputChar; // Accetta solo numeri
          valueIndex++;
        } else {
          // Ignora i caratteri non validi
          valueIndex++;
          i--; // Rimani sulla stessa posizione nella maschera
        }
      } else if (/[A-Za-z]/.test(maskChar)) {
        // Se il carattere della maschera è una lettera (es. abc)
        if (/[A-Za-z]/.test(inputChar)) {
          maskedValue += inputChar; // Accetta solo lettere
          valueIndex++;
        } else {
          // Ignora i caratteri non validi
          valueIndex++;
          i--; // Rimani sulla stessa posizione nella maschera
        }
      } else if (maskChar === "*") {
        // Accetta lettere o numeri
        if (/[A-Za-z0-9]/.test(inputChar)) {
          maskedValue += inputChar;
          valueIndex++;
        } else {
          valueIndex++;
          i--; // Rimani sulla stessa posizione nella maschera
        }
      } else if (maskChar === "#") {
        // Accetta qualsiasi carattere
        maskedValue += inputChar;
        valueIndex++;
      } else {
        // Altri caratteri statici o separatori
        maskedValue += maskChar;
        if (inputChar === maskChar) {
          valueIndex++;
        }
      }
    }

    // Aggiorna il valore dell'input con il risultato mascherato
    this.value = maskedValue;
  });

  $input.on("blur", function () {
    const value = this.value;
    const requiredLength =
      mask.indexOf("?") > -1 ? mask.indexOf("?") : mask.length;
    const isValid = value.length >= requiredLength;

    // Cambia la validità dell'input
    this.setCustomValidity(isValid ? "" : "Invalid input, mask not completed");
  });

  // Imposta la lunghezza massima in base alla maschera, ignorando `?`
  const maxLength = mask.replace(/\?/g, "").length;
  $input.attr("maxlength", maxLength);

  // Imposta un placeholder basato sulla maschera, se non presente
  if (!$input.attr("placeholder")) {
    $input.attr("placeholder", mask.replace(/\?/g, ""));
  }
}

export { initializeMask };