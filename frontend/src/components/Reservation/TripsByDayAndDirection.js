import React, { useState } from "react";
import {
  TextField,
  Select,
  MenuItem,
  Button,
  Typography,
  Grid,
  Box,
} from "@mui/material";
import DualReservationsTables from "./DualReservationsTables";

const originOptions = ["Portugal", "Suiça"];
const destinationOptions = ["Portugal", "Suiça"];

const normalizeString = (str) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const TripsByDayAndDirection = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("");
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTripIds, setSelectedTripIds] = useState([]);

  const handleSearch = async () => {
    if (!selectedDate || !selectedOrigin || !selectedDestination) {
      alert("Por favor, selecione a data, a origem e o destino.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://backendreservasnunes.advir.pt/trips/by-date?date=${selectedDate}`
      );
      if (!res.ok) {
        throw new Error("Erro na resposta do servidor ao buscar viagens por data.");
      }
      const tripsData = await res.json();

      // Filtrar as viagens com base na origem e destino selecionados
      const filteredTrips = tripsData.filter(
        (trip) =>
          normalizeString(trip.origem) === normalizeString(selectedOrigin) &&
          normalizeString(trip.destino) === normalizeString(selectedDestination)
      );
      setTrips(filteredTrips);
      setSelectedTripIds([]); // Limpa seleção anterior
    } catch (error) {
      console.error("Erro ao buscar viagens:", error);
      alert("Ocorreu um erro ao buscar as viagens.");
    } finally {
      setLoading(false);
    }
  };

  // Alternar a seleção de uma viagem
  const toggleSelection = (tripId) => {
    setSelectedTripIds((prev) => {
      if (prev.includes(tripId)) {
        return prev.filter((id) => id !== tripId);
      } else {
        return [...prev, tripId];
      }
    });
  };

  return (
    <Box sx={{ padding: "20px" }}>
      <Typography variant="h4" gutterBottom>
        Pesquisar Viagens
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={3}>
          <TextField
            label="Data da Viagem"
            type="date"
            fullWidth
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Select
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value)}
            displayEmpty
            fullWidth
          >
            <MenuItem value="" disabled>
              Selecione a Origem
            </MenuItem>
            {originOptions.map((origin) => (
              <MenuItem key={origin} value={origin}>
                {origin}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Select
            value={selectedDestination}
            onChange={(e) => setSelectedDestination(e.target.value)}
            displayEmpty
            fullWidth
          >
            <MenuItem value="" disabled>
              Selecione o Destino
            </MenuItem>
            {destinationOptions.map((dest) => (
              <MenuItem key={dest} value={dest}>
                {dest}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Button variant="contained" color="primary" onClick={handleSearch} fullWidth>
            Pesquisar
          </Button>
        </Grid>
      </Grid>

      <Box sx={{ marginTop: "20px" }}>
        {loading && <Typography>Carregando...</Typography>}
        {!loading && trips.length === 0 && (
          <Typography>Nenhuma viagem encontrada para os critérios selecionados.</Typography>
        )}

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, marginTop: 2 }}>
          {trips.map((trip) => {
            const isSelected = selectedTripIds.includes(trip.id);
            return (
              <Box
                key={trip.id}
                onClick={() => toggleSelection(trip.id)}
                sx={{
                  cursor: "pointer",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: isSelected ? "2px solid darkred" : "1px solid darkred",
                  backgroundColor: isSelected ? "#fff" : "darkred",
                  color: isSelected ? "darkred" : "#fff",
                  transition: "all 0.2s",
                  "&:hover": {
                    opacity: 0.8,
                  },
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                  {trip.origem} → {trip.destino} ({trip.origemCidade} → {trip.destinoCidade}) {trip.bus}
                </Typography>
                <Typography variant="body2">
                  {new Date(trip.dataviagem).toLocaleDateString("pt-PT")}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Se houver viagens selecionadas, mostra automaticamente as reservas */}
      {selectedTripIds.length > 0 && (
        <DualReservationsTables tripIds={selectedTripIds} />
      )}
    </Box>
  );
};

export default TripsByDayAndDirection;
