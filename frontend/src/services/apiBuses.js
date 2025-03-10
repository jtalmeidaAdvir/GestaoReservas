import axios from "axios";

const API_URL = "http://192.168.1.10:3000/buses"; // Endpoint da API

// Obter token do localStorage
const getToken = () => localStorage.getItem("token");

// Obter todos os autocarros
export const fetchBuses = async () => {
    const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
};

// Criar um novo autocarro
export const createBus = async (formData) => {
    const token = localStorage.getItem("token"); // Usa o token armazenado
    return axios.post(`${API_URL}/create`, formData, {
        headers: {
            "Content-Type": "multipart/form-data", // Permite upload de ficheiros
            Authorization: `Bearer ${token}`,
        },
    });
};






export const fetchBusById = async (id) => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const updateBus = async (id, formData, hasImage) => {
    const token = localStorage.getItem("token");

    let headers = {
        Authorization: `Bearer ${token}`,
    };

    if (hasImage) {
        headers["Content-Type"] = "multipart/form-data";
    } else {
        headers["Content-Type"] = "application/json";
    }

    return axios.put(`${API_URL}/${id}`, formData, { headers });
};





// Eliminar um autocarro
export const deleteBus = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    });

    if (!response.ok) {
        throw new Error("Erro ao eliminar autocarro");
    }

    return await response.json();
};


// Reativar um autocarro
export const reactivateBus = async (id) => {
    const response = await fetch(`${API_URL}/${id}/activate`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    });

    if (!response.ok) {
        throw new Error("Erro ao reativar autocarro");
    }

    return await response.json();
};


// Eliminar permanentemente um autocarro
export const deleteBusPermanently = async (id) => {
    const response = await fetch(`${API_URL}/${id}/permanent-delete`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${getToken()}`
        }
    });

    if (!response.ok) {
        throw new Error("Erro ao eliminar permanentemente autocarro");
    }

    return await response.json();
};
