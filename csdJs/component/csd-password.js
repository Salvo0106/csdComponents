function initializePassword(inputElement) {
  const $input = $CSD(inputElement);
  const useInputGroup = $input.attr("input-group") === "true";

  if (useInputGroup) {
    // Wrap input in input group if not already wrapped
    let $group = $input.closest(".csd-input-group");
    if (!$group.elements.length) {
      $input.wrap('<div class="csd-input-group"></div>');
      $group = $input.closest(".csd-input-group");
    }

    // Add the toggle password icon as input group icon
    const $icon = $CSD(
      '<span class="csd-input-group-icon"><ion-icon name="eye-outline"></ion-icon></span>'
    );

    $group.append($icon);

    // Toggle password visibility
    $icon.on("click", function (e) {
      e.preventDefault();
      const type = $input.attr("type") === "password" ? "text" : "password";
      $input.attr("type", type);

      // Toggle icon
      const iconName = type === "password" ? "eye-outline" : "eye-off-outline";
      $icon.find("ion-icon").attr("name", iconName);
    });
  } else {
    // Use the simple password style with absolute positioning
    $input.wrap('<div class="csd-password"></div>');

    // Add the toggle password icon
    const $icon = $CSD(
      '<ion-icon class="csd-password-toggle" name="eye-outline"></ion-icon>'
    );

    $input.after($icon);

    // Toggle password visibility
    $icon.on("click", function (e) {
      e.preventDefault();
      const type = $input.attr("type") === "password" ? "text" : "password";
      $input.attr("type", type);

      // Toggle icon
      const iconName = type === "password" ? "eye-outline" : "eye-off-outline";
      $icon.attr("name", iconName);
    });
  }
}

export { initializePassword };