import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Typography, Grid, Button } from "@mui/material";

const DualReservationsTables = ({ tripIds }) => {
  const [tripDetails, setTripDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservations, setSelectedReservations] = useState([]);
  const [rowSelectionModelMap, setRowSelectionModelMap] = useState({});

  // 1. Buscar detalhes das viagens
  const fetchTripDetails = async () => {
    if (!tripIds || tripIds.length === 0) return;
    setLoading(true);
    try {
      const responses = await Promise.all(
        tripIds.map((tripId) =>
          fetch(`https://backendreservasnunes.advir.pt/trips/trip/${tripId}`)
        )
      );
      const data = await Promise.all(responses.map((res) => res.json()));
      setTripDetails(data);
    } catch (error) {
      console.error("Erro ao buscar detalhes das viagens:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripIds]);

  // 2. Combinar reservas com lugares vazios
  const combineReservations = (trip, reservations) => {
    const totalSeats = trip.Bus?.nlugares || 0;
    const initial = Array.from({ length: totalSeats }, (_, index) => ({
      lugar: index + 1,
      preco: "",
      moeda: "",
      entrada: "",
      nomePassageiro: "",
      apelidoPassageiro: "",
      saida: "",
      volta: "",
      telefone: "",
      email: "",
      obs: "",
      carro: "",
      tripId: trip.id,
    }));

    return initial.map((row) => {
      const matching = reservations.find((r) => Number(r.lugar) === row.lugar);
      if (matching) {
        return {
          ...row,
          ...matching,
          id: matching.id,         // ID real para o backend (não visível)
          lugar: matching.lugar,   // Exibe o número do lugar
        };
      } else {
        // Para lugares vazios, criamos um ID temporário único
        return {
          ...row,
          id: `temp-${trip.id}-${row.lugar}`,
        };
      }
    });
  };

  // 3. Atualizar seleção
  const handleSelectionChange = (tripId, newSelection, allRows) => {
    const selectedFromTrip = allRows.filter((row) =>
      newSelection.includes(row.id)
    );
    setSelectedReservations((prev) => [
      ...prev.filter((res) => res.tripId !== tripId),
      ...selectedFromTrip,
    ]);
  };

  // 4. Transferir reservas entre viagens (suportando mover para lugar vazio)
  const handleTransferReservations = async () => {
    if (selectedReservations.length !== 2) {
      alert("Selecione exatamente duas linhas (uma reserva e/ou um lugar vazio) para trocar ou mover.");
      return;
    }
    const [res1, res2] = selectedReservations;
    if (res1.tripId === res2.tripId) {
      alert("As reservas devem pertencer a viagens diferentes.");
      return;
    }
    // Verificar se a linha é uma reserva real ou um lugar vazio
    const res1Empty = typeof res1.id === "string" && res1.id.startsWith("temp-");
    const res2Empty = typeof res2.id === "string" && res2.id.startsWith("temp-");
    
    if (res1Empty && res2Empty) {
      alert("Selecione pelo menos uma reserva existente para mover.");
      return;
    }
    
    try {
      if (!res1Empty && !res2Empty) {
        // Ambos são reservas reais: efetua o swap
        const updatedRes1 = { ...res1, tripId: res2.tripId, lugar: res2.lugar };
        const updatedRes2 = { ...res2, tripId: res1.tripId, lugar: res1.lugar };
        await updateReservationInBackend(updatedRes1);
        await updateReservationInBackend(updatedRes2);
      } else if (!res1Empty && res2Empty) {
        // res1 é real e res2 é vazio: mover a reserva res1 para o lugar vazio (na viagem de res2)
        const updatedRes1 = { ...res1, tripId: res2.tripId, lugar: res2.lugar };
        await updateReservationInBackend(updatedRes1);
      } else if (res1Empty && !res2Empty) {
        // res2 é real e res1 é vazio: mover a reserva res2 para o lugar vazio (na viagem de res1)
        const updatedRes2 = { ...res2, tripId: res1.tripId, lugar: res1.lugar };
        await updateReservationInBackend(updatedRes2);
      }
      
      fetchTripDetails();
      setSelectedReservations([]);
      setRowSelectionModelMap({});
      alert("Operação realizada com sucesso!");
    } catch (error) {
      console.error("Erro ao transferir reservas:", error);
      alert("Ocorreu um erro ao transferir as reservas.");
    }
  };

  // 5. Atualizar reserva no backend
  const updateReservationInBackend = async (updatedReservation) => {
    const response = await fetch(
      `https://backendreservasnunes.advir.pt/reservations/${updatedReservation.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedReservation),
      }
    );
    if (!response.ok) {
      throw new Error("Erro ao atualizar a reserva");
    }
    return response.json();
  };

  // 6. Definir as colunas do DataGrid (o campo "lugar" é mostrado, mas o id interno é oculto)
  const columns = [
    { field: "lugar", headerName: "Lugar", width: 60 },
    { field: "reserva", headerName: "Reserva", width: 80 },
    { field: "nomePassageiro", headerName: "Nome", width: 120 },
    { field: "apelidoPassageiro", headerName: "Apelido", width: 120 },
    { field: "obs", headerName: "Obs.", width: 80 },
  ];

  if (loading) return <Typography>Carregando reservas...</Typography>;

  return (
    <Box sx={{ marginTop: 4 }}>
      <Button
        variant="contained"
        color="primary"
        disabled={
          selectedReservations.length !== 2 ||
          (selectedReservations.length === 2 &&
            selectedReservations[0].tripId === selectedReservations[1].tripId)
        }
        onClick={handleTransferReservations}
      >
        Trocar/Mover Reservas entre Viagens
      </Button>

      <Grid container spacing={2}>
        {tripDetails.map((detail, index) => {
          if (!detail || !detail.trip) {
            return (
              <Grid item xs={12} md={6} key={index}>
                <Typography>Nenhuma informação para esta viagem.</Typography>
              </Grid>
            );
          }
          const combinedRows = combineReservations(detail.trip, detail.reservations);
          const currentRowSelectionModel = rowSelectionModelMap[detail.trip.id] || [];

          return (
            <Grid item xs={12} md={6} key={index}>
              <Typography variant="h6" gutterBottom>
                {detail.trip.origemCidade} → {detail.trip.destinoCidade} -{" "}
                {new Date(detail.trip.dataviagem).toLocaleDateString("pt-PT")}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Autocarro: {detail.trip.Bus?.nome || "N/D"} | Motorista:{" "}
                {detail.trip.motorista}
              </Typography>

              <Box sx={{ height: 1000, width: "100%" }}>
                <DataGrid
                  rows={combinedRows}
                  columns={columns}
                  pageSize={10}
                  checkboxSelection
                  disableRowSelectionOnClick={false}
                  hideFooter
                  rowSelectionModel={currentRowSelectionModel}
                  onRowSelectionModelChange={(newSelection) => {
                    setRowSelectionModelMap((prev) => ({
                      ...prev,
                      [detail.trip.id]: newSelection,
                    }));
                    handleSelectionChange(detail.trip.id, newSelection, combinedRows);
                  }}
                />
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default DualReservationsTables;
