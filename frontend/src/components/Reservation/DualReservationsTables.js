import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Typography, Grid, Button, TextField } from "@mui/material";
import { SlArrowLeft,SlArrowRight } from "react-icons/sl";




// Função auxiliar para descobrir se a row já está selecionada
// e em que posição está em selectedReservations
function findSelectedIndex(selectedReservations, row) {
  return selectedReservations.findIndex(
    (res) => res.tripId === row.tripId && res.id === row.id
  );
}

const DualReservationsTables = ({ tripIds, onReservationsUpdated }) => {
  const [tripDetails, setTripDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerms, setSearchTerms] = useState({});
  const [sourceReservations, setSourceReservations] = useState([]);
  const [targetReservations, setTargetReservations] = useState([]);
  

  // Array de objetos com as linhas selecionadas (ordem de seleção)
  const [selectedReservations, setSelectedReservations] = useState([]);

  // Determinar a viagem inativa (a terceira, se existir)
  const inactiveTripId = tripIds && tripIds.length >= 3 ? tripIds[2] : null;


  const filterRows = (rows, term) => {
    if (!term) return rows;
    const lowered = term.toLowerCase();
    return rows.filter(row =>
      ["reserva", "entrada", "nomePassageiro", "apelidoPassageiro", "saida", "obs"].some(field =>
        (row[field] || "").toString().toLowerCase().includes(lowered)
      )
    );
  };
  


  // 1. Buscar detalhes das viagens
  const fetchTripDetails = async () => {
    if (!tripIds || tripIds.length === 0) return;
    setLoading(true);
    try {
      const responses = await Promise.all(
        tripIds.map((tripId) =>
          fetch(`https://nunes.entriga.pt/backend/trips/trip/${tripId}`)
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
    // Impedir interação com a viagem inativa
    if (inactiveTripId && row.tripId === inactiveTripId) return;
  
    // Está na fonte?
    if (sourceReservations.find(r => r.id === row.id && r.tripId === row.tripId)) {
      setSourceReservations(prev => prev.filter(r => !(r.id === row.id && r.tripId === row.tripId)));
      return;
    }
  
    // Está no destino?
    if (targetReservations.find(r => r.id === row.id && r.tripId === row.tripId)) {
      setTargetReservations(prev => prev.filter(r => !(r.id === row.id && r.tripId === row.tripId)));
      return;
    }
  
    // Se ainda não temos fonte definida
    if (sourceReservations.length === 0) {
      setSourceReservations([row]);
      return;
    }
  
    const sourceTripId = sourceReservations[0].tripId;
  
    if (row.tripId === sourceTripId) {
      setSourceReservations(prev => [...prev, row]);
    } else {
      // Diferente da fonte => destino
      if (targetReservations.length >= sourceReservations.length) return;
      setTargetReservations(prev => [...prev, row]);
    }
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
    if (
      sourceReservations.length === 0 ||
      targetReservations.length === 0 ||
      sourceReservations.length !== targetReservations.length
    ) {
      alert("Tem de selecionar o mesmo número de reservas e lugares destino.");
      return;
    }
  
    try {
      for (let i = 0; i < sourceReservations.length; i++) {
        const resA = sourceReservations[i];
        const resB = targetReservations[i];
  
        const isResBEmpty = typeof resB.id === "string" && resB.id.startsWith("temp-");
  
        if (!isResBEmpty) {
          // Swap
          const updatedResA = { ...resA, tripId: resB.tripId, lugar: resB.lugar };
          const updatedResB = { ...resB, tripId: resA.tripId, lugar: resA.lugar };
          await updateReservationInBackend(updatedResA);
          await updateReservationInBackend(updatedResB);
        } else {
          // Só move
          const updatedResA = { ...resA, tripId: resB.tripId, lugar: resB.lugar };
          await updateReservationInBackend(updatedResA);
        }
      }
      fetchTripDetails();
      setSourceReservations([]);
      setTargetReservations([]);
      alert("Reservas movidas com sucesso!");
      if (onReservationsUpdated) onReservationsUpdated(); // 🚀 notifica o parent!

    } catch (error) {
      console.error("Erro ao mover reservas:", error);
      alert("Erro ao mover reservas.");
    }
  };
  

  // 6. Atualizar reserva no backend
  const updateReservationInBackend = async (updatedReservation) => {
    const response = await fetch(
      `https://nunes.entriga.pt/backend/reservations/${updatedReservation.id}`,
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
        const isSource = sourceReservations.some(r => r.id === params.row.id && r.tripId === params.row.tripId);
        const isTarget = targetReservations.some(r => r.id === params.row.id && r.tripId === params.row.tripId);
        
        let bgColor = "transparent";
        let content = "";
        
        if (isSource) {
          bgColor = "orange";
        } else if (isTarget) {
          bgColor = "blue";
          const index = targetReservations.findIndex(r => r.id === params.row.id && r.tripId === params.row.tripId);
          const sourceRow = sourceReservations[index];
          if (sourceRow) content = String(sourceRow.lugar);
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
              color: isSource || isTarget ? "white" : "inherit",

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
   

     <Grid container spacing={2} wrap="nowrap" sx={{ overflowX: "auto" }}>
  {tripDetails.map((detail, index) => {
    const tripId = detail.trip?.id;
    if (!detail || !tripId) {
      return (
        <Grid item key={index}>
          <Typography>Nenhuma informação para esta viagem.</Typography>
        </Grid>
      );
    }

    const buffer = detail.trip.Bus.imagem?.data;
    const busImage = buffer
      ? `data:image/png;base64,${btoa(
          new Uint8Array(buffer).reduce((acc, byte) => acc + String.fromCharCode(byte), "")
        )}`
      : null;

    const combinedRows = combineReservations(detail.trip, detail.reservations);
    const filteredRows = filterRows(combinedRows, searchTerms[tripId]);
    const isDefaultTrip = tripId === tripIds[0];


    return (
      <React.Fragment key={tripId}>
        <Grid item sx={{ minWidth: 1100 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="h6" gutterBottom>
              {detail.trip.origem} → {detail.trip.destino} 🚌 {detail.trip.Bus.nome}
            </Typography>
            
          </Box>
          <TextField
              label="Pesquisar reservas"
              variant="outlined"
              size="small"
              value={searchTerms[tripId] || ""}
              onChange={(e) =>
                setSearchTerms((prev) => ({
                  ...prev,
                  [tripId]: e.target.value,
                }))
              }
              sx={{ minWidth: 915, mb: 2, backgroundColor: "white" }}
            />
          <Box sx={{ display: "flex", gap: 4 }}>
            <Box
              sx={{
                flex: 1,
                height: 900,
                border: isDefaultTrip ? "2px solid green" : "none",
                borderRadius: "8px",
              }}
            >
              <DataGrid
                rows={filteredRows}
                columns={columns}
                pageSize={10}
                pagination
                disableRowSelectionOnClick
              />
            </Box>

            {busImage && (
              <Box
                sx={{
                  maxWidth: 350,
                  minWidth: 300,
                  textAlign: "center",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  mt: 4,
                }}
              >
                <img
                  src={busImage}
                  alt="Autocarro"
                  style={{
                    width: "100%",
                    maxHeight: "950px",
                    objectFit: "contain",
                    borderRadius: "8px",
                  }}
                />
              </Box>
            )}
          </Box>
        </Grid>

        {/* BOTÃO ENTRE AS DUAS VIAGENS SELECIONADAS */}

        {index === 0 && (
  <Grid
    item
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 300,
    }}
  >
    <Button
      variant="contained"
      color="error"
      onClick={handleTransferReservations}
      style={{
        backgroundColor: "darkred",
        color: "white",
        padding: "10px 20px",
      }}
    >
      <SlArrowLeft /><SlArrowRight />
    </Button>
  </Grid>
)}

          
      </React.Fragment>
    );
  })}
</Grid>

      
      
    </Box>
  );
};

export default DualReservationsTables;
