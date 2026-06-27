import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const csrfToken = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;

if (csrfToken) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken.content;
} else {
    console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
}

declare global {
    interface Window {
        axios: typeof axios;
    }
}

window.axios = axios;

export { axios };
export type { AxiosRequestConfig };
