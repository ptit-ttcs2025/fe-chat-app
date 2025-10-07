/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_API_BASE_URL: string;
    readonly VITE_APP_WS_URL: string;
    readonly VITE_APP_ENVIRONMENT: 'development' | 'staging' | 'production';
    // Add more env variables as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

// Declare module for SCSS files
declare module '*.scss' {
    const content: { [className: string]: string };
    export default content;
}

// Declare module for CSS files
declare module '*.css' {
    const content: { [className: string]: string };
    export default content;
}

// Declare module for image files
declare module '*.svg' {
    const content: string;
    export default content;
}

declare module '*.png' {
    const content: string;
    export default content;
}

declare module '*.jpg' {
    const content: string;
    export default content;
}

declare module '*.jpeg' {
    const content: string;
    export default content;
}

declare module '*.gif' {
    const content: string;
    export default content;
}

declare module '*.webp' {
    const content: string;
    export default content;
}

// Declare module for other asset types
declare module '*.woff';
declare module '*.woff2';
declare module '*.eot';
declare module '*.ttf';
declare module '*.otf';
