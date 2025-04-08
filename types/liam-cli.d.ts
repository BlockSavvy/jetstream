declare module '@liam-hq/cli' {
  export class LiamERD {
    constructor(options: {
      schema: any;
      container: HTMLElement | null;
      theme: 'light' | 'dark';
      config?: {
        showRelationshipLabels?: boolean;
        showColumnTypes?: boolean;
        fitView?: boolean;
        allowPanning?: boolean;
        allowZooming?: boolean;
        [key: string]: any;
      };
    });
    
    init(): Promise<void>;
    destroy(): void;
    setTheme(theme: 'light' | 'dark'): void;
  }
} 