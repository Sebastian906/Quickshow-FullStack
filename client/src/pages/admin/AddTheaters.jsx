import { useState } from "react"
import Title from "../../components/admin/Title"
import { useAppContext } from "../../context/AppContext"
import toast from "react-hot-toast"
import { PlusIcon, XIcon } from "lucide-react"

const AddTheaters = () => {
    const { axios, getToken } = useAppContext()
    
    const [formData, setFormData] = useState({
        name: '',
        image: '',
        address: '',
        openingTime: '',
        closingTime: '',
        phoneNumber: '',
        description: '',
        totalScreens: '',
        amenities: []
    })
    
    const [currentAmenity, setCurrentAmenity] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleAddAmenity = () => {
        if (!currentAmenity.trim()) {
            return toast.error('Please enter an amenity')
        }
        if (formData.amenities.includes(currentAmenity.trim())) {
            return toast.error('Amenity already added')
        }
        setFormData(prev => ({
            ...prev,
            amenities: [...prev.amenities, currentAmenity.trim()]
        }))
        setCurrentAmenity('')
    }

    const handleRemoveAmenity = (amenity) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.filter(a => a !== amenity)
        }))
    }

    const validateForm = () => {
        const { name, image, address, openingTime, closingTime, phoneNumber, description, totalScreens } = formData
        
        if (!name.trim()) {
            toast.error('Theater name is required')
            return false
        }
        if (!image.trim()) {
            toast.error('Theater image URL is required')
            return false
        }
        if (!address.trim()) {
            toast.error('Theater address is required')
            return false
        }
        if (!openingTime.trim()) {
            toast.error('Opening time is required')
            return false
        }
        if (!closingTime.trim()) {
            toast.error('Closing time is required')
            return false
        }
        if (!phoneNumber.trim()) {
            toast.error('Phone number is required')
            return false
        }
        if (!description.trim()) {
            toast.error('Description is required')
            return false
        }
        if (!totalScreens || totalScreens <= 0) {
            toast.error('Total screens must be greater than 0')
            return false
        }
        
        // Validate time format (HH:MM AM/PM)
        const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i
        if (!timeRegex.test(openingTime)) {
            toast.error('Opening time must be in format HH:MM AM/PM (e.g., 9:00 AM)')
            return false
        }
        if (!timeRegex.test(closingTime)) {
            toast.error('Closing time must be in format HH:MM AM/PM (e.g., 11:00 PM)')
            return false
        }

        return true
    }

    const handleSubmit = async () => {
        if (!validateForm()) return

        try {
            setIsSubmitting(true)
            
            const payload = {
                name: formData.name.trim(),
                image: formData.image.trim(),
                address: formData.address.trim(),
                openingTime: formData.openingTime.trim(),
                closingTime: formData.closingTime.trim(),
                phoneNumber: formData.phoneNumber.trim(),
                description: formData.description.trim(),
                totalScreens: parseInt(formData.totalScreens),
                amenities: formData.amenities
            }

            const { data } = await axios.post('/api/theaters', payload, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })

            if (data.success) {
                toast.success(data.message || 'Theater added successfully')
                // Reset form
                setFormData({
                    name: '',
                    image: '',
                    address: '',
                    openingTime: '',
                    closingTime: '',
                    phoneNumber: '',
                    description: '',
                    totalScreens: '',
                    amenities: []
                })
            } else {
                toast.error(data.message || 'Failed to add theater')
            }
        } catch (error) {
            console.error('Error adding theater:', error)
            toast.error(error.response?.data?.message || 'An error occurred. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <Title text1="Add" text2="Theater"/>
            
            <div className="max-w-3xl mt-8 space-y-6">
                {/* Theater Name */}
                <div>
                    <label className="block text-sm font-medium mb-2">Theater Name *</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter theater name"
                        className="w-full px-4 py-2 border border-gray-600 rounded-md outline-none focus:border-primary"
                    />
                </div>

                {/* Theater Image URL */}
                <div>
                    <label className="block text-sm font-medium mb-2">Theater Image URL *</label>
                    <input
                        type="text"
                        name="image"
                        value={formData.image}
                        onChange={handleInputChange}
                        placeholder="Enter image URL"
                        className="w-full px-4 py-2 border border-gray-600 rounded-md outline-none focus:border-primary"
                    />
                    {formData.image && (
                        <div className="mt-3">
                            <img 
                                src={formData.image} 
                                alt="Theater preview" 
                                className="h-40 w-auto rounded-lg"
                                onError={(e) => {
                                    e.target.style.display = 'none'
                                    toast.error('Invalid image URL')
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Address */}
                <div>
                    <label className="block text-sm font-medium mb-2">Address *</label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Enter theater address"
                        className="w-full px-4 py-2 border border-gray-600 rounded-md outline-none focus:border-primary"
                    />
                </div>

                {/* Opening & Closing Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Opening Time * (HH:MM AM/PM)</label>
                        <input
                            type="text"
                            name="openingTime"
                            value={formData.openingTime}
                            onChange={handleInputChange}
                            placeholder="e.g., 9:00 AM"
                            className="w-full px-4 py-2 border border-gray-600 rounded-md outline-none focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Closing Time * (HH:MM AM/PM)</label>
                        <input
                            type="text"
                            name="closingTime"
                            value={formData.closingTime}
                            onChange={handleInputChange}
                            placeholder="e.g., 11:00 PM"
                            className="w-full px-4 py-2 border border-gray-600 rounded-md outline-none focus:border-primary"
                        />
                    </div>
                </div>

                {/* Phone Number */}
                <div>
                    <label className="block text-sm font-medium mb-2">Phone Number *</label>
                    <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="Enter phone number"
                        className="w-full px-4 py-2 border border-gray-600 rounded-md outline-none focus:border-primary"
                    />
                </div>

                {/* Total Screens */}
                <div>
                    <label className="block text-sm font-medium mb-2">Total Screens *</label>
                    <input
                        type="number"
                        name="totalScreens"
                        value={formData.totalScreens}
                        onChange={handleInputChange}
                        placeholder="Enter number of screens"
                        min="1"
                        className="w-full px-4 py-2 border border-gray-600 rounded-md outline-none focus:border-primary"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium mb-2">Description *</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Enter theater description"
                        rows="4"
                        className="w-full px-4 py-2 border border-gray-600 rounded-md outline-none focus:border-primary resize-none"
                    />
                </div>

                {/* Amenities */}
                <div>
                    <label className="block text-sm font-medium mb-2">Amenities</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={currentAmenity}
                            onChange={(e) => setCurrentAmenity(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddAmenity()}
                            placeholder="Enter amenity (e.g., Parking, Food Court)"
                            className="flex-1 px-4 py-2 border border-gray-600 rounded-md outline-none focus:border-primary"
                        />
                        <button
                            onClick={handleAddAmenity}
                            className="px-4 py-2 bg-primary/80 hover:bg-primary rounded-md transition"
                        >
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {formData.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {formData.amenities.map((amenity, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary rounded-md"
                                >
                                    <span className="text-sm">{amenity}</span>
                                    <button
                                        onClick={() => handleRemoveAmenity(amenity)}
                                        className="hover:text-red-500 transition"
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`bg-primary text-white px-8 py-2 rounded hover:bg-primary/90 transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                    {isSubmitting ? 'Adding Theater...' : 'Add Theater'}
                </button>
            </div>
        </>
    )
}

export default AddTheaters
