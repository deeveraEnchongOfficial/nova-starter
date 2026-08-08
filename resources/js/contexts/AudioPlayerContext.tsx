import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import axios from 'axios';

export interface AudioTrack {
    id: string;
    name: string;
    mime_type: string;
    size: number;
}

interface AudioPlayerContextValue {
    currentTrack: AudioTrack | null;
    playlist: AudioTrack[];
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMinimized: boolean;
    play: (track: AudioTrack, playlist?: AudioTrack[]) => void;
    togglePlay: () => void;
    next: () => void;
    prev: () => void;
    seek: (time: number) => void;
    setVolume: (vol: number) => void;
    close: () => void;
    toggleMinimize: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function useAudioPlayer() {
    const ctx = useContext(AudioPlayerContext);
    if (!ctx) throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
    return ctx;
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
    const [playlist, setPlaylist] = useState<AudioTrack[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolumeState] = useState(1);
    const [isMinimized, setIsMinimized] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isLoadingUrl, setIsLoadingUrl] = useState(false);

    // Keep refs in sync with state so the audio event listeners
    // (registered once) always see the latest values.
    const playlistRef = useRef(playlist);
    const currentIndexRef = useRef(currentIndex);
    useEffect(() => { playlistRef.current = playlist; }, [playlist]);
    useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

    // Create audio element once
    useEffect(() => {
        const audio = new Audio();
        audioRef.current = audio;

        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onDurationChange = () => setDuration(audio.duration || 0);
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onEnded = () => {
            const list = playlistRef.current;
            const idx = currentIndexRef.current;
            const nextIdx = idx + 1;
            if (nextIdx < list.length) {
                setCurrentIndex(nextIdx);
                setCurrentTrack(list[nextIdx]);
            } else {
                setIsPlaying(false);
            }
        };

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('durationchange', onDurationChange);
        audio.addEventListener('loadedmetadata', onDurationChange);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('durationchange', onDurationChange);
            audio.removeEventListener('loadedmetadata', onDurationChange);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('ended', onEnded);
            audio.pause();
        };
    }, []);

    // Fetch presigned URL and load into audio element when track changes
    useEffect(() => {
        if (!currentTrack || !audioRef.current) return;

        let cancelled = false;

        const fetchUrl = async () => {
            setIsLoadingUrl(true);
            try {
                const response = await axios.get(`/api/v1/files/${currentTrack.id}/download`);
                if (cancelled) return;
                const url = response.data.url;
                setAudioUrl(url);
                audioRef.current!.src = url;
                audioRef.current!.play().catch(() => {});
            } catch (error) {
                console.error('Failed to load audio URL:', error);
            } finally {
                if (!cancelled) setIsLoadingUrl(false);
            }
        };

        fetchUrl();

        return () => { cancelled = true; };
    }, [currentTrack]);

    const play = useCallback((track: AudioTrack, list?: AudioTrack[]) => {
        const listToUse = list && list.length > 0 ? list : [track];
        const index = listToUse.findIndex((t) => t.id === track.id);
        setPlaylist(listToUse);
        setCurrentIndex(index >= 0 ? index : 0);
        setCurrentTrack(track);
        setIsMinimized(false);
    }, []);

    const togglePlay = useCallback(() => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(() => {});
        }
    }, [isPlaying]);

    const next = useCallback(() => {
        if (playlist.length === 0) return;
        const nextIndex = (currentIndex + 1) % playlist.length;
        setCurrentIndex(nextIndex);
        setCurrentTrack(playlist[nextIndex]);
    }, [playlist, currentIndex]);

    const prev = useCallback(() => {
        if (playlist.length === 0) return;
        const prevIndex = currentIndex <= 0 ? playlist.length - 1 : currentIndex - 1;
        setCurrentIndex(prevIndex);
        setCurrentTrack(playlist[prevIndex]);
    }, [playlist, currentIndex]);

    const seek = useCallback((time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    const setVolume = useCallback((vol: number) => {
        if (audioRef.current) {
            audioRef.current.volume = vol;
            setVolumeState(vol);
        }
    }, []);

    const close = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        setCurrentTrack(null);
        setPlaylist([]);
        setCurrentIndex(-1);
        setIsPlaying(false);
        setAudioUrl(null);
        setCurrentTime(0);
        setDuration(0);
    }, []);

    const toggleMinimize = useCallback(() => {
        setIsMinimized((prev) => !prev);
    }, []);

    return (
        <AudioPlayerContext.Provider
            value={{
                currentTrack,
                playlist,
                isPlaying,
                currentTime,
                duration,
                volume,
                isMinimized,
                play,
                togglePlay,
                next,
                prev,
                seek,
                setVolume,
                close,
                toggleMinimize,
            }}
        >
            {children}
        </AudioPlayerContext.Provider>
    );
}
