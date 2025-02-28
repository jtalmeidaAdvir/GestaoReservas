import axios from "axios";

const API_URL = "http://192.168.1.10:3000/trips"; // Ajusta conforme necessário

export const fetchTrips = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar viagens", error);
        throw error;
    }
};

export const fetchTripById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar viagem por ID", error);
        throw error;
    }
};

export const updateTrip = async (id, tripData) => {
    const response = await axios.put(`${API_URL}/${id}`, tripData); // ✅ Adiciona API_URL
    return response.data;
};


export const deleteTrip = async (id) => {
    try {
        await axios.put(`${API_URL}/${id}/disable`);
    } catch (error) {
        console.error("Erro ao desativar viagem", error);
        throw error;
    }
};

export const reactivateTrip = async (id) => {
    try {
        await axios.put(`${API_URL}/${id}/reactivate`);
    } catch (error) {
        console.error("Erro ao reativar viagem", error);
        throw error;
    }
};

export const deleteTripPermanently = async (id) => {
    try {
        await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
        console.error("Erro ao eliminar permanentemente a viagem", error);
        throw error;
    }
};


