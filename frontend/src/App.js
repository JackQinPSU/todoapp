import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api/todos';

function App() {
    const [todos, setTodos] = useState([]);
    const [newTodo, setNewTodo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');


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

    //Change a todo by id
    const updateTodo = async (id, updates) => {
        try {
            const response = await axios.put(`${API_URL}/${id}`, updates);
            setTodos(todos.map(todo => 
                todo.id === id ? response.data.data: todo
            ));
        } catch (err) {
            setError('Failed to update todo');
            console.error(err);
        }
    };

    //Delete a todo by id
    const deleteTodo = async (id) => {
        try {
            await axios.delete(`${API_URL}/${id}`);
            setTodos(todos.filter(todo => todo.id !== id));
        } catch (err) {
            setError('Failed to delete todo');
            console.error(err);
        }
    };

    //Toggle todo completion 
    const toggleTodo = (todo) => {
        updateTodo(todo.id, {
            title: todo.title,
            completed: !todo.completed
        });
    };

    return (
        <div className="App">
            <div className="container">
                <h1>My Todo App</h1>

                {error && <div className="error">{error}</div>}

                {/*Add a new todo form*/}
                <form onSubmit={createTodo} className="todo-form">
                    <input 
                        type="text"
                        value={newTodo}
                        onChange={(e)=>setNewTodo(e.target.value)}
                        placeholder="What needs to be done?"
                        className="todo-input"
                    />
                    <button type="submit" className="add-btn">
                        Add Todo
                    </button>
                </form>

                {/* Loading state */}
                {loading && <div className="loading">Loading...</div>}

                {/* Todo list */}
                <div className="todo-list">
                    {todos.length == 0 ? (
                        <p className="no-todos">No todos yet. Add one above!</p>
                    ) : (
                        todos.map(todo => (
                            <TodoItem 
                            key={todo.id}
                            todo={todo}
                            onToggle={() => toggleTodo(todo)}
                            onUpdate={updateTodo}
                            onDelete={() => deleteTodo(todo.id)}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

//Individual todo item component
function TodoItem({ todo, onToggle, onUpdate, onDelete}) {
    const[isEditing, setIsEditing] = useState(false);
    const[editText, setEditText] = useState(todo.title);

    const handleEdit = () => {
        if (isEditing) {
            //Save changes
            onUpdate(todo.id, {
                title: editText,
                completed: todo.completed
            });
        }
        setIsEditing(!isEditing);
    };

    const handleCancel = () => {
        setEditText(todo.title);
        setIsEditing(false);
    };

    return (
        <div className={`todo-item ${todo.completed ? 'completed' : ''}`}>
            <input
                type="checkbox"
                checked={todo.completed}
                onChange={onToggle}
                className="todo-checkbox"
            />

            { isEditing ? (
                <div className="edit-form">
                    <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="edit-input"
                    />
                    <button onClick={handleEdit} className="save-btn">
                        Save
                    </button>
                    <button onClick={handleCancel} className="cancel-btn">
                        Cancel
                    </button>
                </div>
            ) : (
                <div className="todo-context">
                    <span className="todo-text">{todo.title}</span>
                    <div className="todo-actions">
                        <button onClick={handleEdit} className="edit-btn">
                            Edit
                        </button>
                        <button onClick={onDelete} className="delete-btn">
                            Delete
                        </button>
                    </div>
                </div>
            )}    
        </div>
    );
}

export default App;