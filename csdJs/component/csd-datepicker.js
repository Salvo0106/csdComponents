import { initializeMask } from "./csd-mask.js";

// Funzione per formattare la data per i preset
function formatPresetDate(date) {
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).split('/').join('/');
}

// Funzione per posizionare il calendario
function positionCalendar($input, $dropdown) {
  const inputRect = $input[0].getBoundingClientRect();
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800; // Default fallback
  const spaceBelow = windowHeight - inputRect.bottom;
  const calendarHeight = $dropdown[0].offsetHeight;

  // Check if there's enough space below for the calendar plus margin
  if (spaceBelow >= calendarHeight + 4) {
    // 4px for margin
    $dropdown.removeClass("position-above").addClass("position-below");
  } else {
    $dropdown.removeClass("position-below").addClass("position-above");
  }
}

function initializeDatepickers() {
  console.log("Initializing datepickers...");

  // Inizializza il date range preset
  $CSD(".csd-datepicker-range-preset").each(function () {
    const $input = $CSD(this);

    // Crea il wrapper per il dropdown
    const $wrapper = $CSD(
      '<div class="csd-select-container position-relative"></div>'
    );
    $input.wrap($wrapper);
    $input.prop("readonly", true);

    // Crea il dropdown
    const $dropdown = $CSD(
      '<div class="csd-select-options"></div>'
    );
    const options = [
      { label: "Ultima settimana", value: "week" },
      { label: "Ultimo mese", value: "month" },
      { label: "Ultimi 3 mesi", value: "threeMonths" },
      { label: "Ultimo anno", value: "year" },
      { label: "Da inizio anno", value: "ytd" },
      { label: "Personalizzato", value: "custom" },
    ];

    options.forEach((option) => {
      const $option = $CSD(
        `<div class="csd-select-option" data-value="${option.value}">${option.label}</div>`
      );
      $dropdown.append($option);
    });

      $input.after($dropdown);

    // Gestisci il click sull'input
    $input.on("click", function (e) {
      e.stopPropagation();
      $CSD(".csd-select-options").not($dropdown).hide();
      if (!$dropdown.hasClass("visible")) {
        $dropdown.addClass("visible");
        positionCalendar($input, $dropdown);
      }
    });

    // Gestisci la selezione delle opzioni
    $dropdown.on("click", ".csd-select-option", function (e) {
      e.stopPropagation();
      const value = $CSD(this).data("value");
      $CSD(this).addClass("selected");
      const today = new Date();
      let startDate, endDate;

      switch (value) {
        case "week":
          endDate = new Date(today);
          startDate = new Date(today);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          endDate = new Date(today);
          startDate = new Date(today);
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "threeMonths":
          endDate = new Date(today);
          startDate = new Date(today);
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case "year":
          endDate = new Date(today);
          startDate = new Date(today);
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case "ytd":
          endDate = new Date(today);
          startDate = new Date(today.getFullYear(), 0, 1);
          break;
        case "custom":
          // Per l'opzione custom, aggiungiamo le classi necessarie
          $input
            .removeClass("csd-datepicker-range-preset")
            .addClass("csd-datepicker")
            .addClass("multi-months")
            .attr("data-range", "true")
            .attr("data-from-preset", "true");

          // Rimuovi l'evento click esistente per evitare loop
          $input.off("click");

          // Reinizializza i datepicker per applicare le nuove classi
          initializeDatepickers();

          // Nascondi il dropdown e triggera il click per aprire il calendario
            $dropdown.hide();
          $input.trigger("click");
          return;
      }

      if (startDate && endDate) {
        const formattedStart = formatPresetDate(startDate);
        const formattedEnd = formatPresetDate(endDate);
        $input.val(`${formattedStart} - ${formattedEnd}`);
      }

      $dropdown.removeClass("visible");

    });

    // Chiudi il dropdown quando si clicca fuori
    $CSD(document).on("click", function (e) {
      if (!$CSD(e.target).closest(".csd-select-container").length) {
        $dropdown.removeClass("visible");
      }
    });
  });

    // Inizializza i datepicker standard
    const $datepickers = $CSD(
      ".csd-datepicker:not(.csd-datepicker-range-preset), .csd-datetimepicker"
    );

    $datepickers.each(function () {
      const $input = $CSD(this);
      const isRange = $input.attr("data-range") === "true";
      const isDateTimePicker = $input.hasClass("csd-datetimepicker");
      const format =
        $input.attr("data-format") ||
        (isDateTimePicker ? "DD/MM/YYYY HH:mm" : "DD/MM/YYYY");
      const isManualInput = $input.attr("data-manual-input") === "true";
      const multiple = $input.attr("data-multiple") === "true";
      const showClearBtn = $input.attr("btn-clear");
      const showTodayBtn = $input.attr("btn-today");
      const minDate = $input.attr("min-date")
        ? new Date($input.attr("min-date"))
        : null;
      const maxDate = $input.attr("max-date")
        ? new Date($input.attr("max-date"))
        : null;
      const isPresetRange = $input.hasClass("csd-datepicker-range-preset");
      const isFromPreset = $input.attr("data-from-preset") === "true";

      // Rendi l'input readonly solo se non è manuale
      $input.prop("readonly", !isManualInput);

      // Array per date multiple
      let selectedDates = [];

      // Funzione per aggiornare il valore dell'input con date multiple
      function updateMultipleInput() {
        if (multiple) {
          const formattedDates = selectedDates
            .sort((a, b) => a - b)
            .map((date) => formatDate(date, format));
          $input.val(formattedDates.join(", "));
          $input.trigger("change");
        }
      }

      // Se è abilitato l'input manuale, aggiungi la validazione della maschera
      if (isManualInput) {
        const singleDateMask = format
          .replace(/YYYY/g, "9999")
          .replace(/MM/g, "19")
          .replace(/DD/g, "39")
          .replace(/HH/g, "29")
          .replace(/mm/g, "59");

        const dateMask = isRange
          ? `${singleDateMask} - ${singleDateMask}`
          : singleDateMask;

        $input.attr("data-mask", dateMask);
        initializeMask($input.elements[0]);

        // Gestione dell'input manuale
        $input.on("change", function () {
          const value = $input.val();

          if (isRange) {
            const [startStr, endStr] = value.split("-").map((s) => s.trim());
            const startDate = parseDate(startStr, format);
            const endDate = parseDate(endStr, format);

            if (startDate && endDate) {
              selectedDate = startDate;
              selectedEndDate = endDate;
              currentDate = new Date(startDate);
              renderCalendar();
            }
          } else if (multiple) {
            const dateStrings = value.split(",").map((s) => s.trim());
            selectedDates = dateStrings
              .map((dateStr) => parseDate(dateStr, format))
              .filter((date) => date !== null);
            if (selectedDates.length > 0) {
              currentDate = new Date(selectedDates[0]);
            }
            renderCalendar();
          } else {
            const date = parseDate(value, format);
            if (date) {
              selectedDate = date;
              currentDate = new Date(date);
              if (isDateTimePicker) {
                selectedHours = date.getHours();
                selectedMinutes = date.getMinutes();
              }
              renderCalendar();
            }
          }
        });
      }

      // Funzione helper per il parsing delle date
      function parseDate(dateStr, format) {
        if (!dateStr) return null;

        const formatParts = format.match(/[A-Za-z]+/g);
        const valueParts = dateStr.match(/\d+/g);

        if (!valueParts || valueParts.length !== formatParts.length) return null;

        let year,
          month,
          day,
          hours = 0,
          minutes = 0;

        formatParts.forEach((part, index) => {
          const value = parseInt(valueParts[index]);
          switch (part) {
            case "YYYY":
              year = value;
              break;
            case "MM":
              month = value - 1;
              break;
            case "DD":
              day = value;
              break;
            case "HH":
              hours = value;
              break;
            case "mm":
              minutes = value;
              break;
          }
        });

        const date = new Date(year, month, day, hours, minutes);
        return isNaN(date.getTime()) ? null : date;
      }

      // Crea il wrapper del calendario
      const $wrapper = multiple
        ? $CSD(
            '<div class="csd-datepicker-wrapper csd-datepicker-wrapper-multiple" style="display: none;"></div>'
          )
        : $CSD('<div class="csd-datepicker-wrapper" style="display: none;"></div>');
      $input.after($wrapper);

      // Stato del calendario
      let currentDate = new Date();
      let selectedDate = null;
      let selectedEndDate = null;
      let selecting = false;
      let showMonthSelect = false;
      let showYearSelect = false;
      let selectedHours = currentDate.getHours();
      let selectedMinutes = currentDate.getMinutes();

      // Se c'è un valore iniziale, usalo
      if ($input.val()) {
        const initialDate = new Date($input.val());
        if (!isNaN(initialDate.getTime())) {
          selectedDate = initialDate;
          selectedHours = initialDate.getHours();
          selectedMinutes = initialDate.getMinutes();
        }
      }

      // Array per i mesi e giorni abbreviati in inglese
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

      // Funzione per formattare la data
      function formatDate(date, customFormat = format) {
        if (!date) return "";

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(selectedHours).padStart(2, "0");
        const minutes = String(selectedMinutes).padStart(2, "0");

        return customFormat
          .replace("YYYY", year)
          .replace("MM", month)
          .replace("DD", day)
          .replace("HH", hours)
          .replace("mm", minutes);
      }

      // Funzione per aggiornare l'input
      function updateInput() {
        if (isRange && selectedDate && selectedEndDate) {
          $input.val(
            `${formatDate(selectedDate)} - ${formatDate(selectedEndDate)}`
          );
          currentDate = new Date(selectedDate);
        } else if (selectedDate) {
          $input.val(formatDate(selectedDate));
          currentDate = new Date(selectedDate);
        } else {
          $input.val("");
        }
      }

      // Funzione per verificare se una data è selezionabile
      function isDateSelectable(date) {
        if (minDate && date < minDate) return false;
        if (maxDate && date > maxDate) return false;
        return true;
      }

      // Funzione per verificare se una data è nel range
      function isInRange(date) {
        if (!isRange || !selectedDate || !selectedEndDate) return false;
        return date > selectedDate && date < selectedEndDate;
      }

      // Funzione per ottenere il primo giorno del mese
      function getFirstDayOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
      }

      // Funzione per ottenere l'ultimo giorno del mese
      function getLastDayOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
      }

      // Funzione per ottenere i giorni del mese precedente
      function getPrevMonthDays(firstDay) {
        const prevMonth = new Date(firstDay);
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        const lastDayPrevMonth = getLastDayOfMonth(prevMonth);
        const startingDay = firstDay.getDay() || 7; // Converte 0 (domenica) in 7
        const days = [];

        for (let i = startingDay - 1; i > 0; i--) {
          const day = new Date(lastDayPrevMonth);
          day.setDate(lastDayPrevMonth.getDate() - i + 1);
          days.push(day);
        }

        return days;
      }

      // Funzione per ottenere i giorni del mese successivo
      function getNextMonthDays(lastDay, totalCells) {
        const nextMonth = new Date(lastDay);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const days = [];
        let dayCount = 1;

        while (days.length + totalCells < 42) {
          const day = new Date(nextMonth);
          day.setDate(dayCount);
          days.push(day);
          dayCount++;
        }

        return days;
      }

      // Funzione per confrontare le date (solo giorno/mese/anno)
      function isSameDay(date1, date2) {
        return (
          date1 &&
          date2 &&
          date1.getDate() === date2.getDate() &&
          date1.getMonth() === date2.getMonth() &&
          date1.getFullYear() === date2.getFullYear()
        );
      }

      // Funzione per renderizzare il selettore dei mesi
      function renderMonthSelect() {
        let html = '<div class="month-select">';
        months.forEach((month, index) => {
          const isSelected = index === currentDate.getMonth() ? "" : "";
          html += `<button type="button" class="month-option ${isSelected}" data-month="${index}">${month}</button>`;
        });
        html += "</div>";
        return html;
      }

      // Funzione per renderizzare il selettore degli anni
      function renderYearSelect() {
        const currentYear = currentDate.getFullYear();
        const startYear = currentYear - 10;
        const endYear = currentYear + 10;

        let html = '<div class="year-select">';
        for (let year = startYear; year <= endYear; year++) {
          const isSelected = year === currentYear ? "" : "";
          html += `<button type="button" class="year-option ${isSelected}" data-year="${year}">${year}</button>`;
        }
        html += "</div>";
        return html;
      }

      // Funzione per renderizzare il selettore dell'ora
      function renderTimeSelect() {
        if (!isDateTimePicker) return "";

        return `
          <div class="time-select">
            <div class="time-field">
              <div class="time-spinner">
                <button type="button" class="time-btn hour-up">&and;</button>
                <input type="text" class="time-input hour-input" value="${String(
                  selectedHours
                ).padStart(2, "0")}" readonly>
                <button type="button" class="time-btn hour-down">&or;</button>
              </div>
            </div>
            <div class="time-separator">:</div>
            <div class="time-field">
              <div class="time-spinner">
                <button type="button" class="time-btn minute-up">&and;</button>
                <input type="text" class="time-input minute-input" value="${String(
                  selectedMinutes
                ).padStart(2, "0")}" readonly>
                <button type="button" class="time-btn minute-down">&or;</button>
              </div>
            </div>
          </div>
        `;
      }

      // Funzione per renderizzare il calendario
      function renderCalendar() {
        const firstDay = getFirstDayOfMonth(currentDate);
        const lastDay = getLastDayOfMonth(currentDate);
        const daysInMonth = lastDay.getDate();
        const isMultiMonths = $input.hasClass("multi-months");

        let html = "";

        // Se è multi-months, renderizza due calendari
        if (isMultiMonths) {
          html += '<div class="datepicker-multi-months">';

          // Primo calendario (mese corrente)
          html += '<div class="datepicker-month">';
          html += renderSingleMonth(currentDate, true, false);
          html += "</div>";

          // Secondo calendario (mese successivo)
          const nextMonth = new Date(currentDate);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          html += '<div class="datepicker-month">';
          html += renderSingleMonth(nextMonth, false, true);
          html += "</div>";

          html += "</div>";
        } else {
          html += renderSingleMonth(currentDate, true, true);
        }

        // Aggiungi il selettore dell'ora se è un datetime picker
        html += renderTimeSelect();

        if (showClearBtn || showTodayBtn) {
          // Aggiungi i pulsanti Today e Clear
          html += `
            <div class="datepicker-footer">
              ${
                showClearBtn && showClearBtn != "false"
                  ? '<button type="button" class="action-btn clear-btn">' +
                    (showClearBtn && showClearBtn != "true"
                      ? showClearBtn
                      : "Clear") +
                    "</button>"
                  : ""
              }
              ${
                showTodayBtn && showTodayBtn != "false"
                  ? '<button type="button" class="action-btn today-btn">' +
                    (showTodayBtn && showTodayBtn != "true"
                      ? showTodayBtn
                      : "Today") +
                    "</button>"
                  : ""
              }
            </div>
          `;
        }

        // Aggiungi il pulsante "Indietro" se il calendario viene da un preset
        if (isFromPreset) {
          html += `
            <div class="datepicker-footer">
              <button type="button" class="action-btn back-btn">Indietro</button>
            </div>
          `;
        }

        $wrapper.html(html);
      }

      // Funzione per renderizzare un singolo mese
      function renderSingleMonth(
        date,
        showPrevButton = true,
        showNextButton = true
      ) {
        const firstDay = getFirstDayOfMonth(date);
        const lastDay = getLastDayOfMonth(date);
        const daysInMonth = lastDay.getDate();

        let html = `
          <div class="datepicker-header">
            ${
              showPrevButton
                ? '<button type="button" class="nav-btn prev-month">&lt;</button>'
                : ""
            }
            <div class="month-year-select">
              <button type="button" class="month-btn">${
                months[date.getMonth()]
              }</button>
              <button type="button" class="year-btn">${date.getFullYear()}</button>
            </div>
            ${
              showNextButton
                ? '<button type="button" class="nav-btn next-month">&gt;</button>'
                : ""
            }
          </div>`;

        // Aggiungi i selettori se sono visibili
        if (showMonthSelect) {
          html += renderMonthSelect();
          return html;
        }
        if (showYearSelect) {
          html += renderYearSelect();
          return html;
        }

        html += '<div class="datepicker-grid">';

        // Giorni della settimana
        weekdays.forEach((day) => {
          html += `<div class="weekday">${day}</div>`;
        });

        // Giorni del mese precedente
        const prevMonthDays = getPrevMonthDays(firstDay);
        prevMonthDays.forEach((date) => {
          html += `<div class="day other-month" data-date="${formatDate(
            date,
            "YYYY-MM-DD"
          )}">${date.getDate()}</div>`;
        });

        // Giorni del mese corrente
        for (let day = 1; day <= daysInMonth; day++) {
          const currentDate = new Date(
            date.getFullYear(),
            date.getMonth(),
            day
          );
          const isToday = isSameDay(currentDate, new Date());
          const isSelected = isSameDay(currentDate, selectedDate);
          const isEndDate = isSameDay(currentDate, selectedEndDate);
          const inRange = isInRange(currentDate);
          const selectable = isDateSelectable(currentDate);
          const isMultipleSelected =
            multiple && selectedDates.some((d) => isSameDay(d, currentDate));

          const classes = [
            "day",
            isToday ? "today" : "",
            isSelected ? (isRange ? "selected start" : "selected") : "",
            isEndDate ? "selected end" : "",
            inRange ? "in-range" : "",
            isMultipleSelected ? "selected" : "",
            !selectable ? "disabled" : "",
          ]
            .filter(Boolean)
            .join(" ");

          html += `<div class="${classes}" data-date="${formatDate(
            currentDate,
            "YYYY-MM-DD"
          )}">${day}</div>`;
        }

        // Giorni del mese successivo
        const totalCells = prevMonthDays.length + daysInMonth;
        const nextMonthDays = getNextMonthDays(lastDay, totalCells);
        nextMonthDays.forEach((date) => {
          html += `<div class="day other-month" data-date="${formatDate(
            date,
            "YYYY-MM-DD"
          )}">${date.getDate()}</div>`;
        });

        html += "</div>";
        return html;
      }

      if (isManualInput) {
        // Togliere l'attributo readonly
        $input.prop("readonly", false);

        $input.on("input", function () {
          const inputValue = this.value.trim();
          const isValidFormat =
            inputValue.length === format.length &&
            inputValue.split("").every((char, index) => {
              if (
                format[index] === "D" ||
                format[index] === "M" ||
                format[index] === "Y"
              ) {
                return /\d/.test(char);
              }
              return char === format[index];
            });

          if (isValidFormat) {
            const [day, month, year] = inputValue.split("/").map(Number);
            const inputDate = new Date(year, month - 1, day);

            if (
              inputDate.getDate() === day &&
              inputDate.getMonth() === month - 1 &&
              inputDate.getFullYear() === year &&
              isDateSelectable(inputDate)
            ) {
              currentDate = inputDate;
              selectedDate = inputDate;
              updateInput();
              renderCalendar();
            } else {
              $input.addClass("error");
            }
          } else {
            $input.addClass("error");
          }
        });
      }

      // Event handlers
      $input.on("click", function (e) {
        e.stopPropagation();
        $CSD(".csd-datepicker-wrapper").not($wrapper).hide();
        $wrapper.toggle();
        if ($wrapper.is(":visible")) {
          showMonthSelect = false;
          showYearSelect = false;
          renderCalendar();
          positionCalendar($input, $wrapper);
        } else {
          
        }
      });

      // Aggiorna la posizione quando la finestra viene ridimensionata
      $CSD(window).on("resize", function () {
        if ($wrapper.is(":visible")) {
          positionCalendar($input, $wrapper);
        }
      });

      // Aggiorna la posizione quando si fa scroll
      $CSD(window).on("scroll", function () {
        if ($wrapper.is(":visible")) {
          positionCalendar($input, $wrapper);
        }
      });

      $wrapper.on("click", ".prev-month", function (e) {
        e.stopPropagation();
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
      });

      $wrapper.on("click", ".next-month", function (e) {
        e.stopPropagation();
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
      });

      $wrapper.on("click", ".month-btn", function (e) {
        e.stopPropagation();
        showMonthSelect = !showMonthSelect;
        showYearSelect = false;
        renderCalendar();
      });

      $wrapper.on("click", ".year-btn", function (e) {
        e.stopPropagation();
        showYearSelect = !showYearSelect;
        showMonthSelect = false;
        renderCalendar();
      });

      $wrapper.on("click", ".month-option", function (e) {
        e.stopPropagation();
        const month = parseInt($CSD(this).data("month"));
        currentDate.setMonth(month);
        showMonthSelect = false;
        renderCalendar();
      });

      $wrapper.on("click", ".year-option", function (e) {
        e.stopPropagation();
        const year = parseInt($CSD(this).data("year"));
        currentDate.setFullYear(year);
        showYearSelect = false;
        renderCalendar();
      });

      $wrapper.on("click", ".day:not(.disabled)", function (e) {
        e.stopPropagation();
        const dateStr = $CSD(this).data("date");
        const [year, month, day] = dateStr.split("-").map(Number);
        const date = new Date(year, month - 1, day);

        if (multiple) {
          const existingIndex = selectedDates.findIndex(
            (d) =>
              d.getFullYear() === date.getFullYear() &&
              d.getMonth() === date.getMonth() &&
              d.getDate() === date.getDate()
          );

          if (existingIndex >= 0) {
            // Rimuovi la data se già selezionata
            selectedDates.splice(existingIndex, 1);
          } else {
            // Aggiungi la nuova data
            selectedDates.push(new Date(date));
          }

          updateMultipleInput();
          renderCalendar();
          return;
        }

        if (isRange) {
          if (!selecting || (selecting && date < selectedDate)) {
            selectedDate = date;
            selectedEndDate = null;
            selecting = true;
          } else {
            if (date > selectedDate) {
              selectedEndDate = date;
            } else {
              selectedEndDate = selectedDate;
              selectedDate = date;
            }
            selecting = false;
            if (!showClearBtn && !showTodayBtn) {
              $wrapper.hide();
            }
          }
          updateInput();
        } else {
          selectedDate = date;
          if (!showClearBtn && !showTodayBtn) {
            $wrapper.hide();
          }
          updateInput();
        }

        renderCalendar();
        $input.trigger("change");
      });

      // Time spinner handlers
      $wrapper.on("click", ".hour-up", function (e) {
        e.stopPropagation();
        selectedHours = (selectedHours + 1) % 24;
        $wrapper
          .find(".hour-input")
          .val(String(selectedHours).padStart(2, "0"));
        updateInput();
      });

      $wrapper.on("click", ".hour-down", function (e) {
        e.stopPropagation();
        selectedHours = (selectedHours - 1 + 24) % 24;
        $wrapper
          .find(".hour-input")
          .val(String(selectedHours).padStart(2, "0"));
        updateInput();
      });

      $wrapper.on("click", ".minute-up", function (e) {
        e.stopPropagation();
        selectedMinutes = (selectedMinutes + 1) % 60;
        $wrapper
          .find(".minute-input")
          .val(String(selectedMinutes).padStart(2, "0"));
        updateInput();
      });

      $wrapper.on("click", ".minute-down", function (e) {
        e.stopPropagation();
        selectedMinutes = (selectedMinutes - 1 + 60) % 60;
        $wrapper
          .find(".minute-input")
          .val(String(selectedMinutes).padStart(2, "0"));
        updateInput();
      });

      // Event handler per Today
      $wrapper.on("click", ".today-btn", function (e) {
        e.stopPropagation();
        const today = new Date();
        if (isRange) {
          selectedDate = today;
          selectedEndDate = null;
          selecting = true;
        } else {
          selectedDate = today;
        }
        if (isDateTimePicker) {
          selectedHours = today.getHours();
          selectedMinutes = today.getMinutes();
        }
        currentDate = new Date(today);
        updateInput();
        renderCalendar();
      });

      // Event handler per Clear
      $wrapper.on("click", ".clear-btn", function (e) {
        e.stopPropagation();
        if (multiple) {
          selectedDates = [];
          updateMultipleInput();
        } else if (isRange) {
          selectedDate = null;
          selectedEndDate = null;
          $input.val("");
        } else {
          selectedDate = null;
          $input.val("");
        }
        renderCalendar();
      });

      // Event handler per Indietro
      $wrapper.on("click", ".back-btn", function (e) {
        e.stopPropagation();

        // Rimuovi le classi del datepicker custom
        $input
          .removeClass("multi-months")
          .removeClass("csd-datepicker")
          .removeAttr("data-range")
          .removeAttr("data-from-preset")
          .addClass("csd-datepicker-range-preset")
          .val(""); // Pulisci il valore

        // Rimuovi il calendario
        $wrapper.remove();

        // Reinizializza come preset e mostra subito il dropdown
        initializeDatepickers();
        $input.trigger("click");
      });

      // Chiudi il calendario quando si clicca fuori
      $CSD(document).on("click", function (e) {
        if (
          !$CSD(e.target).closest(".csd-datepicker-wrapper").length &&
          !$CSD(e.target).hasClass("csd-datepicker")
        ) {
          showMonthSelect = false;
          showYearSelect = false;
          $wrapper.hide();
        }
      });

      // Funzione per aggiornare l'ora
      function updateTimeDisplay() {
        const timeInputs = $wrapper.find(".time-select");
        if (timeInputs.length) {
          timeInputs
            .find(".hour-input")
            .val(String(selectedHours).padStart(2, "0"));
          timeInputs
            .find(".minute-input")
            .val(String(selectedMinutes).padStart(2, "0"));
        }
      }

      // Aggiorna l'ora iniziale
      updateTimeDisplay();
    });
  }

export { initializeDatepickers };
