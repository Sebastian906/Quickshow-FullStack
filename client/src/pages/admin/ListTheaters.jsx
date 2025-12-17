import { useEffect, useState } from "react"
import Loading from "../../components/Loading"
import Title from "../../components/admin/Title"
import { useAppContext } from "../../context/AppContext"
import toast from "react-hot-toast"
import { CheckCircleIcon, XCircleIcon } from "lucide-react"

const ListTheaters = () => {
    const { axios, getToken, user } = useAppContext()
    const [theaters, setTheaters] = useState([])
    const [loading, setLoading] = useState(true)

    const getAllTheaters = async () => {
        try {
            const { data } = await axios.get('/api/theaters', {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })
            if (data.success) {
                setTheaters(data.theaters)
            } else {
                toast.error(data.message || 'Failed to load theaters')
            }
        } catch (error) {
            console.error('Error loading theaters:', error)
            toast.error('Failed to load theaters')
        }
        setLoading(false)
    }

    const handleToggleActive = async (theaterId, currentStatus) => {
        try {
            const { data } = await axios.put(
                `/api/theaters/${theaterId}/toggle-active`,
                {},
                {
                    headers: { Authorization: `Bearer ${await getToken()}` }
                }
            )
            if (data.success) {
                toast.success(data.message)
                getAllTheaters()
            } else {
                toast.error(data.message || 'Failed to update theater status')
            }
        } catch (error) {
            console.error('Error toggling theater status:', error)
            toast.error('Failed to update theater status')
        }
    }

    const handleDelete = async (theaterId) => {
        if (!confirm('Are you sure you want to delete this theater? This action cannot be undone.')) {
            return
        }

        try {
            const { data } = await axios.delete(`/api/theaters/${theaterId}`, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })
            if (data.success) {
                toast.success('Theater deleted successfully')
                getAllTheaters()
            } else {
                toast.error(data.message || 'Failed to delete theater')
            }
        } catch (error) {
            console.error('Error deleting theater:', error)
            toast.error('Failed to delete theater')
        }
    }

    useEffect(() => {
        if (user) {
            getAllTheaters()
        }
    }, [user])

    return !loading ? (
        <>
            <Title text1="List" text2="Theaters"/>
            
            {theaters.length > 0 ? (
                <div className="max-w-6xl mt-6 overflow-x-auto">
                    <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
                        <thead>
                            <tr className="bg-primary/20 text-left text-white">
                                <th className="p-2 font-medium pl-5">Theater Name</th>
                                <th className="p-2 font-medium">Address</th>
                                <th className="p-2 font-medium">Opening Hours</th>
                                <th className="p-2 font-medium">Screens</th>
                                <th className="p-2 font-medium">Phone</th>
                                <th className="p-2 font-medium">Status</th>
                                <th className="p-2 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-light">
                            {theaters.map((theater, index) => (
                                <tr 
                                    key={theater._id}
                                    className="border-b border-primary/20 bg-primary/5 even:bg-primary/10"
                                >
                                    <td className="p-2 min-w-45 pl-5">
                                        <div className="flex items-center gap-3">
                                            <img 
                                                src={theater.image} 
                                                alt={theater.name}
                                                className="h-12 w-12 rounded object-cover"
                                            />
                                            <div>
                                                <p className="font-medium">{theater.name}</p>
                                                {theater.amenities && theater.amenities.length > 0 && (
                                                    <p className="text-xs text-gray-400">
                                                        {theater.amenities.slice(0, 2).join(', ')}
                                                        {theater.amenities.length > 2 && '...'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-2 max-w-60">
                                        <p className="truncate">{theater.address}</p>
                                    </td>
                                    <td className="p-2">
                                        {theater.openingTime} - {theater.closingTime}
                                    </td>
                                    <td className="p-2 text-center">
                                        {theater.totalScreens || 0}
                                    </td>
                                    <td className="p-2">
                                        {theater.phoneNumber || 'N/A'}
                                    </td>
                                    <td className="p-2">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                            theater.isActive 
                                                ? 'bg-green-500/20 text-green-400' 
                                                : 'bg-red-500/20 text-red-400'
                                        }`}>
                                            {theater.isActive ? (
                                                <>
                                                    <CheckCircleIcon className="w-3 h-3" />
                                                    Active
                                                </>
                                            ) : (
                                                <>
                                                    <XCircleIcon className="w-3 h-3" />
                                                    Inactive
                                                </>
                                            )}
                                        </span>
                                    </td>
                                    <td className="p-2">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleToggleActive(theater._id, theater.isActive)}
                                                className={`px-3 py-1 text-xs rounded transition ${
                                                    theater.isActive
                                                        ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                }`}
                                            >
                                                {theater.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(theater._id)}
                                                className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-20">
                    <p className="text-gray-400 text-lg">No theaters found</p>
                </div>
            )}
        </>
    ) : <Loading/>
}

export default ListTheaters