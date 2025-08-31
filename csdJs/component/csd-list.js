function initializeList(element) {
  if (!element || element.initialized) return;

  const $list = $CSD(element);
  const $items = $list.find(".csd-item");

  // Aggiungi interazione hover e click agli items
  $items.each(function (_, item) {
    const $item = $CSD(item);

    $item.on("click", function (e) {
      // Emetti un evento custom quando un item viene cliccato
      const event = new CustomEvent("csd-item-click", {
        detail: {
          text: $item.find("span").text(),
          element: item,
        },
      });
      element.dispatchEvent(event);
    });
  });

  element.initialized = true;
  return element;
}

export { initializeList };
