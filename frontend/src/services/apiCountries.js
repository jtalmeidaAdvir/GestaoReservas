import axios from "axios";

const API_URL = "http://localhost:3010/countries"; // Endpoint da API

// Obter token do localStorage
const getToken = () => localStorage.getItem("token");

// Obter todos os países
export const fetchCountries = async () => {
    const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

// Criar um novo país
export const createCountry = async (formData) => {
    const token = getToken();
    return axios.post(`${API_URL}`, formData, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
};

// Obter um país pelo ID
export const fetchCountryById = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

// Atualizar um país
export const updateCountry = async (id, formData) => {
    return axios.put(`${API_URL}/${id}`, formData, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
        }
    });
};

// Eliminar (desativar) um país
export const deleteCountry = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    });

    if (!response.ok) {
        throw new Error("Erro ao eliminar país");
    }

    return await response.json();
};

// Reativar um país
export const reactivateCountry = async (id) => {
    const response = await fetch(`${API_URL}/${id}/activate`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    });

    if (!response.ok) {
        throw new Error("Erro ao reativar país");
    }

    return await response.json();
};

// Eliminar permanentemente um país
export const deleteCountryPermanently = async (id) => {
    const response = await fetch(`${API_URL}/${id}/permanent-delete`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    });

    if (!response.ok) {
        throw new Error("Erro ao eliminar permanentemente país");
    }

    return await response.json();
};
