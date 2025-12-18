import { useEffect, useState } from 'react'
import BlurCircle from '../components/BlurCircle'
import { useAppContext } from '../context/AppContext'
import { StarIcon } from 'lucide-react'
import { kConverter } from '../lib/kConverter'
import Loading from '../components/Loading'
import toast from 'react-hot-toast'

const Releases = () => {
    const { axios, image_base_url } = useAppContext()
    const [upcomingMovies, setUpcomingMovies] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchUpcomingMovies = async () => {
        try {
            const { data } = await axios.get('/api/shows/upcoming')
            if (data.success) {
                setUpcomingMovies(data.movies)
            } else {
                toast.error(data.message || 'Error loading upcoming movies')
            }
        } catch (error) {
            console.error('Error fetching upcoming movies:', error)
            toast.error('Failed to load upcoming movies')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUpcomingMovies()
    }, [])

    if (isLoading) {
        return <Loading />
    }

    return upcomingMovies.length > 0 ? (
        <div className='relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]'>
            <BlurCircle top='150px' left='0px'/>
            <BlurCircle bottom='50px' right='50px'/>
            <h1 className='text-lg font-medium my-4'>Coming Soon</h1>
            <p className='text-sm text-gray-400 mb-8'>Discover upcoming movies that will be available soon</p>
            
            <div className='flex flex-wrap max-sm:justify-center gap-8'>
                {upcomingMovies.map((movie) => (
                    <div 
                        key={movie.id}
                        className='flex flex-col justify-between p-3 bg-gray-800 rounded-2xl hover:-translate-y-1 transition duration-300 w-56'
                    >
                        <img 
                            src={image_base_url + movie.backdrop_path} 
                            alt={movie.title}
                            className="rounded-lg h-52 w-full object-cover object-bottom-right cursor-pointer" 
                        />

                        <p className="font-semibold mt-2 truncate">{movie.title}</p>

                        <p className="text-sm text-gray-400 mt-2">
                            {new Date(movie.release_date).getFullYear()}
                        </p>

                        <div className="flex items-center justify-between mt-4 pb-3">
                            <div className="flex flex-col gap-1">
                                <p className="text-xs text-gray-400">Release Date</p>
                                <p className="text-sm font-medium">
                                    {new Date(movie.release_date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                            <p className="flex items-center gap-1 text-sm text-gray-400 mt-1 pr-1">
                                <StarIcon className="w-4 h-4 text-primary fill-primary"/> 
                                {movie.vote_average.toFixed(1)}
                            </p>
                        </div>

                        {movie.vote_count && (
                            <p className="text-xs text-gray-500 text-center pb-2">
                                {kConverter(movie.vote_count)} votes
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    ) : (
        <div className='flex flex-col items-center justify-center h-screen'>
            <h1 className='text-3xl font-bold text-center'>No upcoming releases available</h1>
            <p className='text-gray-400 mt-4'>Check back soon for new movie releases!</p>
        </div>
    )
}

export default Releases