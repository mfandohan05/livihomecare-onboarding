import { useCallback, useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { Loader2 } from 'lucide-react'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString()

const LazyPage = ({ pageNumber, width, onSeen }) => {
    const containerRef = useRef(null)
    const [shouldRender, setShouldRender] = useState(false)

    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setShouldRender(true)
                        onSeen(pageNumber)
                    }
                })
            },
            { root: null, rootMargin: '400px 0px', threshold: 0.4 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [pageNumber, onSeen])

    return (
        <div ref={containerRef} className="flex justify-center mb-3">
            {shouldRender ? (
                <Page
                    pageNumber={pageNumber}
                    width={width}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    loading={
                        <div className="flex items-center justify-center bg-muted/20 rounded" style={{ width, height: width * 1.29 }}>
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                    }
                />
            ) : (
                <div className="bg-muted/20 rounded" style={{ width, height: width * 1.29 }} />
            )}
        </div>
    )
}

export default function PdfScrollViewer({ fileUrl, onComplete }) {
    const [numPages, setNumPages] = useState(null)
    const [loadError, setLoadError] = useState(false)
    const [containerWidth, setContainerWidth] = useState(600)
    const containerRef = useRef(null)
    const seenPages = useRef(new Set())
    const notifiedRef = useRef(false)

    useEffect(() => {
        seenPages.current = new Set()
        notifiedRef.current = false
    }, [fileUrl])

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const update = () => setContainerWidth(Math.max(200, Math.min(el.clientWidth - 24, 800)))
        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const handleSeen = useCallback((pageNumber) => {
        seenPages.current.add(pageNumber)
        if (numPages && seenPages.current.size === numPages && !notifiedRef.current) {
            notifiedRef.current = true
            onComplete()
        }
    }, [numPages, onComplete])

    return (
        <div
            ref={containerRef}
            className="border border-border rounded-lg overflow-y-auto bg-muted/10 p-3"
            style={{ maxHeight: '60vh' }}
        >
            {loadError ? (
                <p className="text-sm text-red-600 py-8 text-center">
                    Unable to load this document. Please contact your administrator.
                </p>
            ) : (
                <Document
                    file={fileUrl}
                    onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                    onLoadError={() => setLoadError(true)}
                    loading={
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mr-2" />
                            <span className="text-sm text-muted-foreground">Loading document...</span>
                        </div>
                    }
                >
                    {numPages && Array.from({ length: numPages }, (_, i) => (
                        <LazyPage key={i + 1} pageNumber={i + 1} width={containerWidth} onSeen={handleSeen} />
                    ))}
                </Document>
            )}
        </div>
    )
}
