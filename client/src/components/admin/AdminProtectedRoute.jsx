import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { toast } from 'react-hot-toast';
import { SignIn } from '@clerk/clerk-react';

const AdminProtectedRoute = ({ children }) => {
    const { isAdmin, isAdminLoading, user } = useAppContext();
    const [showError, setShowError] = useState(false);
    
    useEffect(() => {
        console.log('AdminProtectedRoute - isAdmin:', isAdmin, 'user:', !!user, 'loading:', isAdminLoading);
        
        if (!isAdminLoading && user && !isAdmin) {
            setShowError(true);
        }
    }, [user, isAdmin, isAdminLoading]);

    useEffect(() => {
        if (showError) {
            toast.error('You are not authorized to access admin dashboard');
        }
    }, [showError]);

    // Mientras se verifica el estado de admin, mostrar loading
    if (isAdminLoading) {
        return (
            <div className='min-h-screen flex justify-center items-center'>
                <div>Verifying access...</div>
            </div>
        );
    }

    // Si no hay usuario, mostrar pantalla de login
    if (!user) {
        return (
            <div className='min-h-screen flex justify-center items-center'>
                <SignIn fallbackRedirectUrl={'/admin'}/>
            </div>
        );
    }

    // Si hay usuario pero no es admin, redirigir
    if (!isAdmin) {
        console.log('User is not admin, redirecting...');
        return <Navigate to="/" replace />;
    }

    // Si es admin, mostrar el contenido
    console.log('User is admin, showing content');
    return children;
};

export default AdminProtectedRoute;