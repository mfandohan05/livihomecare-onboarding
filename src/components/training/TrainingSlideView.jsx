import { parseVideoUrl, trainingImageUrl } from '@/lib/training'

function SlideBody({ text }) {
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim())
    return (
        <div className="space-y-3">
            {paragraphs.map((paragraph, i) => (
                <p key={i} className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                    {paragraph}
                </p>
            ))}
        </div>
    )
}

export function SlideVideo({ url }) {
    const video = parseVideoUrl(url)
    if (!video || video.error) return null

    if (video.kind === 'file') {
        return <video src={video.src} controls className="w-full rounded-lg bg-black aspect-video" />
    }

    return (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
            <iframe
                src={video.src}
                title="Training video"
                className="w-full h-full"
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
            />
        </div>
    )
}

export default function TrainingSlideView({ slide, index, total }) {
    const imageUrl = trainingImageUrl(slide.image_path)

    return (
        <div className="border border-border rounded-xl p-4 md:p-8 bg-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-1">
                <h2 className="text-lg md:text-xl font-semibold">{slide.title || ''}</h2>
                <span className="text-xs text-muted-foreground">Slide {index + 1} of {total}</span>
            </div>
            <div className="space-y-5">
                {slide.body && <SlideBody text={slide.body} />}
                {imageUrl && <img src={imageUrl} alt={slide.title || 'Training slide image'} className="max-w-full max-h-[420px] mx-auto rounded-lg" />}
                {slide.video_url && <SlideVideo url={slide.video_url} />}
            </div>
        </div>
    )
}
