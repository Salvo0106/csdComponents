function initializeStepper(element) {
  if (!element) return;

  const $element = $CSD(element);
  const $stepper = $element.find(".csd-stepper");
  if (!$stepper.length) return;

  const $steps = $stepper.find(".csd-step");
  const $panels = $element.find(".csd-step-panel");
  const $prevBtn = $element.find(".prev-step");
  const $nextBtn = $element.find(".next-step");
  const isVertical = $stepper.hasClass("vertical");

  function updateProgressLine($progress, index) {
    const $currentIndicator = $steps.eq(index).find(".csd-step-indicator");
    const $nextIndicator = $steps.eq(index + 1).find(".csd-step-indicator");
    const stepperRect = $stepper[0].getBoundingClientRect();

    if (isVertical) {
      const currentRect = $currentIndicator[0].getBoundingClientRect();
      const nextRect = $nextIndicator[0].getBoundingClientRect();

      $progress.css({
        top: `${currentRect.bottom - stepperRect.top + 6}px`,
        height: `${nextRect.top - currentRect.bottom - 12}px`,
        left: `${
          currentRect.left - stepperRect.left + currentRect.width / 2
        }px`,
      });
    } else {
      const currentRect = $currentIndicator[0].getBoundingClientRect();
      const nextRect = $nextIndicator[0].getBoundingClientRect();

      $progress.css({
        left: `${currentRect.right - stepperRect.left + 12}px`,
        width: `${nextRect.left - currentRect.right - 24}px`,
        top: `${currentRect.top - stepperRect.top + currentRect.height / 2}px`,
      });
    }
  }

  $steps.each(function (step, index) {
    if (index < $steps.length - 1) {
      const $progress = $CSD("<div>")
        .addClass("csd-step-progress")
        .attr("data-step", index + 1);

      $stepper.append($progress);
      updateProgressLine($progress, index);
    }
  });

  let currentStep = 1;
  const totalSteps = $steps.length;

  function updateProgress() {
    const $activeStep = $stepper.find(".csd-step.active");
    if (!$activeStep.length) return;

    const stepIndex = $activeStep.index();

    $stepper.find(".csd-step-progress").each(function (progress, index) {
      const $progress = $CSD(progress);
      updateProgressLine($progress, index);
      $progress.toggleClass("completed", index < stepIndex);
    });
  }

  function goToStep(step) {
    currentStep = step;

    $steps.each(function (step, index) {
      const $s = $CSD(step);
      $s.toggleClass("active", index + 1 === currentStep);
      $s.toggleClass("completed", index + 1 < currentStep);
    });

    $panels.each(function (panel, index) {
      $CSD(panel).toggleClass("active", index + 1 === step);
    });

    if ($prevBtn.length) $prevBtn.prop("disabled", currentStep === 1);
    if ($nextBtn.length) $nextBtn.prop("disabled", currentStep === totalSteps);

    updateProgress();
  }

  $steps.each(function (step, index) {
    const $indicator = $CSD(step).find(".csd-step-indicator");
    if ($indicator.length) {
      $indicator.on("click", () => goToStep(index + 1));
    }
  });

  if ($prevBtn.length) {
    $prevBtn.on("click", () => {
      if (currentStep > 1) goToStep(currentStep - 1);
    });
  }

  if ($nextBtn.length) {
    $nextBtn.on("click", () => {
      if (currentStep < totalSteps) goToStep(currentStep + 1);
    });
  }

  $CSD(window).on("load", () => {
    goToStep(1);
    $CSD(window).on("resize", updateProgress);
  });
}

export { initializeStepper };