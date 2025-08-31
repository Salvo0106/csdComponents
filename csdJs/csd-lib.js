/**
 * _CSD_UTILS Library - A lightweight library inspired by jQuery
 */

// Define the core class
class _CSD_UTILS {
  constructor(selector) {
    if (typeof selector === 'string') {
      try {
        // Handle HTML string creation like jQuery
        if (selector.trim().startsWith('<') && selector.trim().endsWith('>')) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = selector.trim();
          this.elements = [tempDiv.firstElementChild];
        } else {
          this.elements = Array.from(document.querySelectorAll(selector));
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'SyntaxError') {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = selector.trim();
          this.elements = [tempDiv.firstElementChild];
        } else {
          throw error;
        }
      }
    } else if (selector instanceof Node) {
      this.elements = [selector];
    } else if (selector instanceof NodeList || Array.isArray(selector)) {
      this.elements = Array.from(selector);
    } else if (selector instanceof _CSD_UTILS) {
      this.elements = selector.elements;
    } else {
      this.elements = [];
    }

    return new Proxy(this, {
      get(target, prop) {
        if (prop === 'length') {
          return target.elements.length;
        }
        if (!isNaN(prop)) {
          return target.elements[prop];
        }
        return target[prop];
      }
    });
  }

  _updateElements() {
    // Update elements array with current state of DOM elements
    this.elements = this.elements.map(el => {
      // If element is no longer in DOM, return null
      return new _CSD_UTILS(el).elements[0] || null;
    }).filter(el => el !== null); // Remove any null elements
    return this;
  }

  // ATTRIBUTES
  addClass(className) {
    return this.each(function (el) {
      el.classList.add(className);
    })._updateElements();
  }

  removeClass(className) {
    return this.each(function (el) {
      el.classList.remove(className);
    })._updateElements();
  }

  toggleClass(className, condition = undefined) {
    return this.each(function (el) {
      if (condition === undefined) {
          el.classList.toggle(className);
      } else {
          el.classList.toggle(className, condition);
      }
    })._updateElements();
  }

  attr(attribute, value) {
    if (value === undefined) {
      return this.elements[0]?.getAttribute(attribute);
    } else {
      return this.each(function (el) {
        el.setAttribute(attribute, value);
      })._updateElements();
    }
  }

  removeAttr(attribute) {
    return this.each(function (el) {
      el.removeAttribute(attribute);
    })._updateElements();
  }

  prop(property, value) {
    if (value === undefined) {
      const element = this.elements[0];
      if (!element) return undefined;
      
      // Handle boolean properties
      if (typeof element[property] === 'boolean') {
        return element[property];
      }
      return element[property];
    }
    
    return this.each(function(el) {
      // Handle special cases for boolean attributes
      if (property === 'checked' || property === 'selected' || property === 'disabled' || property === 'readonly') {
        if (value === true || value === 'true') {
          el.setAttribute(property, '');
        } else {
          el.removeAttribute(property);
        }
      }
      
      // Set the property
      el[property] = value;
      
      // For readonly, also set the attribute to ensure it works in all browsers
      if (property === 'readOnly') {
        if (value === true || value === 'true') {
          el.setAttribute('readonly', '');
        } else {
          el.removeAttribute('readonly');
        }
      }
    })._updateElements();
  }

  removeProp(property) {
    return this.each(function (el) {
      delete el[property];
    })._updateElements();
  }

  hasClass(className) {
    return this.elements[0]?.classList.contains(className) || false;
  }

  // COLLECTION
  each(callback) {
      this.elements.forEach(function (el, index) {
          callback.call(el, el, index);
      });
      return this;
  }

  add(selector) {
    const newElements = document.querySelectorAll(selector);
    this.elements = [...this.elements, ...newElements];
    return this;
  }

  eq(index) {
    return new _CSD_UTILS(this.elements[index]);
  }

  first() {
    return this.eq(0);
  }

  last() {
    return this.eq(this.elements.length - 1);
  }

  get(index) {
    return this.elements[index];
  }

  index() {
    const element = this.elements[0];
    return element ? Array.from(element.parentNode.children).indexOf(element) : -1;
  }

  filter(selectorOrCallback) {
    const filtered = this.elements.filter(el => {
      if (typeof selectorOrCallback === 'function') {
        return selectorOrCallback.call(el, el);
      } else {
        // Handle :visible pseudo-selector
        if (selectorOrCallback === ':visible') {
          // Verifica che siamo in un ambiente browser
          if (typeof window !== 'undefined') {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   style.opacity !== '0' &&
                   el.offsetWidth > 0 &&
                   el.offsetHeight > 0;
          }
          return el.offsetWidth > 0 && el.offsetHeight > 0; // Fallback basic check
        }
        // Handle :hidden pseudo-selector
        if (selectorOrCallback === ':hidden') {
          // Verifica che siamo in un ambiente browser
          if (typeof window !== 'undefined') {
            const style = window.getComputedStyle(el);
            return style.display === 'none' || 
                   style.visibility === 'hidden' || 
                   style.opacity === '0' ||
                   el.offsetWidth === 0 ||
                   el.offsetHeight === 0;
          }
          return el.offsetWidth === 0 || el.offsetHeight === 0; // Fallback basic check
        }
        // Handle complex selectors like [selected][value=""]
        if (selectorOrCallback.includes('[')) {
          const attributes = selectorOrCallback.match(/\[(.*?)\]/g);
          return attributes.every(attr => {
            const [name, value] = attr.slice(1, -1).split('=');
            if (value) {
              // Remove quotes if present
              const cleanValue = value.replace(/['"]/g, '');
              return el.getAttribute(name) === cleanValue;
            }
            return el.hasAttribute(name);
          });
        }
        return el.matches(selectorOrCallback);
      }
    });
    return new _CSD_UTILS(filtered);
  }

  map(callback) {
    return this.elements.map(callback);
  }

  slice(start, end) {
    return new _CSD_UTILS(this.elements.slice(start, end));
  }

  // CSS
  css(property, value) {
    if (typeof property === 'object') {
      return this.each(function(el) {
        Object.assign(el.style, property);
      });
    }
    
    if (value === undefined) {
      const el = this.elements[0];
      if (!el) return '';  // Return empty string for non-existent elements
      if (typeof window !== 'undefined') {
        return window.getComputedStyle(el)[property] || '';
      }
      return el.style[property] || ''; // Fallback per SSR
    }
    
    return this.each(function(el) {
      el.style[property] = value;
    });
  }

  // DATA
  data(key, value) {
    // Convert key to data-* format if needed
    const dataKey = key.startsWith('data-') ? key : `data-${key}`;
    
    if (value === undefined) {
      const element = this.elements[0];
      if (!element) return undefined;

      // Get the data attribute value
      const attrValue = element.getAttribute(dataKey);
      
      // Try to parse the value if it looks like JSON
      if (attrValue) {
        try {
          // Handle special cases first
          if (attrValue.toLowerCase() === 'true') return true;
          if (attrValue.toLowerCase() === 'false') return false;
          if (!isNaN(attrValue)) return Number(attrValue);
          return JSON.parse(attrValue);
        } catch (e) {
          // If parsing fails, return the raw string
          return attrValue;
        }
      }
      return undefined;
    }
    
    // Setting data
    return this.each(function(el) {
      if (value === null) {
        el.removeAttribute(dataKey);
      } else {
        const dataValue = typeof value === 'object' ? JSON.stringify(value) : value;
        el.setAttribute(dataKey, dataValue);
      }
    });
  }

  // DIMENSIONS
  outerWidth() {
    return this.elements[0]?.offsetWidth || 0;
  }

  outerHeight(includeMargin = false) {
    const el = this.elements[0];
    if (!el) return 0;
    
    let height = el.offsetHeight;
    
    if (includeMargin) {
      const computedStyle = window.getComputedStyle(el);
      height += parseFloat(computedStyle.marginTop) + parseFloat(computedStyle.marginBottom);
    }
    
    return height;
  }

  height() {
    return this.elements[0]?.offsetHeight;
  }

  width() {
    return this.elements[0]?.offsetWidth;
  }

  innerHeight() {
    return this.elements[0]?.clientHeight;
  }

  innerWidth() {
    return this.elements[0]?.clientWidth;
  }

  // EFFECTS
  show() {
    return this.each(function (el) {
      el.style.display = '';
    })._updateElements();
  }

  hide() {
    return this.each(function (el) {
      el.style.display = 'none';
    })._updateElements();
  }

  toggle(force) {
    return this.each(function (el) {
      const style = window.getComputedStyle(el);
      const isHidden = style.display === 'none';
      
      if (force === undefined) {
        // Se non c'è force, inverti lo stato corrente
        el.style.display = isHidden ? '' : 'none';
      } else {
        // Se force è true, mostra l'elemento
        // Se force è false, nascondi l'elemento
        el.style.display = force ? '' : 'none';
      }
    })._updateElements();
  }

  // EVENTS
  on(event, selectorOrCallback, callback) {
      if (typeof selectorOrCallback === 'string') {
          const selector = selectorOrCallback;
          return this.each(function (el) {
            const handler = function (e) {
                  const matches = el.querySelectorAll(selector);
                  const target = e.target;
                  let matched = false;
                  
                  // Check if the target or any of its parents match the selector
                  let currentElement = target;
                  while (currentElement && currentElement !== el) {
                      if (Array.from(matches).includes(currentElement)) {
                          matched = true;
                  break;
                }
                      currentElement = currentElement.parentElement;
                  }
                  
                  if (matched) {
                      callback.call(currentElement, e);
              }
            };
            
            // Store the handler reference for potential removal
            if (!el._eventHandlers) el._eventHandlers = {};
            if (!el._eventHandlers[event]) el._eventHandlers[event] = [];
            el._eventHandlers[event].push({ selector, handler, callback });
            
            el.addEventListener(event, handler);
          })._updateElements();
      } else {
          const callback = selectorOrCallback;
          return this.each(function (el) {
              // Store the handler reference for potential removal
            if (!el._eventHandlers) el._eventHandlers = {};
            if (!el._eventHandlers[event]) el._eventHandlers[event] = [];
            el._eventHandlers[event].push({ handler: callback, callback });
            
            el.addEventListener(event, callback);
          })._updateElements();
      }
  }

  off(event, callback) {
      return this.each(function (el) {
          if (el._eventHandlers && el._eventHandlers[event]) {
              el._eventHandlers[event].forEach(item => {
                  if (!callback || item.callback === callback) {
                      el.removeEventListener(event, item.handler || item.callback);
                  }
              });
              if (!callback) {
                  delete el._eventHandlers[event];
              } else {
                  el._eventHandlers[event] = el._eventHandlers[event].filter(
                      item => item.callback !== callback
                  );
              }
          }
      })._updateElements();
  }

  one(event, callback) {
    return this.each(function (el) {
      const oneTimeCallback = (e) => {
        callback(e);
        el.removeEventListener(event, oneTimeCallback);
      };
      el.addEventListener(event, oneTimeCallback);
    })._updateElements();
  }

  trigger(event) {
    if (typeof event === 'string') {
      const evt = new Event(event);
      return this.each(function (el) {
        el.dispatchEvent(evt);
      })._updateElements();
    }
    
    // Handle custom event object
    const customEvent = new CustomEvent(event.type, {
      detail: event,
      bubbles: true,
      cancelable: true
    });
    
    return this.each(function(el) {
      el.dispatchEvent(customEvent);
    })._updateElements();
  }

  // EVENTS
  click(callback) {
      if (!callback) {
          // Se non c'è callback, simula un click
          return this.each(function(el) {
              el.click();
          })._updateElements();
      }
      
      return this.on('click', function(e) {
          // Preserva il contesto this e passa l'evento e
          callback.call(this, e);
      })._updateElements();
  }

  hover(mouseEnterCallback, mouseLeaveCallback) {
      return this.on('mouseenter', function(e) {
          if (mouseEnterCallback) mouseEnterCallback.call(this, e);
      }).on('mouseleave', function(e) {
          if (mouseLeaveCallback) mouseLeaveCallback.call(this, e);
      })._updateElements();
  }

  ready(callback) {
    if (document.readyState !== 'loading') {
      callback();
    } else {
      document.addEventListener('DOMContentLoaded', callback);
    }
    return this;
  }

  // FORMS
  focus(handler) {
    if (handler === undefined) {
      // Se non c'è handler, imposta il focus sul primo elemento
      if (this.elements[0]) {
        this.elements[0].focus();
      }
      return this;
    }
    
    // Altrimenti aggiungi l'event handler per il focus
    return this.on('focus', handler);
  }

  blur(handler) {
    if (handler === undefined) {
      // Se non c'è handler, rimuovi il focus dal primo elemento
      if (this.elements[0]) {
        this.elements[0].blur();
      }
      return this;
    }
    
    // Altrimenti aggiungi l'event handler per il blur
    return this.on('blur', handler);
  }

  val(value) {
    if (value === undefined) {
      const el = this.elements[0];
      if (!el) return undefined;
      if (el.type === 'select-multiple') {
        const selectedOptions = Array.from(el.selectedOptions)
          .map(option => option.value)
          .filter(value => value !== ""); // Filtro i valori vuoti
        return selectedOptions;
      }
      return el.value;
    } else {
      return this.each(function (el) {
        if (el.type === 'select-multiple' && Array.isArray(value)) {
          Array.from(el.options).forEach(option => {
            option.selected = value.includes(option.value);
          });
        } else {
          el.value = value;
        }
      })._updateElements();
    }
  }

  serialize() {
    if (!this.elements[0] || this.elements[0].nodeName !== 'FORM') return '';
    const formData = new FormData(this.elements[0]);
    return new URLSearchParams(formData).toString();
  }

  // MANIPULATION
  html(content) {
    if (content === undefined) {
      return this.elements[0]?.innerHTML;
    } else {
      return this.each(function (el) {
        el.innerHTML = content;
      })._updateElements();
    }
  }

  text(content) {
    if (content === undefined) {
      return this.elements[0]?.textContent;
    } else {
      return this.each(function (el) {
        el.textContent = content;
      })._updateElements();
    }
  }

  append(content) {
    if (!content) return this;
    
    const appendContent = (el, content) => {
      if (typeof content === 'string') {
        el.insertAdjacentHTML('beforeend', content);
        return el.lastElementChild;
      } else if (content instanceof Node) {
        const clone = content.cloneNode(true);
        el.appendChild(clone);
        return clone;
      }
      return null;
    };
    
    const newElements = [];
    this.each((el) => {
      if (content instanceof _CSD_UTILS) {
        content.each(contentEl => {
          const newEl = appendContent(el, contentEl);
          if (newEl) newElements.push(newEl);
        });
      } else {
        const newEl = appendContent(el, content);
        if (newEl) newElements.push(newEl);
      }
    });
    
    // Se content è un _CSD_UTILS, aggiorna i suoi elementi
    if (content instanceof _CSD_UTILS) {
      content.elements = newElements;
    }
    
    return this._updateElements();
  }

  prepend(content) {
    if (!content) return this;
    
    const newElements = [];
    this.each(function (el) {
      if (typeof content === 'string') {
        el.insertAdjacentHTML('afterbegin', content);
        newElements.push(el.firstElementChild);
      } else if (content instanceof _CSD_UTILS) {
        content.each(contentEl => {
          const clone = contentEl.cloneNode(true);
          el.prepend(clone);
          newElements.push(clone);
        });
      } else if (content instanceof Node) {
        const clone = content.cloneNode(true);
        el.prepend(clone);
        newElements.push(clone);
      }
    });
    
    // Se content è un _CSD_UTILS, aggiorna i suoi elementi
    if (content instanceof _CSD_UTILS) {
      content.elements = newElements;
    }
    
    return this._updateElements();
  }

  before(content) {
    if (!content) return this;
    
    const newElements = [];
    this.each(function (el) {
      if (typeof content === 'string') {
        el.insertAdjacentHTML('beforebegin', content);
        newElements.push(el.previousElementSibling);
      } else if (content instanceof _CSD_UTILS) {
        content.each(contentEl => {
          const clone = contentEl.cloneNode(true);
          el.before(clone);
          newElements.push(clone);
        });
      } else if (content instanceof Node) {
        const clone = content.cloneNode(true);
        el.before(clone);
        newElements.push(clone);
      }
    });
    
    // Se content è un _CSD_UTILS, aggiorna i suoi elementi
    if (content instanceof _CSD_UTILS) {
      content.elements = newElements;
    }
    
    return this._updateElements();
  }

  after(content) {
    if (!content) return this;
    
    const newElements = [];
    this.each(function (el) {
      if (typeof content === 'string') {
        el.insertAdjacentHTML('afterend', content);
        newElements.push(el.nextElementSibling);
      } else if (content instanceof _CSD_UTILS) {
        content.each(contentEl => {
          const clone = contentEl.cloneNode(true);
          el.after(clone);
          newElements.push(clone);
        });
      } else if (content instanceof Node) {
        const clone = content.cloneNode(true);
        el.after(clone);
        newElements.push(clone);
      }
    });
    
    // Se content è un _CSD_UTILS, aggiorna i suoi elementi
    if (content instanceof _CSD_UTILS) {
      content.elements = newElements;
    }
    
    return this._updateElements();
  }

  empty() {
    return this.each(function (el) {
      el.innerHTML = '';
    })._updateElements();
  }

  remove() {
    this.each(function (el) {
      el.remove();
    });
    return this._updateElements();
  }

  clone() {
    return new _CSD_UTILS(this.elements.map(el => el.cloneNode(true)));
  }

  wrap(html) {
    return this.each(function (el) {
      const wrapper = document.createElement('div');
      if (html instanceof _CSD_UTILS) {
        wrapper.innerHTML = html.elements[0]?.outerHTML || '';
      } else {
        wrapper.innerHTML = html;
      }
      const wrapperElement = wrapper.firstElementChild;
      if (wrapperElement) {
        el.parentNode.insertBefore(wrapperElement, el);
        wrapperElement.appendChild(el);
      }
    })._updateElements();
  }

  unwrap() {
    return this.each(function (el) {
      const parent = el.parentNode;
      if (parent && parent.nodeName !== 'BODY') {
        parent.replaceWith(...parent.childNodes);
      }
    })._updateElements();
  }

  wrapInner(html) {
    return this.each(function (el) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      while (el.firstChild) {
        wrapper.firstElementChild.appendChild(el.firstChild);
      }
      el.appendChild(wrapper.firstElementChild);
    })._updateElements();
  }

  wrapAll(html) {
    if (this.elements.length === 0) return this;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    const wrapElement = wrapper.firstElementChild;
    this.elements[0].parentNode.insertBefore(wrapElement, this.elements[0]);
    this.each(function (el) {
      wrapElement.appendChild(el);
    });
    return this._updateElements();
  }

  // SCROLL
  scrollTop(value) {
    // Se l'elemento è window, gestisci lo scroll della finestra
    if (this.elements[0] === window) {
      if (value === undefined) {
        return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      }
      window.scrollTo({
        top: value,
        behavior: 'smooth'
      });
      return this;
    }
    
    // Altrimenti gestisci lo scroll dell'elemento
    if (value === undefined) {
      return this.elements[0]?.scrollTop || 0;
    }
    return this.each(function(el) {
      el.scrollTop = value;
    })._updateElements();
  }

  // OFFSET
  offset() {
    if (!this.elements[0]) return;
    const rect = this.elements[0].getBoundingClientRect();
    if (typeof window !== 'undefined') {
      return { top: rect.top + window.scrollY, left: rect.left + window.scrollX };
    }
    // Fallback per SSR
    return { top: rect.top, left: rect.left };
  }

  position() {
    if (!this.elements[0]) return;
    return { top: this.elements[0].offsetTop, left: this.elements[0].offsetLeft };
  }

  offsetParent() {
    return new _CSD_UTILS(this.elements[0]?.offsetParent);
  }

  // TRAVERSAL
  children() {
    return new _CSD_UTILS(this.elements[0]?.children);
  }

  parent() {
    return new _CSD_UTILS(this.elements[0]?.parentNode);
  }

  parents() {
    const parents = [];
    let parent = this.elements[0]?.parentNode;
    while (parent && parent.nodeName !== 'HTML') {
      parents.push(parent);
      parent = parent.parentNode;
    }
    return new _CSD_UTILS(parents);
  }

  parentsUntil(selector) {
    const parents = [];
    let parent = this.elements[0]?.parentNode;
    while (parent && !parent.matches(selector)) {
      parents.push(parent);
      parent = parent.parentNode;
    }
    return new _CSD_UTILS(parents);
  }

  closest(selector) {
    const el = this.elements[0];
    if (!el) return new _CSD_UTILS([]);
    
    const closest = el.closest(selector);
    return closest ? new _CSD_UTILS([closest]) : new _CSD_UTILS([]);
  }

  contents() {
    return new _CSD_UTILS(this.elements[0]?.childNodes);
  }

  find(selector) {
    if (selector === ':visible') {
      // Gestisci il selettore :visible
      const allElements = this.elements[0]?.querySelectorAll('*');
      if (!allElements) return new _CSD_UTILS([]);
      
      const visibleElements = Array.from(allElements).filter(el => {
        // Verifica compatibilità SSR
        if (typeof window !== 'undefined') {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && 
                 style.visibility !== 'hidden' && 
                 style.opacity !== '0' &&
                 el.offsetWidth > 0 &&
                 el.offsetHeight > 0;
        }
        return el.offsetWidth > 0 && el.offsetHeight > 0; // Fallback basic check
      });
      
      return new _CSD_UTILS(visibleElements);
    } else if (selector === ':hidden') {
      // Gestisci il selettore :hidden
      const allElements = this.elements[0]?.querySelectorAll('*');
      if (!allElements) return new _CSD_UTILS([]);
      
      const hiddenElements = Array.from(allElements).filter(el => {
        // Verifica compatibilità SSR
        if (typeof window !== 'undefined') {
          const style = window.getComputedStyle(el);
          return style.display === 'none' || 
                 style.visibility === 'hidden' || 
                 style.opacity === '0' ||
                 el.offsetWidth === 0 ||
                 el.offsetHeight === 0;
        }
        return el.offsetWidth === 0 || el.offsetHeight === 0; // Fallback basic check
      });
      
      return new _CSD_UTILS(hiddenElements);
    } else if (selector === ':selected') {
      // Gestisci il selettore :selected per gli elementi option
      const selectedElements = this.elements.reduce((acc, el) => {
        const selected = el.querySelectorAll('option').length > 0 
          ? Array.from(el.querySelectorAll('option')).filter(opt => opt.selected)
          : [];
        return [...acc, ...selected];
      }, []);
      
      return new _CSD_UTILS(selectedElements);
    } else if (selector.includes(':visible') || selector.includes(':hidden') || selector.includes(':selected') || selector.includes(':checked')) {
      // Gestisci selettori combinati (es: .my-class:visible)
      const baseSelector = selector.replace(/:visible|:hidden|:selected/g, '');
      const isPseudoVisible = selector.includes(':visible');
      const isPseudoHidden = selector.includes(':hidden');
      const isPseudoSelected = selector.includes(':selected');
      
      const elements = this.elements[0]?.querySelectorAll(baseSelector);
      if (!elements) return new _CSD_UTILS([]);
      
      const filteredElements = Array.from(elements).filter(el => {
        if (isPseudoSelected && el.tagName.toLowerCase() === 'option') {
          return el.selected;
        }
        
        const style = window.getComputedStyle(el);
        const elementIsVisible = style.display !== 'none' && 
                              style.visibility !== 'hidden' && 
                              style.opacity !== '0' &&
                              el.offsetWidth > 0 &&
                              el.offsetHeight > 0;
        
        if (isPseudoVisible) return elementIsVisible;
        if (isPseudoHidden) return !elementIsVisible;
        return true;
    });
      
      return new _CSD_UTILS(filteredElements);
    }
    
    // Per tutti gli altri selettori, usa querySelectorAll standard
    return new _CSD_UTILS(this.elements[0]?.querySelectorAll(selector));
  }

  siblings() {
    const siblings = Array.from(this.elements[0]?.parentNode?.children || []).filter(
      sibling => sibling !== this.elements[0]
    );
    return new _CSD_UTILS(siblings);
  }

  next() {
    return new _CSD_UTILS(this.elements[0]?.nextElementSibling);
  }

  prev() {
    return new _CSD_UTILS(this.elements[0]?.previousElementSibling);
  }

  nextAll() {
    const nextSiblings = [];
    let sibling = this.elements[0]?.nextElementSibling;
    while (sibling) {
      nextSiblings.push(sibling);
      sibling = sibling.nextElementSibling;
    }
    return new _CSD_UTILS(nextSiblings);
  }

  prevAll() {
    const prevSiblings = [];
    let sibling = this.elements[0]?.previousElementSibling;
    while (sibling) {
      prevSiblings.push(sibling);
      sibling = sibling.previousElementSibling;
    }
    return new _CSD_UTILS(prevSiblings);
  }

  nextUntil(selector) {
    const nextSiblings = [];
    let sibling = this.elements[0]?.nextElementSibling;
    while (sibling && !sibling.matches(selector)) {
      nextSiblings.push(sibling);
      sibling = sibling.nextElementSibling;
    }
    return new _CSD_UTILS(nextSiblings);
  }

  prevUntil(selector) {
    const prevSiblings = [];
    let sibling = this.elements[0]?.previousElementSibling;
    while (sibling && !sibling.matches(selector)) {
      prevSiblings.push(sibling);
      sibling = sibling.previousElementSibling;
    }
    return new _CSD_UTILS(prevSiblings);
  }

  is(selector) {
    // Se non ci sono elementi o il selettore è vuoto, ritorna false
    if (!this.elements[0] || !selector) return false;

    // Se il selettore è una funzione, la esegue per ogni elemento
    if (typeof selector === 'function') {
      return this.elements.some((el, i) => selector.call(el, i, el));
    }

    // Se il selettore è un oggetto _CSD_UTILS
    if (selector instanceof _CSD_UTILS) {
      return this.elements.some(el => selector.elements.includes(el));
    }

    // Se il selettore è un elemento DOM
    if (selector.nodeType) {
      return this.elements.includes(selector);
    }

    // Se il selettore è :visible o :hidden
    if (selector === ':visible' || selector === ':hidden') {
      const isVisible = (el) => {
        if (!el) return false;
        
        // Verifica compatibilità SSR
        if (typeof window !== 'undefined') {
          const style = window.getComputedStyle(el);
          const isVisibleStyle = style.display !== 'none' && 
                                style.visibility !== 'hidden' && 
                                style.opacity !== '0' &&
                                el.offsetWidth > 0 &&
                                el.offsetHeight > 0;
          return selector === ':visible' ? isVisibleStyle : !isVisibleStyle;
        } else {
          // Fallback per SSR
          const hasSize = el.offsetWidth > 0 && el.offsetHeight > 0;
          return selector === ':visible' ? hasSize : !hasSize;
        }
      };
      return this.elements.some(isVisible);
    }

    try {
      // Per selettori CSS standard
      if (typeof selector === 'string') {
        // Crea un set temporaneo di elementi che matchano il selettore
        const matches = Array.from(document.querySelectorAll(selector));
        // Controlla se almeno un elemento della collection è nel set
        return this.elements.some(el => matches.includes(el));
    }
    } catch (e) {
      console.warn('Invalid selector in is():', selector);
    }

    return false;
  }

  not(selector) {
    if (selector instanceof _CSD_UTILS) {
      const selectorElements = selector.elements;
      const filtered = this.elements.filter(el => !selectorElements.includes(el));
      return new _CSD_UTILS(filtered);
    } else if (selector instanceof Node) {
      const filtered = this.elements.filter(el => el !== selector);
      return new _CSD_UTILS(filtered);
    } else if (typeof selector === 'string') {
      try {
        const filtered = this.elements.filter(el => {
          if (el instanceof Element) {
            return !el.matches(selector);
          }
          return true;
        });
        return new _CSD_UTILS(filtered);
      } catch (e) {
        console.warn('Invalid selector in not():', selector);
        return this;
      }
    }
    return this;
  }

  has(selector) {
    const hasChild = this.elements.some(el => el.querySelector(selector));
    return new _CSD_UTILS(hasChild ? this.elements : []);
  }

  replaceWith(content) {
    let replacedElement;
    this.each(function (el) {
      let newElement;
      if (content instanceof _CSD_UTILS) {
        newElement = content.elements[0];
        el.replaceWith(newElement);
      } else if (content instanceof Node) {
        newElement = content.cloneNode(true);
        el.replaceWith(newElement);
      } else if (typeof content === 'string') {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content.trim();
        newElement = tempDiv.firstElementChild;
        el.replaceWith(newElement);
      }
      replacedElement = newElement;
    });
    return new _CSD_UTILS(replacedElement)._updateElements();
  }

  // STATIC METHODS
  static extend(target, ...sources) {
    return Object.assign(target, ...sources);
  }

  static each(obj, callback) {
    if (!obj) return;
    
    if (obj instanceof NodeList || Array.isArray(obj) || obj instanceof Array || obj instanceof NamedNodeMap) {
      Array.from(obj).forEach(function(element, index) {
        callback.call(element, index);
      });
    } else {
      callback.call(obj, 0);
    }
    
    return this;
  }
}

class Sortable {
  constructor(element, options = {}) {
      this.element = element;
      this.options = {
          handle: '.handle',              // Elemento per iniziare il drag
          draggable: '.csd-reorder',      // Classe degli elementi draggabili
          ghostClass: 'csd-reorder-ghost',// Classe per il ghost
          dragClass: 'csd-reorder-drag',  // Classe durante il drag
          onStart: null,                  // Callback all'inizio del drag
          onEnd: null,                    // Callback alla fine del drag
          ...options
      };

      this.dragItem = null;
      this.startY = 0;
      this.currentY = 0;
      this.initialY = 0;
      this.touchStartTime = 0;

      this.init();
  }

  init() {
      // Rendi tutti gli elementi draggabili
      const items = this.element.querySelectorAll(this.options.draggable);
      items.forEach(item => {
          // Desktop Events
          item.draggable = true;

          const handle = item.querySelector(this.options.handle);
          if (handle) {
              // Desktop Events
              handle.addEventListener('mousedown', () => {
                  item.draggable = true;
              });
              
              handle.addEventListener('mouseup', () => {
                  item.draggable = false;
              });

              // Touch Events
              handle.addEventListener('touchstart', (e) => this.handleTouchStart(e, item));
              handle.addEventListener('touchmove', (e) => this.handleTouchMove(e));
              handle.addEventListener('touchend', (e) => this.handleTouchEnd(e));
          }

          // Desktop Events
          item.addEventListener('dragstart', (e) => this.handleDragStart(e, item));
          item.addEventListener('dragend', (e) => this.handleDragEnd(e, item));
      });

      // Eventi di drag per il container
      this.element.addEventListener('dragover', (e) => this.handleDragOver(e));
      this.element.addEventListener('dragenter', (e) => e.preventDefault());
  }

  handleTouchStart(e, item) {
      e.preventDefault();
      this.touchStartTime = Date.now();
      this.dragItem = item;
      const touch = e.touches[0];
      this.startY = touch.clientY;
      this.initialY = this.dragItem.offsetTop;
  }

  handleTouchMove(e) {
      if (!this.dragItem) return;
      e.preventDefault();

      const touch = e.touches[0];
      this.currentY = touch.clientY;
      const deltaY = this.currentY - this.startY;

      // Se il touch è attivo da più di 150ms, inizia il drag
      if (Date.now() - this.touchStartTime > 150) {
          this.dragItem.classList.add(this.options.dragClass);
          this.element.classList.add('is-dragging');

          // Sposta l'elemento
          this.dragItem.style.transform = `translateY(${deltaY}px)`;

          // Trova la nuova posizione
          const siblings = [...this.element.querySelectorAll(`${this.options.draggable}:not(.${this.options.dragClass})`)];
          const nextSibling = siblings.find(sibling => {
              const rect = sibling.getBoundingClientRect();
              const middle = rect.top + rect.height / 2;
              return touch.clientY <= middle;
          });

          if (nextSibling) {
              this.element.insertBefore(this.dragItem, nextSibling);
          } else {
              this.element.appendChild(this.dragItem);
          }
      }
  }

  handleTouchEnd(e) {
      if (!this.dragItem) return;
      e.preventDefault();

      this.dragItem.classList.remove(this.options.dragClass);
      this.element.classList.remove('is-dragging');
      this.dragItem.style.transform = '';

      // Callback
      if (this.options.onEnd) {
          const newIndex = Array.from(this.element.children).indexOf(this.dragItem);
          this.options.onEnd({
              item: this.dragItem,
              from: this.startIndex,
              to: newIndex
          });
      }

      this.dragItem = null;
      this.startY = 0;
      this.currentY = 0;
      this.initialY = 0;
      this.touchStartTime = 0;
  }

  handleDragStart(e, item) {
      e.dataTransfer.effectAllowed = 'move';
      this.startIndex = Array.from(this.element.children).indexOf(item);

      setTimeout(() => {
          item.classList.add(this.options.dragClass);
          this.element.classList.add('is-dragging');
      }, 0);

      if (this.options.onStart) {
          this.options.onStart({
              item: item,
              index: this.startIndex
          });
      }
  }

  handleDragOver(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const draggingItem = this.element.querySelector('.' + this.options.dragClass);
      if (!draggingItem) return;

      const siblings = [...this.element.querySelectorAll(`${this.options.draggable}:not(.${this.options.dragClass})`)];
      
      const nextSibling = siblings.find(sibling => {
          const rect = sibling.getBoundingClientRect();
          const middle = rect.top + rect.height / 2;
          return e.clientY <= middle;
      });

      if (nextSibling) {
          this.element.insertBefore(draggingItem, nextSibling);
      } else {
          this.element.appendChild(draggingItem);
      }
  }

  handleDragEnd(e, item) {
      item.classList.remove(this.options.dragClass);
      this.element.classList.remove('is-dragging');

      const newIndex = Array.from(this.element.children).indexOf(item);

      if (this.options.onEnd) {
          this.options.onEnd({
              item: item,
              from: this.startIndex,
              to: newIndex
          });
      }

      item.draggable = false;
  }

  destroy() {
      const items = this.element.querySelectorAll(this.options.draggable);
      items.forEach(item => {
          item.draggable = false;
          item.removeEventListener('dragstart', this.handleDragStart);
          item.removeEventListener('dragend', this.handleDragEnd);
          
          const handle = item.querySelector(this.options.handle);
          if (handle) {
              handle.removeEventListener('mousedown', null);
              handle.removeEventListener('mouseup', null);
              handle.removeEventListener('touchstart', null);
              handle.removeEventListener('touchmove', null);
              handle.removeEventListener('touchend', null);
          }
      });

      this.element.removeEventListener('dragover', this.handleDragOver);
      this.element.removeEventListener('dragenter', null);
  }
}

// Factory function
const $CSD = (function() {
    // Create the main function
    const fn = function(selector) {
        return new _CSD_UTILS(selector);
    };

    // Add ready method
    fn.ready = function(callback) {
        if (document.readyState !== 'loading') {
            callback();
        } else {
            document.addEventListener('DOMContentLoaded', callback);
        }
    };

    return fn;
})();

// Make $CSD and _CSD_UTILS available globally solo in ambiente browser
if (typeof window !== 'undefined') {
  window.$CSD = $CSD;
  window._CSD_UTILS = _CSD_UTILS;
  window.Sortable = Sortable;
}

// Add static methods to $CSD
$CSD.extend = _CSD_UTILS.extend;
$CSD.each = _CSD_UTILS.each;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { $CSD, _CSD_UTILS, Sortable };
} else if (typeof define === 'function' && define.amd) {
    define(function() { return { $CSD, _CSD_UTILS, Sortable }; });
}