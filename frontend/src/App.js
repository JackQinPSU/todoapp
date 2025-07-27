import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api/todos';

function App() {
    const [todos, setTodos] = useSTate([]);
    const [newTodo, setNewTodo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
}

//Loads todos when component mounts
useEffect(() => {
    fetchTodos();
}, []);

//Fetch all todos from backend
const fetchTodos = async () => {
    try {
        setLoading(true);
        const response = await axios.get(API_URL);
        setTodos(response.data.data);
    } catch(err) {
        setError('Failed to fetch todos');
        console.error(err);
    } finally {
        setLoading(false);
    }
};

//Create a new todo 
const createTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
        const response = await axios.post(API_URL, { title: newTodo });
        setTodos([response.data.data, ...todos]);
        setNewTodo('');
        setError('');
    } catch (err) {
        setError('Failed to create todo');
        console.error(err);
    }
};