/**
 * Constants for emotion values.
 */
export const EMOTIONS = {
  PLEASANT: 'pleasant',
  NEUTRAL: 'neutral',
  NEGATIVE: 'negative',
} as const;

/**
 * Array of valid emotion values.
 */
export const VALID_EMOTIONS = Object.values(EMOTIONS) as readonly string[];
