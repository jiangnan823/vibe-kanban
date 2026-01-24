/**
 * Cross-platform path utilities
 *
 * This module provides utilities for handling file paths across different operating systems.
 * Since paths are typically handled server-side, these utilities focus on:
 * 1. Normalizing paths for display and storage
 * 2. Converting between platform formats
 * 3. Validating path formats
 */

export type Platform = 'windows' | 'macos' | 'linux' | 'unknown';

/**
 * Detect the current platform based on user agent
 */
export function detectPlatform(): Platform {
  const ua = navigator.userAgent;

  if (ua.includes('Win')) return 'windows';
  if (ua.includes('Mac')) return 'macos';
  if (ua.includes('Linux')) return 'linux';

  return 'unknown';
}

/**
 * Get the path separator for the current platform
 */
export function getPathSeparator(platform?: Platform): string {
  const detectedPlatform = platform || detectPlatform();
  return detectedPlatform === 'windows' ? '\\' : '/';
}

/**
 * Normalize a path for cross-platform use
 *
 * - Converts backslashes to forward slashes (for internal storage)
 * - Removes duplicate separators
 * - Removes trailing separator (except root)
 *
 * @param path - The path to normalize
 * @param targetPlatform - Optional target platform for output format
 * @returns Normalized path
 */
export function normalizePath(path: string, targetPlatform?: Platform): string {
  if (!path) return '';

  const platform = targetPlatform || detectPlatform();
  const separator = getPathSeparator(platform);

  let normalized = path
    .trim()
    .replace(/\\/g, '/') // Convert to forward slashes first
    .replace(/\/+/g, '/'); // Remove duplicates

  // Remove trailing slash (unless it's root)
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  // Convert to target platform separator
  if (separator === '\\') {
    normalized = normalized.replace(/\//g, '\\');
  }

  return normalized;
}

/**
 * Convert a path from one platform format to another
 *
 * @param path - The path to convert
 * @param fromPlatform - Source platform
 * @param toPlatform - Target platform
 * @returns Converted path
 */
export function convertPath(path: string, fromPlatform: Platform, toPlatform: Platform): string {
  if (!path) return '';

  // First normalize to internal format (forward slashes)
  let normalized = path.replace(/\\/g, '/').replace(/\/+/g, '/');

  // Then convert to target platform
  if (toPlatform === 'windows') {
    // Preserve Windows drive letters
    if (/^[a-zA-Z]:\//.test(normalized)) {
      const [drive, ...rest] = normalized.split('/');
      return `${drive}:\\${rest.join('\\')}`;
    }
    return normalized.replace(/\//g, '\\');
  }

  // Unix-style (macOS/Linux)
  return normalized.replace(/\\/g, '/');
}

/**
 * Check if a path is absolute
 *
 * @param path - The path to check
 * @returns True if path is absolute
 */
export function isAbsolutePath(path: string): string {
  if (!path) return '';

  // Windows: C:\ or C:/
  if (/^[a-zA-Z]:[\\/]/.test(path)) return path;

  // Unix: /path
  if (path.startsWith('/')) return path;

  // Not absolute
  return '';
}

/**
 * Join path segments together
 *
 * @param segments - Path segments to join
 * @param platform - Target platform
 * @returns Joined path
 */
export function joinPaths(...segments: string[]): string {
  const platform = detectPlatform();
  const separator = getPathSeparator(platform);

  const joined = segments
    .filter(Boolean)
    .map(s => s.replace(/[\\/]+/g, '/').replace(/[\\/]$/, ''))
    .join('/');

  // Convert to target platform separator
  return separator === '\\' ? joined.replace(/\//g, '\\') : joined;
}

/**
 * Get the directory name of a path
 *
 * @param path - The path
 * @returns Directory name
 */
export function getDirName(path: string): string {
  if (!path) return '';

  const normalized = path.replace(/\\/g, '/');
  const lastSlash = normalized.lastIndexOf('/');

  if (lastSlash <= 0) return '';

  // Check if it's a Windows path like C:/path
  if (/^[a-zA-Z]:/.test(normalized) && lastSlash <= 2) {
    return normalized.slice(0, lastSlash + 1).replace(/\//g, '\\');
  }

  return normalized.slice(0, lastSlash).replace(/\//g, '\\');
}

/**
 * Get the base name (filename or folder name) of a path
 *
 * @param path - The path
 * @returns Base name
 */
export function getBaseName(path: string): string {
  if (!path) return '';

  const normalized = path.replace(/\\/g, '/');
  const parts = normalized.split('/');

  return parts[parts.length - 1] || '';
}

/**
 * Get the file extension from a path
 *
 * @param path - The path
 * @returns Extension including dot (e.g., '.json') or empty string
 */
export function getExtension(path: string): string {
  if (!path) return '';

  const base = getBaseName(path);
  const lastDot = base.lastIndexOf('.');

  if (lastDot <= 0) return '';

  return base.slice(lastDot);
}

/**
 * Validate a path format
 *
 * @param path - The path to validate
 * @returns True if path format is valid
 */
export function isValidPath(path: string): boolean {
  if (!path || path.length > 260) return false;

  // Check for invalid characters
  const invalidChars = /[<>:"|?*]/;
  if (invalidChars.test(path)) return false;

  // Check for reserved names (Windows)
  const base = getBaseName(path);
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
  if (reservedNames.test(base)) return false;

  return true;
}

/**
 * Format a path for display
 *
 * @param path - The path to format
 * @param maxLength - Maximum length before truncating
 * @returns Formatted path (with ellipsis if truncated)
 */
export function formatPathForDisplay(path: string, maxLength = 50): string {
  if (!path) return '';

  if (path.length <= maxLength) return path;

  // Truncate middle: C:\...\file.txt
  const separator = path.includes('\\') ? '\\' : '/';
  const parts = path.split(separator);

  if (parts.length <= 2) {
    return path.slice(0, maxLength - 3) + '...';
  }

  const first = parts[0];
  const last = parts[parts.length - 1];

  return `${first}${separator}...${separator}${last}`;
}

/**
 * Resolve a relative path against a base path
 *
 * @param basePath - The base path
 * @param relativePath - The relative path
 * @returns Resolved absolute path
 */
export function resolvePath(basePath: string, relativePath: string): string {
  if (!relativePath) return basePath;

  // If relativePath is already absolute, return it
  if (isAbsolutePath(relativePath)) {
    return relativePath;
  }

  return joinPaths(basePath, relativePath);
}

/**
 * Make a path relative to another path
 *
 * @param from - The base path
 * @param to - The target path
 * @returns Relative path
 */
export function makeRelative(from: string, to: string): string {
  if (!from || !to) return '';

  const fromParts = from.replace(/\\/g, '/').split('/');
  const toParts = to.replace(/\\/g, '/').split('/');

  // Find common prefix
  let i = 0;
  while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) {
    i++;
  }

  // Build relative path
  const upCount = fromParts.length - i - 1;
  const downParts = toParts.slice(i);

  const relativeParts = Array(upCount).fill('..').concat(downParts);

  return relativeParts.join('/');
}

/**
 * Path utilities export object
 */
export const pathUtils = {
  detectPlatform,
  getPathSeparator,
  normalizePath,
  convertPath,
  isAbsolutePath,
  joinPaths,
  getDirName,
  getBaseName,
  getExtension,
  isValidPath,
  formatPathForDisplay,
  resolvePath,
  makeRelative,
};
