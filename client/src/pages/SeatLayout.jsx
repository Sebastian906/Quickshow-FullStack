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
        }
    }

    const handleSeatClick = (seatId) => {
        if (!selectedTime) {
            return toast("Please select time first!")
        }
        if (!selectedSeats.includes(seatId) && selectedSeats.length > 4) {
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
                            className={`h-8 w-8 rounded border border-primary/60 cursor-pointer ${selectedSeats.includes(seatId) && "bg-primary text-white"} ${occupiedSeats.includes(seatId) && "opacity-50"}`}
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
            if (!selectedTime || !selectedTime.showId) {
                console.log('getOccupiedSeats: missing selectedTime or showId', selectedTime);
                return;
            }

            const { data } = await axios.get(`/api/booking/seats/${selectedTime.showId}`, {
                params: { time: selectedTime.time }
            });
            if (data.success) {
                setOccupiedSeats(data.occupiedSeats)
                return data.occupiedSeats
            } else {
                toast.error(data.message)
                return []
            }
        } catch (error) {
            console.log('Error getting occupied seats:', error);
            return []
        }
    }

    const bookTickets = async () => {
        try {
            if (!user) return toast.error('Please login to proceed')
            if (!selectedTime || !selectedSeats.length) return toast.error('Please select a time and seats');
            if (!selectedTime.showId) return toast.error('Invalid show selected. Please choose a time again.')
            
            const currentOccupied = await getOccupiedSeats()
            const conflicts = selectedSeats.filter(s => currentOccupied.includes(s))
            if (conflicts.length > 0) {
                return toast.error(`Selected seats not available: ${conflicts.join(', ')}`)
            }

            const showIdStr = String(selectedTime.showId).trim().toLowerCase()
            console.log('Booking payload showId:', showIdStr, 'length:', showIdStr.length)
            if (showIdStr.length !== 24 || !/^[0-9a-f]{24}$/.test(showIdStr)) {
                console.error('Invalid showId format:', {
                    original: selectedTime.showId,
                    cleaned: showIdStr,
                    length: showIdStr.length
                })
                return toast.error('Invalid show id. Please go back and reselect the schedule.')
            }

            const payload = {
                showId: showIdStr,
                selectedSeats
            }

            const { data } = await axios.post('/api/booking/create', payload, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })

            if (data.success) {
                window.location.href = data.url;
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.error('Booking error:', error)
            const msg = error?.response?.data?.message || error?.message || 'Failed to create booking'
            toast.error(msg)
        }
    }

    useEffect(() => {
        getShow()
    }, [])

    useEffect(() => {
        if (selectedTime) {
            getOccupiedSeats()
        }
    }, [selectedTime])

    return show ? (
        <div className="flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-30 md:pt-50">
            {/** Available Timings */}
            <div className="w-60 bg-primary/10 border border-primary/20 rounded-lg py-10 h-max md:sticky md:top-30">
                <p className="text-lg font-semibold px-6">Available Timings</p>
                <div className="mt-5 space-y-1">
                    {show.dateTime[date].map((item) => (
                        <div
                            key={item.time}
                            // item already contains the DB showId (see backend). Use it directly.
                            onClick={() => setSelectedTime(item)}
                            className={`flex items-center gap-2 px-6 py-2 w-max rounded-r-md cursor-pointer transition-all ${selectedTime?.time === item.time ? "bg-primary text-white" : "hover:bg-primary/20"}`}
                        >
                            <ClockIcon className="w-4 h-4" />
                            <p className="text-sm">{isoTimeFormat(item.time)}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/** Seats Layout */}
            <div className="relative flex-1 flex flex-col items-center max-md:mt-16">
                <BlurCircle top="-100px" left="-100px" />
                <BlurCircle bottom="0" right="0" />
                <h1 className="text-2xl font-semibold mb-4">Select your seat</h1>
                <img src={assets.screenImage} alt="screen" />
                <p className="text-gray-400 text-sm mb-6">SCREEN SIDE</p>
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
                <button 
                    onClick={bookTickets}
                    className="flex items-center gap-1 mt-20 px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer active:scale-95"
                >
                    Proceed to Checkout
                    <ArrowRightIcon strokeWidth={3} className="w-4 h-4"/>
                </button>
            </div>
        </div>
    ) : (
        <Loading />
    )
}

export default SeatLayout