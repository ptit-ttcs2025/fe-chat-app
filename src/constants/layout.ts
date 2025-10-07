export const LAYOUT_TYPES = {
    VERTICAL: 'vertical',
    HORIZONTAL: 'horizontal',
    TWOCOLUMN: 'twocolumn',
} as const;

export const LAYOUT_WIDTH_TYPES = {
    FLUID: 'fluid',
    BOXED: 'boxed',
} as const;

export const LAYOUT_POSITION_TYPES = {
    FIXED: 'fixed',
    SCROLLABLE: 'scrollable',
} as const;

export const LAYOUT_SIDEBAR_SIZE_TYPES = {
    DEFAULT: 'lg',
    COMPACT: 'md',
    SMALL: 'sm',
} as const;

export const LAYOUT_THEME = {
    LIGHT: 'light',
    DARK: 'dark',
} as const;

export const LAYOUT_THEME_COLOR = {
    DEFAULT: 'default',
    BLUE: 'blue',
    RED: 'red',
    GREEN: 'green',
    PURPLE: 'purple',
} as const;

export const LAYOUT_TOPBAR_THEME_TYPES = {
    LIGHT: 'light',
    DARK: 'dark',
} as const;

export const LEFT_SIDEBAR_IMAGE_TYPES = {
    NONE: 'none',
    IMG1: 'img1',
    IMG2: 'img2',
} as const;

export const LEFT_SIDEBAR_VIEW_TYPES = {
    DEFAULT: 'default',
    COMPACT: 'compact',
} as const;

export const PERLOADER_TYPES = {
    ENABLE: 'enable',
    DISABLE: 'disable',
} as const;

export const SIDEBAR_VISIBILITY_TYPES = {
    SHOW: 'show',
    HIDE: 'hide',
} as const;

// Types
export type LayoutType = typeof LAYOUT_TYPES[keyof typeof LAYOUT_TYPES];
export type LayoutWidthType = typeof LAYOUT_WIDTH_TYPES[keyof typeof LAYOUT_WIDTH_TYPES];
export type LayoutPositionType = typeof LAYOUT_POSITION_TYPES[keyof typeof LAYOUT_POSITION_TYPES];
export type LayoutSidebarSizeType = typeof LAYOUT_SIDEBAR_SIZE_TYPES[keyof typeof LAYOUT_SIDEBAR_SIZE_TYPES];
