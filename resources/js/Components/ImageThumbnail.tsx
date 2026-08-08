import { useState } from 'react';
import { FileImage } from 'lucide-react';

interface ImageThumbnailProps {
    src: string;
    alt: string;
    className?: string;
}

export default function ImageThumbnail({ src, alt, className = 'w-12 h-12' }: ImageThumbnailProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    if (hasError) {
        return <FileImage className={`text-blue-500 ${className}`} />;
    }

    return (
        <div className={`flex overflow-hidden relative justify-center items-center bg-gray-100 rounded ${className}`}>
            <img
                src={src}
                alt={alt}
                className="object-cover w-full h-full"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setIsLoading(false);
                    setHasError(true);
                }}
            />
            {isLoading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}
        </div>
    );
}
