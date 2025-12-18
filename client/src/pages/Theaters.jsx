import { useEffect, useState } from "react"
import BlurCircle from "../components/BlurCircle"
import { useAppContext } from "../context/AppContext"
import { useLanguage } from "../context/LanguageContext"
import { translations } from "../locales/translation.js"
import { ClockIcon, MapPinIcon, PhoneIcon, StarIcon } from "lucide-react"
import Loading from "../components/Loading"
import toast from "react-hot-toast"

const Theaters = () => {
    const { axios, image_base_url } = useAppContext()
    const { language } = useLanguage()
    const t = translations[language].theaters
    const [theaters, setTheaters] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    const getTheaters = async () => {
        try {
            const { data } = await axios.get('/api/theaters', {
                params: { active: 'true' }
            })
            if (data.success) {
                setTheaters(data.theaters)
            } else {
                toast.error('Error loading theaters')
            }
        } catch (error) {
            console.log(error)
            toast.error('Error loading theaters')
        }
        setIsLoading(false)
    }

    useEffect(() => {
        getTheaters()
    }, [])

    const filteredTheaters = theaters.filter(theater =>
        theater.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        theater.address.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return !isLoading ? (
        <div className="relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]">
            <BlurCircle top="100px" left="100px"/>
            <BlurCircle bottom="0px" right="600px"/>
            
            <div className="max-w-5xl mx-auto">
                <h1 className="text-2xl font-semibold mb-4">{t.title}</h1>
                
                {/* Search Bar */}
                <div className="mb-8">
                    <input
                        type="text"
                        placeholder={t.search}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white"
                    />
                </div>

                {filteredTheaters.length > 0 ? (
                    <div className="space-y-6">
                        {filteredTheaters.map((theater) => (
                            <div
                                key={theater._id}
                                className="flex flex-col md:flex-row bg-primary/8 border border-primary/20 rounded-lg overflow-hidden hover:border-primary/40 transition-all"
                            >
                                <img
                                    src={theater.image}
                                    alt={theater.name}
                                    className="md:w-80 h-64 md:h-auto object-cover"
                                />
                                
                                <div className="flex-1 p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h2 className="text-2xl font-semibold text-white mb-2">
                                                {theater.name}
                                            </h2>
                                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                                                <MapPinIcon className="w-4 h-4" />
                                                <span className="text-sm">{theater.address}</span>
                                            </div>
                                            {theater.phoneNumber && (
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <PhoneIcon className="w-4 h-4" />
                                                    <span className="text-sm">{theater.phoneNumber}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                                                <ClockIcon className="w-4 h-4" />
                                                <span className="text-sm">
                                                    {theater.openingTime} - {theater.closingTime}
                                                </span>
                                            </div>
                                            {theater.totalScreens > 0 && (
                                                <div className="text-sm text-gray-400">
                                                    {theater.totalScreens} {theater.totalScreens > 1 ? t.screens_plural : t.screens}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {theater.description && (
                                        <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                                            {theater.description}
                                        </p>
                                    )}

                                    {theater.amenities && theater.amenities.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {theater.amenities.map((amenity, index) => (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-full border border-primary/30"
                                                >
                                                    {amenity}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-lg">
                            {searchTerm ? t.noResults : t.noTheaters}
                        </p>
                    </div>
                )}
            </div>
        </div>
    ) : (
        <Loading/>
    )
}

export default Theaters