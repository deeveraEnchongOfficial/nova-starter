import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Use the XSRF-TOKEN cookie for CSRF protection instead of a static meta tag.
// The cookie is updated by Laravel on every response (including after session
// regeneration), so it's always current. The meta tag approach goes stale after
// login because Inertia doesn't do a full page reload.
axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

declare global {
    interface Window {
        axios: typeof axios;
    }
}

window.axios = axios;

export { axios };
export type { AxiosRequestConfig };
