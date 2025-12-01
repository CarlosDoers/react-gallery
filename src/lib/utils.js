/**
 * Utility function to merge class names conditionally
 * Similar to clsx/classnames functionality
 */
export function cn(...inputs) {
  return inputs
    .filter(Boolean)
    .join(' ')
    .trim();
}
