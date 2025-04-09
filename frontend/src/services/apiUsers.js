import axios from "axios";
//http://localhost:3010/
const API_URL = "http://localhost:3010/users"; // Endereço do backend

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export const registerUser = async (userData) => {
    try {
        const response = await api.post("/register", userData);
        return response.data;
    } catch (error) {
        console.error("Erro ao registar utilizador:", error);
        throw error;
    }
};

export const loginUser = async (credentials) => {
    try {
        const response = await api.post("/login", credentials);
        return response.data;
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        throw error;
    }
};

export const deleteUser = async (id) => {
    await axios.delete(`${API_URL}/${id}`);
};


export const fetchUsers = async () => {
    try {
        const response = await api.get("");
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar utilizadores:", error);
        throw error;
    }
};

export const updateUser = async (id, userData) => {
    const response = await axios.put(`${API_URL}/${id}`, userData);
    return response.data;
};

export default api;
