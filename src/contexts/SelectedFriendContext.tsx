import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SelectedFriendContextType {
    selectedFriendId: string | null;
    setSelectedFriendId: (friendId: string | null) => void;
}

const SelectedFriendContext = createContext<SelectedFriendContextType | undefined>(undefined);

export const SelectedFriendProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

    return (
        <SelectedFriendContext.Provider value={{ selectedFriendId, setSelectedFriendId }}>
            {children}
        </SelectedFriendContext.Provider>
    );
};

export const useSelectedFriend = () => {
    const context = useContext(SelectedFriendContext);
    if (context === undefined) {
        throw new Error('useSelectedFriend must be used within a SelectedFriendProvider');
    }
    return context;
};

