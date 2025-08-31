// Menu Component
function initializeMenu(element) {
  const $element = $CSD(element);
  const $menuItems = $element.find(".csd-menu-item");
  const $subMenuItems = $element.find(".has-submenu");

  $menuItems.on("click", function () {
    const $this = $CSD(this);
    if (!$this.hasClass("has-submenu")) {
      $menuItems.removeClass("active");
      $this.addClass("active");
    }
  });

  $subMenuItems.on("click", function (e) {
    e.preventDefault();
    $CSD(this).toggleClass("expanded");
  });
}

export { initializeMenu };
