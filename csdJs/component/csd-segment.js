// Segment Component
function initializeSegment(element) {
  const $element = $CSD(element);
  const $buttons = $element.find(".csd-segment-button");
  const $indicator = $element.find(".csd-segment-indicator");
  let segmentPadding = 0;
  
  // Gestione compatibilità SSR
  if (typeof window !== 'undefined') {
    const containerStyle = window.getComputedStyle(element);
    segmentPadding = parseFloat(containerStyle.paddingLeft);
  }

  function updateIndicatorPosition(selectedButton) {
    if (!selectedButton || !$indicator.length) return;

    const containerRect = element.getBoundingClientRect();
    const $buttonElements = $element.find(".csd-segment-button");
    const buttonElements = $buttonElements.elements;
    const isFirstButton = buttonElements[0] === selectedButton;
    const isLastButton =
      buttonElements[buttonElements.length - 1] === selectedButton;

    $buttonElements.removeClass("before-checked");

    const selectedIndex = buttonElements.indexOf(selectedButton);
    if (!isFirstButton && selectedIndex > 0) {
      $CSD(buttonElements[selectedIndex - 1]).addClass("before-checked");
    }

    const buttonWidth = selectedButton.getBoundingClientRect().width;
    let translateX = 0;

    for (let i = 0; i < selectedIndex; i++) {
      translateX += buttonElements[i].getBoundingClientRect().width;
    }

    if (isFirstButton) {
      translateX = 0;
    } else if (isLastButton) {
      translateX = containerRect.width - buttonWidth - segmentPadding * 2;
    } else {
      translateX += segmentPadding;
    }

    requestAnimationFrame(() => {
      $indicator[0].style.width = `${buttonWidth}px`;
      $indicator[0].style.transform = `translateX(${translateX}px)`;
    });
  }

  function updateIndicator(selectedButton) {
    updateIndicatorPosition(selectedButton);
    const $icons = $CSD(selectedButton).find("ion-icon");

    if ($icons.length > 0) {
      setTimeout(() => {
        updateIndicatorPosition(selectedButton);
        setTimeout(() => updateIndicatorPosition(selectedButton), 300);
      }, 50);
    }
  }

  function selectButton(selectedButton) {
    if ($CSD(selectedButton).hasClass("active")) return;

    $buttons.removeClass("active");
    $CSD(selectedButton).addClass("active");
    updateIndicator(selectedButton);

    const contentId = $CSD(selectedButton).attr("content-id");
    if (contentId) {
      // Nascondi tutti i contenuti
      // Mostra il contenuto corrispondente
      const targetContent = document.getElementById(contentId);
      if (targetContent) {
        const segmentContents = targetContent.closest(".csd-segment-contents");

        segmentContents
          .querySelector(".csd-segment-content.active")
          ?.classList.remove("active");

        targetContent.classList.add("active");
      }
    }

    element.dispatchEvent(
      new CustomEvent("segment-change", {
        detail: {
          value: $CSD(selectedButton).attr("value"),
          contentId: contentId,
        },
      })
    );
  }

  const $activeButton = $element.find(".csd-segment-button.active");
  if ($activeButton.length) {
    updateIndicator($activeButton[0]);
  }

  $buttons.each((button) => {
    $CSD(button).on("click", () => {
      if (!$CSD(button).prop("disabled")) {
        selectButton(button);
      }
    });
  });

  const debouncedResize = debounce(() => {
    const $activeButton = $element.find(".csd-segment-button.active");
    if ($activeButton.length) {
      updateIndicator($activeButton[0]);
    }
  }, 100);

  if (typeof window !== 'undefined') {
    window.addEventListener("resize", debouncedResize);
  }
}

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

export { initializeSegment };