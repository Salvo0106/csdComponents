// Initialize Sidebar Toggle
function initializeSidebar() {
  const $sidebarToggle = $CSD("#sidebarToggle");
  const $sidebar = $CSD(".csd-sidebar");
  const $sidebarOverlay = $CSD("#sidebarOverlay");
  const $sidebarPositionSwitch = $CSD("#sidebarPosition");
  const $demoContainer = $sidebar.length
    ? $sidebar.closest(".demo-container")
    : null;

  if (!$sidebar.length || !$sidebarOverlay.length || !$sidebarToggle.length)
    return;

  if ($sidebarPositionSwitch.length) {
    $sidebarPositionSwitch.prop("checked", true);

    $sidebarPositionSwitch.on("change", function () {
      if ($CSD(this).prop("checked")) {
        if ($sidebar.length && $demoContainer.length) {
          $sidebar.removeClass("csd-sidebar-fixed");
          $demoContainer.append($sidebar);
        }
      } else {
        if ($sidebar.length && $demoContainer.length) {
          $sidebar.addClass("csd-sidebar-fixed");
          $demoContainer.parent().append($sidebar);
        }
      }
    });
  }

  if ($sidebarToggle.length && $sidebar.length && $sidebarOverlay.length) {
    const $toggleIcon = $sidebarToggle.find("ion-icon");

    $sidebarToggle.on("click", function () {
      if ($sidebar.hasClass("csd-sidebar-fixed")) {
        $sidebar.toggleClass("show");
        $sidebarOverlay.toggleClass("active");
      } else {
        $sidebar.toggleClass("active");
      }

      const isActive = $sidebar.hasClass("active") || $sidebar.hasClass("show");
      $toggleIcon.attr("name", isActive ? "close-outline" : "menu-outline");
    });

    $sidebarOverlay.on("click", function () {
      if ($sidebar.hasClass("csd-sidebar-fixed")) {
        $sidebar.removeClass("show");
      } else {
        $sidebar.removeClass("active");
      }
      $sidebarOverlay.removeClass("active");
      $toggleIcon.attr("name", "menu-outline");
    });
  }

  const $submenuItems = $CSD(".has-submenu");
  $submenuItems.each(function () {
    const $item = $CSD(this);
    const $link = $item.find("a");
    if ($link.length) {
      $link.on("click", function (e) {
        e.preventDefault();
        $item.toggleClass("open");
      });
    }
  });
}

export { initializeSidebar };