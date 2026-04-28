const API_URL = 'https://fabric-calculator-production.up.railway.app/api';
const BASE_URL = 'https://fabric-calculator-production.up.railway.app';

const prefixImageUrls = (data) => {
    if (!data) return data;
    if (Array.isArray(data)) return data.map(prefixImageUrls);
    if (typeof data === 'object') {
        const result = { ...data };
        if (result.image_url && result.image_url.startsWith('/'))
            result.image_url = `${BASE_URL}${result.image_url}`;
        if (result.thumbnail_url && result.thumbnail_url.startsWith('/'))
            result.thumbnail_url = `${BASE_URL}${result.thumbnail_url}`;
        if (result.measurements) result.measurements = result.measurements.map(prefixImageUrls);
        return result;
    }
    return data;
};

class ApiService {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    async request(endpoint, options = {}) {
        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
                ...options.headers
            },
            body: options.body ? JSON.stringify(options.body) : undefined
        });

        const text = await res.text();
        console.log('Response status:', res.status);
        console.log('Response body:', text);

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error(`Server trả về không phải JSON (${res.status}): ${text.slice(0, 100)}`);
        }

        if (!res.ok) {
            const error = new Error(data.code || data.error || 'UNKNOWN_ERROR');
            error.code = data.code;
            throw error;
        }
        return prefixImageUrls(data);
    }

    login = (email, password) => this.request('/auth/login', {
        method: 'POST', body: { email, password }
    });

    register = (name, email, password) => this.request('/auth/register', {
        method: 'POST', body: { name, email, password }
    });

    getMe = () => this.request('/auth/me');

    getMeasurements = () => this.request('/measurements');

    createMeasurement = (data) => this.request('/measurements', {
        method: 'POST', body: data
    });

    deleteMeasurement = (id) => this.request(`/measurements/${id}`, {
        method: 'DELETE'
    });

    getFolders = () => this.request('/folders');

    createFolder = (data) => this.request('/folders', { method: 'POST', body: data });

    getFolder = (id) => this.request(`/folders/${id}`);

    addToFolder = (projectId, measurementId) => this.request(`/folders/${projectId}/measurements`, {
        method: 'POST', body: { measurement_id: measurementId }
    });

    deleteFolder = (id) => this.request(`/folders/${id}`, { method: 'DELETE' });

    forgotPassword = (email,  lang = 'vi') => this.request('/auth/forgot-password', {
        method: 'POST',
        body: { email, lang }
    });

    resetPassword = (token, newPassword) => this.request('/auth/reset-password', {
        method: 'POST',
        body: { token, newPassword }
    });

    updateMeasurement = (id, data) => this.request(`/measurements/${id}`, {
        method: 'PUT',
        body: data
    });

    updateFolder = (id, data) => this.request(`/folders/${id}`, {
        method: 'PUT',
        body: data
    });
}

export const api = new ApiService();