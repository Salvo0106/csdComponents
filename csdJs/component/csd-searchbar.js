function initializeSearchbar(searchBarElement) {
  const $searchBar = $CSD(searchBarElement);
  const hasClearButton = $searchBar.hasClass("clearbutton");

  // Crea il wrapper della searchbar
  const $searchBarWrapper = $CSD('<div class="csd-searchbar"></div>');

  // Sposta l'input nel wrapper
  $searchBar.wrap($searchBarWrapper);

  // Aggiungi search icon
  const $searchIcon = $CSD(
    '<ion-icon class="csd-searchbar-icon" name="search-sharp"></ion-icon>'
  );
  $searchBar.after($searchIcon);

  // Aggiungi clear button solo se richiesto
  if (hasClearButton) {
    const $clearButton = $CSD(
      '<div class="csd-clearbutton"><ion-icon name="close-sharp"></ion-icon></div>'
    );

    $searchBar.after($clearButton);

    $clearButton.on("click", function () {
      $searchBar.val("").trigger("input");
    });
  }
}

export { initializeSearchbar };