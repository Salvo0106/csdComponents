import { Sortable } from '../csd-lib.js';

function initializeReorder() {
  // Inizializza i gruppi
  const reorderGroups = document.querySelectorAll(".csd-reorder-group");

  reorderGroups.forEach((group) => {
    // Configura le opzioni di base per Sortable
    const sortableOptions = {
      handle: ".handle",
      draggable: ".csd-reorder",
      ghostClass: "csd-reorder-ghost",
      dragClass: "csd-reorder-drag",
      animation: 150,
      // Opzioni touch specifiche
      touchStartThreshold: 0,
      supportPointer: true,
      fallbackTolerance: 0,
      delayOnTouchOnly: true,
      delay: 100,
      // Prevenzione scroll durante il drag
      preventScroll: true,
      // Feedback aptico su mobile
      forceFallback: false,
      // Callback
      onStart: (evt) => {
        evt.item.style.touchAction = "none";
        group.classList.add("reordering");
        // Disabilita lo scroll del body durante il drag
        document.body.style.overflow = "hidden";
      },
      onEnd: (evt) => {
        evt.item.style.touchAction = "";
        group.classList.remove("reordering");
        // Riabilita lo scroll del body
        document.body.style.overflow = "";
      },
      onMove: (evt) => {
        // Previeni lo scroll durante il movimento
        evt.preventDefault && evt.preventDefault();
        return true;
      },
    };

    // Inizializza il gruppo principale
    new Sortable(group, sortableOptions);

    // Inizializza i sottogruppi
    const groupItems = group.querySelectorAll(".csd-group-item");
    groupItems.forEach((groupItem) => {
      new Sortable(groupItem, {
        ...sortableOptions,
        onStart: (evt) => {
          evt.item.style.touchAction = "none";
          groupItem.classList.add("reordering");
          document.body.style.overflow = "hidden";
        },
        onEnd: (evt) => {
          evt.item.style.touchAction = "";
          groupItem.classList.remove("reordering");
          document.body.style.overflow = "";
        },
      });
    });
  });
}

export { initializeReorder };