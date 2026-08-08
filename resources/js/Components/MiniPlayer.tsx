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

    if (isMinimized) {
        return (
            <button
                onClick={toggleMinimize}
                className="flex fixed right-4 bottom-4 z-50 gap-2 items-center p-2 rounded-lg border shadow-lg transition-all bg-background hover:shadow-xl"
                aria-label="Expand player"
            >
                <div className="flex justify-center items-center w-8 h-8 rounded bg-primary/10">
                    <Music className="w-4 h-4 text-primary" />
                </div>
                {isPlaying ? (
                    <div className="flex gap-1 items-center">
                        <span className="w-1 h-3 rounded-full animate-pulse bg-primary" />
                        <span className="w-1 h-4 rounded-full animate-pulse bg-primary" />
                        <span className="w-1 h-2 rounded-full animate-pulse bg-primary" />
                    </div>
                ) : (
                    <Play className="w-4 h-4 text-muted-foreground" />
                )}
                <Maximize2 className="w-3 h-3 text-muted-foreground" />
            </button>
        );
    }

    return (
        <div className="fixed right-4 bottom-4 z-50 w-96 rounded-lg border shadow-lg bg-background">
            {/* Progress bar at the top */}
            <div className="overflow-hidden relative w-full h-1 rounded-t-lg bg-muted">
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
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />
            </div>

            <div className="flex gap-3 items-center p-3">
                {/* Track icon */}
                <div className="flex justify-center items-center w-10 h-10 rounded shrink-0 bg-primary/10">
                    <Music className="w-5 h-5 text-primary" />
                </div>

                {/* Track info */}
                <div className="flex flex-1 min-w-0 flex-col justify-center gap-0.5">
                    <p className="text-sm font-medium leading-tight truncate">{currentTrack.name}</p>
                    <p className="text-xs tabular-nums leading-tight whitespace-nowrap text-muted-foreground">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </p>
                </div>

                {/* Controls */}
                <div className="flex gap-1 items-center">
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={prev}>
                        <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={togglePlay}>
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={next}>
                        <SkipForward className="w-4 h-4" />
                    </Button>
                </div>

                {/* Volume + minimize + close */}
                <div className="flex gap-1 items-center">
                    <div
                        className="relative"
                        onMouseEnter={() => setShowVolume(true)}
                        onMouseLeave={() => setShowVolume(false)}
                    >
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                            <Volume2 className="w-4 h-4" />
                        </Button>
                        {showVolume && (
                            <div className="absolute right-0 bottom-full pb-2">
                                <div
                                    className="p-2 rounded border shadow-md bg-background"
                                    onMouseEnter={() => setShowVolume(true)}
                                    onMouseLeave={() => setShowVolume(false)}
                                >
                                    <input
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.05}
                                        value={volume}
                                        onChange={(e) => setVolume(Number(e.target.value))}
                                        onMouseDown={() => setShowVolume(true)}
                                        className="w-24 cursor-pointer"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={toggleMinimize}>
                        {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={close}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
