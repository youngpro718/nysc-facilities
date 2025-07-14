import { ReportCallback } from '../types';

export class ReportError extends Error {
  constructor(
    message: string,
    public type: 'database' | 'validation' | 'generation' | 'timeout' | 'unknown' = 'unknown',
    public details?: any
  ) {
    super(message);
    this.name = 'ReportError';
  }
}

export function handleReportError(
  error: unknown,
  progressCallback: ReportCallback,
  context: string
): never {
  console.error(`Report error in ${context}:`, error);
  
  let errorMessage = 'An unexpected error occurred';
  let errorType: ReportError['type'] = 'unknown';
  
  if (error instanceof ReportError) {
    errorMessage = error.message;
    errorType = error.type;
  } else if (error instanceof Error) {
    errorMessage = error.message;
    
    // Categorize common error types
    if (error.message.includes('timeout') || error.message.includes('timed out')) {
      errorType = 'timeout';
    } else if (error.message.includes('does not exist') || error.message.includes('column')) {
      errorType = 'database';
    } else if (error.message.includes('invalid') || error.message.includes('validation')) {
      errorType = 'validation';
    } else if (error.message.includes('PDF') || error.message.includes('generation')) {
      errorType = 'generation';
    }
  }
  
  // Provide user-friendly error messages
  const friendlyMessages = {
    database: 'Database connection or query failed. Please try again later.',
    validation: 'Invalid data format detected. Please check your input.',
    generation: 'Report generation failed. Please try again or contact support.',
    timeout: 'Report generation timed out. Please try a smaller date range or contact support.',
    unknown: 'An unexpected error occurred. Please try again or contact support.'
  };
  
  progressCallback({
    status: 'error',
    progress: 0,
    message: friendlyMessages[errorType] || errorMessage
  });
  
  throw new ReportError(errorMessage, errorType, error);
}

export function validateReportData<T>(
  data: T[] | null | undefined,
  dataType: string,
  progressCallback: ReportCallback
): T[] {
  if (!data) {
    console.log(`No ${dataType} data found, returning empty array`);
    progressCallback({
      status: 'generating',
      progress: 50,
      message: `No ${dataType} data found - generating empty report`
    });
    return [];
  }
  
  if (!Array.isArray(data)) {
    throw new ReportError(
      `Invalid ${dataType} data format: expected array`,
      'validation',
      { data, dataType }
    );
  }
  
  console.log(`Validated ${data.length} ${dataType} records`);
  return data;
}

export function createRetryableQuery<T>(
  queryFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await queryFn();
        resolve(result);
        return;
      } catch (error) {
        console.log(`Query attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          reject(error);
          return;
        }
        
        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  });
}