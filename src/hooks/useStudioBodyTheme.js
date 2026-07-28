import { useEffect } from 'react'

export function useStudioBodyTheme() {
    useEffect(() => {
        document.body.classList.add('studio-theme')
        return () => document.body.classList.remove('studio-theme')
    }, [])
}
