import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';
import { ChatBotProvider } from '@/contexts/ChatBotContext';
import MiniPlayer from '@/Components/MiniPlayer';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        if (import.meta.env.SSR) {
            hydrateRoot(el, <App {...props} />);
            return;
        }

        createRoot(el).render(
            <AudioPlayerProvider>
                <ChatBotProvider>
                    <App {...props} />
                    <MiniPlayer />
                </ChatBotProvider>
            </AudioPlayerProvider>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});
