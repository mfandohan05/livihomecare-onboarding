import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/admin/AdminLayout'
import { Search, MapPin, Navigation, X, ExternalLink } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const geocodeAddress = async (address) => {
    const encoded = encodeURIComponent(address)
    const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}&country=US&limit=1`
    )
    const data = await res.json()
    if (data.features?.length > 0) {
        const [lng, lat] = data.features[0].center
        return { lat, lng, placeName: data.features[0].place_name }
    }
    return null
}

const distanceMiles = (lat1, lng1, lat2, lng2) => {
    const R = 3958.8
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function AdminCaregiverMap() {
    const navigate = useNavigate()
    const searchRef = useRef(null)

    const [caregivers, setCaregivers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [searching, setSearching] = useState(false)
    const [suggestions, setSuggestions] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [clientLocation, setClientLocation] = useState(null)
    const [sortedCaregivers, setSortedCaregivers] = useState([])
    const [selectedCaregiver, setSelectedCaregiver] = useState(null)
    const [viewState, setViewState] = useState({
        longitude: -80.8431,
        latitude: 35.2271,
        zoom: 9
    })

    useEffect(() => {
        fetchCaregivers()
    }, [])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const fetchCaregivers = async () => {
        const { data: caregiverData } = await supabase
            .from('caregivers')
            .select('id, name, role, position_title, phone, email')
            .eq('status', 'completed')

        if (!caregiverData) { setLoading(false); return }

        const { data: progressData } = await supabase
            .from('caregiver_progress')
            .select('caregiver_id, form_data')
            .in('caregiver_id', caregiverData.map(c => c.id))

        const withCoords = await Promise.all(
            caregiverData.map(async (caregiver) => {
                const progress = progressData?.find(p => p.caregiver_id === caregiver.id)
                const info = progress?.form_data?.personalInfo
                if (!info?.streetAddress) return null

                const address = `${info.streetAddress}, ${info.city}, ${info.state} ${info.zip}`
                const coords = await geocodeAddress(address)
                if (!coords) return null

                return { ...caregiver, address, lat: coords.lat, lng: coords.lng }
            })
        )

        const valid = withCoords.filter(Boolean)
        setCaregivers(valid)
        setSortedCaregivers(valid)
        setLoading(false)
    }

    const fetchSuggestions = async (query) => {
        if (!query.trim() || query.length < 3) { setSuggestions([]); return }
        const encoded = encodeURIComponent(query)
        const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}&country=US&types=address&limit=5`
        )
        const data = await res.json()
        setSuggestions(data.features || [])
        setShowSuggestions(true)
    }

    const handleSelectSuggestion = (feature) => {
        const [lng, lat] = feature.center
        setSearchQuery(feature.place_name)
        setSuggestions([])
        setShowSuggestions(false)

        setClientLocation({ lat, lng, placeName: feature.place_name })

        const sorted = [...caregivers]
            .map(c => ({ ...c, distance: distanceMiles(lat, lng, c.lat, c.lng) }))
            .sort((a, b) => a.distance - b.distance)

        setSortedCaregivers(sorted)
        setViewState(prev => ({ ...prev, longitude: lng, latitude: lat, zoom: 10 }))
    }

    const handleSearch = async () => {
        if (!searchQuery.trim()) return
        setSearching(true)
        setSuggestions([])
        setShowSuggestions(false)

        const coords = await geocodeAddress(searchQuery)
        if (!coords) { setSearching(false); return }

        setClientLocation(coords)

        const sorted = [...caregivers]
            .map(c => ({ ...c, distance: distanceMiles(coords.lat, coords.lng, c.lat, c.lng) }))
            .sort((a, b) => a.distance - b.distance)

        setSortedCaregivers(sorted)
        setViewState(prev => ({ ...prev, longitude: coords.lng, latitude: coords.lat, zoom: 10 }))
        setSearching(false)
    }

    const clearSearch = () => {
        setSearchQuery('')
        setClientLocation(null)
        setSuggestions([])
        setShowSuggestions(false)
        setSortedCaregivers(caregivers)
        setViewState({ longitude: -80.8431, latitude: 35.2271, zoom: 9 })
    }

    return (
        <AdminLayout>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Caregiver Map</h1>
                    <p className="text-muted-foreground">
                        {caregivers.length} caregivers with addresses on file
                    </p>
                </div>
            </div>

            {/* Search bar */}
            <div className="flex gap-3 mb-6">
                <div className="relative flex-1 max-w-lg" ref={searchRef}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            fetchSuggestions(e.target.value)
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                setSuggestions([])
                                setShowSuggestions(false)
                                handleSearch()
                            }
                            if (e.key === 'Escape') {
                                setSuggestions([])
                                setShowSuggestions(false)
                            }
                        }}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        placeholder="Enter a client address to find nearest caregivers..."
                        className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#577C09]/20 focus:border-[#577C09]"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                            {suggestions.map((feature) => (
                                <button
                                    key={feature.id}
                                    onClick={() => handleSelectSuggestion(feature)}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2 border-b border-border last:border-0"
                                >
                                    <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                    <span className="truncate">{feature.place_name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button
                    onClick={handleSearch}
                    disabled={!searchQuery.trim() || searching}
                    className="px-4 py-2 bg-[#577C09] hover:bg-[#3D5906] text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                >
                    {searching ? 'Searching...' : 'Search'}
                </button>
                {clientLocation && (
                    <button
                        onClick={clearSearch}
                        className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
                    >
                        <X className="w-4 h-4" />
                        Clear
                    </button>
                )}
            </div>

            {/* Split view */}
            <div className="flex gap-6 h-[600px]">
                {/* Left — caregiver list */}
                <div className="w-80 shrink-0 overflow-y-auto space-y-2">
                    {loading ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">Loading caregivers...</p>
                    ) : sortedCaregivers.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No caregivers with addresses found</p>
                    ) : (
                        sortedCaregivers.map((caregiver, index) => (
                            <div
                                key={caregiver.id}
                                onClick={() => {
                                    setSelectedCaregiver(caregiver)
                                    setViewState(prev => ({
                                        ...prev,
                                        longitude: caregiver.lng,
                                        latitude: caregiver.lat,
                                        zoom: 13
                                    }))
                                }}
                                className={`bg-white rounded-xl border p-4 cursor-pointer transition-colors hover:border-[#577C09] ${
                                    selectedCaregiver?.id === caregiver.id
                                        ? 'border-[#577C09] bg-[#E8F0D0]/50'
                                        : 'border-border'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#577C09] flex items-center justify-center text-white text-xs font-medium shrink-0">
                                        {caregiver.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-medium text-sm truncate">{caregiver.name}</p>
                                            {clientLocation && caregiver.distance !== undefined && (
                                                <span className="text-xs font-medium text-[#577C09] shrink-0">
                                                    {caregiver.distance.toFixed(1)} mi
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground capitalize">{caregiver.role}</p>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">{caregiver.address}</p>
                                    </div>
                                </div>
                                {clientLocation && index === 0 && (
                                    <div className="mt-2 text-xs font-medium text-[#577C09] flex items-center gap-1">
                                        <Navigation className="w-3 h-3" />
                                        Closest caregiver
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Right — map */}
                <div className="flex-1 rounded-xl overflow-hidden border border-border">
                    <Map
                        {...viewState}
                        onMove={e => setViewState(e.viewState)}
                        mapStyle="mapbox://styles/mapbox/light-v11"
                        mapboxAccessToken={MAPBOX_TOKEN}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <NavigationControl position="top-right" />

                        {clientLocation && (
                            <Marker longitude={clientLocation.lng} latitude={clientLocation.lat} anchor="bottom">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center">
                                        <MapPin className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="text-xs font-medium bg-blue-500 text-white px-2 py-0.5 rounded mt-1">
                                        Client
                                    </div>
                                </div>
                            </Marker>
                        )}

                        {sortedCaregivers.map((caregiver, index) => (
                            <Marker
                                key={caregiver.id}
                                longitude={caregiver.lng}
                                latitude={caregiver.lat}
                                anchor="bottom"
                                onClick={() => setSelectedCaregiver(caregiver)}
                            >
                                <div className="flex flex-col items-center cursor-pointer">
                                    <div className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold transition-transform hover:scale-110 ${
                                        selectedCaregiver?.id === caregiver.id
                                            ? 'bg-[#3D5906] scale-110'
                                            : clientLocation && index === 0
                                            ? 'bg-[#577C09]'
                                            : 'bg-[#577C09]/70'
                                    }`}>
                                        {caregiver.name.split(' ')[0][0]}
                                    </div>
                                </div>
                            </Marker>
                        ))}

                        {selectedCaregiver && (
                            <Popup
                                longitude={selectedCaregiver.lng}
                                latitude={selectedCaregiver.lat}
                                anchor="top"
                                onClose={() => setSelectedCaregiver(null)}
                                closeButton={false}
                            >
                                <div className="p-3 min-w-[180px]">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-semibold text-sm">{selectedCaregiver.name}</p>
                                        <button onClick={() => setSelectedCaregiver(null)}>
                                            <X className="w-3.5 h-3.5 text-muted-foreground" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-muted-foreground capitalize mb-1">{selectedCaregiver.role}</p>
                                    <p className="text-xs text-muted-foreground mb-1">{selectedCaregiver.phone || '—'}</p>
                                    {clientLocation && selectedCaregiver.distance !== undefined && (
                                        <p className="text-xs font-medium text-[#577C09] mb-2">
                                            {selectedCaregiver.distance.toFixed(1)} miles away
                                        </p>
                                    )}
                                    <button
                                        onClick={() => navigate(`/admin/caregivers/${selectedCaregiver.id}`)}
                                        className="flex items-center gap-1.5 text-xs text-[#577C09] hover:underline"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        View profile
                                    </button>
                                </div>
                            </Popup>
                        )}
                    </Map>
                </div>
            </div>
        </AdminLayout>
    )
}