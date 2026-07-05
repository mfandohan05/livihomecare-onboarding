import { useRef, useEffect, useState } from 'react'
import { useAddressAutocomplete } from '@/hooks/useAddressAutocomplete'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AddressAutocompleteField({ label = 'Street Address', value, onSelect }) {
    const { query, setQuery, suggestions, parseFeature, clearSuggestions } = useAddressAutocomplete()
    const [inputValue, setInputValue] = useState(value || '')
    const [open, setOpen] = useState(false)
    const containerRef = useRef(null)

    useEffect(() => {
        setInputValue(value || '')
    }, [value])

    useEffect(() => {
        setOpen(suggestions.length > 0)
    }, [suggestions])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleInputChange = (e) => {
        const val = e.target.value
        setInputValue(val)
        setQuery(val)
    }

    const handleSelectSuggestion = (feature) => {
        const parsed = parseFeature(feature)
        setInputValue(parsed.streetAddress)
        onSelect(parsed)
        setQuery('')
        clearSuggestions()
        setOpen(false)
    }

    return (
        <div className="space-y-2" ref={containerRef}>
            <Label>{label}</Label>
            <div className="relative">
                <Input
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => {
                        if (suggestions.length > 0) setOpen(true)
                    }}
                    placeholder="Start typing an address..."
                />

                {open && suggestions.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-border rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                        {suggestions.map((feature) => (
                            <li
                                key={feature.id}
                                onMouseDown={() => handleSelectSuggestion(feature)}
                                className="px-3 py-2 text-sm cursor-pointer hover:bg-muted"
                            >
                                {feature.place_name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}