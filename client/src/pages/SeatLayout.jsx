import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { assets } from "../assets/assets"
import Loading from "../components/Loading"
import { ArrowRightIcon, ClockIcon } from "lucide-react"
import isoTimeFormat from "../lib/isoTimeFormat"
import BlurCircle from "../components/BlurCircle"
import toast from 'react-hot-toast'
import { useAppContext } from "../context/AppContext"

const SeatLayout = () => {

    const groupRows = [["A", "B"], ["C", "D"], ["E", "F"], ["G", "H"], ["I", "J"]]

    const { id, date } = useParams()
    const [selectedSeats, setSelectedSeats] = useState([])
    const [selectedTime, setSelectedTime] = useState(null)
    const [show, setShow] = useState(null)
    const [occupiedSeats, setOccupiedSeats] = useState([])
    const [isBooking, setIsBooking] = useState(false)

    const navigate = useNavigate()

    const { axios, getToken, user } = useAppContext()

    const getShow = async () => {
        try {
            const { data } = await axios.get(`/api/shows/movie/${id}`)
            if (data.success) {
                const normalized = { ...data };
                if (normalized.dateTime) {
                    const mapped = {};
                    Object.keys(normalized.dateTime).forEach((d) => {
                        mapped[d] = normalized.dateTime[d].map(item => ({
                            ...item,
                            showId: item.showId ? String(item.showId).trim() : item.showId
                        }))
                    })
                    normalized.dateTime = mapped;
                }
                setShow(normalized)
            }
        } catch (error) {
            console.log(error);
            toast.error('Failed to load show details')
        }
    }

    const handleSeatClick = (seatId) => {
        if (!selectedTime) {
            return toast("Please select time first!")
        }
        if (!selectedSeats.includes(seatId) && selectedSeats.length >= 5) {
            return toast("You can only select 5 seats")
        }
        if (occupiedSeats.includes(seatId)) {
            return toast("This seat is already booked")
        }
        setSelectedSeats(prev => prev.includes(seatId) ? prev.filter(seat => seat !== seatId) : [...prev, seatId])
    }

    const renderSeats = (row, count = 9) => (
        <div
            key={row}
            className="flex gap-2 mt-2"
        >
            <div className="flex flex-wrap items-center justify-center gap-2">
                {Array.from({ length: count }, (_, i) => {
                    const seatId = `${row}${i + 1}`;
                    return (
                        <button
                            key={seatId}
                            onClick={() => handleSeatClick(seatId)}
                            disabled={occupiedSeats.includes(seatId)}
                            className={`h-8 w-8 rounded border border-primary/60 transition-all ${
                                selectedSeats.includes(seatId) 
                                    ? "bg-primary text-white" 
                                    : occupiedSeats.includes(seatId)
                                    ? "opacity-30 cursor-not-allowed"
                                    : "cursor-pointer hover:bg-primary/20"
                            }`}
                        >
                            {seatId}
                        </button>
                    )
                })}
            </div>
        </div>
    )

    const getOccupiedSeats = async () => {
        try {

            const { data } = await axios.get(`/api/booking/seats/${selectedTime.showId}`, {
                params: { time: selectedTime.time }
            });
            
            if (data.success) {
                setOccupiedSeats(data.occupiedSeats || [])
                return data.occupiedSeats || []
            } else {
                toast.error(data.message || 'Failed to get occupied seats')
                return []
            }
        } catch (error) {
            console.error('Error getting occupied seats:', error);
            toast.error('Failed to load seat availability')
            return []
        }
    }

    const bookTickets = async () => {
        if (isBooking) return;

        try {
            setIsBooking(true);

            // Validaciones
            if (!user) {
                toast.error('Please login to proceed')
                return;
            }

            if (!selectedTime) {
                toast.error('Please select a showtime')
                return;
            }

            if (!selectedSeats.length) {
                toast.error('Please select at least one seat')
                return;
            }

            if (!selectedTime.showId) {
                toast.error('Invalid show selected. Please choose a time again.')
                return;
            }
            
            // Verificar disponibilidad antes de enviar
            const currentOccupied = await getOccupiedSeats()
            const conflicts = selectedSeats.filter(s => currentOccupied.includes(s))
            if (conflicts.length > 0) {
                toast.error(`Selected seats not available: ${conflicts.join(', ')}`)
                setSelectedSeats(prev => prev.filter(s => !conflicts.includes(s)))
                return;
            }

            // Limpiar y validar showId
            const showIdStr = String(selectedTime.showId).trim()

            if (showIdStr.length !== 24 || !/^[0-9a-f]{24}$/i.test(showIdStr)) {
                console.error('Invalid showId format:', {
                    original: selectedTime.showId,
                    cleaned: showIdStr,
                    length: showIdStr.length
                })
                toast.error('Invalid show ID. Please go back and reselect the schedule.')
                return;
            }

            // Preparar payload
            const payload = {
                showId: showIdStr,
                selectedSeats: selectedSeats
            }

            // Obtener token fresco
            const token = await getToken()
            if (!token) {
                toast.error('Authentication failed. Please login again.')
                return;
            }

            // Hacer la solicitud
            const { data } = await axios.post('/api/booking/create', payload, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (data.success && data.url) {
                toast.success('Redirecting to payment...')
                setTimeout(() => {
                    window.location.href = data.url;
                }, 500)
            } else {
                toast.error(data.message || 'Failed to create booking')
            }

        } catch (error) {
            
            const errorMessage = error?.response?.data?.message 
                || error?.message 
                || 'Failed to create booking. Please try again.'
            
            toast.error(errorMessage)
        } finally {
            setIsBooking(false);
        }
    }

    useEffect(() => {
        getShow()
    }, [])

    useEffect(() => {
        if (selectedTime) {
            setSelectedSeats([]) // Reset selected seats when time changes
            getOccupiedSeats()
        }
    }, [selectedTime])

    return show ? (
        <div className="flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-30 md:pt-50">
            {/** Available Timings */}
            <div className="w-60 bg-primary/10 border border-primary/20 rounded-lg py-10 h-max md:sticky md:top-30">
                <p className="text-lg font-semibold px-6">Available Timings</p>
                <div className="mt-5 space-y-1">
                    {show.dateTime[date]?.map((item) => (
                        <div
                            key={item.time}
                            onClick={() => setSelectedTime(item)}
                            className={`flex items-center gap-2 px-6 py-2 w-max rounded-r-md cursor-pointer transition-all ${
                                selectedTime?.time === item.time 
                                    ? "bg-primary text-white" 
                                    : "hover:bg-primary/20"
                            }`}
                        >
                            <ClockIcon className="w-4 h-4" />
                            <p className="text-sm">{isoTimeFormat(item.time)}</p>
                        </div>
                    )) || <p className="px-6 text-sm text-gray-400">No showtimes available</p>}
                </div>
            </div>

            {/** Seats Layout */}
            <div className="relative flex-1 flex flex-col items-center max-md:mt-16">
                <BlurCircle top="-100px" left="-100px" />
                <BlurCircle bottom="0" right="0" />
                <h1 className="text-2xl font-semibold mb-4">Select your seat</h1>
                <img src={assets.screenImage} alt="screen" />
                <p className="text-gray-400 text-sm mb-6">SCREEN SIDE</p>
                
                {!selectedTime && (
                    <div className="text-center mb-6 text-yellow-500">
                        <p>Please select a showtime first</p>
                    </div>
                )}

                <div className="flex flex-col items-center mt-10 text-xs text-gray-300">
                    <div className="grid grid-cols-2 md:grid-cols-1 gap-8 md:gap-2 mb-6">
                        {groupRows[0].map(row => renderSeats(row))}
                    </div>
                    <div className="grid grid-cols-2 gap-11">
                        {groupRows.slice(1).map((group, index) => (
                            <div key={index}>
                                {group.map(row => renderSeats(row))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Seat legend */}
                <div className="flex gap-4 mt-8 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 border border-primary/60 rounded"></div>
                        <span>Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-primary rounded"></div>
                        <span>Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 border border-primary/60 rounded opacity-30"></div>
                        <span>Occupied</span>
                    </div>
                </div>

                {selectedSeats.length > 0 && (
                    <div className="mt-4 text-sm">
                        <p>Selected seats: <span className="font-semibold text-primary">{selectedSeats.join(', ')}</span></p>
                    </div>
                )}
                
                <button 
                    onClick={bookTickets}
                    disabled={isBooking || !selectedTime || selectedSeats.length === 0}
                    className={`flex items-center gap-1 mt-8 px-10 py-3 text-sm rounded-full font-medium transition-all ${
                        isBooking || !selectedTime || selectedSeats.length === 0
                            ? 'bg-gray-600 cursor-not-allowed opacity-50'
                            : 'bg-primary hover:bg-primary-dull cursor-pointer active:scale-95'
                    }`}
                >
                    {isBooking ? 'Processing...' : 'Proceed to Checkout'}
                    {!isBooking && <ArrowRightIcon strokeWidth={3} className="w-4 h-4"/>}
                </button>
            </div>
        </div>
    ) : (
        <Loading />
    )
}

export default SeatLayout