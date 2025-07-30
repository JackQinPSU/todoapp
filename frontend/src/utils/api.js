import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

//Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        //Token will be added by AuthContext interceptor
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


//Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        //Handle common errors
        if (error.response?.status === 401) {
            console.log('Unauthorized access - redirecting to login');
        } else if (error.response?.status === 403) {
            console.log('Forbidden access');
        } else if (error.response?.status === 500) {
            console.log('Server error');
        }
        return Promise.reject(error);
    }
);

//Todo API calls
export const todoAPI = {
    //Get all todos
    getTodos: () => api.get('./todos'),

    //Create new todo
    createTodo: (title) => api.post('/todos', { title }),

    //Update todo
    updateTodo: (id, updates) => api.put(`/todos/${id}`, updates),

    //Delete todos
    deleteTodo: (id) => api.delete('/todos/${id}')
}

//Auth API calls
export const authAPI = {
    //Login 
    login: (email, password) => api.post('/auth/login', {email, password}),

    //Register
    register: (name, email, password) => api.post('auth/register', { name, email, password }),

    //Get current user
    me: () => api.get(/auth/me),

    // Logout
    logout: () => api.post('/auth/logout')
};

export const testAPI = {
    //Test backend connection 
    test: () => api.get('/test'),

    //Test database connection
    dbTest: () => api.get('/db-test')
};

export default api;