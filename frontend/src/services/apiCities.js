import axios from "axios";

const API_URL = "https://backendreservasnunes.advir.pt/cities"; // Endpoint da API

// Obter token do localStorage
const getToken = () => localStorage.getItem("token");

// Obter todas as cidades
export const fetchCities = async () => {
    const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

// Criar uma nova cidade
export const createCity = async (formData) => {
    const token = getToken();
    return axios.post(`${API_URL}`, formData, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
};

// Obter uma cidade pelo ID
export const fetchCityById = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

// Atualizar uma cidade
export const updateCity = async (id, formData) => {
    return axios.put(`${API_URL}/${id}`, formData, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
        }
    });
};

// Eliminar (desativar) uma cidade
export const deleteCity = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    });

    if (!response.ok) {
        throw new Error("Erro ao eliminar cidade");
    }

    return await response.json();
};

// Reativar uma cidade
export const reactivateCity = async (id) => {
    const response = await fetch(`${API_URL}/${id}/activate`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    });

    if (!response.ok) {
        throw new Error("Erro ao reativar cidade");
    }

    return await response.json();
};

// Eliminar permanentemente uma cidade
export const deleteCityPermanently = async (id) => {
    const response = await fetch(`${API_URL}/${id}/permanent-delete`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    });

    if (!response.ok) {
        throw new Error("Erro ao eliminar permanentemente cidade");
    }

    return await response.json();
};
