import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

// Interceptor para silenciar errores 401 de admin check
axios.interceptors.response.use(
    response => response,
    error => {
        // Silenciar error 401 de la ruta de admin check - devolver respuesta satisfactoria con success: false
        if (error.response?.status === 401 && error.config?.url === '/api/admin/is-admin') {
            return Promise.resolve({
                data: { success: false, isAdmin: false }
            });
        }
        return Promise.reject(error);
    }
);

export const AppContext = createContext()

export const AppProvider = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(false)
    const [isAdminLoading, setIsAdminLoading] = useState(true)
    const [shows, setShows] = useState([])
    const [favoriteMovies, setFavoriteMovies] = useState([])

    const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

    const { user } = useUser()
    const { getToken } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()

    const fetchIsAdmin = async () => {
        setIsAdminLoading(true);
        try {
            // Si no hay usuario, no es admin
            if (!user) {
                setIsAdmin(false);
                return;
            }

            const token = await getToken();
            if (!token) {
                setIsAdmin(false);
                return;
            }

            const { data } = await axios.get('/api/admin/is-admin', { 
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (data.success && data.isAdmin) {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
        } catch (error) {
            // Silently handle errors - user is not admin
            setIsAdmin(false);
        } finally {
            setIsAdminLoading(false);
        }
    }

    const fetchShows = async () => {
        try {
            const { data } = await axios.get('/api/shows/all')
            if (data.success) {
                setShows(data.shows)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error);
        }
    }

    const fetchFavoriteMovies = async () => {
        try {
            const token = await getToken();
            if (!token) {
                return;
            }
            const { data } = await axios.get('/api/user/favorites', { 
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (data.success) {
                setFavoriteMovies(data.movies)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            // Silently handle errors
        }
    }

    useEffect(() => {
        fetchShows()
    }, [])

    useEffect(() => {
        const initializeUser = async () => {
            if (user) {
                await fetchIsAdmin();
                await fetchFavoriteMovies();
            } else {
                setIsAdmin(false);
            }
        };
        
        initializeUser();
    }, [user])

    const value = { 
        axios,
        fetchIsAdmin,
        user, 
        getToken, 
        navigate, 
        isAdmin,
        isAdminLoading, 
        shows, 
        favoriteMovies, 
        fetchFavoriteMovies,
        image_base_url
    }
    
    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export const useAppContext = () => useContext(AppContext)