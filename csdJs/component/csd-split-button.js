// Split Button functionality
function initializeSplitButton(element) {
    if (!element || element.initialized) return;

    const $splitButton = $CSD(element);
    const $toggleButton = $splitButton.find('.split-toggle');
    const $dropdown = $splitButton.find('.split-dropdown');
    let isOpen = false;

    function toggleDropdown(e) {
        e.stopPropagation();
        if (isOpen) {
            $dropdown.removeClass('show');
        } else {
            $dropdown.addClass('show');
            // Close other open dropdowns
            $CSD('.split-dropdown.show').not($dropdown).removeClass('show');
        }
        isOpen = !isOpen;
    }

    function closeDropdown(e) {
        if (!$splitButton[0].contains(e.target)) {
            $dropdown.removeClass('show');
            isOpen = false;
        }
    }

    $toggleButton.on('click', toggleDropdown);
    $CSD(document).on('click', closeDropdown);

    // Mark as initialized
    element.initialized = true;
}

export { initializeSplitButton };