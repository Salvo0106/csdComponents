function handleVirtualKeyboard($editor) {
  const $container = $editor.closest(".csd-editor-container");
  const $mobileToolbar = $container.find(".csd-editor-toolbar-mobile");
  const $bottomToolbar = $mobileToolbar.find(
    ".csd-editor-toolbar-mobile-bottom"
  );
  const $topToolbar = $container.find(".csd-editor-toolbar-mobile-top");
  let scrollTimeout;
  let isToolbarAction = false;

  function updateKeyboardHeight() {
    // Verifica compatibilità SSR
    if (typeof window !== 'undefined') {
      const visualViewport = window.visualViewport;
      if (!visualViewport) return;

      // Calculate keyboard height considering the viewport offset
      const keyboardHeight = Math.max(
        0,
        window.innerHeight - visualViewport.height
      );
      const viewportOffset = window.visualViewport.offsetTop || 0;

      // Update the CSS variable for keyboard height
      document.documentElement.style.setProperty(
        "--keyboard-height",
        `${keyboardHeight}px`
      );

    // Update classes based on keyboard state
    if (keyboardHeight > 0) {
      $container.addClass("keyboard-open");
      $bottomToolbar.addClass("keyboard-open");

      // Get the top toolbar
      const $topToolbar = $container.find(".csd-editor-toolbar-mobile-top");

      // When keyboard is open, position both toolbars relative to viewport
      $bottomToolbar.css({
        position: "fixed",
        bottom: `${keyboardHeight}px`,
        transform: `translateY(${viewportOffset}px)`,
        zIndex: 1050,
      });

      $topToolbar.css({
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        transform: `translateY(${viewportOffset}px)`,
        zIndex: 1050,
      });
    } else if (!isToolbarAction) {
      // Only hide keyboard if it's not a toolbar action
      $container.removeClass("keyboard-open");
      $bottomToolbar.removeClass("keyboard-open");

      // Reset position when keyboard is closed
      $bottomToolbar.css({
        position: "fixed",
        bottom: 0,
        transform: "none",
        zIndex: 1050,
      });

      $topToolbar.css({
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        transform: "none",
        zIndex: 1050,
      });
    }
    }
  }

  function handleScroll() {
    // Hide toolbar immediately when scrolling starts
    $topToolbar.css("opacity", "0");
    $topToolbar.css("pointer-events", "none");
    $bottomToolbar.css("opacity", "0");
    $bottomToolbar.css("pointer-events", "none");

    // Clear any existing timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    // Set new timeout to show toolbar after scrolling stops
    scrollTimeout = setTimeout(() => {
      $topToolbar.css("opacity", "1");
      $topToolbar.css("pointer-events", "auto");
      $bottomToolbar.css("opacity", "1");
      $bottomToolbar.css("pointer-events", "auto");
      updateKeyboardHeight();
    }, 150);
  }

  // Listen for viewport changes
  if (typeof window !== 'undefined' && window.visualViewport) {
    window.visualViewport.addEventListener("resize", updateKeyboardHeight);
    window.visualViewport.addEventListener("scroll", handleScroll);
  }

  // Handle toolbar button clicks
  $bottomToolbar.on("mousedown touchstart", ".csd-editor-tool", function (e) {
    isToolbarAction = true;
    // Prevent default to avoid losing focus
    e.preventDefault();
  });

  $bottomToolbar.on("mouseup touchend", ".csd-editor-tool", function () {
    // Reset after a short delay to allow the action to complete
    setTimeout(() => {
      isToolbarAction = false;
      // Refocus the editor
      $editor.focus();
    }, 100);
  });

  // Focus/blur events with improved positioning
  $editor.on("focus", () => {
    updateKeyboardHeight();
    // Scroll the editor into view if needed
    const editorRect = $editor[0].getBoundingClientRect();
    // Verifica compatibilità SSR
    if (typeof window !== 'undefined') {
      const viewportHeight = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
      if (editorRect.bottom > viewportHeight) {
        window.scrollTo({
          top: window.pageYOffset + (editorRect.bottom - viewportHeight) + 100,
          behavior: "smooth",
        });
      }
    }
  });

  $editor.on("blur", (e) => {
    // Don't hide keyboard if we're clicking a toolbar button
    if (isToolbarAction || $CSD(e.target).closest(".csd-color-picker").length) {
      e.preventDefault();
      return;
    }

    document.documentElement.style.setProperty("--keyboard-height", "0px");
    $container.removeClass("keyboard-open");
    $bottomToolbar.removeClass("keyboard-open");
    $bottomToolbar.css({
      position: "fixed",
      bottom: 0,
      transform: "none",
      opacity: "1",
      pointerEvents: "auto",
    });
  });

  // Initial position
  updateKeyboardHeight();
}

function initializeEditor(element) {
  if (!element || element.initialized) return;

  const $textarea = $CSD(element);
  const $container = $CSD('<div class="csd-editor-container"></div>');
  $textarea.wrap($container);

  // Create menu bar
  const $menuBar = createMenuBar();

  // Create toolbar
  const $toolbar = createToolbar($textarea);

  // Create content area
  const $editor = $CSD(
    '<div class="csd-editor-content" contenteditable="true"></div>'
  );
  $editor.attr("placeholder", $textarea.attr("placeholder") || "");

  // Create status bar
  const $statusBar = createStatusBar();

  // Insert components
  $textarea.before($menuBar);
  $textarea.before($toolbar);
  $textarea.before($editor);
  $textarea.after($statusBar);
  $textarea.hide();

  // Set initial content
  $editor.html($textarea.val());

  // Handle virtual keyboard
  handleVirtualKeyboard($editor);

  // Event handlers
  initializeEventHandlers($editor, $textarea);

  // Add click handlers for dropdowns
  $toolbar
    .find(".csd-editor-toolbar-dropdown > button")
    .on("touchend", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const $dropdown = $CSD(this).closest(".csd-editor-toolbar-dropdown");
      $dropdown.toggleClass("active");

      // Close other dropdowns
      $toolbar
        .find(".csd-editor-toolbar-dropdown.active")
        .not($dropdown)
        .removeClass("active");
    });

  // Close dropdowns when clicking outside
  $CSD(document).on("touchend", function (e) {
    if (!$CSD(e.target).closest(".csd-editor-toolbar-dropdown").length) {
      $toolbar
        .find(".csd-editor-toolbar-dropdown.active")
        .removeClass("active");
    }
  });

  function clickToolBtn(el) {
    const command = $CSD(el).data("command");
    const value = $CSD(el).data("value");

    if (command) {
      // Mantieni il focus prima dell'esecuzione del comando
      $textarea[0].focus({ preventScroll: true });

      executeCommand(el, $editor);

      // Toggle active state for formatting buttons
      if (["bold", "italic", "underline"].includes(command)) {
        $CSD(el).toggleClass("active");
      }
    }
  }

  // Add click handlers for dropdown menu items
  $toolbar
    .find(".csd-editor-toolbar-dropdown-menu button")
    .on("touchend", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const command = $CSD(this).data("command");
      const value = $CSD(this).data("value");

      if (command) {
        executeCommand({ command, value }, $editor);

        // Close the dropdown
        $CSD(this)
          .closest(".csd-editor-toolbar-dropdown")
          .removeClass("active");

        // Update dropdown button icon for alignment
        if (command.startsWith("justify")) {
          const $dropdownButton = $CSD(this)
            .closest(".csd-editor-toolbar-dropdown")
            .find("button i");
          $dropdownButton.attr("class", $CSD(this).find("i").attr("class"));
        }
      }
    });

  $toolbar.find(".csd-editor-tool").on("touchend", function (e) {
    e.preventDefault();
    e.stopPropagation();

    // Esegui l'azione e mantieni il focus
    clickToolBtn(e.target);
  });

  // Previeni la perdita del focus durante lo scroll o altri eventi
  // $toolbar.on("scroll touchmove", function(e) {
  //   if ($CSD(e.target).closest(".csd-editor-tool").length) {
  //     e.preventDefault();
  //     $textarea[0].focus({preventScroll: true});
  //   }
  // });

  // Update button states based on current selection
  $editor.on("selectionchange", function () {
    updateToolbarState($toolbar);
  });

  // Initialize autoformatting
  initializeAutoformatting($editor);

  // Mark as initialized
  element.initialized = true;
}

function initializeEventHandlers($editor, $textarea) {
  const $container = $editor.closest(".csd-editor-container");

  // Content changes
  $editor.on("input", function () {
    $textarea.val($editor.html());
    $textarea.trigger("change");
    updateWordCount($container);
  });

  // Toolbar actions
  $container.on("click", ".csd-editor-tool", function (e) {
    e.preventDefault();
    const tool = $CSD(this).data("tool");
    executeCommand(this, $editor);
  });

  // Menu actions
  $container.on("click", ".csd-editor-menu-item button", function (e) {
    e.preventDefault();
    const action = $CSD(this).data("action");
    executeMenuAction(action, $editor);
  });

  // Initialize word count
  updateWordCount($container);

  // Paste handling
  $editor.on("paste", function (e) {
    e.preventDefault();

    // Prendi il contenuto dagli appunti
    const clipboardData = e.originalEvent.clipboardData || (typeof window !== 'undefined' ? window.clipboardData : null);
    const pastedData = clipboardData ?
      clipboardData.getData("text/html") || clipboardData.getData("text") : '';

    // Crea un elemento temporaneo per pulire il contenuto
    const div = document.createElement("div");
    div.innerHTML = pastedData;

    // Rimuovi stili indesiderati
    const elements = div.getElementsByTagName("*");
    for (let el of elements) {
      // Mantieni solo gli stili di base
      const allowedStyles = [
        "font-weight",
        "font-style",
        "text-decoration",
        "text-align",
      ];
      const style = el.style;
      for (let i = style.length - 1; i >= 0; i--) {
        const prop = style[i];
        if (!allowedStyles.includes(prop)) {
          style.removeProperty(prop);
        }
      }

      // Rimuovi classi e ID
      el.removeAttribute("class");
      el.removeAttribute("id");
    }

    // Inserisci il contenuto pulito
    document.execCommand("insertHTML", false, div.innerHTML);
  });
}

function executeCommand(tool, $editor) {
  if (!tool) return; // Guard against undefined tool

  $editor.focus();

  // Handle both string commands and button elements
  const command =
    typeof tool === "string"
      ? tool
      : tool && typeof tool === "object" && tool.dataset
      ? tool.dataset.command
      : tool && typeof tool === "object"
      ? tool.command
      : null;

  const value =
    typeof tool === "string"
      ? null
      : tool && typeof tool === "object" && tool.dataset
      ? tool.dataset.value
      : tool && typeof tool === "object"
      ? tool.value
      : null;

  if (!command) return; // Guard against missing command

  switch (command) {
    // Basic formatting
    case "undo":
    case "redo":
    case "bold":
    case "italic":
    case "underline":
    case "strikethrough":
      document.execCommand(command, false);
      break;

    // Headings
    case "heading":
      showDropdown($editor, [
        {
          text: "Heading 1",
          command: "formatBlock",
          value: "h1",
        },
        {
          text: "Heading 2",
          command: "formatBlock",
          value: "h2",
        },
        {
          text: "Heading 3",
          command: "formatBlock",
          value: "h3",
        },
        {
          text: "Paragraph",
          command: "formatBlock",
          value: "p",
        },
      ]);
      break;

    case "formatBlock":
      // Verifica compatibilità SSR
      if (typeof window !== 'undefined') {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);

      document.execCommand(command, false, value);
      }
      break;

    // Font styling
    case "font":
      showDropdown($editor, [
        {
          text: "Arial",
          command: "fontName",
          value: "Arial",
        },
        {
          text: "Times New Roman",
          command: "fontName",
          value: "Times New Roman",
        },
        {
          text: "Courier New",
          command: "fontName",
          value: "Courier New",
        },
        {
          text: "Georgia",
          command: "fontName",
          value: "Georgia",
        },
      ]);
      break;

    case "fontName":
      document.execCommand(command, false, value);
      break;

    case "fontSize":
      if (value === null) {
        showDropdown($editor, [
          {
            text: "Small",
            command: "fontSize",
            value: "1",
          },
          {
            text: "Normal",
            command: "fontSize",
            value: "3",
          },
          {
            text: "Large",
            command: "fontSize",
            value: "5",
          },
          {
            text: "Huge",
            command: "fontSize",
            value: "7",
          },
        ]);
      } else {
        document.execCommand(command, false, value);
      }
      break;

    // Colors
    case "textColor":
      showColorPicker("color", tool);
      break;

    case "backgroundColor":
      showColorPicker("backgroundColor", tool);
      break;

    // Alignment
    case "alignment":
      showDropdown($editor, [
        {
          text: "Left",
          icon: "fa-solid fa-align-left",
          command: "justifyLeft",
        },
        {
          text: "Center",
          icon: "fa-solid fa-align-center",
          command: "justifyCenter",
        },
        {
          text: "Right",
          icon: "fa-solid fa-align-right",
          command: "justifyRight",
        },
        {
          text: "Justify",
          icon: "fa-solid fa-align-justify",
          command: "justifyFull",
        },
      ]);
      break;

    case "justifyLeft":
    case "justifyCenter":
    case "justifyRight":
    case "justifyFull":
      document.execCommand(command, false);
      break;

    // Lists
    case "numberedList":
      document.execCommand("insertOrderedList", false);
      break;

    case "bulletedList":
      document.execCommand("insertUnorderedList", false);
      break;

    // Indentation
    case "indent":
      document.execCommand("indent", false);
      break;

    case "outdent":
      document.execCommand("outdent", false);
      break;

    // Insert elements
    case "link":
      showLinkPopover($editor);
      break;

    case "image":
      showImagePicker($editor);
      break;

    case "table":
      showTablePicker($editor);
      break;

    case "specialCharacters":
      showSpecialCharacters($editor);
      break;

    case "pageBreak":
      document.execCommand("insertHTML", false, '<hr class="page-break">');
      break;

    case "sourceEditing":
      toggleSourceMode($editor);
      break;

    case "paste":
      // Gestisci l'evento paste direttamente nell'editor
      const handlePaste = function (e) {
        e.preventDefault();

        // Verifica compatibilità SSR
        if (typeof window === 'undefined') return;
        
        // Ottieni il contenuto dagli appunti
        const clipboardData = e.clipboardData || window.clipboardData;
        let content;

        // Prova prima a ottenere HTML, altrimenti usa testo semplice
        if (clipboardData.types.includes("text/html")) {
          content = clipboardData.getData("text/html");

          // Crea un elemento temporaneo per pulire l'HTML
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = content;

          // Rimuovi tutti gli stili inline e attributi indesiderati
          const cleanNode = function (node) {
            if (node.nodeType === 1) {
              // Element node
              // Rimuovi tutti gli attributi tranne quelli permessi
              const allowedAttrs = ["href", "src", "alt"];
              const attrs = Array.from(node.attributes);
              attrs.forEach((attr) => {
                if (!allowedAttrs.includes(attr.name)) {
                  node.removeAttribute(attr.name);
                }
              });

              // Gestisci stili inline
              if (node.style.length > 0) {
                const allowedStyles = [
                  "font-weight",
                  "font-style",
                  "text-decoration",
                  "text-align",
                ];
                const styles = Array.from(node.style);
                styles.forEach((style) => {
                  if (!allowedStyles.includes(style)) {
                    node.style.removeProperty(style);
                  }
                });
              }

              // Pulisci ricorsivamente i nodi figli
              Array.from(node.children).forEach(cleanNode);
            }
          };

          cleanNode(tempDiv);
          content = tempDiv.innerHTML;
        } else {
          // Se non c'è HTML, usa il testo semplice
          content = clipboardData.getData("text/plain");
          content = content.replace(/\n/g, "<br>");
        }

        // Inserisci il contenuto pulito
        // Verifica compatibilità SSR
        if (typeof window !== 'undefined') {
          const selection = window.getSelection();
          if (selection.rangeCount) {
            const range = selection.getRangeAt(0);
            range.deleteContents();

            // Crea un frammento con il contenuto pulito
            const fragment = document.createDocumentFragment();
            const temp = document.createElement("div");
            temp.innerHTML = content;

            while (temp.firstChild) {
              fragment.appendChild(temp.firstChild);
            }

            range.insertNode(fragment);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      };

      // Aggiungi il gestore dell'evento paste all'editor
      $editor.elements[0].addEventListener("paste", handlePaste);
      break;

    default:
      if (command) {
        document.execCommand(command, false, value || null);
      }
      break;
  }
}

function executeMenuAction(action, $editor) {
  switch (action) {
    case "new":
      if (confirm("Create new document? All changes will be lost.")) {
        $editor.html("");
      }
      break;
    case "open":
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".txt,.html,.md";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            $editor.html(e.target.result);
          };
          reader.readAsText(file);
        }
      };
      input.click();
      break;

    case "save":
      const content = $editor.html();
      // Verifica compatibilità SSR
      if (typeof window !== 'undefined') {
        const blob = new Blob([content], { type: "text/html" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "document.html";
        a.click();
        window.URL.revokeObjectURL(url);
      }
      break;

    case "export-pdf":
      alert(
        "PDF export functionality requires a PDF generation library. Please implement based on your needs."
      );
      break;

    case "export-word":
      const wordContent = $editor.html();
      // Verifica compatibilità SSR
      if (typeof window !== 'undefined') {
        const wordBlob = new Blob([wordContent], { type: "application/msword" });
        const wordUrl = window.URL.createObjectURL(wordBlob);
        const wordLink = document.createElement("a");
        wordLink.href = wordUrl;
        wordLink.download = "document.doc";
        wordLink.click();
        window.URL.revokeObjectURL(wordUrl);
      }
      break;
  }
}

function showDropdown($editor, items) {
  const $dropdown = $CSD('<div class="csd-editor-dropdown"></div>');

  items.forEach((item) => {
    const $item = $CSD(`
                <button type="button" class="csd-editor-dropdown-item csd-editor-tool" data-command="${
                  item.command || ""
                }" data-value="${item.value || ""}">
                    ${item.icon ? `<i class="${item.icon}"></i>` : ""}
                    <span>${item.text}</span>
                </button>
            `);
    $dropdown.append($item);
  });

  const $button = $CSD(event.target).closest(".csd-editor-tool");
  const buttonRect = $button[0].getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

  $dropdown.css({
    position: "absolute",
    top: buttonRect.bottom + scrollTop + "px",
    left: buttonRect.left + scrollLeft + "px",
  });

  $CSD("body").append($dropdown);

  // Gestisci il click sugli item del dropdown
  $dropdown.on("click", ".csd-editor-dropdown-item", function (e) {
    e.preventDefault();
    e.stopPropagation();
    const command = this.dataset.command;
    const value = this.dataset.value;
    executeCommand(this, $editor);
    $dropdown.remove();
  });

  // Previeni la chiusura quando si clicca dentro il dropdown
  $dropdown.on("mousedown", function (e) {
    e.preventDefault();
    e.stopPropagation();
  });

  setTimeout(() => {
    $CSD(document).on("mousedown", function (e) {
      if (!$dropdown[0].contains(e.target)) {
        $dropdown.remove();
        $CSD(document).off("mousedown");
      }
    });
  }, 0);
}

function showColorPicker(type, btnTool) {
  if ($CSD(btnTool).attr("data-color-picker")) {
    $CSD(btnTool).removeAttr("data-color-picker");
    $CSD(".csd-editor-container").css("padding-bottom", "0");
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  let elemManipolato;
  let isElementoManipolatoCreato = false;
  const $button = $CSD(event.target).closest(".csd-editor-tool");
  const $mobileToolbar = $button.closest(".csd-editor-toolbar-mobile-bottom");

  if ($mobileToolbar.length) {
    const $picker = $CSD(`
          <div class="csd-color-picker" style="position: absolute; bottom: 100%; left: 0; right: 0; background: #fff; padding: 4px 8px 0; box-shadow: 0 -2px 5px rgba(0,0,0,0.1); z-index: 1000;">
            <div class="color-area" style="width: 100%; height: 150px; position: relative; background: linear-gradient(to right, #fff, #f00);">
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to bottom, transparent, #000);"></div>
              <div class="color-pointer" style="position: absolute; width: 10px; height: 10px; border: 2px solid #fff; border-radius: 50%; transform: translate(-50%, -50%);"></div>
            </div>
            <div class="hue-slider" style="width: 100%; height: 20px; margin: 6px 0 2px; background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00); position: relative;">
              <div class="hue-handle" style="position: absolute; top: 0; width: 5px; height: 100%; background: #fff; border: 1px solid #000; transform: translateX(-50%);"></div>
            </div>
          </div>
        `);

    let currentHue = 0;
    let currentSat = 100;
    let currentLit = 50;

    function updateColor() {
      const h = currentHue;
      const s = currentSat;
      const l = currentLit;

      const c = ((1 - Math.abs((2 * l) / 100 - 1)) * s) / 100;
      const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
      const m = l / 100 - c / 2;

      let r, g, b;
      if (h < 60) {
        r = c;
        g = x;
        b = 0;
      } else if (h < 120) {
        r = x;
        g = c;
        b = 0;
      } else if (h < 180) {
        r = 0;
        g = c;
        b = x;
      } else if (h < 240) {
        r = 0;
        g = x;
        b = c;
      } else if (h < 300) {
        r = x;
        g = 0;
        b = c;
      } else {
        r = c;
        g = 0;
        b = x;
      }

      const toHex = (n) => {
        const hex = Math.round((n + m) * 255).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      };

      const color = "#" + toHex(r) + toHex(g) + toHex(b);
      $picker
        .find(".color-area")
        .css(
          "background",
          `linear-gradient(to right, #fff, hsl(${currentHue}, 100%, 50%))`
        );
      return color;
    }

    $CSD(".csd-editor-container").css(
      "padding-bottom",
      "var(--keyboard-height)"
    );

    const id = "color-picker-" + Math.random().toString(36).substring(2, 9);
    $picker.attr("data-id", id);
    $CSD(btnTool).attr("data-color-picker", id);

    $mobileToolbar.append($picker);

    // Verifica compatibilità SSR
    if (typeof window !== 'undefined') {
      window.scrollBy({
        top: scrollNeeded,
        behavior: "smooth",
      });
    }

    // Eventi per l'area colore
    const $colorArea = $picker.find(".color-area");
    const $colorPointer = $picker.find(".color-pointer");

    $colorArea.on("touchstart", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const rect = this.getBoundingClientRect();

      function handleMove(e) {
        e.stopPropagation();
        const touch = e.touches[0];
        const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
        const y = Math.max(0, Math.min(touch.clientY - rect.top, rect.height));
        currentSat = (x / rect.width) * 100;
        currentLit = 100 - (y / rect.height) * 100;

        $colorPointer.css({
          left: x + "px",
          top: y + "px",
        });

        const color = updateColor();

        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        if (range.collapsed) {
          // Se non c'è selezione, crea uno span colorato
          if (!elemManipolato) {
            elemManipolato = document.createElement("span");
          }
          if (type == "color") {
            elemManipolato.style.color = color;
          } else if (type == "background") {
            elemManipolato.style.backgroundColor = color;
          }
          elemManipolato.innerHTML = "\u200B"; // Zero-width space
          range.insertNode(elemManipolato);
          range.setStartAfter(elemManipolato);
        } else {
          // Se c'è selezione, applica il colore al testo selezionato
          if (!elemManipolato) {
            elemManipolato = document.createElement("span");
          }
          if (type == "color") {
            elemManipolato.style.color = color;
          } else if (type == "background") {
            elemManipolato.style.backgroundColor = color;
          }
          if (!isElementoManipolatoCreato) {
            range.surroundContents(elemManipolato);
            isElementoManipolatoCreato = true;
          }
        }
      }

      $CSD(document).on("touchmove", handleMove);
      $CSD(document).on("touchend touchcancel", function cleanup() {
        $CSD(document).off("touchmove", handleMove);
        $CSD(document).off("touchend touchcancel", cleanup);
      });

      handleMove(e);
    });

    // Eventi per lo slider della tonalità
    const $hueSlider = $picker.find(".hue-slider");
    const $hueHandle = $picker.find(".hue-handle");

    $hueSlider.on("touchstart", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const rect = this.getBoundingClientRect();

      function handleMove(e) {
        e.stopPropagation();
        const touch = e.touches[0];
        const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));

        currentHue = (x / rect.width) * 360;

        $hueHandle.css("left", x + "px");

        const color = updateColor();
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);

        if (range.collapsed) {
          // Se non c'è selezione, crea uno span colorato
          if (!elemManipolato) {
            elemManipolato = document.createElement("span");
          }
          if (type == "color") {
            elemManipolato.style.color = color;
          } else if (type == "background") {
            elemManipolato.style.backgroundColor = color;
          }
          elemManipolato.innerHTML = "\u200B"; // Zero-width space
          range.insertNode(elemManipolato);
          range.setStartAfter(elemManipolato);
        } else {
          // Se c'è selezione, applica il colore al testo selezionato
          if (!elemManipolato) {
            elemManipolato = document.createElement("span");
          }
          if (type == "color") {
            elemManipolato.style.color = color;
          } else if (type == "background") {
            elemManipolato.style.backgroundColor = color;
          }
          if (!isElementoManipolatoCreato) {
            range.surroundContents(elemManipolato);
            isElementoManipolatoCreato = true;
          }
        }
      }

      $CSD(document).on("touchmove", handleMove);
      $CSD(document).on("touchend touchcancel", function cleanup() {
        $CSD(document).off("touchmove", handleMove);
        $CSD(document).off("touchend touchcancel", cleanup);
      });

      handleMove(e);
    });

    updateColor();

    // Imposta posizione iniziale
    $colorPointer.css({
      left: "100%",
      top: "0%",
    });
    $hueHandle.css("left", "0");

    // Chiudi quando si clicca fuori
    setTimeout(() => {
      $CSD(document).one("touchstart", (e) => {
        if (!$picker[0].contains(e.target)) {
          $CSD(".csd-editor-container").css("padding-bottom", "0");
          $picker.remove();
        }
      });
    }, 0);
  } else {
    // Per desktop, mostra la griglia di colori
    const $picker = $CSD(`
          <div class="csd-editor-color-picker">
            <div class="color-grid">
              ${[
                "#000000",
                "#FF0000",
                "#00FF00",
                "#0000FF",
                "#FFFF00",
                "#FF00FF",
                "#00FFFF",
                "#FFFFFF",
                "#808080",
                "#800000",
                "#008000",
                "#000080",
                "#808000",
                "#800080",
                "#008080",
                "#C0C0C0",
              ]
                .map(
                  (color) => `
                <button type="button" class="color-item" style="background-color: ${color}" data-color="${color}"></button>
              `
                )
                .join("")}
            </div>
          </div>
        `);

    const buttonRect = $button[0].getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;

    $picker.css({
      position: "absolute",
      top: buttonRect.bottom + scrollTop + "px",
      left: buttonRect.left + scrollLeft + "px",
    });

    $CSD("body").append($picker);

    $picker.on("click", ".color-item", function () {
      const color = $CSD(this).data("color");
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);

      if (range.collapsed) {
        // Se non c'è selezione, crea uno span colorato
        if (!elemManipolato) {
          elemManipolato = document.createElement("span");
        }
        if (type == "color") {
          elemManipolato.style.color = color;
        } else if (type == "background") {
          elemManipolato.style.backgroundColor = color;
        }
        elemManipolato.innerHTML = "\u200B"; // Zero-width space
        range.insertNode(elemManipolato);
        range.setStartAfter(elemManipolato);
      } else {
        // Se c'è selezione, applica il colore al testo selezionato
        if (!elemManipolato) {
          elemManipolato = document.createElement("span");
        }
        if (type == "color") {
          elemManipolato.style.color = color;
        } else if (type == "background") {
          elemManipolato.style.backgroundColor = color;
        }
        if (!isElementoManipolatoCreato) {
          range.surroundContents(elemManipolato);
          isElementoManipolatoCreato = true;
        }
      }
    });

    setTimeout(() => {
      $CSD(document).on("click", (e) => {
        const $target = $CSD(e.target);
        if (
          !$target.closest(".csd-editor-color-picker").length ||
          !$target.closest(".csd-color-picker").length
        ) {
          $picker.remove();
        }
      });
    }, 0);
  }
}

function showSpecialCharacters($editor) {
  const specialChars = [
    "€",
    "£",
    "$",
    "¥",
    "¢",
    "₽",
    "₹",
    "±",
    "×",
    "÷",
    "≠",
    "≈",
    "≤",
    "≥",
    "∞",
    "∑",
    "∏",
    "√",
    "∫",
    "∂",
    "∆",
    "¼",
    "½",
    "¾",
    "⅓",
    "⅔",
    "⅕",
    "⅖",
    "⅗",
    "⅘",
    "←",
    "→",
    "↑",
    "↓",
    "↔",
    "↕",
    "⇐",
    "⇒",
    "⇑",
    "⇓",
    "©",
    "®",
    "™",
    "§",
    "¶",
    "†",
    "‡",
    "•",
    "·",
    "…",
    "‰",
    "′",
    "″",
    "À",
    "Á",
    "È",
    "É",
    "Ì",
    "Í",
    "Ò",
    "Ó",
    "Ù",
    "Ú",
    "à",
    "á",
    "è",
    "é",
    "ì",
    "í",
    "ò",
    "ó",
    "ù",
    "ú",
  ];

  const $picker = $CSD('<div class="csd-editor-special-chars"></div>');

  const $grid = $CSD(`
            <div class="special-chars-grid">
                ${specialChars
                  .map(
                    (char) => `
                    <button type="button" class="special-char-item" title="${char}">${char}</button>
                `
                  )
                  .join("")}
            </div>
        `);

  $picker.append($grid);

  // Stili inline per il picker
  $picker.css({
    position: "absolute",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "4px",
    padding: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    zIndex: 1000,
    maxHeight: "400px",
    overflowY: "auto",
    width: "400px",
  });

  $picker.find(".special-chars-grid").css({
    display: "grid",
    gridTemplateColumns: "repeat(10, 1fr)",
    gap: "5px",
  });

  // Stili per i bottoni
  $picker.find(".special-char-item").css({
    width: "30px",
    height: "30px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    background: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    transition: "all 0.2s",
  });

  // Posizionamento
  const $button = $CSD(event.target).closest(".csd-editor-tool");
  const buttonRect = $button[0].getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

  $picker.css({
    top: buttonRect.bottom + scrollTop + 5 + "px",
    left: buttonRect.left + scrollLeft + "px",
  });

  $CSD("body").append($picker);

  // Hover effect per i bottoni
  $picker.find(".special-char-item").hover(
    function () {
      $(this).css({ background: "#f5f5f5", borderColor: "#999" });
    },
    function () {
      $(this).css({ background: "#fff", borderColor: "#ddd" });
    }
  );

  // Click handler
  $picker.on("click", ".special-char-item", function (e) {
    e.stopPropagation();
    const char = $CSD(this).text().trim();
    document.execCommand("insertText", false, char);
    $picker.remove();
  });

  // Chiudi il picker quando si clicca fuori
  setTimeout(() => {
    $CSD(document).one("mousedown", function (e) {
      if (!$picker[0].contains(e.target)) {
        $picker.remove();
      }
    });
  }, 0);
}

function insertTable($editor, rows, cols) {
  let tableHtml = "<table><tbody>";
  for (let i = 0; i < rows; i++) {
    tableHtml += "<tr>";
    for (let j = 0; j < cols; j++) {
      tableHtml += "<td><br></td>";
    }
    tableHtml += "</tr>";
  }
  tableHtml += "</tbody></table>";

  const editorElement = $editor.elements[0];
  // Verifica compatibilità SSR
  if (typeof window === 'undefined') return;
  
  const selection = window.getSelection();
  let range;

  // Se c'è una selezione usa quella, altrimenti crea un nuovo range alla fine
  if (selection.rangeCount > 0) {
    range = selection.getRangeAt(0);
    // Verifica che il range sia all'interno dell'editor
    if (!editorElement.contains(range.commonAncestorContainer)) {
      range = null;
    }
  }

  // Se non abbiamo un range valido, troviamo il punto di inserimento corretto
  if (!range) {
    range = document.createRange();

    // Se c'è un nodo di testo attivo, usa quello
    if (document.activeElement === editorElement && selection.focusNode) {
      if (selection.focusNode.nodeType === Node.TEXT_NODE) {
        range.setStart(selection.focusNode, selection.focusOffset);
        range.setEnd(selection.focusNode, selection.focusOffset);
      } else {
        // Se il nodo focus non è un nodo di testo, cerca il punto di inserimento più vicino
        const walker = document.createTreeWalker(
          editorElement,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        let node;
        let closestNode = null;
        let minDistance = Infinity;

        while ((node = walker.nextNode())) {
          const range = document.createRange();
          range.selectNode(node);
          const rect = range.getBoundingClientRect();
          const distance = Math.abs(
            rect.top - selection.focusNode.getBoundingClientRect().top
          );

          if (distance < minDistance) {
            minDistance = distance;
            closestNode = node;
          }
        }

        if (closestNode) {
          range.setStart(closestNode, closestNode.length);
          range.setEnd(closestNode, closestNode.length);
        } else {
          // Se non troviamo nessun nodo di testo, crea uno nuovo
          const textNode = document.createTextNode("");
          editorElement.appendChild(textNode);
          range.setStart(textNode, 0);
          range.setEnd(textNode, 0);
        }
      }
    } else {
      // Se l'editor non è attivo, inserisci alla fine
      let lastNode = editorElement.lastChild;

      // Se l'ultimo nodo è un BR, crea un nuovo nodo di testo
      if (!lastNode || lastNode.nodeName === "BR") {
        const textNode = document.createTextNode("");
        editorElement.appendChild(textNode);
        lastNode = textNode;
      }

      range.selectNode(lastNode);
      range.collapse(false);
    }

    // Aggiorna la selezione
    selection.removeAllRanges();
    selection.addRange(range);
  }

  const table = document.createElement("table");
  table.innerHTML = tableHtml;

  // Inserisci la tabella
  range.deleteContents();
  range.insertNode(table);

  // Aggiungi uno spazio dopo la tabella per facilitare l'editing
  const space = document.createElement("p");
  space.innerHTML = "<br>";
  table.parentNode.insertBefore(space, table.nextSibling);

  // Sposta il cursore dopo la tabella
  const newRange = document.createRange();
  newRange.setStartAfter(space);
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
}

function toggleSourceMode($editor) {
  const $container = $editor.closest(".csd-editor-container");
  const isSourceMode = $container.hasClass("source-mode");

  if (isSourceMode) {
    const sourceCode = $editor.text();
    $editor.html(sourceCode);
    $container.removeClass("source-mode");
  } else {
    const htmlContent = $editor.html();
    $editor.text(htmlContent);
    $container.addClass("source-mode");
  }
}

function updateWordCount($container) {
  const text = $container.find(".csd-editor-content").text();
  const words = text.trim().split(/\s+/).length;
  const chars = text.length;

  $container.find(".csd-editor-wordcount").text(`Words: ${words}`);
  $container.find(".csd-editor-charcount").text(`Characters: ${chars}`);
}

// Markdown-style autoformatting
function initializeAutoformatting($editor) {
  // Formatta il contenuto iniziale
  function formatInitialContent() {
    const content = $editor.html();
    if (!content) return;

    // Dividi il contenuto in linee
    const lines = content.split(/\n|<br\/?>/);
    const formattedLines = lines.map((line) => {
      line = line.trim();

      // Headings
      if (line.match(/^#\s/)) {
        return `<h1>${line.replace(/^#\s/, "")}</h1>`;
      } else if (line.match(/^##\s/)) {
        return `<h2>${line.replace(/^##\s/, "")}</h2>`;
      } else if (line.match(/^###\s/)) {
        return `<h3>${line.replace(/^###\s/, "")}</h3>`;
      }
      // Lists
      else if (line.match(/^[\*\-]\s/)) {
        return `<ul><li>${line.replace(/^[\*\-]\s/, "")}</li></ul>`;
      } else if (line.match(/^1\.\s/)) {
        return `<ol><li>${line.replace(/^1\.\s/, "")}</li></ol>`;
      }
      // Blockquote
      else if (line.match(/^>\s/)) {
        return `<blockquote>${line.replace(/^>\s/, "")}</blockquote>`;
      }
      // Code block
      else if (line.match(/^```/)) {
        return "<pre><code>";
      }
      // Inline formatting
      else {
        // Bold
        line = line.replace(/\*\*([^\*]+)\*\*/g, "<strong>$1</strong>");
        // Italic
        line = line.replace(/\*([^\*]+)\*/g, "<em>$1</em>");
        // Code
        line = line.replace(/`([^`]+)`/g, "<code>$1</code>");
        // Links
        line = line.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>');

        return line ? `<p>${line}</p>` : "<p><br></p>";
      }
    });

    $editor.html(formattedLines.join(""));
  }

  // Formatta il contenuto iniziale
  formatInitialContent();

  // Gestisci gli eventi di formattazione durante l'editing
  $editor.on("keydown", function (e) {
    if (e.key === "Enter") {
      // Verifica compatibilità SSR
      if (typeof window === 'undefined') return;
      
      // Verifica compatibilità SSR
      if (typeof window === 'undefined') return;
      
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      
      const line = selection.anchorNode.textContent;

      // Headings
      if (line && line.match(/^#\s/)) {
        e.preventDefault();
        document.execCommand("formatBlock", false, "h1");
        document.execCommand("delete", false);
        document.execCommand("delete", false);
      } else if (line.match(/^##\s/)) {
        e.preventDefault();
        document.execCommand("formatBlock", false, "h2");
        document.execCommand("delete", false);
        document.execCommand("delete", false);
        document.execCommand("delete", false);
      } else if (line.match(/^###\s/)) {
        e.preventDefault();
        document.execCommand("formatBlock", false, "h3");
        document.execCommand("delete", false);
        document.execCommand("delete", false);
        document.execCommand("delete", false);
        document.execCommand("delete", false);
      }
      // Lists
      else if (line.match(/^[\*\-]\s/)) {
        e.preventDefault();
        document.execCommand("insertUnorderedList", false);
        document.execCommand("delete", false);
        document.execCommand("delete", false);
      } else if (line.match(/^1\.\s/)) {
        e.preventDefault();
        document.execCommand("insertOrderedList", false);
        document.execCommand("delete", false);
        document.execCommand("delete", false);
        document.execCommand("delete", false);
      }
      // Blockquote
      else if (line.match(/^>\s/)) {
        e.preventDefault();
        document.execCommand("formatBlock", false, "blockquote");
        document.execCommand("delete", false);
        document.execCommand("delete", false);
      }
      // Code block
      else if (line.match(/^```/)) {
        e.preventDefault();
        document.execCommand("formatBlock", false, "pre");
        const pre = selection.anchorNode.parentElement;
        if (pre.tagName === "PRE") {
          const code = document.createElement("code");
          pre.appendChild(code);
          const range = document.createRange();
          range.setStart(code, 0);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        document.execCommand("delete", false);
        document.execCommand("delete", false);
        document.execCommand("delete", false);
      }
    }
    // Keyboard shortcuts
    else if (e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          document.execCommand("bold", false);
          break;
        case "i":
          e.preventDefault();
          document.execCommand("italic", false);
          break;
        case "u":
          e.preventDefault();
          document.execCommand("underline", false);
          break;
      }
    }
    // Tab handling
    else if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand(e.shiftKey ? "outdent" : "indent", false);
    }
    // Inline formatting
    else if (e.key === " ") {
      // Verifica compatibilità SSR
      if (typeof window === 'undefined') return;
      
      const selection = window.getSelection();
      if (!selection) return;
      
      const anchorNode = selection.anchorNode;
      const position = selection.anchorOffset;

      // Bold with **text**
      if (anchorNode && anchorNode.textContent && anchorNode.textContent.match(/\*\*([^\*]+)\*\*$/)) {
        e.preventDefault();
        const text = anchorNode.textContent.match(/\*\*([^\*]+)\*\*$/)[1];
        replaceText(
          selection,
          text,
          position,
          "**",
          document.execCommand.bind(document, "bold", false)
        );
      }
      // Italic with *text*
      else if (line.match(/\*([^\*]+)\*$/)) {
        e.preventDefault();
        const text = line.match(/\*([^\*]+)\*$/)[1];
        replaceText(
          selection,
          text,
          position,
          "*",
          document.execCommand.bind(document, "italic", false)
        );
      }
      // Code with `code`
      else if (line.match(/`([^`]+)`$/)) {
        e.preventDefault();
        const text = line.match(/`([^`]+)`$/)[1];
        replaceText(selection, text, position, "`", () => {
          document.execCommand("fontName", false, "monospace");
        });
      }
      // Links with [text](url)
      else if (line.match(/\[([^\]]+)\]\(([^\)]+)\)$/)) {
        e.preventDefault();
        const matches = line.match(/\[([^\]]+)\]\(([^\)]+)\)$/);
        const text = matches[1];
        const url = matches[2];
        const range = document.createRange();
        range.setStart(selection.anchorNode, position - matches[0].length);
        range.setEnd(selection.anchorNode, position);
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand("createLink", false, url);
        document.execCommand("insertText", false, " ");
      }
    }
  });
}

// Helper function to replace markdown text with formatted text
function replaceText(selection, text, position, marker, formatCommand) {
  const range = document.createRange();
  range.setStart(
    selection.anchorNode,
    position - (text.length + 2 * marker.length)
  );
  range.setEnd(selection.anchorNode, position);
  selection.removeAllRanges();
  selection.addRange(range);
  formatCommand();
  document.execCommand("insertText", false, text + " ");
}

// Editor Configuration
const EDITOR_MENU_ITEMS = {
  file: [
    { label: "New Document", icon: "fa-regular fa-file", action: "new" },
    { label: "Open...", icon: "fa-regular fa-folder-open", action: "open" },
    { label: "Save", icon: "fa-regular fa-floppy-disk", action: "save" },
    {
      label: "Export as PDF",
      icon: "fa-regular fa-file-pdf",
      action: "export-pdf",
    },
    {
      label: "Export as Word",
      icon: "fa-regular fa-file-word",
      action: "export-word",
    },
  ],
  edit: [
    { label: "Undo", icon: "fa-solid fa-rotate-left", action: "undo" },
    { label: "Redo", icon: "fa-solid fa-rotate-right", action: "redo" },
    { label: "Cut", icon: "fa-regular fa-scissors", action: "cut" },
    { label: "Copy", icon: "fa-regular fa-copy", action: "copy" },
    { label: "Paste", icon: "fa-regular fa-clipboard", action: "paste" },
  ],
  insert: [
    { label: "Image", icon: "fa-regular fa-image", action: "image" },
    { label: "Table", icon: "fa-solid fa-table", action: "table" },
    { label: "Link", icon: "fa-solid fa-link", action: "link" },
    {
      label: "Special Character",
      icon: "fa-solid fa-s",
      action: "special-char",
    },
    {
      label: "Page Break",
      icon: "fa-solid fa-grip-lines",
      action: "page-break",
    },
  ],
  format: [
    { label: "Bold", icon: "fa-solid fa-bold", action: "bold" },
    { label: "Italic", icon: "fa-solid fa-italic", action: "italic" },
    { label: "Underline", icon: "fa-solid fa-underline", action: "underline" },
    {
      label: "Strikethrough",
      icon: "fa-solid fa-strikethrough",
      action: "strikethrough",
    },
  ],
};

const EDITOR_TOOLBAR_ITEMS = [
  ["undo", "redo"],
  ["cut", "copy", "paste"],
  ["heading"],
  ["bold", "italic", "underline", "strikethrough"],
  ["font", "fontSize"],
  ["textColor", "backgroundColor"],
  ["alignment"],
  ["numberedList", "bulletedList"],
  ["indent", "outdent"],
  ["link", "image", "table"],
  ["specialCharacters", "pageBreak"],
  ["sourceEditing"],
];

function createMobileToolbar($editor) {
  const $mobileToolbar = $CSD('<div class="csd-editor-toolbar-mobile"></div>');

  // Top toolbar (fixed at top)
  const $topToolbar = $CSD('<div class="csd-editor-toolbar-mobile-top"></div>');

  // Navigation group (undo, redo)
  const $navGroup = $CSD('<div class="csd-editor-toolbar-group"></div>');
  $navGroup.append(`
            <button class="csd-editor-tool" data-command="undo">
                <i class="fa-solid fa-rotate-left"></i>
            </button>
            <button class="csd-editor-tool" data-command="redo">
                <i class="fa-solid fa-rotate-right"></i>
            </button>
            <button class="csd-editor-tool" data-command="copy">
                <i class="fa-solid fa-copy"></i>
            </button>
            <button class="csd-editor-tool" data-command="paste">
                <i class="fa-solid fa-paste"></i>
            </button>
        `);

  // Insert dropdown
  const $insertButton = $CSD(`
            <div class="csd-editor-toolbar-dropdown">
                <button class="csd-editor-tool">
                    <i class="fa-solid fa-plus"></i>
                </button>
                <div class="csd-editor-toolbar-dropdown-menu">
                    <button data-command="image"><i class="fa-regular fa-image"></i> Image</button>
                    <button data-command="link"><i class="fa-solid fa-link"></i> Link</button>
                </div>
            </div>
        `);

  $topToolbar.append($navGroup);
  $topToolbar.append($insertButton);

  // Bottom toolbar (above keyboard)
  const $bottomToolbar = $CSD(
    '<div class="csd-editor-toolbar-mobile-bottom"></div>'
  );

  // Format group
  const $formatGroup = $CSD('<div class="csd-editor-toolbar-group"></div>');
  $formatGroup.append(`
            <button class="csd-editor-tool" data-command="bold" style="width: 100%; height: 100%;">
                <i class="fa-solid fa-bold" style="pointer-events: none;"></i>
            </button>
            <button class="csd-editor-tool" data-command="italic" style="width: 100%; height: 100%;">
                <i class="fa-solid fa-italic" style="pointer-events: none;"></i>
            </button>
            <button class="csd-editor-tool" data-command="underline" style="width: 100%; height: 100%;">
                <i class="fa-solid fa-underline" style="pointer-events: none;"></i>
            </button>
            <button class="csd-editor-tool" data-command="textColor" style="width: 100%; height: 100%;">
                <i class="fa-solid fa-palette" style="pointer-events: none;"></i>
            </button>
        `);

  // Align dropdown
  const $alignButton = $CSD(`
            <div class="csd-editor-toolbar-dropdown">
                <button class="csd-editor-tool" style="width: 100%; height: 100%;">
                    <i class="fa-solid fa-align-left" style="pointer-events: none;"></i>
                </button>
                <div class="csd-editor-toolbar-dropdown-menu">
                    <button data-command="justifyLeft" style="width: 100%;"><i class="fa-solid fa-align-left" style="pointer-events: none;"></i></button>
                    <button data-command="justifyCenter" style="width: 100%;"><i class="fa-solid fa-align-center" style="pointer-events: none;"></i></button>
                    <button data-command="justifyRight" style="width: 100%;"><i class="fa-solid fa-align-right" style="pointer-events: none;"></i></button>
                </div>
            </div>
        `);

  // Font size button (Aa)
  const $fontSizeButton = $CSD(`
            <div class="csd-editor-toolbar-dropdown">
                <button class="csd-editor-tool" style="width: 100%; height: 100%;">
                    <i class="fa-solid fa-text-height" style="pointer-events: none;"></i>
                </button>
                <div class="csd-editor-toolbar-dropdown-menu">
                    <button data-command="fontSize" data-value="1" style="width: 100%;">Small</button>
                    <button data-command="fontSize" data-value="3" style="width: 100%;">Normal</button>
                    <button data-command="fontSize" data-value="5" style="width: 100%;">Large</button>
                    <button data-command="fontSize" data-value="7" style="width: 100%;">Huge</button>
                </div>
            </div>
        `);

  // More options dropdown
  const $moreButton = $CSD(`
            <div class="csd-editor-toolbar-dropdown">
                <button class="csd-editor-tool" style="width: 100%; height: 100%;">
                    <i class="fa-solid fa-ellipsis" style="pointer-events: none;"></i>
                </button>
                <div class="csd-editor-toolbar-dropdown-menu">
                    <button data-command="strikethrough" style="width: 100%;"><i class="fa-solid fa-strikethrough" style="pointer-events: none;"></i> Strikethrough</button>
                    <button data-command="subscript" style="width: 100%;"><i class="fa-solid fa-subscript" style="pointer-events: none;"></i> Subscript</button>
                    <button data-command="superscript" style="width: 100%;"><i class="fa-solid fa-superscript" style="pointer-events: none;"></i> Superscript</button>
                    <button data-command="indent" style="width: 100%;"><i class="fa-solid fa-indent" style="pointer-events: none;"></i> Indent</button>
                    <button data-command="outdent" style="width: 100%;"><i class="fa-solid fa-outdent" style="pointer-events: none;"></i> Outdent</button>
                </div>
            </div>
        `);

  $bottomToolbar.append($formatGroup);
  $bottomToolbar.append($alignButton);
  $bottomToolbar.append($fontSizeButton);
  $bottomToolbar.append($moreButton);

  $mobileToolbar.append($topToolbar);
  $mobileToolbar.append($bottomToolbar);

  return $mobileToolbar;
}

// Helper function to update toolbar button states
function updateToolbarState($toolbar) {
  const commands = ["bold", "italic", "underline"];

  commands.forEach((cmd) => {
    const isActive = document.queryCommandState(cmd);
    $toolbar.find(`[data-command="${cmd}"]`).toggleClass("active", isActive);
  });
}

// Update createToolbar to pass $editor
function createToolbar($editor) {
  // Create desktop toolbar
  const $desktopToolbar = $CSD('<div class="csd-editor-toolbar"></div>');

  // Add toolbar groups
  EDITOR_TOOLBAR_ITEMS.forEach((group) => {
    const $group = $CSD('<div class="csd-editor-toolbar-group"></div>');

    group.forEach((item) => {
      const $button = createToolbarButton(item);
      $group.append($button);
    });

    $desktopToolbar.append($group);
  });

  // Create mobile toolbar
  const $mobileToolbar = createMobileToolbar($editor);

  // Return both toolbars wrapped in a container
  let $toolbars = $CSD('<div class="csd-editor-toolbars"></div>')
    .append($desktopToolbar)
    .append($mobileToolbar);

  return $toolbars;
}

function createMenuBar() {
  const $menuBar = $CSD('<div class="csd-editor-menubar"></div>');

  // Add menu items
  Object.keys(EDITOR_MENU_ITEMS).forEach((menu) => {
    const $menuItem = $CSD(`<div class="csd-editor-menu-item">
                <span>${menu.charAt(0).toUpperCase() + menu.slice(1)}</span>
                <div class="csd-editor-menu-dropdown">
                    ${EDITOR_MENU_ITEMS[menu]
                      .map(
                        (item) => `
                        <button type="button" data-action="${item.action}">
                            <i class="${item.icon}"></i>
                            ${item.label}
                        </button>
                    `
                      )
                      .join("")}
                </div>
            </div>`);

    $menuBar.append($menuItem);
  });

  return $menuBar;
}

function createToolbarButton(tool) {
  const buttonConfig = {
    undo: {
      icon: "fa-solid fa-rotate-left",
      title: "Undo (Ctrl+Z)",
      shortcut: "Ctrl+Z",
    },
    redo: {
      icon: "fa-solid fa-rotate-right",
      title: "Redo (Ctrl+Y)",
      shortcut: "Ctrl+Y",
    },
    cut: {
      icon: "fa-regular fa-scissors",
      title: "Cut (Ctrl+X)",
      shortcut: "Ctrl+X",
    },
    copy: {
      icon: "fa-regular fa-copy",
      title: "Copy (Ctrl+C)",
      shortcut: "Ctrl+C",
    },
    paste: {
      icon: "fa-regular fa-clipboard",
      title: "Paste (Ctrl+V)",
      shortcut: "Ctrl+V",
    },
    heading: { icon: "fa-solid fa-heading", title: "Heading", dropdown: true },
    bold: {
      icon: "fa-solid fa-bold",
      title: "Bold (Ctrl+B)",
      shortcut: "Ctrl+B",
    },
    italic: {
      icon: "fa-solid fa-italic",
      title: "Italic (Ctrl+I)",
      shortcut: "Ctrl+I",
    },
    underline: {
      icon: "fa-solid fa-underline",
      title: "Underline (Ctrl+U)",
      shortcut: "Ctrl+U",
    },
    strikethrough: {
      icon: "fa-solid fa-strikethrough",
      title: "Strikethrough",
    },
    font: { icon: "fa-solid fa-font", title: "Font Family", dropdown: true },
    fontSize: {
      icon: "fa-solid fa-text-height",
      title: "Font Size",
      dropdown: true,
    },
    textColor: {
      icon: "fa-solid fa-palette",
      title: "Text Color",
      dropdown: true,
    },
    backgroundColor: {
      icon: "fa-solid fa-fill",
      title: "Background Color",
      dropdown: true,
    },
    alignment: {
      icon: "fa-solid fa-align-justify",
      title: "Text Alignment",
      dropdown: true,
    },
    numberedList: {
      icon: "fa-solid fa-list-ol",
      title: "Numbered List (Ctrl+Shift+7)",
    },
    bulletedList: {
      icon: "fa-solid fa-list-ul",
      title: "Bulleted List (Ctrl+Shift+8)",
    },
    indent: { icon: "fa-solid fa-indent", title: "Increase Indent (Tab)" },
    outdent: {
      icon: "fa-solid fa-outdent",
      title: "Decrease Indent (Shift+Tab)",
    },
    link: {
      icon: "fa-solid fa-link",
      title: "Insert Link (Ctrl+K)",
      shortcut: "Ctrl+K",
    },
    image: { icon: "fa-regular fa-image", title: "Insert Image" },
    table: { icon: "fa-solid fa-table", title: "Insert Table" },
    specialCharacters: { icon: "fa-solid fa-s", title: "Special Characters" },
    pageBreak: { icon: "fa-solid fa-grip-lines", title: "Insert Page Break" },
    sourceEditing: { icon: "fa-solid fa-code", title: "Source Editing" },
  };

  const config = buttonConfig[tool];
  if (!config) return "";

  const tooltipText = config.title;

  const $button = $CSD(`
            <button type="button" class="csd-editor-tool" data-command="${tool}">
                <i class="${config.icon}"></i>
                ${
                  config.dropdown
                    ? '<i class="fa-solid fa-chevron-down"></i>'
                    : ""
                }
                <span class="csd-editor-tooltip">${tooltipText}</span>
            </button>
        `);

  return $button;
}

function createStatusBar() {
  return $CSD(`
            <div class="csd-editor-statusbar">
                <div class="csd-editor-wordcount">Words: 0</div>
                <div class="csd-editor-charcount">Characters: 0</div>
            </div>
        `);
}

function handleSpecialCommands(command, $editor) {
  const $textarea = $editor.find("[contenteditable]");

  switch (command) {
    case "insertImage":
      const imageUrl = prompt("Enter image URL:");
      if (imageUrl) {
        $textarea[0].focus();
        document.execCommand("insertImage", false, imageUrl);
      }
      break;

    case "insertLink":
      const url = prompt("Enter URL:");
      if (url) {
        const text = prompt("Enter link text:", url);
        $textarea[0].focus();
        if (text) {
          document.execCommand(
            "insertHTML",
            false,
            `<a href="${url}">${text}</a>`
          );
        } else {
          document.execCommand("createLink", false, url);
        }
      }
      break;

    case "insertTable":
      const rows = prompt("Number of rows:", "2");
      const cols = prompt("Number of columns:", "2");
      if (rows && cols) {
        let tableHtml = '<table style="width:100%;border-collapse:collapse;">';
        for (let i = 0; i < rows; i++) {
          tableHtml += "<tr>";
          for (let j = 0; j < cols; j++) {
            tableHtml +=
              '<td style="border:1px solid #ccc;padding:8px;">&nbsp;</td>';
          }
          tableHtml += "</tr>";
        }
        tableHtml += "</table>";

        $textarea[0].focus();
        document.execCommand("insertHTML", false, tableHtml);
      }
      break;

    case "insertSpecialChar":
      const specialChars = ["©", "®", "™", "€", "£", "¥", "¢", "§", "°", "±"];
      const char = prompt(
        "Choose a special character:\n" + specialChars.join(" ")
      );
      if (char) {
        $textarea[0].focus();
        document.execCommand("insertText", false, char);
      }
      break;
  }
}

function showLinkPopover($editor) {
  const selection = window.getSelection();
  const editorElement = $editor.elements[0];
  let range;
  let selectedText = "";

  if (selection.rangeCount > 0) {
    range = selection.getRangeAt(0);
    selectedText = range.toString();

    // Verifica che il range sia all'interno dell'editor
    if (!editorElement.contains(range.commonAncestorContainer)) {
      range = null;
    }
  }

  // Se non abbiamo un range valido, troviamo il punto di inserimento corretto
  if (!range) {
    range = document.createRange();

    // Se c'è un nodo di testo attivo, usa quello
    if (document.activeElement === editorElement && selection.focusNode) {
      if (selection.focusNode.nodeType === Node.TEXT_NODE) {
        range.setStart(selection.focusNode, selection.focusOffset);
        range.setEnd(selection.focusNode, selection.focusOffset);
      } else {
        // Se il nodo focus non è un nodo di testo, cerca il punto di inserimento più vicino
        const walker = document.createTreeWalker(
          editorElement,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        let node;
        let closestNode = null;
        let minDistance = Infinity;

        while ((node = walker.nextNode())) {
          const range = document.createRange();
          range.selectNode(node);
          const rect = range.getBoundingClientRect();
          const distance = Math.abs(
            rect.top - selection.focusNode.getBoundingClientRect().top
          );

          if (distance < minDistance) {
            minDistance = distance;
            closestNode = node;
          }
        }

        if (closestNode) {
          range.setStart(closestNode, closestNode.length);
          range.setEnd(closestNode, closestNode.length);
        } else {
          // Se non troviamo nessun nodo di testo, crea uno nuovo
          const textNode = document.createTextNode("");
          editorElement.appendChild(textNode);
          range.setStart(textNode, 0);
          range.setEnd(textNode, 0);
        }
      }
    } else {
      // Se l'editor non è attivo, inserisci alla fine
      let lastNode = editorElement.lastChild;

      // Se l'ultimo nodo è un BR, crea un nuovo nodo di testo
      if (!lastNode || lastNode.nodeName === "BR") {
        const textNode = document.createTextNode("");
        editorElement.appendChild(textNode);
        lastNode = textNode;
      }

      range.selectNode(lastNode);
      range.collapse(false);
    }

    // Aggiorna la selezione
    selection.removeAllRanges();
    selection.addRange(range);
  }

  const $popover = $CSD(`
          <div class="csd-editor-link-popover">
              <div class="link-form">
                  <div class="csd-field">
                      <label class="csd-label">URL:</label>
                      <input type="text" class="csd-input link-url" placeholder="https://" value="">
                  </div>
                  <div class="csd-field">
                      <label class="csd-label">Testo:</label>
                      <input type="text" class="csd-input link-text" value="${selectedText}">
                  </div>
                  <div class="form-buttons">
                      <button type="button" class="csd-btn btn-insert">Inserisci</button>
                      <button type="button" class="csd-btn btn-cancel">Annulla</button>
                  </div>
              </div>
          </div>
      `);

  // Prima prova con getBoundingClientRect
  let rect = range.getBoundingClientRect();

  // Se il rect è vuoto, prova con getClientRects
  if (
    rect.top === 0 &&
    rect.left === 0 &&
    rect.width === 0 &&
    rect.height === 0
  ) {
    const rects = range.getClientRects();
    if (rects.length > 0) {
      rect = rects[0];
    } else {
      rect = editorElement.getBoundingClientRect();
    }
  }

  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

  $popover.css({
    position: "absolute",
    top: rect.bottom + scrollTop + "px",
    left: rect.left + scrollLeft + "px",
  });

  $CSD("body").append($popover);

  // Previeni la chiusura quando si clicca dentro il popover
  $popover.on("mousedown", function (e) {
    if (!["INPUT", "TEXTAREA"].includes(e.target.tagName)) {
      e.preventDefault();
    }
    e.stopPropagation();
  });

  // Gestisci la cancellazione
  $popover.find(".btn-cancel").on("click", function () {
    $popover.remove();
  });

  // Gestisci l'inserimento del link
  $popover.find(".btn-insert").on("click", function () {
    const url = $popover.find(".link-url").val();
    const text = $popover.find(".link-text").val();

    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.textContent = text || url;
      link.title = url;
      link.style.cursor = "pointer";

      link.addEventListener("dblclick", function (e) {
        e.preventDefault();
        if (typeof window !== 'undefined') {
          window.open(this.href, "_blank");
        }
      });

      range.deleteContents();
      range.insertNode(link);

      // Inserisci uno spazio dopo il link
      const space = document.createTextNode(" ");
      if (link.nextSibling) {
        link.parentNode.insertBefore(space, link.nextSibling);
      } else {
        link.parentNode.appendChild(space);
      }

      // Sposta il cursore dopo il link
      const newRange = document.createRange();
      newRange.setStartAfter(space);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
    $popover.remove();
  });

  // Focus sull'URL all'apertura
  $popover.find(".link-url").focus();

  const handleClickOutside = function (e) {
    if (!$popover.elements[0].contains(e.target)) {
      $popover.remove();
      $CSD(document).off("mousedown", handleClickOutside);
    }
  };

  // Aggiungi l'event listener dopo un breve delay
  setTimeout(() => {
    $CSD(document).on("mousedown", handleClickOutside);
  }, 100);
}

function showImagePicker($editor) {
  // Crea un input file nascosto
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.onchange = function () {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.maxWidth = "100%";
        img.style.position = "relative";
        img.style.cursor = "default";
        img.className = "csd-resizable-image";

        // Wrapper per l'immagine
        const corners = [
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
        ];
        const wrapper = document.createElement("div");
        wrapper.style.cssText = `
      position: relative;
      display: inline-block;
      margin: 5px;
    `;

        // Aggiungi i cerchi di resize agli angoli
        corners.forEach((position) => {
          const corner = document.createElement("div");
          corner.className = `resize-corner ${position}`;
          corner.style.cssText = `
        position: absolute;
        width: 12px;
        height: 12px;
        background: white;
        border: 2px solid #007bff;
        border-radius: 50%;
        cursor: ew-resize;
        opacity: 0;
        transition: opacity 0.2s ease;
        z-index: 1000;
      `;

          // Posiziona i cerchi agli angoli
          switch (position) {
            case "top-left":
              corner.style.top = "-6px";
              corner.style.left = "-6px";
              break;
            case "top-right":
              corner.style.top = "-6px";
              corner.style.right = "-6px";
              break;
            case "bottom-left":
              corner.style.bottom = "-6px";
              corner.style.left = "-6px";
              break;
            case "bottom-right":
              corner.style.bottom = "-6px";
              corner.style.right = "-6px";
              break;
          }
          wrapper.appendChild(corner);
        });

        // Mostra/nascondi i cerchi al hover
        wrapper.addEventListener("mouseenter", () => {
          wrapper.querySelectorAll(".resize-corner").forEach((corner) => {
            corner.style.opacity = "1";
          });
        });

        wrapper.addEventListener("mouseleave", () => {
          if (!isResizing) {
            wrapper.querySelectorAll(".resize-corner").forEach((corner) => {
              corner.style.opacity = "0";
            });
          }
        });

        // Durante il resize, mantieni i cerchi visibili
        wrapper.addEventListener("mousedown", () => {
          wrapper.querySelectorAll(".resize-corner").forEach((corner) => {
            corner.style.opacity = "1";
          });
        });

        wrapper.appendChild(img);

        function stopResize() {
          isResizing = false;
          activeCorner = null;
          document.body.style.userSelect = "";
          wrapper.classList.remove("resizing");
        }

        // Eventi mouse per i cerchi
        wrapper.querySelectorAll(".resize-corner").forEach((corner) => {
          corner.addEventListener("mousedown", initResize);
          corner.addEventListener("touchstart", initResize);
        });

        // Eventi mouse per l'immagine
        img.addEventListener("mousedown", initResize);

        // Inserisci nel documento
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(wrapper);

        // Inserisci uno spazio dopo l'immagine
        const space = document.createTextNode(" ");
        wrapper.parentNode.insertBefore(space, wrapper.nextSibling);

        // Rendi l'immagine resizable
        let isResizing = false;
        let startX, startWidth;
        let activeCorner = null;

        function initResize(e) {
          isResizing = true;
          startX = e.type.includes("mouse") ? e.pageX : e.touches[0].pageX;
          startWidth = img.offsetWidth;

          e.preventDefault();
          document.body.style.userSelect = "none";

          wrapper.classList.add("resizing");
        }

        function resize(e) {
          if (!isResizing) return;

          const currentX = e.type.includes("mouse")
            ? e.pageX
            : e.touches[0].pageX;
          const diff = currentX - startX;

          // Calcola la nuova larghezza mantenendo i limiti
          let newWidth;
          if (activeCorner) {
            // Se stiamo usando un angolo sinistro, invertiamo la direzione
            if (
              activeCorner.classList.contains("top-left") ||
              activeCorner.classList.contains("bottom-left")
            ) {
              newWidth = startWidth - diff;
            } else {
              newWidth = startWidth + diff;
            }
          } else {
            newWidth = startWidth + diff;
          }

          newWidth = Math.max(
            50,
            Math.min(newWidth, wrapper.parentNode.offsetWidth)
          );
          img.style.width = newWidth + "px";

          e.preventDefault();
        }

        function stopResize() {
          isResizing = false;
          activeCorner = null;
          document.body.style.userSelect = "";
          wrapper.classList.remove("resizing");
        }

        // Eventi mouse
        img.addEventListener("mousedown", initResize);
        document.addEventListener("mousemove", resize);
        document.addEventListener("mouseup", stopResize);

        // Eventi touch
        img.addEventListener("touchstart", initResize);
        document.addEventListener("touchmove", resize);
        document.addEventListener("touchend", stopResize);

        // Cleanup degli event listener quando l'immagine viene rimossa
        const cleanup = () => {
          document.removeEventListener("mousemove", resize);
          document.removeEventListener("mouseup", stopResize);
          document.removeEventListener("touchmove", resize);
          document.removeEventListener("touchend", stopResize);
        };

        // Osserva se l'immagine viene rimossa dal DOM
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.removedNodes.forEach((node) => {
              if (node === wrapper) {
                cleanup();
                observer.disconnect();
              }
            });
          });
        });

        observer.observe(wrapper.parentNode, {
          childList: true,
        });

        // Sposta il cursore dopo l'immagine
        const newRange = document.createRange();
        newRange.setStartAfter(space);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      };
      reader.readAsDataURL(file);
    }
  };

  input.click();
}

function showTablePicker($editor) {
  const maxRows = 8;
  const maxCols = 8;
  let selectedRows = 0;
  let selectedCols = 0;

  // Crea la griglia
  let gridHtml = '<div class="table-grid">';
  for (let i = 0; i < maxRows; i++) {
    gridHtml += '<div class="table-row">';
    for (let j = 0; j < maxCols; j++) {
      gridHtml += `<div class="table-cell" data-row="${i}" data-col="${j}"></div>`;
    }
    gridHtml += "</div>";
  }
  gridHtml += "</div>";
  gridHtml += '<div class="table-size">0 x 0</div>';

  const $picker = $CSD(`
          <div class="csd-editor-table-picker">
              ${gridHtml}
          </div>
      `);

  function updateSelection(row, col) {
    selectedRows = row + 1;
    selectedCols = col + 1;

    // Aggiorna il testo delle dimensioni
    $picker.find(".table-size").text(`${selectedRows} x ${selectedCols}`);

    // Aggiorna la selezione visiva
    $picker.find(".table-cell").each(function () {
      const $cell = $CSD(this);
      const cellRow = parseInt($cell.data("row"));
      const cellCol = parseInt($cell.data("col"));

      if (cellRow <= row && cellCol <= col) {
        $cell.addClass("selected");
      } else {
        $cell.removeClass("selected");
      }
    });
  }

  // Posiziona il picker
  const $button = $CSD(event.target).closest(".csd-editor-tool");
  const buttonRect = $button.elements[0].getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

  $picker.css({
    position: "absolute",
    top: buttonRect.bottom + scrollTop + "px",
    left: buttonRect.left + scrollLeft + "px",
  });

  $CSD("body").append($picker);

  // Gestisci l'hover sulle celle
  $picker.on("mouseover", ".table-cell", function (e) {
    const row = parseInt($CSD(this).data("row"));
    const col = parseInt($CSD(this).data("col"));
    updateSelection(row, col);
  });

  // Mantieni la selezione quando il mouse esce dalla griglia
  $picker.find(".table-grid").on("mouseleave", function () {
    if (selectedRows > 0 && selectedCols > 0) {
      updateSelection(selectedRows - 1, selectedCols - 1);
    }
  });

  // Gestisci il click per inserire la tabella
  $picker.on("click", ".table-cell", function () {
    if (selectedRows > 0 && selectedCols > 0) {
      insertTable($editor, selectedRows, selectedCols);
      $picker.remove();
    }
  });

  // Previeni la chiusura quando si clicca dentro il picker
  $picker.on("mousedown", function (e) {
    e.stopPropagation();
  });

  const handleClickOutside = function (e) {
    if (!$picker.elements[0].contains(e.target)) {
      $picker.remove();
      $CSD(document).off("mousedown", handleClickOutside);
    }
  };

  // Aggiungi l'event listener dopo un breve delay
  setTimeout(() => {
    $CSD(document).on("mousedown", handleClickOutside);
  }, 100);
}

export {initializeEditor};