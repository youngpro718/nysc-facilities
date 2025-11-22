import { ExtractedPart } from '@/components/court-operations/PDFExtractionPreview';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate extracted part data before importing
 */
export function validateExtractedPart(part: ExtractedPart, buildingCode: '100' | '111'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!part.judge || part.judge.trim() === '') {
    errors.push('Judge name is required');
  }

  if (!part.part || part.part.trim() === '') {
    errors.push('Part number is required');
  }

  if (part.mapping_status === 'not_found') {
    errors.push('Courtroom mapping is required - please select a courtroom manually');
  }

  // Confidence warnings
  if (part.confidence < 0.85) {
    warnings.push(`Low extraction confidence (${Math.round(part.confidence * 100)}%) - please review data carefully`);
  }

  // Calendar day validation
  const validCalendarDays = ['Cal Mon', 'Cal Tues', 'Cal Wed', 'Cal Thurs', 'Cal Fri'];
  if (part.calendar_day && !validCalendarDays.some(day => part.calendar_day?.includes(day))) {
    warnings.push(`Unusual calendar day format: "${part.calendar_day}"`);
  }

  // Building validation (if room is mapped)
  if (part.courtroom_id && part.mapping_status === 'found') {
    // This would be validated against actual building data in real implementation
    // For now, just check if building code is valid
    if (buildingCode !== '100' && buildingCode !== '111') {
      errors.push('Invalid building code');
    }
  }

  // Case data validation
  if (part.cases && part.cases.length > 0) {
    const casesWithMissingDefendants = part.cases.filter(c => !c.defendant || c.defendant.trim() === '');
    if (casesWithMissingDefendants.length > 0) {
      warnings.push(`${casesWithMissingDefendants.length} case(s) missing defendant information`);
    }

    const casesWithMissingCharges = part.cases.filter(c => !c.top_charge || c.top_charge.trim() === '');
    if (casesWithMissingCharges.length > 0) {
      warnings.push(`${casesWithMissingCharges.length} case(s) missing charge information`);
    }
  }

  // Date format validation for out dates
  if (part.out_dates && part.out_dates.length > 0) {
    const invalidDates = part.out_dates.filter(date => {
      // Simple date format check
      return !date.match(/\d{1,2}[-\/]\d{1,2}/) && !date.toLowerCase().includes('out');
    });

    if (invalidDates.length > 0) {
      warnings.push(`Some out dates may have unusual format: ${invalidDates.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate multiple parts at once
 */
export function validateBatch(
  parts: ExtractedPart[],
  buildingCode: '100' | '111'
): Map<number, ValidationResult> {
  const results = new Map<number, ValidationResult>();

  parts.forEach((part, index) => {
    results.set(index, validateExtractedPart(part, buildingCode));
  });

  return results;
}

/**
 * Get summary of validation results
 */
export function getValidationSummary(results: Map<number, ValidationResult>) {
  let totalErrors = 0;
  let totalWarnings = 0;
  let validCount = 0;

  results.forEach(result => {
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;
    if (result.isValid) validCount++;
  });

  return {
    totalParts: results.size,
    validParts: validCount,
    invalidParts: results.size - validCount,
    totalErrors,
    totalWarnings,
    hasErrors: totalErrors > 0,
    hasWarnings: totalWarnings > 0,
  };
}

/**
 * Convert validation result to user-friendly message
 */
export function formatValidationMessage(result: ValidationResult): string {
  if (result.isValid && result.warnings.length === 0) {
    return 'All validation checks passed';
  }

  const messages: string[] = [];

  if (result.errors.length > 0) {
    messages.push(`Errors: ${result.errors.join('; ')}`);
  }

  if (result.warnings.length > 0) {
    messages.push(`Warnings: ${result.warnings.join('; ')}`);
  }

  return messages.join(' | ');
}
