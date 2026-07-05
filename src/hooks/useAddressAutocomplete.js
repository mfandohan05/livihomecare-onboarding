import { useState, useEffect, useRef } from 'react'

export function useAddressAutocomplete() {
    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState([])
    const [loading, setLoading] = useState(false)
    const debounceRef = useRef(null)

    useEffect(() => {
        if (!query || query.length < 3) {
            setSuggestions([])
            return
        }

        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}&country=US&types=address&autocomplete=true&limit=5`
                )
                const data = await res.json()
                setSuggestions(data.features || [])
            } catch (err) {
                console.error('Mapbox autocomplete error:', err)
                setSuggestions([])
            }
            setLoading(false)
        }, 300)

        return () => clearTimeout(debounceRef.current)
    }, [query])

    const parseFeature = (feature) => {
        const context = feature.context || []
        const getContext = (type) =>
            context.find(c => c.id.startsWith(type))?.text || ''

        const streetAddress = feature.address
            ? `${feature.address} ${feature.text}`
            : feature.text

        return {
            streetAddress,
            city: getContext('place') || getContext('locality'),
            state: context.find(c => c.id.startsWith('region'))?.short_code?.replace('US-', '') || getContext('region'),
            zip: getContext('postcode'),
            lat: feature.center?.[1],
            lng: feature.center?.[0],
        }
    }

    return { query, setQuery, suggestions, loading, parseFeature, clearSuggestions: () => setSuggestions([]) }
}