import axios from "axios";

const API_URL = "https://nunes.entigra.pt/backend/trips";

// Obter token do localStorage
const getToken = () => localStorage.getItem("token");

// Axios com token
const apiAuth = () =>
  axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json"
    }
  });

// ==================== Funções ====================

export const fetchTrips = async () => {
  try {
    const response = await apiAuth().get("/");
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar viagens", error);
    throw error;
  }
};

export const fetchTripById = async (id) => {
  try {
    const response = await apiAuth().get(`/${id}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar viagem por ID", error);
    throw error;
  }
};

export const updateTrip = async (id, tripData) => {
  const response = await apiAuth().put(`/${id}`, tripData);
  return response.data;
};

export const deleteTrip = async (id) => {
  try {
    await apiAuth().put(`/${id}/disable`);
  } catch (error) {
    console.error("Erro ao desativar viagem", error);
    throw error;
  }
};

export const reactivateTrip = async (id) => {
  try {
    await apiAuth().put(`/${id}/reactivate`);
  } catch (error) {
    console.error("Erro ao reativar viagem", error);
    throw error;
  }
};

export const deleteTripPermanently = async (id) => {
  try {
    await apiAuth().delete(`/${id}`);
  } catch (error) {
    console.error("Erro ao eliminar permanentemente a viagem", error);
    throw error;
  }
};
