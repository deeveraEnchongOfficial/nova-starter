import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Button } from '@/Components/ui/button';
import { Play, Pause, SkipBack, SkipForward, X, Minimize2, Maximize2, Volume2, Music } from 'lucide-react';
import { useState } from 'react';

function formatTime(seconds: number) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function MiniPlayer() {
    const {
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMinimized,
        togglePlay,
        next,
        prev,
        seek,
        setVolume,
        close,
        toggleMinimize,
    } = useAudioPlayer();

    const [showVolume, setShowVolume] = useState(false);

    if (!currentTrack) return null;

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="fixed right-4 bottom-4 z-50 w-80 rounded-lg border bg-background shadow-lg">
            {/* Progress bar at the top */}
            <div className="relative h-1 w-full overflow-hidden rounded-t-lg bg-muted">
                <div
                    className="absolute h-full bg-primary transition-[width] duration-200"
                    style={{ width: `${progress}%` }}
                />
                <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    value={currentTime}
                    step={0.1}
                    onChange={(e) => seek(Number(e.target.value))}
                    className="absolute inset-0 w-full cursor-pointer opacity-0"
                />
            </div>

            <div className="flex items-center gap-3 p-3">
                {/* Track icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-primary/10">
                    <Music className="h-5 w-5 text-primary" />
                </div>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{currentTrack.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prev}>
                        <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={togglePlay}>
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={next}>
                        <SkipForward className="h-4 w-4" />
                    </Button>
                </div>

                {/* Volume + minimize + close */}
                <div className="flex items-center gap-1">
                    <div
                        className="relative"
                        onMouseEnter={() => setShowVolume(true)}
                        onMouseLeave={() => setShowVolume(false)}
                    >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Volume2 className="h-4 w-4" />
                        </Button>
                        {showVolume && (
                            <div className="absolute bottom-full right-0 mb-2 rounded border bg-background p-2 shadow-md">
                                <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    value={volume}
                                    onChange={(e) => setVolume(Number(e.target.value))}
                                    className="w-24 cursor-pointer"
                                />
                            </div>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMinimize}>
                        {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={close}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
