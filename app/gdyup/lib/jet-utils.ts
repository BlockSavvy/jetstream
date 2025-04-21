/**
 * Utility functions for jet validation and submission
 */

/**
 * Validates jet data before submission
 * 
 * @param jetData The jet data to validate
 * @returns An object containing validation result and any error messages
 */
export function validateJetData(jetData: any): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  // Check required fields
  if (!jetData.tail_number) {
    errors.tail_number = 'Tail number is required';
  }
  
  if (!jetData.model) {
    errors.model = 'Aircraft model is required';
  }
  
  if (!jetData.capacity) {
    errors.capacity = 'Capacity is required';
  } else if (isNaN(parseInt(jetData.capacity))) {
    errors.capacity = 'Capacity must be a number';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Prepares jet data for submission to the API
 * 
 * @param formData The raw form data
 * @returns Formatted jet data ready for API submission
 */
export function prepareJetDataForSubmission(formData: any) {
  return {
    tail_number: formData.tailNumber,
    model: formData.model,
    capacity: parseInt(formData.capacity as string) || 0,
    operator: formData.operator || null,
    base_airport: formData.baseAirport || null,
  };
}

/**
 * Logs form debugging information
 * 
 * @param form The form object from react-hook-form
 */
export function logFormDebugInfo(form: any) {
  console.group('Form Debug Info');
  console.log('Form values:', form.getValues());
  console.log('Form state:', form.formState);
  console.log('Form errors:', form.formState.errors);
  console.groupEnd();
} 