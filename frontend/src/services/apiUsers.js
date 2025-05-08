import axios from "axios";

const API_URL = "https://nunes.entigra.pt/backend/users";

// Obter token do localStorage
const getToken = () => localStorage.getItem("token");

// Instância base sem autenticação (para login/register)
const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// ➕ Instância com token (para chamadas protegidas)
const apiAuth = () =>
    axios.create({
        baseURL: API_URL,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
        },
    });

// ================== Métodos ==================

// 🔓 Registar e login (sem token)
export const registerUser = async (userData) => {
    const response = await api.post("/register", userData);
    return response.data;
};

export const loginUser = async (credentials) => {
    const response = await api.post("/login", credentials);
    return response.data;
};

// 🔐 Métodos com autenticação
export const deleteUser = async (id) => {
    const response = await apiAuth().delete(`/${id}`);
    return response.data;
};

export const fetchUsers = async () => {
    const response = await apiAuth().get("/");
    return response.data;
};

export const updateUser = async (id, userData) => {
    const response = await apiAuth().put(`/${id}`, userData);
    return response.data;
};

export default api;
