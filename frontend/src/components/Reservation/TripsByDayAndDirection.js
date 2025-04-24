import React, { useState, useEffect } from "react";
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
import CreateTripModal from "../Trip/CreateTripModal";
import AddIcon from '@mui/icons-material/Add'; // ícone de "+"


const originOptions = ["Portugal", "Suiça"];
const destinationOptions = ["Portugal", "Suiça"];



const normalizeString = (str) =>
  (typeof str === "string" ? str : "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();



const TripsByDayAndDirection = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("");
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTripIds, setSelectedTripIds] = useState([]);
  const [seatsInfo, setSeatsInfo] = useState({});


  const [citiesByCountry, setCitiesByCountry] = useState({
    Portugal: [],
    Suiça: []
  });

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await fetch("https://backendreservasnunes.advir.pt/cities");
        const data = await res.json();
        const portugal = data.filter(c => c.isActive && c.Country?.nome === "Portugal").map(c => c.nome);
        const suica = data.filter(c => c.isActive && c.Country?.nome === "Suiça").map(c => c.nome);
        console.log("🇵🇹 Cidades PT:", portugal);
        console.log("🇨🇭 Cidades CH:", suica);
        setCitiesByCountry({ Portugal: portugal, Suiça: suica });
      } catch (err) {
        console.error("Erro ao buscar cidades:", err);
      }
    };
    fetchCities();
  }, []);
  
  
  


  useEffect(() => {
    if (selectedDate && selectedOrigin && selectedDestination) {
      handleSearch();
    }
  }, [selectedDate, selectedOrigin, selectedDestination]);



const handleSearch = async () => {
  if (!selectedDate || !selectedOrigin || !selectedDestination) {
    alert("Por favor, selecione a data, a origem e o destino.");
    return;
  }

  setLoading(true);
  try {
    const res = await fetch(`https://backendreservasnunes.advir.pt/trips/by-date?date=${selectedDate}`);
    if (!res.ok) throw new Error("Erro ao buscar viagens.");

    const tripsData = await res.json();

    // ✅ Declara as cidades por país
    const originCities = citiesByCountry[selectedOrigin] || [];
    const destinationCities = citiesByCountry[selectedDestination] || [];

    // ✅ Filtra as viagens com base nas cidades da origem/destino
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
    
      if (!origemMatch) {
        console.log("❌ Origem falhou:", trip.origem);
      }
      if (!destinoMatch) {
        console.log("❌ Destino falhou:", trip.destino);
      }
    
      return origemMatch && destinoMatch;
    });
    
    

    setTrips(filteredTrips);

    const seatsMap = {};
    for (const trip of filteredTrips) {
      try {
        const res = await fetch(`https://backendreservasnunes.advir.pt/trips/${trip.id}/available-seats`);
        const availableSeats = await res.json();
        const totalSeats = trip.Bus?.nlugares || 0;
        const occupiedSeats = totalSeats - availableSeats.length;
        seatsMap[trip.id] = { occupied: occupiedSeats, total: totalSeats };
      } catch (error) {
        console.error(`Erro ao buscar lugares para viagem ${trip.id}:`, error);
        seatsMap[trip.id] = { occupied: "?", total: "?" };
      }
    }
    setSeatsInfo(seatsMap);
    
    // ✅ Mantém as seleções válidas
    setSelectedTripIds((prevIds) =>
      filteredTrips.map((t) => t.id).filter((id) => prevIds.includes(id))
    );
    
    
    // ✅ Esta parte aqui adiciona a seleção automática
    if (filteredTrips.length > 0 && selectedTripIds.length === 0) {
      setSelectedTripIds([filteredTrips[0].id]);
    }
    


  } catch (error) {
    console.error("Erro ao buscar viagens:", error);
    alert("Erro ao buscar as viagens.");
  } finally {
    setLoading(false);
  }
};

  

  // Alternar a seleção de uma viagem
  const toggleSelection = (tripId) => {
    setSelectedTripIds((prev) => {
      if (prev.includes(tripId)) {
        // Se já está selecionada, desseleciona
        return prev.filter((id) => id !== tripId);
      } else {
        // Se já houver 2 selecionadas, não permite adicionar mais
        if (prev.length >= 2) return prev;
        return [...prev, tripId];
      }
    });
  };
  


  const [showCreateModal, setShowCreateModal] = useState(false);

const handleTripCreated = (newTrip) => {
  // Atualiza a lista de viagens se os critérios coincidirem
  if (
    normalizeString(newTrip.origem) === normalizeString(selectedOrigin) &&
    normalizeString(newTrip.destino) === normalizeString(selectedDestination) &&
    newTrip.dataViagem === selectedDate
  ) {
    setTrips((prev) => [...prev, newTrip]);
  }
  handleSearch(); // simples e funcional

};


  return (
    <Box sx={{ padding: "20px" }}>
      <Typography variant="h4" gutterBottom>
        Listagens 
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
        {!loading && trips.length === 0 && (
          <Typography>Nenhuma viagem encontrada para os critérios selecionados.</Typography>
        )}

<Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2, marginTop: 2 }}>
  {selectedDate && (
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
    return (
      <Box
      key={trip.id}
      onClick={() => toggleSelection(trip.id)}
      sx={() => {
        const isPortugueseCity =
          citiesByCountry["Portugal"].some(
            city => normalizeString(city) === normalizeString(trip.origem)
          );
    
        const isPortugal =
          normalizeString(trip.origem) === normalizeString("Portugal");
    
        const isFromPortugal = isPortugal || isPortugueseCity;
    
        const activeColor = isFromPortugal ? "green" : "darkred";
        const activeBg = isSelected ? "#fff" : activeColor;
        const activeText = isSelected ? activeColor : "#fff";
    
        return {
          cursor: "pointer",
          padding: "8px 16px",
          borderRadius: "4px",
          border: isSelected ? `2px solid ${activeColor}` : `1px solid ${activeColor}`,
          backgroundColor: activeBg,
          color: activeText,
          transition: "all 0.2s",
          "&:hover": {
            opacity: 0.8,
          },
        };
      }}
    >
      <Typography variant="body1" sx={{ fontWeight: "bold" }}>
        {/*{trip.origem} → {trip.destino}*/}   {trip.Bus.nome} ({seatsInfo[trip.id]?.occupied ?? "?"}/{seatsInfo[trip.id]?.total ?? "?"} lugares)

      </Typography>
    </Box>
    
    );
  })}
</Box>


      </Box>

      {/* Se houver viagens selecionadas, mostra automaticamente as reservas */}
      {selectedTripIds.length > 0 && (
        <DualReservationsTables tripIds={selectedTripIds}   onReservationsUpdated={handleSearch} />
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

export default TripsByDayAndDirection;
