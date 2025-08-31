function initializeSubmenu(element) {
  if (!element) return;

  const $element = $CSD(element);
  const $toggle = $element.find(">  a");
  if (!$toggle.length) return;

  $toggle.on("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    const $parent = $CSD(this).closest(".has-submenu").parent();
    if ($parent.length) {
      $parent.find(".has-submenu.open").not($element).removeClass("open");
    }

    $element.toggleClass("open");
  });

  const $submenuItems = $element.find(
    ".csd-sidebar-submenu .csd-sidebar-item > a"
  );
  $submenuItems.on("click", function (e) {
    const $this = $CSD(this);
    const href = $this.attr("href");
    if (!href || href === "#") {
      e.preventDefault();
    }
    e.stopPropagation();
  });
}

export { initializeSubmenu };