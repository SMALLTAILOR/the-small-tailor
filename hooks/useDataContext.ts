
import { useContext } from 'react';
import { DataContext } from '../context/DataContext';

// This is a re-export for convenience. The main logic is in DataContext.tsx
// However, the instructions want this file.
export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
