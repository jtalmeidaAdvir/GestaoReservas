import React, { useState, useEffect } from "react";
import {
  TextField,
  Select,
  MenuItem,
  Typography,
  Grid,
  Box,
  Button,
} from "@mui/material";
import Reservations from "./Reservation";
import CreateTripModal from "../Trip/CreateTripModal";
import AddIcon from "@mui/icons-material/Add";

const originOptions = ["Portugal", "Suiça"];

const normalizeString = (str) =>
  (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const SearchTripPage = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("");
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTripIds, setSelectedTripIds] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [citiesByCountry, setCitiesByCountry] = useState({ Portugal: [], Suiça: [] });

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await fetch("https://backendreservasnunes.advir.pt/cities");
        const data = await res.json();
        const portugal = data.filter(c => c.isActive && c.Country?.nome === "Portugal").map(c => c.nome);
        const suica = data.filter(c => c.isActive && c.Country?.nome === "Suiça").map(c => c.nome);
        setCitiesByCountry({ Portugal: portugal, Suiça: suica });
      } catch (err) {
        console.error("Erro ao buscar cidades:", err);
      }
    };
    fetchCities();
  }, []);

  const handleSearch = async () => {
    if (!selectedDate || !selectedOrigin || !selectedDestination) return;

    setLoading(true);
    try {
      const res = await fetch(`https://backendreservasnunes.advir.pt/trips/by-date?date=${selectedDate}`);
      if (!res.ok) throw new Error("Erro na resposta do servidor ao buscar viagens por data.");

      const tripsData = await res.json();

      const filteredTrips = tripsData.filter((trip) => {
        const origemMatch =
          citiesByCountry[selectedOrigin].some(city =>
            normalizeString(trip.origem) === normalizeString(city)
          ) ||
          normalizeString(trip.origem) === normalizeString(selectedOrigin);

        const destinoMatch =
          citiesByCountry[selectedDestination].some(city =>
            normalizeString(trip.destino) === normalizeString(city)
          ) ||
          normalizeString(trip.destino) === normalizeString(selectedDestination);

        return origemMatch && destinoMatch;
      });

      setTrips(filteredTrips);
      setSelectedTripIds([]);
    } catch (error) {
      console.error("Erro ao buscar viagens:", error);
      alert("Ocorreu um erro ao buscar as viagens.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate && selectedOrigin && selectedDestination) {
      handleSearch();
    }
  }, [selectedDate, selectedOrigin, selectedDestination]);

  const toggleSelection = (tripId) => {
    setSelectedTripIds([tripId]);
  };

  const handleTripCreated = (newTrip) => {
    if (
      normalizeString(newTrip.origem) === normalizeString(selectedOrigin) &&
      normalizeString(newTrip.destino) === normalizeString(selectedDestination) &&
      newTrip.dataViagem === selectedDate
    ) {
      setTrips((prev) => [...prev, newTrip]);
    }
    handleSearch();
  };

  return (
    <Box sx={{ padding: "20px" }}>
      <Typography variant="h4" gutterBottom>
        Lançar Viagens
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <TextField
            label="Data da Viagem"
            type="date"
            fullWidth
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Select
            value={selectedOrigin}
            onChange={(e) => {
              const origem = e.target.value;
              const destino = origem === "Portugal" ? "Suiça" : "Portugal";
              setSelectedOrigin(origem);
              setSelectedDestination(destino);
            }}
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
        <Grid item xs={12} sm={4}>
          <TextField
            label="Destino"
            value={selectedDestination}
            InputProps={{ readOnly: true }}
            fullWidth
          />
        </Grid>
      </Grid>

      <Box sx={{ marginTop: "20px" }}>
        {loading && <Typography>Carregando...</Typography>}
        {!loading && trips.length === 0 && selectedDate && selectedOrigin && (
          <Typography>
            Nenhuma viagem encontrada para os critérios selecionados.
          </Typography>
        )}

        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2, marginTop: 2 }}>
          {selectedDate && selectedOrigin && selectedDestination && (
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="outlined"
              sx={{
                borderColor: "darkred",
                color: "darkred",
                height: "40px",
                minWidth: "40px",
                borderRadius: "50%",
                fontWeight: "bold",
                '&:hover': {
                  backgroundColor: "#fbeaea",
                }
              }}
            >
              <AddIcon />
            </Button>
          )}

          {trips.map((trip) => {
            const isSelected = selectedTripIds.includes(trip.id);

            const isFromPortugal =
              citiesByCountry["Portugal"].some(
                city => normalizeString(trip.origem) === normalizeString(city)
              ) ||
              normalizeString(trip.origem) === normalizeString("Portugal");

            const cor = isFromPortugal ? "green" : "darkred";
            const bg = isSelected ? "#fff" : cor;
            const text = isSelected ? cor : "#fff";

            return (
              <Box
                key={trip.id}
                onClick={() => toggleSelection(trip.id)}
                sx={{
                  cursor: "pointer",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: isSelected ? `2px solid ${cor}` : `1px solid ${cor}`,
                  backgroundColor: bg,
                  color: text,
                  transition: "all 0.2s",
                  "&:hover": {
                    opacity: 0.8,
                  },
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                  {trip.Bus.nome}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {selectedTripIds.length > 0 && (
        <Reservations tripId={selectedTripIds[0]} />
      )}

      <CreateTripModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        date={selectedDate}
        onTripCreated={handleTripCreated}
      />
    </Box>
  );
};

export default SearchTripPage;
