// Type definitions for csdsolutions-csdjs
// Project: https://github.com/yourusername/csdsolutions-csdjs

declare module 'csdsolutions-csdjs' {
  // Core library
  export const $CSD: any;
  export function initCSDComponents(): void;
  
  // Form components
  export function initializeNumber(element: any): void;
  export function initializeCustomSelect(element: any): void;
  export function initializeDatepickers(): void;
  export function initializeMask(element: any): void;
  export function initializeCheckbox(element: any): void;
  export function initializeRadio(element: any): void;
  export function initializeOtp(element: any): void;
  export function initializeSearchbar(element: any): void;
  export function initializeToggle(element: any): void;
  export function initializeEditor(element: any): void;
  export function initializePassword(element: any): void;
  export function initializeRange(element: any): void;
  export function initializeSplitButton(element: any): void;
  export function initializeTextArea(element: any): void;
  export function initializeToggleButton(element: any): void;
  export function initializeBtn(element: any): void;
  
  // UI components
  export function initializeFab(element: any): void;
  export function initializeNavigation(element: any): void;
  export function initializeModal(element: any): void;
  export function initializeToast(element?: any): any;
  export function initializeReorder(element: any): void;
  export function initializeList(element: any): void;
  export function initializeSplitter(element: any): void;
  export function initializePopover(element: any): void;
  export function initializeDropdown(element: any): void;
  export function initializeStepper(element: any): void;
  export function initializeTab(element: any): void;
  export function initializeAccordion(element: any): void;
  export function initializeSegment(element: any): void;
  export function initializeMenu(element: any): void;
  export function initializeSidebar(): void;
  export function initializeToolbar(element: any): void;
  export function initializeConfirmDialog(element: any): void;
  export function initializeSubmenu(element: any): void;
  
  // Helper methods
  export function showAccordion(id: string): void;
  
  // Bundle object
  export const csdBundle: any;
  
  // Default export
  export default $CSD;
}
