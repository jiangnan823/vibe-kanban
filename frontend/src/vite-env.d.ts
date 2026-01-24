/// <reference types="vite/client" />

interface Window {
  api?: {
    openPath: (path: string) => void;
    selectFile?: (options: any) => Promise<string | string[]>;
    selectFolder?: (title?: string) => Promise<string>;
  };
}

