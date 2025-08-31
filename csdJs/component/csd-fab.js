// Tiene traccia di tutti i FAB attivi
let activeFabs = new Set();

/**
 * Destroys a FAB instance, removing all event handlers and cleaning up state
 * @param {HTMLElement} fabElement - The FAB element to destroy
 */
function destroyFab(fabElement) {
    if (!fabElement) return;
    
    const $fab = $CSD(fabElement);
    
    // Check if the element is already initialized
    if (!$fab.attr('data-csd-fab-initialized')) {
        return; // Not initialized, nothing to destroy
    }
    
    // Use the existing destroy method if available
    if (fabElement.csdFab && fabElement.csdFab.destroy) {
        fabElement.csdFab.destroy();
    }
    
    // Remove from active FABs
    activeFabs.delete(fabElement);
    
    // Remove event listeners by cloning elements
    const $mainButton = $fab.find('.csd-fab-button').first();
    const $lists = $fab.find('.csd-fab-list');
    
    if ($mainButton.length) {
        const $newMainButton = $mainButton.clone(false, true);
        $mainButton.replaceWith($newMainButton);
    }
    
    $lists.find('.csd-fab-button').each(function() {
        const $button = $CSD(this);
        const $newButton = $button.clone(false, true);
        $button.replaceWith($newButton);
    });
    
    // Reset styles and classes
    $fab.removeClass('open');
    $lists.find('.csd-fab-button').css({
        'transform': '',
        'transition': '',
        'transition-delay': '',
        'cursor': ''
    });
    
    // Remove initialization properties
    delete fabElement.csdFab;
    delete fabElement.initialized;
    
    // Remove the initialized flag
    $fab.removeAttr('data-csd-fab-initialized');
}

function initializeFab(element) {
    // Check if element exists, otherwise terminate
    if (!element) return;
    
    const $fab = $CSD(element);
    
    // Check if the element is already initialized
    if ($fab.attr('data-csd-fab-initialized')) {
        // If already initialized, destroy it first
        destroyFab(element);
    }
    
    // Check legacy initialization flag
    if (element.initialized) return;
    const $mainButton = $fab.find('.csd-fab-button').first();
    const $lists = $fab.find('.csd-fab-list');
    const hasLists = $lists.length > 0;
    let isOpen = false;

    function calculateButtonPositions($list) {
        const type = $list.data('type') || 'linear';
        const direction = $list.data('direction') || 'top';
        const $buttons = $list.find('.csd-fab-button');
        const buttonCount = $buttons.length;
        const spacing = 14 * 2.5 + 7; // Aumentato lo spacing per maggiore distanza
        const radius = 14 * 5; // Aumentato il radius per maggiore distanza

        $buttons.each(function(btn, index) {
            let x = 0, y = 0;

            switch(type) {
                case 'linear':
                    switch(direction) {
                        case 'top':
                            y = -spacing * (index + 1);
                            break;
                        case 'bottom':
                            y = spacing * (index + 1);
                            break;
                        case 'left':
                            x = -spacing * (index + 1);
                            break;
                        case 'right':
                            x = spacing * (index + 1);
                            break;
                    }
                    break;

                case 'circle':
                    const angle = ((360 / buttonCount) * index - 90) * (Math.PI / 180);
                    x = Math.cos(angle) * radius;
                    y = Math.sin(angle) * radius;
                    break;

                case 'semi-circle':
                    const semiAngle = ((180 / (buttonCount - 1)) * index - 180) * (Math.PI / 180);
                    x = Math.cos(semiAngle) * radius;
                    y = Math.sin(semiAngle) * radius;
                    break;

                case 'quarter-circle':
                    const quarterAngle = (90 / (buttonCount - 1)) * index * (Math.PI / 180);
                    
                    switch(direction) {
                        case 'top-left':
                            x = -Math.cos(quarterAngle) * radius;
                            y = -Math.sin(quarterAngle) * radius;
                            break;
                        case 'top-right':
                            x = Math.sin(quarterAngle) * radius;
                            y = -Math.cos(quarterAngle) * radius;
                            break;
                        case 'bottom-left':
                            x = -Math.sin(quarterAngle) * radius;
                            y = Math.cos(quarterAngle) * radius;
                            break;
                        case 'bottom-right':
                            x = Math.cos(quarterAngle) * radius;
                            y = Math.sin(quarterAngle) * radius;
                            break;
                    }
                    break;
            }

            // Imposta la posizione finale e il delay per l'animazione
            const $button = $CSD(this);
            $button.css({
                'transform': `translate(${x}px, ${y}px)`,
                'transition-delay': `${index * 0.05}s`
            });
        });
    }

    function openFab() {
        if (!hasLists || isOpen) return;
        
        // Chiudi tutti gli altri FAB attivi
        activeFabs.forEach(fab => {
            if (fab !== element && fab.csdFab) {
                fab.csdFab.close();
            }
        });
        
        isOpen = true;
        $fab.addClass('open');
        activeFabs.add(element);
        $lists.each(function() {
            calculateButtonPositions($CSD(this));
        });
    }

    function closeFab() {
        if (!hasLists || !isOpen) return;
        isOpen = false;
        
        // Resetta i delay quando chiudi
        $lists.find('.csd-fab-button').css({
            'transition-delay': '0s',
            'transform': 'translate(0, 0)'
        });
        
        $fab.removeClass('open');
        activeFabs.delete(element);
    }

    // Click handler for main button
    $mainButton.on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Se non ci sono liste, non fare nulla
        if (!hasLists) return;
        
        if (isOpen) {
            closeFab();
        } else {
            openFab();
        }
    });

    if (hasLists) {
        // Click handler for child buttons (solo se ci sono liste)
        $lists.find('.csd-fab-button').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeFab();
        });

        // Close on click outside (solo se ci sono liste)
        const closeHandler = function(e) {
            // Se il click non è su un FAB, chiudi tutti i FAB attivi
            if (!$CSD(e.target).closest('.csd-fab').length) {
                activeFabs.forEach(fab => {
                    if (fab.csdFab) {
                        fab.csdFab.close();
                    }
                });
            }
        };
        
        $CSD(document).on('click', closeHandler);

        // Initialize positions
        $lists.each(function() {
            const $list = $CSD(this);
            $list.find('.csd-fab-button').css({
                'transform': 'translate(0, 0)',
                'transition': 'all 0.3s',
                'transition-delay': '0s'
            });
        });

        // Make buttons clickable
        $fab.find('.csd-fab-button').css('cursor', 'pointer');

        // Cleanup function
        element.csdFab = {
            open: openFab,
            close: closeFab,
            destroy: function() {
                $mainButton.off();
                $lists.find('.csd-fab-button').off();
                $CSD(document).off('click', closeHandler);
                activeFabs.delete(element);
                element.initialized = false;
            }
        };
    }

    element.initialized = true;
    
    // Mark the element as initialized
    $fab.attr('data-csd-fab-initialized', 'true');
    
    return element.csdFab;
}

export { initializeFab, destroyFab };