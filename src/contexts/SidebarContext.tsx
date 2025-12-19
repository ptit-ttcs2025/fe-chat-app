import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  setIsCollapsed: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

interface SidebarProviderProps {
  children: ReactNode;
  storageKey?: string;
  shortcutKey?: string;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({
  children,
  storageKey = 'chat_sidebar_collapsed',
  shortcutKey = 'b'
}) => {
  // Load saved state from localStorage
  const getSavedState = () => {
    const saved = localStorage.getItem(storageKey);
    return saved === 'true';
  };

  const [isCollapsed, setIsCollapsed] = useState(getSavedState);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, isCollapsed.toString());
  }, [isCollapsed, storageKey]);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  // Keyboard shortcut (Ctrl+B or Cmd+B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === shortcutKey) {
        e.preventDefault();
        toggleCollapse();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcutKey, toggleCollapse]);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleCollapse, setIsCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebarContext = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within SidebarProvider');
  }
  return context;
};

