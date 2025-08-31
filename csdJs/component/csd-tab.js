// Utility Functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
// Tab Component
function initializeTab(element) {
  const $element = $CSD(element);
  const $tabs = $element.find(".csd-tab");
  const $panels = $element.find(".csd-tab-panel");
  const $indicator = $element.find(".csd-tab-indicator");
  const $tabList = $element.find(".csd-tab-list");

  function updateIndicatorPosition(selectedTab) {
    if (!selectedTab || !$indicator.length) return;

    const tabRect = selectedTab.getBoundingClientRect();
    const listRect = $tabList[0].getBoundingClientRect();
    const translateX = tabRect.left - listRect.left;

    requestAnimationFrame(() => {
      $indicator
        .css("width", `${tabRect.width}px`)
        .css("transform", `translateX(${translateX}px)`);
    });
  }

  function selectTab(selectedTab, index) {
    const $selectedTab = $CSD(selectedTab);
    if ($selectedTab.hasClass("active")) return;

    $tabs.removeClass("active");
    $selectedTab.addClass("active");

    $panels.each((panel, panelIndex) => {
      $CSD(panel).toggleClass("active", panelIndex === index);
    });

    updateIndicatorPosition(selectedTab);
  }

  $tabs.each((tab) => {
    $CSD(tab).on("click", () => {
      const index = $CSD(tab).index();
      selectTab(tab, index);
    });
  });

  const $activeTab = $element.find(".csd-tab.active");
  if ($activeTab.length) {
    updateIndicatorPosition($activeTab[0]);
  }

  const debouncedResize = debounce(() => {
    const $activeTab = $element.find(".csd-tab.active");
    if ($activeTab.length) {
      updateIndicatorPosition($activeTab[0]);
    }
  }, 100);

  $CSD(window).on("resize", debouncedResize);
}

export { initializeTab };