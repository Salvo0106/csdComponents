import { $CSD } from "../csd-lib";

/**
 * Destroys a button instance, removing all event handlers and restoring original state
 * @param {HTMLElement} buttonElement - The button element to destroy
 */
function destroyBtn(buttonElement) {
  if (!buttonElement) return null;
  
  const $btn = $CSD(buttonElement);
  
  // Check if the element is already initialized
  if (!$btn.attr('data-csd-btn-initialized')) {
    return buttonElement; // Not initialized, return original element
  }
  
  // Ripristina il testo originale se salvato
  const originalText = $btn.attr('data-original-text');
  if (originalText) {
    $btn.text(originalText);
  }
  
  // Remove event listeners by cloning the element
  const $newBtn = $btn.clone(false, true);
  $btn.replaceWith($newBtn);
  
  // Disconnetti l'osservatore se presente
  if (buttonElement._csdBtnObserver) {
    buttonElement._csdBtnObserver.disconnect();
    delete buttonElement._csdBtnObserver;
  }
  
  // Remove the initialized flag and other data attributes
  $newBtn.removeAttr('data-csd-btn-initialized');
  $newBtn.removeAttr('data-original-text');
  $newBtn.removeAttr('data-current-icon');
  $newBtn.removeAttr('data-current-badge');
  $newBtn.removeAttr('data-current-place-icon');
  
  // Return the new element
  return $newBtn.elements[0];
}

/**
 * Triggers a custom button event with detailed state information
 * @param $btn - The button item that triggered the event
 * @private
 */
function _triggerButtonEvent($btn) {  
    // Create event object with all details
    const eventData = {
      type: "csd_click", // - type: "csd_btn_click"
      action: "click", // - action: "click", "hide", "show-all", o "hide-all"
      item: $btn // - item triggered
    };
  
    // Trigger the event using CSD library on the button element
    $btn.trigger(eventData);
}

function initializeBtn(btnElement) {
    // Check if element exists, otherwise terminate
    if (!btnElement) return;
    
    let $btn = $CSD(btnElement);
    
    // Check if the element is already initialized
    if ($btn.attr('data-csd-btn-initialized')) {
        // If already initialized, destroy it first and get the new element
        const newElement = destroyBtn(btnElement);
        if (!newElement) return; // Destroy failed
        btnElement = newElement;
        $btn = $CSD(btnElement);
    }
    
    const originalText = $btn.text();
    
    // Salva il testo originale per il destroy
    if (!$btn.attr('data-original-text')) {
        $btn.attr('data-original-text', originalText);
    }
    
    if ($btn.attr('icon')) {
        const attrIcon = $btn.attr('icon')
        const type = attrIcon.split('-', 1)[0];
        let newContentBTN
        switch (type) {
            case 'ion':
                const ionIconData = attrIcon.split('-');
                const ionIcon = attrIcon.slice(type.length + 1)
                newContentBTN = `<ion-icon name="${ionIcon}"></ion-icon>`;
                if ($btn.attr('place-icon') == "left") {
                    $btn.html(newContentBTN).append(originalText);    
                } else {
                    $btn.append(newContentBTN);
                }
                break;
            case 'fa':
                const faIconData = attrIcon.split('-');
                const faIcon = attrIcon.slice(type.length + 1 + faIconData[1].length + 1)
                newContentBTN = `<i class="fa-${faIconData[1]} fa-${faIcon}"></i>`;
                if ($btn.attr('place-icon') == "left") {
                    $btn.html(newContentBTN).append(originalText);
                } else {
                    $btn.append(newContentBTN);
                }
                break;
        }
    } 

    if ($btn.attr('badge')) {
        const badgeValue = $btn.attr('badge'); 
        const badgeItem = `<span class="csd-badge">${badgeValue}</span>`;
        $btn.append(badgeItem);
    }

    $btn.on('click', function () {
        _triggerButtonEvent($btn)
    })
    
    // Salva i valori correnti degli attributi per il confronto
    const currentIcon = $btn.attr('icon') || '';
    const currentBadge = $btn.attr('badge') || '';
    const currentPlaceIcon = $btn.attr('place-icon') || '';
    
    $btn.attr('data-current-icon', currentIcon);
    $btn.attr('data-current-badge', currentBadge);
    $btn.attr('data-current-place-icon', currentPlaceIcon);
    
    // Configura l'osservatore di attributi per reinizializzazione automatica
    if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes') {
                    const attrName = mutation.attributeName;
                    
                    // Controlla se sono cambiati gli attributi che ci interessano
                    if (['icon', 'badge', 'place-icon'].includes(attrName)) {
                        const currentValue = $btn.attr(attrName) || '';
                        const savedValue = $btn.attr(`data-current-${attrName}`) || '';
                        
                        // Se il valore è cambiato, reinizializza
                        if (currentValue !== savedValue) {
                            // Usa setTimeout per evitare loop infiniti durante l'aggiornamento
                            setTimeout(() => {
                                initializeBtn(btnElement);
                            }, 0);
                        }
                    }
                }
            });
        });
        
        // Osserva i cambiamenti agli attributi
        observer.observe(btnElement, {
            attributes: true,
            attributeFilter: ['icon', 'badge', 'place-icon']
        });
        
        // Salva l'observer per poterlo disconnettere durante il destroy
        btnElement._csdBtnObserver = observer;
    }
    
    // Mark the element as initialized
    $btn.attr('data-csd-btn-initialized', 'true');
}

export {initializeBtn, destroyBtn};