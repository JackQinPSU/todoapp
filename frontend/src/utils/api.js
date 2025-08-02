import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});


// Add request interceptor to include token
api.interceptors.request.use(
    (config) => {
        // Get token from wherever you store it (localStorage, context, etc.)
        const token = localStorage.getItem('token'); // or get from context
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - redirect to login
            localStorage.removeItem('token');
            window.location.href = '/'; // or use your routing method
        }
        return Promise.reject(error);
    }
);

// Todo API calls
export const todoAPI = {
    getTodos: () => api.get('/todos'),
    createTodo: (title) => api.post('/todos', { title }),
    updateTodo: (id, updates) => api.put('/todos/' + id, updates),
    deleteTodo: (id) => api.delete('/todos/' + id)
};

// Auth API calls  
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (name, email, password) => api.post('/auth/register', { name, email, password }),
    me: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout')
};

export default api;