// Core components
import './csd-lib.js';
import './csd-utility.js';

// Form components
import './component/csd-number.js';
import './component/csd-select.js';
import './component/csd-datepicker.js';
import './component/csd-toggle-button.js';
import './component/csd-mask.js';
import './component/csd-checkbox.js';
import './component/csd-radio.js';
import './component/csd-otp.js';
import './component/csd-searchbar.js';
import './component/csd-toggle.js';
import './component/csd-editor.js';
import './component/csd-password.js';
import './component/csd-range.js';
import './component/csd-split-button.js';
import './component/csd-textarea.js';

// UI components
import './component/csd-fab.js';
import './component/csd-split-button.js';
import './component/csd-navigation.js';
import './component/csd-editor.js';
import './component/csd-modal.js';
import './component/csd-toast.js';
import './component/csd-reorder.js';
import './component/csd-list.js';
import './component/csd-splitter.js';
import './component/csd-popover.js';

import './component/csd-dropdown.js';
import './component/csd-stepper.js';
import './component/csd-tab.js';
import './component/csd-accordion.js';
import './component/csd-segment.js';
import './component/csd-menu.js';
import './component/csd-sidebar.js';
import './component/csd-toolbar.js';
import './component/csd-submenu.js';


// Import the core library ($CSD)
import { $CSD } from './csd-lib.js';

// Import all components functions
import * as components from './component/index.js';

// Initialize all components
import initCSDComponents from './csd-init.js';

// Create a bundle object with all exports
const csdBundle = {
  $CSD,
  initCSDComponents,
  ...components
};

// Make all functions available globally, ma solo in ambiente browser
if (typeof window !== 'undefined') {
  window.$CSD = $CSD;
  window.initCSDComponents = initCSDComponents;
  
  // Add all component functions to window
  Object.keys(components).forEach(key => {
    window[key] = components[key];
  });

  // Also add the full bundle as a single object
  window.csdBundle = csdBundle;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = csdBundle;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return csdBundle; });
}

// ES6 exports
export default $CSD;
export { initCSDComponents };
export * from './component/index.js';