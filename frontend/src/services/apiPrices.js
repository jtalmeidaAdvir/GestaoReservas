import axios from "axios";

const API_URL = "https://nunes.entriga.pt/backend/prices"; // Endpoint da API de preços

// Obter token do localStorage
const getToken = () => localStorage.getItem("token");

// Obter todos os preços
export const fetchPrices = async () => {
    const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

// Criar um novo preço
export const createPrice = async (formData) => {
    return axios.post(API_URL, formData, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    });
};

// Obter um preço pelo ID
export const fetchPriceById = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

// Atualizar um preço
export const updatePrice = async (id, formData) => {
    return axios.put(`${API_URL}/${id}`, formData, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
        }
    });
};

// Eliminar um preço
export const deletePrice = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    });

    if (!response.ok) {
        throw new Error("Erro ao eliminar preço");
    }

    return await response.json();
};
