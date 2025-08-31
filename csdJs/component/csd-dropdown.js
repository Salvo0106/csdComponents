function initializeDropdown(element) {
  if (!element) return;

  const $element = $CSD(element);
  const $toggle = $element.find(".csd-dropdown-toggle");
  const $menu = $element.find(".csd-dropdown-menu, .csd-mega-menu");

  if (!$toggle.length || !$menu.length) return;

  const isMegaMenu = $menu.hasClass("csd-mega-menu");

  $toggle.on("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    const $openMenus = $CSD(".csd-dropdown-menu.show, .csd-mega-menu.show");
    $openMenus.each(function () {
      const $openMenu = $CSD(this);
      if (!$openMenu.is($menu)) {
        $openMenu
          .removeClass("show")
          .closest(".csd-dropdown")
          .find(".csd-dropdown-toggle")
          .removeClass("active");
      }
    });

    $menu.toggleClass("show");
    $toggle.toggleClass("active");

    if (isMegaMenu) {
      const $menuBar = $element.closest(".csd-menubar");
      if ($menuBar.length) {
        const dropdownRect = element.getBoundingClientRect();
        const menuRect = $menu[0].getBoundingClientRect();
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024; // Default fallback

        const leftOffset = Math.max(
          0,
          dropdownRect.left - (menuRect.width - dropdownRect.width) / 2
        );
        const rightEdge = leftOffset + menuRect.width;
        const finalLeftOffset =
          rightEdge > viewportWidth
            ? viewportWidth - menuRect.width
            : leftOffset;

        $menu.css("left", `${-finalLeftOffset}px`);
      }
    }
  });

  $menu.on("click", function (e) {
    e.stopPropagation();
  });
}

// Close dropdowns when clicking outside
$CSD(document).on("click", function (e) {
  const $target = $CSD(e.target);
  if (!$target.closest(".csd-dropdown").length) {
    const $openMenus = $CSD(".csd-dropdown-menu.show, .csd-mega-menu.show");
    $openMenus.each(function () {
      $CSD(this)
        .removeClass("show")
        .closest(".csd-dropdown")
        .find(".csd-dropdown-toggle")
        .removeClass("active");
    });
  }
});

function closeAllDropdowns() {
  $CSD(".csd-dropdown-menu.show, .csd-mega-menu.show").each(function () {
    $CSD(this)
      .removeClass("show")
      .closest(".csd-dropdown")
      .find(".csd-dropdown-toggle")
      .removeClass("active");
  });
}

// Gestione click globale
$CSD(document).on("click", function (e) {
  const $target = $CSD(e.target);

  const $dropdownToggle = $target.closest(".csd-dropdown-toggle");
  if ($dropdownToggle.length) {
    e.preventDefault();
    const $dropdown = $dropdownToggle.closest(".csd-dropdown");
    const $menu = $dropdown.find(".csd-dropdown-menu");

    if ($menu.hasClass("show")) {
      $menu.removeClass("show");
      $dropdownToggle.removeClass("active");
    } else {
      closeAllDropdowns();
      $menu.addClass("show");
      $dropdownToggle.addClass("active");
    }
    return;
  }

  const $submenuToggle = $target.closest(".has-submenu > a");
  if ($submenuToggle.length) {
    e.preventDefault();
    const $submenuItem = $submenuToggle.parent();

    if ($submenuItem.hasClass("open")) {
      $submenuItem.removeClass("open");
    } else {
      const $siblings = $submenuItem.parent().children();
      $siblings.each(function (index, sibling) {
        const $sibling = $CSD(sibling);
        if (!$sibling.is($submenuItem) && $sibling.hasClass("has-submenu")) {
          $sibling.removeClass("open");
        }
      });
      $submenuItem.addClass("open");
    }
    return;
  }

  if (!$target.closest(".csd-dropdown").length) {
    closeAllDropdowns();
  }
});

export { initializeDropdown };
