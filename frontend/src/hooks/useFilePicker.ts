import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export type FilePickerMode = 'file' | 'folder' | 'file-folder';

export interface FilePickerOptions {
  mode?: FilePickerMode;
  multiple?: boolean;
  accept?: string; // For file mode, e.g., '.json,.txt'
  title?: string;
}

export interface UseFilePickerReturn {
  pickFile: (options?: FilePickerOptions) => Promise<string | string[] | null>;
  pickFolder: (title?: string) => Promise<string | null>;
  pick: (options?: FilePickerOptions) => Promise<string | string[] | null>;
  isSupported: boolean;
}

/**
 * File picker Hook that supports multiple environments:
 * - Web (using File System Access API or fallback to input element)
 * - Tauri (using window.api.selectFile/selectFolder)
 * - Electron (using window.api.selectFile/selectFolder)
 *
 * @returns File picker functions and support status
 */
export function useFilePicker(): UseFilePickerReturn {
  const { t } = useTranslation('filePicker');

  // Check if native file system access API is supported
  const isFsApiSupported =
    'showOpenFilePicker' in window || 'showDirectoryPicker' in window;

  // Check if Tauri/Electron API is available
  const hasNativeApi = typeof window !== 'undefined' && 'api' in window;

  const isSupported = isFsApiSupported || hasNativeApi;

  /**
   * Universal file/folder picker with fallback support
   */
  const pick = useCallback(
    async (
      options: FilePickerOptions = {}
    ): Promise<string | string[] | null> => {
      const { mode = 'file', multiple = false, accept = '*', title } = options;

      // Try Tauri/Electron API first (if available)
      if (
        hasNativeApi &&
        (window as unknown as { api?: Record<string, unknown> }).api
      ) {
        try {
          const api = (window as unknown as { api: Record<string, unknown> })
            .api;

          if (mode === 'folder') {
            if (typeof api.selectFolder === 'function') {
              return await (
                api.selectFolder as (title?: string) => Promise<string>
              )(title);
            }
          } else if (mode === 'file') {
            if (typeof api.selectFile === 'function') {
              return await (
                api.selectFile as (options: {
                  title?: string;
                  multiple: boolean;
                  accept: string;
                }) => Promise<string | string[]>
              ).call(api, { title, multiple, accept });
            }
          }
        } catch (error) {
          console.error('[useFilePicker] Native API error:', error);
          // Fall through to web APIs
        }
      }

      // Try File System Access API (Web)
      if (isFsApiSupported) {
        try {
          if (mode === 'folder') {
            if ('showDirectoryPicker' in window) {
              const handle = await (
                window as unknown as {
                  showDirectoryPicker: (options: {
                    title?: string;
                    mode: string;
                  }) => Promise<{ name: string }>;
                }
              ).showDirectoryPicker({ title, mode: 'read' });
              return handle.name;
            }
          } else if (mode === 'file') {
            if ('showOpenFilePicker' in window) {
              const handles = await (
                window as unknown as {
                  showOpenFilePicker: (options: {
                    title?: string;
                    multiple: boolean;
                    types?: Array<{
                      description: string;
                      accept: Record<string, string>;
                    }>;
                  }) => Promise<Array<{ name: string }>>;
                }
              ).showOpenFilePicker({
                title,
                multiple,
                types:
                  accept !== '*'
                    ? [
                        {
                          description: 'Files',
                          accept: { [accept.split(',')[0]]: accept },
                        },
                      ]
                    : undefined,
              });
              return multiple ? handles.map((h) => h.name) : handles[0].name;
            }
          }
        } catch (error: unknown) {
          // User cancelled or API not supported
          const err = error as { name?: string };
          if (err.name === 'AbortError') {
            return null;
          }
          console.error('[useFilePicker] File System Access API error:', error);
          // Fall through to input element fallback
        }
      }

      // Fallback: use traditional input element (for path selection in server context)
      return new Promise((resolve) => {
        // In a web context without native APIs, we need to prompt user for path
        // This is typically used when the backend needs the path
        const result = prompt(
          title ||
            t(mode === 'folder' ? 'folderPrompt' : 'filePrompt', { accept })
        );

        if (result) {
          // Normalize path for cross-platform
          resolve(normalizePath(result));
        } else {
          resolve(null);
        }
      });
    },
    [t, hasNativeApi, isFsApiSupported]
  );

  /**
   * Pick a single file
   */
  const pickFile = useCallback(
    async (options: FilePickerOptions = {}): Promise<string | null> => {
      const { accept = '*', title } = options;
      return (await pick({ mode: 'file', accept, title })) as string | null;
    },
    [pick]
  );

  /**
   * Pick a folder
   */
  const pickFolder = useCallback(
    async (title?: string): Promise<string | null> => {
      return (await pick({ mode: 'folder', title })) as string | null;
    },
    [pick]
  );

  return {
    pickFile,
    pickFolder,
    pick,
    isSupported,
  };
}

/**
 * Normalize path for cross-platform compatibility
 * - Converts backslashes to forward slashes (Windows -> Unix)
 * - Removes duplicate separators
 * - Trims trailing separators (except for root)
 */
export function normalizePath(path: string): string {
  if (!path) return '';

  return path
    .replace(/\\/g, '/') // Convert backslashes to forward slashes
    .replace(/\/+/g, '/') // Remove duplicate separators
    .replace(/\/$/, ''); // Remove trailing separator
}

/**
 * Get platform-specific path separator
 */
export function getPathSeparator(): string {
  return navigator.userAgent.includes('Win') ? '\\' : '/';
}

/**
 * Check if path is absolute (platform-aware)
 */
export function isAbsolutePath(path: string): boolean {
  if (!path) return false;

  // Windows: C:\ or C:/
  if (/^[a-zA-Z]:[\\/]/.test(path)) return true;

  // Unix: /path
  if (path.startsWith('/')) return true;

  return false;
}

/**
 * Join path segments (platform-aware)
 */
export function joinPaths(...segments: string[]): string {
  const separator = getPathSeparator();
  const normalized = segments
    .filter(Boolean)
    .map((s) => s.replace(/\\/g, '/').replace(/\/$/, ''))
    .join('/');

  // Convert back to platform-specific separator
  return separator === '\\' ? normalized.replace(/\//g, '\\') : normalized;
}

/**
 * Get the directory name of a path
 */
export function getDirName(path: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split('/');
  parts.pop();
  return parts.join('/');
}

/**
 * Get the base name of a path (filename or folder name)
 */
export function getBaseName(path: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split('/');
  return parts[parts.length - 1] || '';
}
