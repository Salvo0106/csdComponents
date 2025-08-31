// Import all components from the component directory
import {
  initializeFab,
  initializeSplitButton,
  initializeDatepickers,
  initializeEditor,
  initializeSearchbar,
  initializeCheckbox,
  initializeRadio,
  initializeRange,
  initializePassword,
  initializeMask,
  initializeTextArea,
  initializeToggle,
  initializeToggleButton,
  initializeModal,
  initializePopover,
  initializeSplitter,
  initializeConfirmDialog,
  initializeToast,
  initializeList,
  initializeReorder,
  initializeDropdown,
  initializeAccordion,
  initializeTab,
  initializeToolbar,
  initializeNavigation,
  initializeNumber,
  initializeCustomSelect,
  initializeSegment,
  initializeStepper,
  initializeMenu,
  initializeSidebar,
  initializeBtn,
} from "./component";

// Import all function/Events
import { showAccordion } from "./component";
import { $CSD } from "./csd-lib";

const originalVal = _CSD_UTILS.prototype.val;

function initCSDComponents() {
  // Initialize searchbar components
  $CSD(".csd-searchbar-input:not(.csd-select-editable)").each(function () {
    initializeSearchbar(this);
  });

  $CSD(".csd-btn").each(function () {
    initializeBtn(this);
  });

  // Initialize form components
  $CSD(".csd-select").each(function () {
      initializeCustomSelect(this);
  });

  $CSD(".csd-checkbox").each(function () {
    initializeCheckbox(this);
  });

  $CSD(".csd-radio").each(function () {
    initializeRadio(this);
  });

  // Initialize password inputs
  $CSD('input[type="password"].csd-input').each(function () {
    initializePassword(this);
  });

  // Initialize masked inputs
  $CSD("input[data-mask].csd-input").each(function () {
    initializeMask(this);
  });

  // Initialize number inputs
  $CSD(".csd-number").each(function () {
    initializeNumber(this);
  });

  // Initialize textareas
  $CSD(".csd-textarea").each(function () {
    initializeTextArea(this);
  });

  // Initialize datepickers
  initializeDatepickers();

  // Reinitialize datepickers on content change
  $CSD(document).on("contentChanged", function () {
    initializeDatepickers();
  });

  // Initialize range components
  $CSD(".csd-range").each(function () {
    initializeRange(this);
  });

  $CSD(".csd-knob").each(function () {
    initializeKnob(this);
  });

  // Initialize toggle components
  $CSD(".csd-toggle").each(function () {
    initializeToggle(this);
  });

  $CSD(".csd-toggle-button").each(function () {
    initializeToggleButton(this);
  });

  // Initialize UI components
  $CSD(".csd-segment").each(function () {
    initializeSegment(this);
  });

  $CSD(".csd-tabs").each(function () {
    initializeTab(this);
  });

  $CSD(".csd-stepper-container").each(function () {
    initializeStepper(this);
  });

  // Initialize menu components
  $CSD(".csd-menubar").each(function () {
    initializeMenu(this);
  });

  $CSD(".csd-mega-menu").each(function () {
    initializeMenu(this);
  });

  $CSD(".csd-toolbar").each(function () {
    initializeToolbar(this);
  });

  // Initialize sidebar
  initializeSidebar();

  // Initialize navigation elements
  $CSD(".csd-navigation").each(function () {
    initializeNavigation(this);
  });

  // Initialize accordion elements
  $CSD(".csd-accordion").each(function () {
    initializeAccordion(this);
  });

  // Handle csdClick="showAccordion(param)" syntax
  $CSD("[csdClick^='showAccordion']").on("click", function () {
    const param = $CSD(this)
      .attr("csdClick")
      .replace("showAccordion(", "")
      .replace(")", "");
    showAccordion.call(this, param);
  });

  // Initialize dropdown elements
  $CSD(".csd-dropdown").each(function () {
    initializeDropdown(this);
  });

  // Initialize toast elements
  $CSD(".csd-toast").each(function () {
    initializeToast(this);
  });

  // Modal
  $CSD(".csd-modal").each(function () {
    initializeModal(this);
  });

  // Confirm Dialog
  $CSD(".csd-modal-confirm").each(function () {
    initializeConfirmDialog(this);
  });

  // Popover
  $CSD(".csd-popover").each(function () {
    initializePopover(this);
  });

  // Initialize splitter functionality
  $CSD(".csd-splitter").each(function () {
    initializeSplitter(this);
  });

  // Initialize FABs
  $CSD(".csd-fab").each(function () {
    initializeFab(this);
  });

  // Initialize list
  $CSD(".csd-list").each(function () {
    initializeList(this);
  });

  // Initialize reorder
  $CSD(".csd-reorder").each(function () {
    initializeReorder(this);
  });

  // Initialize global toast
  const toastInstance = initializeToast();
  if (typeof window !== 'undefined') {
    window.toast = toastInstance;
  }

  // Initialize all split buttons
  $CSD(".csd-split-button").each(function () {
    initializeSplitButton(this);
  });

  // Initialize all editors
  $CSD(".csd-editor").each(function () {
    initializeEditor(this);
  });

  if (!$CSD(".csd-toast-container").length) {
    $CSD("body").append('<div class="csd-toast-container"></div>');
  }

  // Toast buttons
  $CSD(document).on("click", ".csd-btn-toast", function () {
    const type = $CSD(this).data("type");
    const message = $CSD(this).data("message");

    const $toast = $CSD("<div>")
      .addClass("csd-toast")
      .addClass(`csd-toast-${type}`).html(`
                <div class="csd-toast-content">
                    <ion-icon name="${getToastIcon(type)}"></ion-icon>
                    <span>${message}</span>
                </div>
                <button type="button" class="csd-toast-close">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            `);

    const $container = $CSD(".csd-toast-container");
    $container.append($toast);

    // Show with animation
    setTimeout(() => {
      $toast.addClass("show");
    }, 100);

    // Auto close after 3 seconds
    const autoCloseTimeout = setTimeout(() => {
      closeToast($toast);
    }, 2500);

    // Close button handler
    $toast.find(".csd-toast-close").on("click", function () {
      clearTimeout(autoCloseTimeout);
      closeToast($toast);
    });
  });

  function closeToast($toast) {
    $toast.removeClass("show");
    setTimeout(() => {
      $toast.remove();
    }, 300);
  }

  function getToastIcon(type) {
    switch (type) {
      case "success":
        return "checkmark-circle-outline";
      case "warning":
        return "warning-outline";
      case "error":
        return "alert-circle-outline";
      case "info":
        return "information-circle-outline";
      default:
        return "information-circle-outline";
    }
  }

  // Initialize modals and confirm dialogs
  $CSD(".csd-modal, .csd-modal-confirm").each(function () {
    initializeModal(this);
  });

  // Modal and confirm dialog open buttons
  $CSD(document).on("click", ".js-open-modal, .js-open-confirm", function (e) {
    e.preventDefault();
    const targetId = $CSD(this).data("target");
    const $modal = $CSD(targetId);
    if ($modal.length) {
      $modal.show();
      setTimeout(() => {
        $modal.addClass("show");
      }, 50);
    }
  });

  // Modal close buttons and overlay
  $CSD(document).on(
    "click",
    ".csd-modal-close, .csd-modal-overlay",
    function (e) {
      e.preventDefault();
      const $modal = $CSD(this).closest(".csd-modal");
      $modal.removeClass("show");
    }
  );

  // Handle confirm dialog buttons
  $CSD(document).on("click", ".csd-confirm-btn", function (e) {
    e.preventDefault();
    const $modal = $CSD(this).closest(".csd-modal-confirm");
    if ($modal.length) {
      console.log("Confirmed");
      $modal.removeClass("show");
      setTimeout(() => {
        $modal.hide();
      }, 300);
    }
  });

  $CSD(document).on("click", ".csd-cancel-btn", function (e) {
    e.preventDefault();
    const $modal = $CSD(this).closest(".csd-modal-confirm");
    if ($modal.length) {
      console.log("Cancelled");
      $modal.removeClass("show");
      setTimeout(() => {
        $modal.hide();
      }, 300);
    }
  });

  // Form submit handler
  $CSD(".js-form-submit").on("click", function (e) {
    e.preventDefault();
    const $modal = $CSD(this).closest(".csd-modal");
    const $form = $modal.find("form");

    // Check form validity
    if ($form[0].checkValidity()) {
      // Collect form data
      const formData = {};
      $form.find(".csd-form-control").each(function () {
        const $input = $CSD(this);
        formData[$input.attr("name")] = $input.val();
      });

      // Handle form submission
      console.log("Form data:", formData);
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.show("Dati salvati con successo!", "success");
      } else if (toastInstance) {
        toastInstance.show("Dati salvati con successo!", "success");
      }

      // Clear form and close modal
      $form[0].reset();
      $modal.removeClass("show");
    } else {
      // Trigger HTML5 validation
      $form[0].reportValidity();
    }
  });

  // Handle escape key
  $CSD(document).on("keydown", function (e) {
    if (e.key === "Escape") {
      const $modal = $CSD(".csd-modal.show");
      if ($modal.length) {
        $modal.removeClass("show");
      }
    }
  });

  // Previeni il redirect sui link # che non sono submenu o dropdown
  $CSD(document).on("click", 'a[href="#"]', function (e) {
    const $target = $CSD(this);
    if (
      !$target.closest(".has-submenu").length &&
      !$target.closest(".csd-dropdown-menu").length
    ) {
      e.preventDefault();
    }
  });
}

export default initCSDComponents;
export { initCSDComponents };
