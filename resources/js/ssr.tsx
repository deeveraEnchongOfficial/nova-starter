import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ReactDOMServer from 'react-dom/server';
import { route } from '../../vendor/tightenco/ziggy';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => `${title} - ${appName}`,
        resolve: (name) =>
            resolvePageComponent(
                `./Pages/${name}.tsx`,
                import.meta.glob('./Pages/**/*.tsx'),
            ),
        setup: ({ App, props }) => {
            /* eslint-disable */
            const ziggy = { ...page.props.ziggy, location: new URL(page.props.ziggy.location) };
            (global as Record<string, unknown>).route = (name: string, params?: Record<string, unknown>, absolute?: boolean) =>
                route(name, params as never, absolute, ziggy as never);
            /* eslint-enable */

            return <App {...props} />;
        },
    }),
);
