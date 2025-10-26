import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast'

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

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
                console.log('No user logged in');
                setIsAdmin(false);
                return;
            }

            const token = await getToken();
            if (!token) {
                console.log('No authentication token available');
                setIsAdmin(false);
                return;
            }

            console.log('Checking admin status...');
            const { data } = await axios.get('/api/admin/is-admin', { 
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Admin check response:', data);
            
            if (data.success && data.isAdmin) {
                console.log('User confirmed as admin');
                setIsAdmin(true);
            } else {
                console.log('User is not admin');
                setIsAdmin(false);
            }
        } catch (error) {
            console.log('Admin check error:', error.response?.data || error.message);
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
                console.log('No authentication token available');
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
            console.log('Favorites fetch error:', error.response?.data || error.message);
        }
    }

    useEffect(() => {
        fetchShows()
    }, [])

    useEffect(() => {
        const initializeUser = async () => {
            if (user) {
                console.log('User metadata:', user.privateMetadata);
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