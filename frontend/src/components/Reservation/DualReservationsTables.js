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
          fetch(`http://localhost:3010/trips/trip/${tripId}`)
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
      return;
    }
  
    const index = findSelectedIndex(selectedReservations, row);
  
    // Desselecionar se já estava selecionada
    if (index !== -1) {
      setSelectedReservations((prev) => {
        const newArr = [...prev];
        newArr.splice(index, 1);
        return newArr;
      });
      return;
    }
  
    // Se for a primeira seleção, tem de ser da 1ª viagem
    if (selectedReservations.length === 0 && row.tripId !== tripIds[0]) {
  
      return;
    }
  
    // Se for a segunda seleção, tem de ser de uma viagem diferente
    if (selectedReservations.length % 2 === 1) {
      const lastSelected = selectedReservations[selectedReservations.length - 1];
      if (lastSelected.tripId === row.tripId) {
    
        return;
      }
    }
  
    setSelectedReservations((prev) => [...prev, row]);
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
      `http://localhost:3010/reservations/${updatedReservation.id}`,
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
    {
      field: "reserva",
      headerName: "Reserva",
      width: 80,
      sortable: false,
      editable: false,
      renderCell: (params) => {
        const valor = (params.value || "").trim();
    
        // Se for em bloco, tipo "0003.1", mostra "*"
        if (/^\d{4}\.\d+$/.test(valor)) {
          return "*";
        }
    
        // Se for de volta, tipo "0003.v" ou "0034.v", mostra "0003" ou "0034"
        if (/^\d{1,4}\.v$/i.test(valor)) {
          return valor.split(".")[0]; // mostra só a parte antes de ".v"
        }
    
        // Caso normal
        return valor;
      },
    }
    ,
    
    { field: "entrada", headerName: "Entrada", width: 80 },
    { field: "nomePassageiro", headerName: "Nome", width: 120 },
    { field: "apelidoPassageiro", headerName: "Apelido", width: 120 },
    { field: "saida", headerName: "Saída", width: 80 },
    { field: "obs", headerName: "Obs.", width: 300 },
  ];

  if (loading) return <Typography>Carregando reservas...</Typography>;

  return (
    <Box sx={{ marginTop: 4 }}>
      {/* Legenda */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        
      
      
      
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

      <Grid
        container
        spacing={2}
        wrap="nowrap"
        sx={{ overflowX: "auto" }}
      >
        {tripDetails.map((detail, index) => {
          const buffer = detail.trip.Bus.imagem?.data;
          const busImage = buffer
            ? `data:image/png;base64,${btoa(
                new Uint8Array(buffer).reduce((acc, byte) => acc + String.fromCharCode(byte), "")
              )}`
            : null;
          

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
            <Grid item key={index} sx={{ minWidth: 1100 }}>
              <Typography variant="h6" gutterBottom>
                {detail.trip.origem} → {detail.trip.destino} 🚌 {detail.trip.Bus.nome}
             
              </Typography>
          
              <Box sx={{ display: "flex", gap: 4 }}>
                {/* DataGrid */}
                <Box sx={{ flex: 1, height: 900 }}>
                  <DataGrid
                    rows={combinedRows}
                    columns={columns}
                    pageSize={10}
                    
                    pagination
                    
                    disableRowSelectionOnClick
                  />
                </Box>
          
                {/* Imagem do autocarro */}
                
                {detail.trip.Bus?.imagem && (
                  <Box
                    sx={{
                      maxWidth: 250,
                      minWidth: 200,
                      textAlign: "center",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      mt: 4,
                    }}
                  >
                    <img
                      src={`data:image/png;base64,${btoa(
                        new Uint8Array(detail.trip.Bus.imagem.data).reduce(
                          (acc, byte) => acc + String.fromCharCode(byte),
                          ""
                        )
                      )}`}
                      alt="Autocarro"
                      style={{
                        width: "100%",
                        maxHeight: "850px",
                        objectFit: "contain",
                        borderRadius: "8px",
                      }}
                    />
                  </Box>
                  
                )}
              </Box>
              
            </Grid>
          );
          
        })}
      </Grid>
      
      
    </Box>
  );
};

export default DualReservationsTables;
