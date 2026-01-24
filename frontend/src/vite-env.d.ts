/// <reference types="vite/client" />

interface Window {
  api?: {
    openPath: (path: string) => void;
    selectFile?: (options: {
      title?: string;
      multiple?: boolean;
      accept?: string;
    }) => Promise<string | string[]>;
    selectFolder?: (title?: string) => Promise<string>;
  };
}
