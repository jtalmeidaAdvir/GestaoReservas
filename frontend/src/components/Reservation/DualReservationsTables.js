import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Typography, Grid, Button } from "@mui/material";

// Função auxiliar para descobrir se a row já está selecionada
// e em que posição está em selectedReservations
function findSelectedIndex(selectedReservations, row) {
  return selectedReservations.findIndex(
    (res) => res.tripId === row.tripId && res.id === row.id
  );
}

const DualReservationsTables = ({ tripIds }) => {
  const [tripDetails, setTripDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  // Array de objetos com as linhas selecionadas (ordem de seleção)
  const [selectedReservations, setSelectedReservations] = useState([]);

  // Determinar a viagem inativa (a terceira, se existir)
  const inactiveTripId = tripIds && tripIds.length >= 3 ? tripIds[2] : null;

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
          id: matching.id, // ID real (do backend)
          lugar: matching.lugar,
        };
      } else {
        // Se não há reserva, cria ID temporário
        return {
          ...row,
          id: `temp-${trip.id}-${row.lugar}`,
        };
      }
    });
  };

  // 3. Alternar a seleção de uma linha (desativar para viagem inativa)
  const toggleSelection = (row) => {
    if (inactiveTripId && row.tripId === inactiveTripId) {
      // Se a linha pertence à viagem inativa, não permite seleção.
      return;
    }
    setSelectedReservations((prev) => {
      const index = findSelectedIndex(prev, row);
      if (index === -1) {
        // Não estava selecionada -> adicionar
        return [...prev, row];
      } else {
        // Já estava selecionada -> remover
        const newArr = [...prev];
        newArr.splice(index, 1);
        return newArr;
      }
    });
  };

  // 4. Agrupar as reservas selecionadas por tripId (para a lógica de troca)
  const groupSelectedReservations = () => {
    return selectedReservations.reduce((acc, res) => {
      if (!acc[res.tripId]) {
        acc[res.tripId] = [];
      }
      acc[res.tripId].push(res);
      return acc;
    }, {});
  };

  // 5. Transferir reservas (swap/move) em pares de viagens
  const handleTransferReservations = async () => {
    const groups = groupSelectedReservations();
    const groupKeys = Object.keys(groups);
    if (groupKeys.length !== 2) {
      alert("Selecione reservas de exatamente duas viagens.");
      return;
    }
    const groupA = groups[groupKeys[0]];
    const groupB = groups[groupKeys[1]];
    if (groupA.length !== groupB.length) {
      alert(
        "Para realizar a troca, o número de reservas selecionadas em cada viagem deve ser igual."
      );
      return;
    }
    try {
      for (let i = 0; i < groupA.length; i++) {
        const resA = groupA[i];
        const resB = groupB[i];
        const resAEmpty =
          typeof resA.id === "string" && resA.id.startsWith("temp-");
        const resBEmpty =
          typeof resB.id === "string" && resB.id.startsWith("temp-");

        if (!resAEmpty && !resBEmpty) {
          // Ambas são reservas reais => swap
          const updatedResA = { ...resA, tripId: resB.tripId, lugar: resB.lugar };
          const updatedResB = { ...resB, tripId: resA.tripId, lugar: resA.lugar };
          await updateReservationInBackend(updatedResA);
          await updateReservationInBackend(updatedResB);
        } else if (!resAEmpty && resBEmpty) {
          // Move resA para o lugar vazio de B
          const updatedResA = { ...resA, tripId: resB.tripId, lugar: resB.lugar };
          await updateReservationInBackend(updatedResA);
        } else if (resAEmpty && !resBEmpty) {
          // Move resB para o lugar vazio de A
          const updatedResB = { ...resB, tripId: resA.tripId, lugar: resA.lugar };
          await updateReservationInBackend(updatedResB);
        }
      }
      fetchTripDetails();
      setSelectedReservations([]);
      alert("Reservas trocadas/movidas com sucesso!");
    } catch (error) {
      console.error("Erro ao transferir reservas:", error);
      alert("Ocorreu um erro ao transferir as reservas.");
    }
  };

  // 6. Atualizar reserva no backend
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

  // 7. Coluna de seleção: 
  // A 1ª seleção do par (índice par) é "fonte" e não mostra nada.
  // A 2ª seleção do par (índice ímpar) mostra o lugar da 1ª seleção do par.
  const columns = [
    {
      field: "selection",
      headerName: "",
      width: 50,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        // Se a linha pertence à viagem inativa, renderiza sem opção de seleção
        if (inactiveTripId && params.row.tripId === inactiveTripId) {
          return (
            <Box
              sx={{
                width: 25,
                height: 25,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "grey",
                border: "1px solid #ccc",
                color: "white",
                fontWeight: "bold",
                fontSize: "0.8rem",
                cursor: "not-allowed",
              }}
            >
              {/* Ícone ou texto opcional */}
            </Box>
          );
        }

        // Comportamento normal
        const index = findSelectedIndex(selectedReservations, params.row);
        const isChecked = index !== -1;

        let bgColor = "transparent";
        let content = "";

        if (isChecked) {
          if (index % 2 === 0) {
            // Índice par => "fonte" (Reserva Selecionada)
            bgColor = "orange";
            content = "";
          } else {
            // Índice ímpar => "destino" (Reserva Destino)
            bgColor = "blue";
            const prevIndex = index - 1;
            if (prevIndex >= 0) {
              const prevRow = selectedReservations[prevIndex];
              content = prevRow ? String(prevRow.lugar) : "";
            }
          }
        }

        return (
          <Box
            onClick={(e) => {
              e.stopPropagation();
              toggleSelection(params.row);
            }}
            sx={{
              width: 25,
              height: 25,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              backgroundColor: bgColor,
              border: "1px solid #ccc",
              color: isChecked ? "white" : "inherit",
              fontWeight: "bold",
              fontSize: "0.8rem",
            }}
          >
            {content}
          </Box>
        );
      },
    },
    { field: "lugar", headerName: "Lugar", width: 60 },
    { field: "reserva", headerName: "Reserva", width: 80 },
    { field: "nomePassageiro", headerName: "Nome", width: 120 },
    { field: "apelidoPassageiro", headerName: "Apelido", width: 120 },
    { field: "obs", headerName: "Obs.", width: 300 },
  ];

  if (loading) return <Typography>Carregando reservas...</Typography>;

  return (
    <Box sx={{ marginTop: 4 }}>
      {/* Legenda */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        
      
      <Button
        variant="contained"
        color="error"
        disabled={selectedReservations.length === 0}
        onClick={handleTransferReservations}
        sx={{ mb: 2 }}
        style={{ backgroundColor: "darkred", color: "white" }}
      >
        Trocar/Mover Reservas Entre Viagens
      </Button>
      <Typography variant="body2"> </Typography>
      <Box
          sx={{
            width: 25,
            height: 25,
            borderRadius: "50%",
            backgroundColor: "orange",
            mr: 1,
          }}
        />
        <Typography variant="body2" sx={{ mr: 2 }}>
          Reserva Selecionada
        </Typography>
        <Box
          sx={{
            width: 25,
            height: 25,
            borderRadius: "50%",
            backgroundColor: "blue",
            mr: 1,
          }}
        />
        <Typography variant="body2">Reserva Destino</Typography>
      </Box>

      <Grid
        container
        spacing={2}
        wrap="nowrap"
        sx={{ overflowX: "auto" }}
      >
        {tripDetails.map((detail, index) => {
          if (!detail || !detail.trip) {
            return (
              <Grid item key={index}>
                <Typography>Nenhuma informação para esta viagem.</Typography>
              </Grid>
            );
          }
          const combinedRows = combineReservations(
            detail.trip,
            detail.reservations
          );

          return (
            <Grid item key={index}>
              <Typography variant="h6" gutterBottom>
                {detail.trip.origemCidade} → {detail.trip.destinoCidade} -{" "}
                {new Date(detail.trip.dataviagem).toLocaleDateString("pt-PT")}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Autocarro: {detail.trip.Bus?.nome || "N/D"} | Motorista:{" "}
                {detail.trip.motorista}
              </Typography>

              <Box sx={{ width: "100%", height: 900 }}>
                <DataGrid
                  rows={combinedRows}
                  columns={columns}
                  pageSize={10}
                  hideFooter
                  disableRowSelectionOnClick
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
