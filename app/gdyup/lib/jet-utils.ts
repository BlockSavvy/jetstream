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
  // Extract manufacturer from model if possible
  const manufacturer = extractManufacturer(formData.model);
  
  // Only include fields we know exist in the database
  const jetData: any = {
    tail_number: formData.tailNumber,
    model: formData.model,
    capacity: parseInt(formData.capacity as string) || 0,
    home_base_airport: formData.baseAirport || null,
    manufacturer: formData.manufacturer || manufacturer || 'Unknown', // Use provided manufacturer or extract it
    status: 'available' // Set a default status
  };
  
  // Log the data we're sending
  console.log('Preparing jet data for submission:', jetData);
  
  return jetData;
}

/**
 * Extracts manufacturer from the model string
 * Common format is "Manufacturer Model" (e.g., "Gulfstream G650")
 */
function extractManufacturer(modelString: string): string | null {
  if (!modelString) return null;
  
  // Common private jet manufacturers
  const manufacturers = [
    'Gulfstream', 'Bombardier', 'Cessna', 'Dassault', 'Embraer', 
    'Hawker', 'Learjet', 'Pilatus', 'Beechcraft', 'Airbus', 'Boeing'
  ];
  
  // Check if model starts with any of the known manufacturers
  for (const manufacturer of manufacturers) {
    if (modelString.toLowerCase().startsWith(manufacturer.toLowerCase())) {
      return manufacturer;
    }
  }
  
  // Try to extract the first word as manufacturer
  const firstWord = modelString.split(' ')[0];
  if (firstWord && firstWord.length > 2) {
    return firstWord;
  }
  
  return 'Unknown';
}

/**
 * Logs form debug info to help troubleshoot form submission issues
 */
export function logFormDebugInfo(form: any) {
  console.log('=== FORM DEBUG INFO ===');
  console.log('Form values:', form.getValues());
  console.log('Form state:', {
    isDirty: form.formState.isDirty,
    isSubmitting: form.formState.isSubmitting,
    isSubmitted: form.formState.isSubmitted,
    isValid: form.formState.isValid,
    isValidating: form.formState.isValidating,
    submitCount: form.formState.submitCount,
  });
  console.log('Form errors:', form.formState.errors);
  
  // Test if event handlers are attaching properly
  console.log('Form element:', document.querySelector('form'));
  console.log('Submit buttons:', document.querySelectorAll('button[type="submit"]'));
  console.log('=== END DEBUG INFO ===');
} 