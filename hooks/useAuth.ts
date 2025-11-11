
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// This is a re-export for convenience. The main logic is in AuthContext.tsx
// However, the instructions want this file.
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
