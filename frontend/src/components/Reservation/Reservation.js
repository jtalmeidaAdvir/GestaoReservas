import React, { useState, useEffect, useRef } from "react";
import { DataGrid,DataGridPro, useGridApiRef } from "@mui/x-data-grid";

import * as XLSX from "xlsx";
import {
  Button,
  Box,
  IconButton,
  Typography,
  TextField,
  Autocomplete,
  Modal,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { io } from "socket.io-client";
import BusChangeModal from "./Moves/BusChangeModal";
import handlePrintList from "./Tickets/PrintList";
import handlePrintTicket from "./Tickets/PrintTicket";
import handlePrintAllTickets from "./Tickets/PrintAllTickets";
import { calculatePriceCounts, calculatePrecoTotal, calculateCloseSummary, calculateEntrySummary } from "./Tickets/Summarys";
import MoveReservationModal from "./Moves/MoveReservationModal";
import MoveReservationTripModal from "./Moves/MoveReservationTripModal";
import MoveReservationsBatchModal from "./Moves/MoveReservationsBatchModal";
import SelectReturnSeatModal from "./SelectReturnSeatModal";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import DeleteIcon from '@mui/icons-material/Delete';

import InputMask from "react-input-mask";


const socket = io("https://backendreservasnunes.advir.pt", {
  transports: ["websocket"],
  path: "/socket.io/",
  reconnectionAttempts: 5,
  reconnectionDelay: 3000,
  timeout: 5000
});

const Reservation = ({ tripId }) => {
  console.log("📌 tripId recebido no Reservation:", tripId);

  // Estados da aplicação
  const [datatrip, setDataTrip] = useState(null);
  const [origemtrip, setOrigemTrip] = useState(null);
  const [destinotrip, setDestinoTrip] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [motorista, setMotorista] = useState([]);
  const [origem, setorigem] = useState([]);
  const [destino, setdestino] = useState([]);
  const [busSeats, setBusSeats] = useState(0);
  const [busImage, setBusImage] = useState("");
  const [busName, setBusName] = useState("");
  const [entrySummary, setEntrySummary] = useState({}); // Resumo das entradas
  const [closeSummary, setCloseSummary] = useState({}); // Resumo das saídas
  const [loading, setLoading] = useState(true);
  const [totalPreco, setTotalPreco] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [priceCounts, setPriceCounts] = useState({});
  const [draggedReservation, setDraggedReservation] = useState(null);
  const [modalMoveOpen, setModalMoveOpen] = useState(false);
  const [reservationToMove, setReservationToMove] = useState(null);
  const [modalMoveTripOpen, setModalMoveTripOpen] = useState(false);
  const [reservationToMoveTrip, setReservationToMoveTrip] = useState(null);
  const [availableTrips, setAvailableTrips] = useState([]);
  const [selectedReservations, setSelectedReservations] = useState([]);
  const [modalMoveBatchOpen, setModalMoveBatchOpen] = useState(false);
  const [reserva, setReserva] = useState("");
  const [quantidadePassageiros, setQuantidadePassageiros] = useState(1);
  const [modalReturnOpen, setModalReturnOpen] = useState(false);
  const [modalMoveWithinTripOpen, setModalMoveWithinTripOpen] = useState(false);
  const [returnTripId, setReturnTripId] = useState(null);
  const [returnReservationData, setReturnReservationData] = useState(null);
  const [emailDestinatario, setEmailDestinatario] = useState("");
  const [cities, setCities] = useState([]);
  const [rowSelectionModel, setRowSelectionModel] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  // Estado para a reserva copiada (para cópia/colagem)
  const [copiedReservation, setCopiedReservation] = useState(null);
  const [tripNotas, setTripNotas] = useState("");
  const [notasCarregadas, setNotasCarregadas] = useState(false);
  const [prices, setPrices] = useState([]);



  const apiRef = useGridApiRef();

  const storedTripId = localStorage.getItem("selectedTripId");
  const storedDate = localStorage.getItem("selectedDate");
  const [searchFilter, setSearchFilter] = useState("");

  // Ler do localStorage no useEffect, antes ou depois do fetchReservations
  useEffect(() => {
    const storedFilter = localStorage.getItem("searchFilter");
    if (storedFilter) {
      setSearchFilter(storedFilter);
    }
  }, []);



  const filteredReservations = reservations.filter((r) => {
    if (!searchFilter) return true;
    
    const lowerSearch = searchFilter.toLowerCase();
    
    // Exemplo: filtrar por 'reserva', 'nomePassageiro', 'apelidoPassageiro', telefone, etc.
    return (
      (r.reserva && r.reserva.toLowerCase().includes(lowerSearch)) ||
      (r.nomePassageiro && r.nomePassageiro.toLowerCase().includes(lowerSearch)) ||
      (r.apelidoPassageiro && r.apelidoPassageiro.toLowerCase().includes(lowerSearch)) ||
      (r.telefone && r.telefone.toLowerCase().includes(lowerSearch))
    );
  });
  




  // Se `tripId` ainda não estiver definido, tenta redirecionar automaticamente
  if (!tripId && storedTripId) {
    // Redireciona para o mesmo componente mas com o tripId da reserva
    window.location.href = `/trips/${storedTripId}`;
  }

  
  // Trocar a posição de duas reservas selecionadas
  const handleSwapReservations = async () => {
    if (selectedReservations.length !== 2) {
      alert("Por favor, selecione exatamente duas reservas para trocar de lugar.");
      return;
    }
    const [res1, res2] = selectedReservations;
    const novoLugarRes1 = res2.lugar;
    const novoLugarRes2 = res1.lugar;
  
    // Atualiza o estado alterando a posição (lugar) de cada reserva
    setReservations(prevReservations =>
      prevReservations.map(r => {
        if (r.id === res1.id) return { ...r, lugar: novoLugarRes1, id: novoLugarRes1 };
        if (r.id === res2.id) return { ...r, lugar: novoLugarRes2, id: novoLugarRes2 };
        return r;
      })
    );
  
    // Atualiza no backend apenas as reservas que tenham o campo "reserva" preenchido
    if (res1.reserva) {
      await handleRowEdit({ ...res1, lugar: novoLugarRes1 });
    }
    if (res2.reserva) {
      await handleRowEdit({ ...res2, lugar: novoLugarRes2 });
    }
  
    fetchReservations();
    apiRef.current.setRowSelectionModel([]);
  };
  


  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch("http://94.143.231.141:3010/prices");
        if (response.ok) {
          const data = await response.json();
          setPrices(data); // aqui guardamos o array de objetos
        } else {
          console.error("Erro ao obter prices:", response.status);
        }
      } catch (error) {
        console.error("Erro ao buscar prices:", error);
      }
    };
    fetchPrices();
  }, []);
  
  



  // Buscar a lista de cidades
  useEffect(() => {
    fetch("http://94.143.231.141:3010/cities")
      .then(response => response.json())
      .then(data => {
        console.log("📥 Resposta da API (cidades disponíveis):", data);
        const sortedCities = Array.isArray(data)
          ? data.sort((a, b) => a.nome.localeCompare(b.nome))
          : [];
        setCities(sortedCities);
      })
      .catch(error => {
        console.error("Erro ao carregar cidades:", error);
        setCities([]);
      });
  }, []);



  
  // Mover reservas dentro da mesma viagem (modal)
  const handleMoveReservationsWithinTrip = async (updates) => {
    console.log("🏁 Movendo reservas dentro da mesma viagem:", updates);
    setReservations(prevReservations =>
      prevReservations.map(res => {
        const update = updates.find(item => item.id === res.id);
        return update ? { ...res, lugar: update.newSeat } : res;
      })
    );
    for (const update of updates) {
      const reservation = reservations.find(r => r.id === update.id);
      if (reservation) {
        await handleRowEdit({
          ...reservation,
          lugar: update.newSeat
        });
      }
    }
    fetchReservations();
    apiRef.current.setRowSelectionModel([]);
  };




  // Modal para mover reservas dentro da mesma viagem
  const MoveReservationsWithinTripModal = ({ open, onClose, tripId, selectedReservations, onConfirm }) => {
    const [availableSeats, setAvailableSeats] = useState([]);
    const [reservationsWithSeats, setReservationsWithSeats] = useState([]);

    useEffect(() => {
      if (open) {
        fetch(`http://94.143.231.141:3010/reservations/trip/${tripId}`)
          .then(response => response.json())
          .then(data => {
            if (data && Array.isArray(data.freeSeats)) {
              const sortedSeats = [...data.freeSeats].sort((a, b) => a - b);
              setAvailableSeats(sortedSeats);
              setReservationsWithSeats(
                selectedReservations.map((res) => ({ ...res, selectedSeat: null }))
              );
            } else {
              setAvailableSeats([]);
            }
          })
          .catch(error => {
            console.error("Erro ao buscar lugares disponíveis:", error);
            setAvailableSeats([]);
          });
      }
    }, [open, tripId, selectedReservations]);

    useEffect(() => {
      if (reservationsWithSeats.length > 0 && reservationsWithSeats[0].selectedSeat) {
        const sortedSeats = [...availableSeats].sort((a, b) => a - b);
        const firstSeat = Number(reservationsWithSeats[0].selectedSeat);
        const startIndex = sortedSeats.findIndex(seat => Number(seat) >= firstSeat);
        if (startIndex !== -1) {
          const updated = reservationsWithSeats.map((res, index) => {
            if (index === 0) return res;
            if (res.selectedSeat == null) {
              return { ...res, selectedSeat: sortedSeats[startIndex + index] };
            }
            return res;
          });
          setReservationsWithSeats(updated);
        }
      }
    }, [reservationsWithSeats[0]?.selectedSeat, availableSeats]);

    const handleSeatSelection = (reservationId, seat) => {
      setReservationsWithSeats(prev =>
        prev.map(res =>
          res.id === reservationId ? { ...res, selectedSeat: seat } : res
        )
      );
    };

    const handleConfirmMove = () => {
      const updates = reservationsWithSeats.map(res => ({
        id: res.id,
        newSeat: res.selectedSeat,
      }));
      console.log("Reservas para mover:", updates);
      onConfirm(updates);
      onClose();
    };

    const isReadyToConfirm = reservationsWithSeats.every(res => res.selectedSeat);

    return (
      <Modal open={open} onClose={onClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            bgcolor: "background.paper",
            p: 4,
            boxShadow: 25,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6">
            Mover {selectedReservations.length} Reserva(s)
          </Typography>
          <Box sx={{ mt: 2 }}>
            {reservationsWithSeats.map((res) => (
              <Box key={res.id} sx={{ display: "flex", flexDirection: "column", mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Typography sx={{ width: "40%" }}>
                    {res.nomePassageiro || `Reserva: ${res.reserva}`}
                  </Typography>
                  <Select
                    value={res.selectedSeat || ""}
                    onChange={(e) => handleSeatSelection(res.id, e.target.value)}
                    sx={{ width: "60%" }}
                  >
                    {availableSeats
                      .filter(seat =>
                        !reservationsWithSeats.some(
                          r => r.id !== res.id && r.selectedSeat === seat
                        )
                      )
                      .map(seat => (
                        <MenuItem key={seat} value={seat}>
                          Lugar {seat}
                        </MenuItem>
                      ))}
                  </Select>
                </Box>
              </Box>
            ))}
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
            <Button variant="contained" style={{ backgroundColor: "darkred", color: "white" }} onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              style={{ backgroundColor: "darkred", color: "white" }}
              onClick={handleConfirmMove}
              disabled={!isReadyToConfirm}
            >
              Confirmar
            </Button>
          </Box>
        </Box>
      </Modal>
    );
  };

  // Enviar email com os dados da viagem
  const handleSendEmail = (motorista, origem, destino, datatrip, busName) => {
    const destinatario = "";
    const assunto = `Documentos da Viagem de ${origem} → ${destino} - ${datatrip} - ${busName}`;
    const corpo = `Olá,\n\nSegue abaixo as informações da viagem:\n\n🚌 Motorista: ${motorista}\n📍 Origem: ${origem}\n📍 Destino: ${destino}\n📅 Data: ${datatrip}\n🚍 Autocarro: ${busName}\n\nCumprimentos,\n`;
    const mailtoLink = `mailto:${destinatario}?subject=${encodeURIComponent(
      assunto
    )}&body=${encodeURIComponent(corpo)}`;
    window.location.href = mailtoLink;
  };

  // Mover reserva para um novo lugar dentro da mesma viagem
  const handleMoveReservation = async (newSeat) => {
    setReservations(prevReservations => {
      let updatedReservations = [...prevReservations];
      const originalIndex = updatedReservations.findIndex(res => res.id === reservationToMove.id);
      const newPositionIndex = updatedReservations.findIndex(res => res.id === newSeat);

      if (originalIndex !== -1 && newPositionIndex !== -1) {
        const reservaOriginal = { ...updatedReservations[originalIndex] };
        updatedReservations[originalIndex] = {
          id: updatedReservations[originalIndex].id,
          lugar: updatedReservations[originalIndex].id,
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
          reserva: ""
        };
        updatedReservations[newPositionIndex] = {
          ...reservaOriginal,
          id: newSeat,
          lugar: newSeat
        };
        console.log(`✅ Reserva movida para o lugar ${newSeat}`);
        handleRowEdit(updatedReservations[newPositionIndex]);
      }
      return updatedReservations;
      apiRef.current.setRowSelectionModel([]);
    });
  };

  // Mover reserva para outra viagem
  const handleMoveReservationTrip = async (newTripId, newSeat, newTripDate) => {
    setReservations(prevReservations => {
      let updatedReservations = [...prevReservations];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const originalIndex = updatedReservations.findIndex(res => res.id === reservationToMoveTrip.id);

      if (originalIndex !== -1) {
        const reservaOriginal = {
          ...updatedReservations[originalIndex],
          tripId: newTripId,
          lugar: newSeat,
          tripDate: newTripDate
        };
        updatedReservations.splice(originalIndex, 1);
        console.log(`✅ Reserva movida para a viagem ${newTripId} no lugar ${newSeat}`);
        handleRowEdit(reservaOriginal);
      }
      return updatedReservations.filter(res => {
        if (!res.tripDate) return false;
        const tripDate = new Date(res.tripDate);
        tripDate.setHours(0, 0, 0, 0);
        return tripDate >= today;
      });
    });
  };

// Eliminar reserva
const handleDeleteReservation = async (numeroReserva) => {
  console.log("🔍 Tentando eliminar reserva com número:", numeroReserva);

  if (!numeroReserva) {
    console.error("❌ Número de reserva inválido");
    return;
  }

  // Define o identificador da reserva de regresso com base na reserva principal
  const voltaReservaNumber = `${numeroReserva}.v`;

  // Tentar obter a reserva de regresso diretamente do backend
  let reservaVolta = null;
  try {
    const voltaResponse = await fetch(`http://94.143.231.141:3010/reservations/by-reserva/${voltaReservaNumber}`);
    if (voltaResponse.ok) {
      reservaVolta = await voltaResponse.json();
    }
  } catch (error) {
    console.error("Erro ao obter reserva de volta:", error);
  }

  // Criar mensagem de confirmação
  let confirmMessage = `Tem certeza que deseja eliminar a reserva Nº ${numeroReserva}?`;
  if (reservaVolta) {
    confirmMessage = `A reserva Nº ${numeroReserva} tem uma reserva de regresso associada (${voltaReservaNumber}).\nAo eliminar esta reserva, a reserva de regresso também será eliminada.\nTem certeza que deseja continuar?`;
  }

  if (!window.confirm(confirmMessage)) {
    return;
  }

  try {
    // Eliminar a reserva principal
    const response = await fetch(`http://94.143.231.141:3010/reservations/delete/${numeroReserva}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro ao eliminar reserva principal:", errorText);
      return;
    }

    // Se existir uma reserva de regresso, eliminá-la também
    if (reservaVolta) {
      const voltaDeleteResponse = await fetch(`http://94.143.231.141:3010/reservations/delete/${voltaReservaNumber}`, {
        method: "DELETE",
      });
      if (!voltaDeleteResponse.ok) {
        const errorText = await voltaDeleteResponse.text();
        console.error("Erro ao eliminar reserva de regresso:", errorText);
      }
    }

    alert(`Reserva Nº ${numeroReserva} eliminada com sucesso!`);
    fetchReservations();
  } catch (error) {
    console.error("🔥 Erro ao eliminar reserva:", error);
  }
};

const handleGenerateTicket = async (row) => {
  try {
    let newBilheteNumber = row.bilhete;

    // Se a reserva ainda não tiver bilhete, buscar do backend
    if (!newBilheteNumber) {
      const lastTicketResponse = await fetch("http://94.143.231.141:3010/reservations/lastTicket");
      if (!lastTicketResponse.ok) {
        throw new Error("Erro ao obter último nº de bilhete");
      }
      const lastTicketData = await lastTicketResponse.json();
      // Se vier algo como { bilhete: "0001" }
      // ou { bilhete: 1 } (dependendo de como o backend guarda),
      // converte sempre para inteiro:
      newBilheteNumber = parseInt(lastTicketData.bilhete, 10) + 1;
    } else {
      // Se já houver "alguma coisa" no row.bilhete,
      // também converte para inteiro para garantir que não concatenas:
      newBilheteNumber = parseInt(newBilheteNumber, 10);
      newBilheteNumber += 1;
    }

    // Agora formatamos com zeros à esquerda:
    const paddedBilhete = String(newBilheteNumber).padStart(4, "0");

    // Marca impresso e define o bilhete formatado
    const updatedReservation = {
      ...row,
      bilhete: paddedBilhete,
      impresso: true,
    };

    await handleRowEdit(updatedReservation, row, { skipReturnCreation: true });


    // Gera/imprime bilhete
    handlePrintTicket(updatedReservation, datatrip, formatDate);

    // Atualiza tabela
    fetchReservations();
    
  } catch (error) {
    console.error("Erro ao gerar bilhete:", error);
    alert("Não foi possível gerar o bilhete.");
  }
};


  
  // Alterar autocarro e reatribuir reservas
  const handleChangeBus = async (busId) => {
    try {
      const busInfoResponse = await fetch(`http://94.143.231.141:3010/buses/${busId}`);
      const busInfo = await busInfoResponse.json();

      if (!busInfo || !busInfo.nlugares) {
        alert("❌ Erro ao obter informações do novo autocarro.");
        return;
      }

      const newBusSeats = Number(busInfo.nlugares);
      console.log(`Novo Autocarro "${busInfo.nome}" tem ${newBusSeats} lugares.`);

      const activeReservations = reservations.filter(
        res => res.reserva && res.reserva.trim() !== ""
      );
      console.log("Reservas ativas:", activeReservations);
      activeReservations.forEach((r, i) => {
        console.log(`Ativa #${i}`, {
          reserva: r.reserva,
          lugar: r.lugar,
          nomePassageiro: r.nomePassageiro
        });
      });

      const invalidReservation = activeReservations.find(res => {
        const seatNumber = parseInt(res.lugar, 10);
        console.log(`Verificar reserva: ${res.reserva} (lugar=${res.lugar}) => seatNumber=`, seatNumber);
        return seatNumber > newBusSeats;
      });

      console.log("invalidReservation encontrado:", invalidReservation);

      if (invalidReservation) {
        alert(
          `❌ Não é possível mudar para este autocarro. 
             A reserva no lugar ${invalidReservation.lugar} 
             excede o número de lugares (${newBusSeats}).`
        );
        return;
      }

      const allSeats = Array.from({ length: newBusSeats }, (_, i) => i + 1);
      const occupiedSeats = [];
      console.log("🎟️ Lugares já ocupados no novo autocarro:", occupiedSeats.length);
      const availableSeats = allSeats.filter(seat => !occupiedSeats.includes(seat));
      console.log("✅ Lugares disponíveis no novo autocarro:", availableSeats.length);

      if (activeReservations.length > availableSeats.length) {
        alert(
          `❌ O novo autocarro tem apenas ${availableSeats.length} lugares disponíveis, 
             mas existem ${activeReservations.length} reservas ativas.`
        );
        return;
      }

      const updatedReservations = activeReservations.map((reservation, index) => ({
        ...reservation,
        lugar: availableSeats[index],
        tripId: tripId,
      }));

      const updateBusResponse = await fetch(`http://94.143.231.141:3010/trips/${tripId}/bus`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ busId }),
      });
      if (!updateBusResponse.ok) {
        console.error("❌ Erro ao atualizar autocarro:", await updateBusResponse.text());
        return;
      }

      for (const updatedRes of updatedReservations) {
        await handleRowEdit(updatedRes);
      }

      alert("✅ Autocarro atualizado e reservas reorganizadas com sucesso!");
      setModalOpen(false);
      fetchReservations();
      apiRef.current.setRowSelectionModel([]);
    } catch (error) {
      console.error("🔥 Erro ao mudar autocarro:", error);
    }
  };

  // Função para copiar uma reserva (guardar no estado)
  const handleCopyReservation = (row) => {
    // Cria uma cópia profunda do objeto
    setCopiedReservation(JSON.parse(JSON.stringify(row)));
  };
  
  
  

  // Função para colar a reserva copiada na linha com id (lugar) vazio
  const handlePasteReservation = async (rowId) => {
    if (!copiedReservation) {
      alert("Nenhuma reserva foi copiada.");
      return;
    }
  
    // Obter a base da reserva copiada (ex.: "0017")
    const baseReservation = copiedReservation.reserva;
  
    // Encontrar todas as reservas já com sufixo (ex.: "0017.1", "0017.2", etc.)
    const pastedReservations = reservations.filter(
      (res) => res.reserva && res.reserva.startsWith(baseReservation + ".")
    );
  
    // Calcular o próximo sufixo (se não houver, inicia em 1)
    const nextSuffix =
      pastedReservations.length > 0
        ? Math.max(
            ...pastedReservations.map((res) => {
              const parts = res.reserva.split(".");
              return parts.length > 1 ? parseInt(parts[1], 10) : 0;
            })
          ) + 1
        : 1;
  
    // Define o novo número de reserva com o sufixo calculado
    const newReservationNumber = `${baseReservation}.${nextSuffix}`;
  
    // Cria a nova reserva copiando os dados da reserva copiada,
    // atualizando 'id', 'lugar' e o número da reserva,
    // e substituindo os campos 'telefone', 'email', 'obs', 'volta' e 'carro'
    const newReservation = {
      ...copiedReservation,
      id: rowId,
      lugar: rowId,
      reserva: newReservationNumber,
      telefone: "*",
      email: "*",
      obs: "*",
      volta: "", // Não colar o valor original do campo "volta"
      carro: ""  // Não colar o valor original do campo "carro"
    };
  
    try {
      // Atualiza a reserva no backend
      await handleRowEdit(newReservation);
      // Atualiza a lista de reservas no estado
      setReservations((prev) => {
        const semDuplicarOriginal = prev.filter((r) => r.reserva !== newReservationNumber);
        return semDuplicarOriginal.map((r) => 
          r.id === rowId ? newReservation : r
        );
      });
      
      //alert("Reserva em bloco criada: " + newReservationNumber);
    } catch (error) {
      console.error("Erro ao criar reserva em bloco:", error);
    }
  };
  
  
  
  // Mover reservas em lote para outra viagem
  const handleMoveReservationsInBatch = async (newTripId, reservationsToMove) => {
    console.log("🏁 Movendo reservas:", reservationsToMove);

    setReservations(prevReservations => {
      return prevReservations.map(res => {
        const movedReservation = reservationsToMove.find(movedRes => movedRes.id === res.id);
        return movedReservation
          ? { ...movedReservation, tripId: newTripId, lugar: movedReservation.newSeat }
          : res;
      });
    });

    for (const res of reservationsToMove) {
      await handleRowEdit({
        ...res,
        tripId: newTripId,
        lugar: res.newSeat,
      });
    }

    fetchReservations();
    apiRef.current.setRowSelectionModel([]);
  };





  // Função para atualizar ou criar reserva (backend)
  const handleRowEdit = async (updatedRow, oldRow = {}) => {
    try {
      console.log("🔍 A atualizar reserva para o lugar:", updatedRow.id);



  
// No teu handleRowEdit (ou processRowUpdate):
const bilheteInfo = prices.find(p => p.id === updatedRow.bilhete);
const valorBase = bilheteInfo ? parseFloat(bilheteInfo.valor) : parseFloat(updatedRow.preco) || 0;
const valorCarro = parseFloat(updatedRow.valorCarro) || 0;
const valorVolume = parseFloat(updatedRow.valorVolume) || 0;

updatedRow.preco = (valorBase + valorCarro + valorVolume).toFixed(2);


// Só calcula se preco não tiver valor (ou tiver "0.00")
if (!updatedRow.preco || updatedRow.preco === "0.00") {
  updatedRow.preco = (valorBase + valorCarro + valorVolume).toFixed(2);
}



      if (!updatedRow) {
        console.error("❌ Erro: updatedRow é undefined");
        return;
      }

      if (!updatedRow.reserva) {
        let lastReservationResponse = await fetch(`http://94.143.231.141:3010/reservations/last`);
        let lastReservation = await lastReservationResponse.json();
        let newReservaNumber = lastReservation?.reserva ? parseInt(lastReservation.reserva) + 1 : 1;
        updatedRow.reserva = String(newReservaNumber).padStart(4, "0");
        console.log("📌 Nova reserva atribuída:", updatedRow.reserva);
      }

      const userEmail = localStorage.getItem("email") || "desconhecido";

      let checkResponse = await fetch(`http://94.143.231.141:3010/reservations/by-reserva/${updatedRow.reserva}`);
      if (checkResponse.ok) {
        const existingReservation = await checkResponse.json();
        let response = await fetch(`http://94.143.231.141:3010/reservations/${existingReservation.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...updatedRow, updatedBy: userEmail }),
        });
        if (!response.ok) throw new Error("Erro ao atualizar reserva");
      } else {
        let response = await fetch(`http://94.143.231.141:3010/reservations/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...updatedRow, tripId, createdBy: userEmail }),
        });
        if (!response.ok)
          throw new Error(`Erro ao criar reserva: ${await response.text()}`);
      }

      // Se houver alteração no campo "volta", tenta criar a reserva de regresso
      if (
        oldRow &&
        oldRow.volta !== updatedRow.volta &&
        updatedRow.volta &&
        /^\d{2}\/\d{2}\/\d{4}$/.test(updatedRow.volta) // apenas se for uma data válida tipo "12/04/2025"
      ) {
        console.log(`🔙 Criando reserva de volta para ${updatedRow.volta}`);

        const origemDeIda = origemtrip;
        const destinoDeIda = destinotrip;
        const [day, month, year] = updatedRow.volta.split("/");
        const dbFormatDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

        const tripRegressoResponse = await fetch(
          `http://94.143.231.141:3010/trips/return?origem=${destinoDeIda}&destino=${origemDeIda}&dataviagem=${dbFormatDate}`
        );

        if (tripRegressoResponse.ok) {
          const tripRegressoData = await tripRegressoResponse.json();

          if (tripRegressoData && tripRegressoData.id) {
            setReturnTripId(tripRegressoData.id);
            setReturnReservationData({
              ...updatedRow,
              reserva: updatedRow.reserva,
              entrada: updatedRow.saida,
              saida: updatedRow.volta,
              volta: datatrip,
              telefone: updatedRow.telefone,
              email: updatedRow.email,
              carro: updatedRow.carro,
              obs: updatedRow.obs,
              tripId: tripRegressoData.id
            });
            setModalReturnOpen(true);
            console.log("🛑 Modal de seleção de assento aberto?", modalReturnOpen);
          } else {
            console.warn("⚠️ Nenhuma viagem de regresso encontrada!");
          }
        } else {
          console.warn("❌ Erro ao procurar viagem de regresso:", await tripRegressoResponse.text());
        }
      }

      // Verifica se a reserva NÃO é já .v para só então atualizar a “volta” correspondente
      const parts = updatedRow.reserva.split(".");
      const isReturn = parts[parts.length - 1] === "v"; // Se for "v", estamos na volta

      if (!isReturn) {
        // A base pode ser "0003" OU "0003.1" consoante a reserva
        const baseReserva = parts.join(".");
        const returnReservaId = `${baseReserva}.v`;

        let returnResponse = await fetch(`http://94.143.231.141:3010/reservations/by-reserva/${returnReservaId}`);
        if (returnResponse.ok) {
          const existingReturn = await returnResponse.json();
          const updatedReturnRow = {
            ...existingReturn,
            entrada: updatedRow.saida,
            saida: updatedRow.entrada,
            telefone: updatedRow.telefone,
            email: updatedRow.email,
            carro: updatedRow.carro,
            obs: updatedRow.obs,
          };

          let updateReturnResponse = await fetch(`http://94.143.231.141:3010/reservations/${existingReturn.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...updatedReturnRow, updatedBy: userEmail }),
          });
          const retornoData = await updateReturnResponse.json();
          if (updateReturnResponse.ok) {
            console.log(`✅ Reserva de volta ${returnReservaId} atualizada automaticamente.`, retornoData);
            fetchReservations();
          } else {
            console.error(`❌ Erro ao atualizar reserva de volta ${returnReservaId}`, retornoData);
          }
        } else {
          console.log("ℹ️ Não existe reserva de volta para atualizar.");
        }
      }

      return updatedRow;
    } catch (error) {
      console.error("🔥 Erro ao atualizar reserva:", error);
      throw error;
    }
  };






  // Criar reservas em bloco (baseadas na reserva principal) – método alternativo
  const handleBlockReservations = async (reservasSelecionadas) => {
    try {
      if (reservasSelecionadas.length === 0) {
        alert("❌ Deve selecionar primeiro a reserva principal.");
        return;
      }

      const reservaPrincipal = reservasSelecionadas[0];
      if (!reservaPrincipal.reserva) {
        alert("❌ Deve selecionar primeiro a reserva principal.");
        return;
      }
      const baseReserva = reservaPrincipal.reserva.split(".")[0];

      const existingSuffixes = reservations
        .filter(r => r.reserva && r.reserva.startsWith(`${baseReserva}.`))
        .map(r => {
          const parts = r.reserva.split(".");
          return parts.length > 1 ? parseInt(parts[1], 10) : 0;
        });
      const maxSuffix = existingSuffixes.length > 0 ? Math.max(...existingSuffixes) : 0;

      const promises = reservasSelecionadas.map(async (reserva, index) => {
        const novoSufixo = maxSuffix + index + 1;
        const novaReservaNumero = `${baseReserva}.${novoSufixo}`;
        const reservaAtualizada = {
          ...reservaPrincipal,
          reserva: novaReservaNumero,
          id: reserva.id,
          lugar: reserva.lugar,
          email: index === 0 ? reservaPrincipal.email : "*",
          telefone: index === 0 ? reservaPrincipal.telefone : "*",
          obs: index === 0 ? reservaPrincipal.obs : "*",
        };

        console.log(`🔄 Criando reserva ${novaReservaNumero} com base na reserva ${baseReserva}`);
        return handleRowEdit(reservaAtualizada);
      });

      await Promise.all(promises);

      alert(`✅ Reservas em bloco criadas com base na reserva ${baseReserva}`);
      fetchReservations();
      apiRef.current.setRowSelectionModel([]);
    } catch (error) {
      console.error("❌ Erro ao criar reservas em bloco:", error);
    }
  };

  const handleSaveMotorista = async () => {
    try {
      const response = await fetch(`http://94.143.231.141:3010/trips/${tripId}/motorista`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motorista }),
      });

      if (response.ok) {
        console.log("✅ Motorista atualizado com sucesso!");
        alert("Motorista guardado com sucesso.");
        fetchReservations();
      } else {
        console.error("❌ Erro ao atualizar motorista:", await response.text());
      }
    } catch (error) {
      console.error("🔥 Erro ao atualizar motorista:", error);
    }
  };

  const handleSaveOrigemDestino = async () => {
    if (!origem || !destino) {
      alert("Por favor, selecione tanto a origem como o destino.");
      return;
    }
  
    try {
      const response = await fetch(`http://94.143.231.141:3010/trips/${tripId}/origemdestino`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origem, destino }),
      });
  
      if (response.ok) {
        console.log("✅ Origem e Destino atualizado com sucesso!");
        alert("Origem e Destino guardado com sucesso.");
        fetchReservations();
      } else {
        const err = await response.text();
        console.error("❌ Erro ao atualizar Origem e Destino:", err);
        alert("Erro ao guardar Origem e Destino:\n" + err);
      }
    } catch (error) {
      console.error("🔥 Erro ao atualizar Origem e Destino:", error);
    }
  };
  
  const handleSaveNotas = async () => {
    try {
      const response = await fetch(`http://94.143.231.141:3010/trips/${tripId}/notas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notas: tripNotas }),
      });
  
      if (response.ok) {
        alert("Notas atualizadas com sucesso!");
        // fetchReservations(); <-- REMOVE ISTO
      } else {
        const errorText = await response.text();
        console.error("Erro ao atualizar notas:", errorText);
        alert("Erro ao guardar notas: " + errorText);
      }
    } catch (error) {
      console.error("🔥 Erro ao guardar notas:", error);
      alert("Erro ao guardar notas.");
    }
  };
  
  

  const printRef = useRef();

  const fetchReservations = async () => {
    if (!tripId || isNaN(tripId) || Number(tripId) <= 0) {
      console.error("❌ tripId inválido. Abortando fetch.");
      return;
    }

    try {
      const response = await fetch(`http://94.143.231.141:3010/trips/trip/${tripId}`);
      const data = await response.json();
      console.log("📩 Dados da viagem recebidos:", data);

      if (data.trip) {
        setBusSeats(data.trip.Bus?.nlugares || 0);

        if (data.trip.Bus?.imagem && data.trip.Bus?.imagem !== busImage) {
          setBusImage(data.trip.Bus.imagem);
        }

        setDestinoTrip(data.trip.destino || "");
        setOrigemTrip(data.trip.origem || "");
        setMotorista(data.trip.motorista || "");
        setorigem(data.trip.origem || "");
        setdestino(data.trip.destino || "");
        setBusName(data.trip.Bus?.nome || "");
        setDataTrip(data.trip.dataviagem || "");
        if (!notasCarregadas) {
          setTripNotas(data.trip.notas || "");
          setNotasCarregadas(true);
        }
        



        const citiesResponse = await fetch(`http://94.143.231.141:3010/cities`);
        const citiesData = await citiesResponse.json();
        console.log("📩 Lista de cidades recebida:", citiesData);

        const cidadeOrigem = citiesData.find(
          city => city.nome.toLowerCase() === data.trip.origem.toLowerCase()
        );

        console.log("🏙️ Cidade de origem encontrada:", cidadeOrigem);

        let moedaPadrao = "€";
        if (cidadeOrigem && cidadeOrigem.Country) {
          console.log("🌍 País da cidade de origem:", cidadeOrigem.Country.nome);
          const paisOrigem = cidadeOrigem.Country.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

          if (paisOrigem === "suica") {
            moedaPadrao = "Fr";
          }
        }

        const initialReservations = Array.from({ length: data.trip.Bus?.nlugares || 0 }, (_, index) => ({
          id: index + 1,
          lugar: index + 1,
          preco: "",
          moeda: moedaPadrao,
          entrada: "",
          nomePassageiro: "",
          apelidoPassageiro: "",
          saida: "",
          volta: "",
          telefone: "",
          email: "",
          obs: "",
          carro: ""
        }));

        if (Array.isArray(data.reservations)) {
          const updatedReservations = initialReservations.map(row => {
            const matchingReservation = data.reservations.find(res => res.lugar === row.id);
            return matchingReservation ? { ...row, ...matchingReservation, id: row.id } : row;
          });

          setReservations(updatedReservations);
          setEntrySummary(calculateEntrySummary(updatedReservations));
          setCloseSummary(calculateCloseSummary(updatedReservations));
          setTotalPreco(calculatePrecoTotal(updatedReservations));
          setPriceCounts(calculatePriceCounts(updatedReservations));
        } else {
          setReservations(initialReservations);
        }
      }
    } catch (error) {
      console.error("🔥 Erro ao buscar dados da viagem:", error);
    }
  };

  useEffect(() => {
    const handlePaste = (event) => {
      const clipboardData = event.clipboardData || window.clipboardData;
      const pastedText = clipboardData.getData("text");

      if (!pastedText) return;

      let pastedValues = pastedText.split(/\t|\s{2,}/);

      if (pastedValues.length >= 14) {
        console.log("📌 Dados colados:", pastedValues);
        const [id, drag, moeda, preco, entrada, reserva, apelidoPassageiro, nomePassageiro, saida, volta, telefone, email, obs, carro] = pastedValues;

        setReservations(prevReservations => {
          let updatedReservations = [...prevReservations];
          const originalIndex = updatedReservations.findIndex(row => row.reserva === reserva);
          const newPositionIndex = updatedReservations.findIndex(row => row.id === parseInt(id));

          if (originalIndex !== -1 && newPositionIndex !== -1 && originalIndex !== newPositionIndex) {
            console.log(`🔄 Movendo reserva ${reserva} do lugar ${updatedReservations[originalIndex].id} para ${id}`);
            const reservaOriginal = { ...updatedReservations[originalIndex] };
            updatedReservations[originalIndex] = {
              id: updatedReservations[originalIndex].id,
              lugar: updatedReservations[originalIndex].id,
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
              reserva: ""
            };
            updatedReservations[newPositionIndex] = {
              ...reservaOriginal,
              id: parseInt(id),
              lugar: parseInt(id),
              drag, moeda, preco, entrada, reserva, apelidoPassageiro, nomePassageiro, saida, volta, telefone, email, obs, carro,
            };
            console.log("✅ Reserva movida corretamente!");
          } else {
            console.warn(`⚠️ A reserva ${reserva} não foi encontrada para troca, atualizando apenas os dados.`);
            return updatedReservations.map(row =>
              row.id === parseInt(id)
                ? {
                    ...row,
                    drag, moeda, preco, entrada, reserva, apelidoPassageiro,
                    nomePassageiro, saida, volta, telefone, email, obs, carro
                  }
                : row
            );
          }
          return updatedReservations;
        });
      } else {
        console.warn("⚠️ Formato incorreto! Certifica-te de que estás a colar dados completos.");
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, []);

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    if (busImage && typeof busImage === "object" && "data" in busImage) {
      const base64String = `data:image/png;base64,${btoa(
        new Uint8Array(busImage.data).reduce((data, byte) => data + String.fromCharCode(byte), "")
      )}`;
      if (busImage !== base64String) {
        setBusImage(base64String);
      }
    }
  }, [busImage]);

  useEffect(() => {
    let isMounted = true;
    fetchReservations().then(() => {
      if (isMounted) {
        setLoading(false);
      }
    });
    socket.on("reservationUpdated", ({ tripId: updatedTripId }) => {
      if (updatedTripId === tripId && isMounted) {
        fetchReservations();
      }
    });
    return () => {
      isMounted = false;
      socket.off("reservationUpdated");
    };
  }, [tripId]);

  // Definição das colunas do DataGrid, incluindo a coluna "Ações" com botões de copiar/colar
  const columns = [
    { field: "id", headerName: "Lugar", width: 60, editable: false },
    { field: "moeda", headerName: "", width: 10, editable: false },
    {
      field: "preco",
      headerName: "Preço",
      width: 100,
      editable: true,
      renderEditCell: (params) => {
        const paisFiltrado = origemtrip
          ? cities.find(city => city.nome === origemtrip)?.Country?.nome?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
          : "";
      
        const filteredPrices = prices.filter((p) =>
          p.Country?.nome?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === paisFiltrado
        );
      
        return (
          <Select
            value={params.value || ""}
            onChange={(e) => {
              const valorSelecionado = e.target.value;
              params.api.setEditCellValue({ id: params.id, field: "preco", value: valorSelecionado });
      
              const isEditing = apiRef.current.getCellMode(params.id, "preco") === "edit";
              if (isEditing) {
                apiRef.current.stopCellEditMode({ id: params.id, field: "preco" });
              }
            }}
            autoFocus
            fullWidth
            variant="standard"
          >
            {filteredPrices.map((p, index) => (
              <MenuItem key={index} value={p.valor}>
                {p.valor} {paisFiltrado === "suica" ? "Fr" : "€"} - {p.descricao}
              </MenuItem>
            ))}
          </Select>
        );
      }
      
      
      
      
      
      
      
    }
    
    
    ,
    
    
    {
      field: "entrada",
      headerName: "Entrada",
      width: 100,
      editable: true,
      renderEditCell: (params) => {
        const atualizarValor = (valor) => {
          let newValue = valor;
          const selectedOption = cities.find(
            city => city.nome.toLowerCase() === newValue.toLowerCase()
          );
          if (selectedOption) {
            newValue = selectedOption.nome;
          }
          params.api.setEditCellValue({
            id: params.id,
            field: params.field,
            value: newValue,
          });
          if (params.id !== undefined && params.field !== undefined) {
            params.api.stopCellEditMode({ id: params.id, field: params.field });
          }
        };

        const handleKeyDown = (event) => {
          if (event.key === "Enter" || event.key === "Tab") {
            event.preventDefault();
            atualizarValor(event.target.value);
            if (event.key === "Tab") {
              setTimeout(() => {
                const allColumns = params.api.getAllColumns();
                const currentIndex = allColumns.findIndex(col => col.field === params.field);
                if (currentIndex !== -1 && currentIndex < allColumns.length - 1) {
                  const nextField = allColumns[currentIndex + 1].field;
                  params.api.setCellFocus(params.id, nextField);
                }
              }, 50);
            }
          }
        };

        return (
          <Autocomplete
            freeSolo
            options={cities.map(city => city.nome)}
            value={params.value || ""}
            onChange={(event, newValue) => {
              params.api.setEditCellValue({
                id: params.id,
                field: params.field,
                value: newValue,
              });
            }}
            style={{ width: "400px" }}
            renderInput={(paramsInput) => (
              <TextField
                {...paramsInput}
                variant="standard"
                autoFocus
                inputRef={(input) => input && input.focus()}
                onKeyDown={handleKeyDown}
                onBlur={(event) => {
                  atualizarValor(event.target.value);
                }}
              />
            )}
          />
        );
      },
    },
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
          return `* ${valor.split(".")[0]}`;
        }
    
        // Se for de volta, tipo "0003.v" ou "0034.v", mostra "0003" ou "0034"
        if (/^\d{1,4}\.v$/i.test(valor)) {
          return valor.split(".")[0]; // mostra só a parte antes de ".v"
        }
        if (/\.v$/i.test(valor)) {
          return valor.split(".")[0]; // retorna sempre a base
        }
        
    
        // Caso normal
        return valor;
      },
    },
    
    
    

    { field: "apelidoPassageiro", headerName: "Apelido", width: 100, editable: true },
    { field: "nomePassageiro", headerName: "Nome", width: 100, editable: true },
    {
      field: "saida",
      headerName: "Saida",
      width: 100,
      editable: true,
      renderEditCell: (params) => {
        return (
          <Autocomplete
            freeSolo
            options={cities.map(city => city.nome)}
            value={params.value || ""}
            onChange={(event, newValue) => {
              params.api.setEditCellValue({
                id: params.id,
                field: params.field,
                value: newValue,
              });
            }}
            style={{ width: "400px" }}
            renderInput={(paramsInput) => (
              <TextField
                {...paramsInput}
                variant="standard"
                autoFocus
                inputRef={(input) => input && input.focus()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === "Tab") {
                    event.preventDefault();
                    let newValue = paramsInput.inputProps.value;
                    const selectedOption = cities.find(
                      city => city.nome.toLowerCase() === newValue.toLowerCase()
                    );
                    if (selectedOption) {
                      newValue = selectedOption.nome;
                    }
                    params.api.setEditCellValue({
                      id: params.id,
                      field: params.field,
                      value: newValue,
                    });
                    if (params.id !== undefined && params.field !== undefined) {
                      params.api.stopCellEditMode({ id: params.id, field: params.field });
                    }
                    if (event.key === "Tab") {
                      setTimeout(() => {
                        const columns = params.api.getAllColumns();
                        const currentColumnIndex = columns.findIndex(col => col.field === params.field);
                        if (currentColumnIndex !== -1 && currentColumnIndex < columns.length - 1) {
                          const nextField = columns[currentColumnIndex + 1].field;
                          params.api.setCellFocus(params.id, nextField);
                        }
                      }, 50);
                    }
                  }
                }}
              />
            )}
          />
        );
      },
    },
    {
      field: "volta",
      headerName: "Volta",
      width: 110,
      editable: true,
      renderEditCell: (params) => {
        const { id, field, api } = params;
    
        return (
          <TextField
            fullWidth
            variant="standard"
            autoFocus
            defaultValue={params.value || ""}
            onChange={(e) => {
              api.setEditCellValue({ id, field, value: e.target.value });
            }}
            onBlur={() => {
              apiRef.current.stopCellEditMode({ id, field });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                apiRef.current.stopCellEditMode({ id, field });
              }
            }}
            placeholder="dd/mm/aaaa"
          />
        );
      }
    }
,    
    
    

    
    
    { field: "telefone", headerName: "Tel.", width: 100, editable: true },
    { field: "email", headerName: "Email", width: 120, editable: true },
    { field: "obs", headerName: "OBS.", width: 350, editable: true },
    { field: "carro", headerName: "Carro", width: 200, editable: true },
    { field: "valorCarro", headerName: "V.Carro", width: 100, editable: true },
    { field: "valorVolume", headerName: "V.Volume", width: 100, editable: true },
    { field: "bilhete", headerName: "Bilhete", width: 80, editable: false },
    {
      field: "impresso",
      headerName: "Impresso",
      width: 50,
      renderCell: (params) => {
        if (!params || !params.value) {
          return "";
        }
        return params.value === "1" ? "✔" : "";
      },
    },
    {
      field: "bilhet",
      headerName: "",
      width: 100,
      renderCell: (params) => {
        const row = params.row;
    
        // Não mostrar se não houver reserva ou se 'impresso' for 1
        if (!row.reserva || row.impresso === "1" || row.impresso === 1) {
          return null;
        }
    
        return (
          <Button
            onClick={() => handleGenerateTicket(row)}
            variant="outlined"
            style={{
              height: "15px",
              fontSize: "12px",
              color: "darkred",
              borderColor: "darkred",
            }}
          >
            Gerar
          </Button>
        );
      },
    },
    {
      field: "eliminar",
      headerName: "",
      width: 60,
      renderCell: (params) => {
        const row = params.row;
    
        // Só mostrar o botão se houver reserva e se 'impresso' não for 1
        if (row.reserva && row.impresso !== "1" && row.impresso !== 1) {
          return (
            <IconButton
              onClick={() => {
                console.log("🗑️ Reserva a eliminar:", row.reserva);
                handleDeleteReservation(row.reserva);
              }}
              title="Eliminar Reserva"
            >
              <DeleteIcon fontSize="small" style={{ color: "darkred" }} />
            </IconButton>
          );
        }
        return null;
      },
    },
    
    {
      field: "acoes",
      headerName: "",
      width: 60,
      sortable: false,
      renderCell: (params) => {
        const row = params.row;
        const reservaValue = row.reserva || "";
        const isPrincipal = reservaValue !== "" && !reservaValue.includes(".");
    
        // Se a linha estiver vazia e existir uma reserva copiada, exibe o botão de colar.
        if (reservaValue === "" && copiedReservation) {
          return (
            <IconButton
              onClick={() => handlePasteReservation(row.id)}
              title="Colar Reserva"
            >
              <ContentPasteIcon fontSize="small" />
            </IconButton>
          );
        } 
        // Caso contrário, se for uma reserva principal, exibe o botão de copiar.
        else if (isPrincipal) {
          return (
            <IconButton
              onClick={() => handleCopyReservation(row)}
              title="Copiar Reserva"
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          );
        } 
        else {
          return null;
        }
      },
    }
    
    
    
    
    
  ];

  return (
    <Box sx={{ padding: 2, width: "1500px" }}>
      {busName ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>

<Select
  value={origem}
  onChange={(e) => setorigem(e.target.value)}
  displayEmpty
  style={{ minWidth: 150, backgroundColor: "white", borderRadius: "4px", height: "40px" }}
>
  <MenuItem value="">
    <em>Origem</em>
  </MenuItem>
  {cities.map(city => (
    <MenuItem key={city.id} value={city.nome}>
      {city.nome}
    </MenuItem>
  ))}
</Select>

<Select
  value={destino}
  onChange={(e) => setdestino(e.target.value)}
  displayEmpty
  style={{ minWidth: 150, backgroundColor: "white", borderRadius: "4px", height: "40px" }}
>
  <MenuItem value="">
    <em>Destino</em>
  </MenuItem>
  {cities.map(city => (
    <MenuItem key={city.id} value={city.nome}>
      {city.nome}
    </MenuItem>
  ))}
</Select>

  <Button
    variant="contained"
    color="error"
    onClick={handleSaveOrigemDestino}
    style={{
      backgroundColor: "darkred",
      color: "white",
      padding: "10px 16px",
      borderRadius: "5px",
      fontSize: "14px",
      border: "none",
      cursor: "pointer",
      whiteSpace: 'nowrap'
    }}
  >
    Guardar Origem e Destino
  </Button>
  <TextField
    label="Motorista"
    variant="outlined"
    value={motorista}
    onChange={(e) => setMotorista(e.target.value)}
    style={{ minWidth: 150 }}
  />
  <Button
    variant="contained"
    color="error"
    onClick={handleSaveMotorista}
    style={{
      backgroundColor: "darkred",
      color: "white",
      padding: "10px 16px",
      borderRadius: "5px",
      fontSize: "14px",
      border: "none",
      cursor: "pointer",
      whiteSpace: 'nowrap'
    }}
  >
    Guardar Motorista
  </Button>
</div>


      ) : (
        <Typography variant="h4" gutterBottom>
          Carregando viagem...
        </Typography>
      )}

      <Box sx={{ display: "flex", gap: 4, alignItems: "flex-start", mt: 2 }}>
        {/* Secção da Tabela */}

        <Box sx={{ flexGrow: 1 }}>
        
        <DataGrid
  rows={filteredReservations}
  apiRef={apiRef}
          columns={columns}
          isCellEditable={(params) => {
            // Se impresso for "1" (ou 1), desativar edição daquela linha
            if (params.row.impresso === "1") {
              return false;
            }
            return true;
          }}
          checkboxSelection
          pagination
          pageSize={1000} // força a mostrar mais
          rowsPerPageOptions={[1000]} // evita fallback para 100
          
          disableRowSelectionOnClick
          selectionModel={rowSelectionModel}
          onRowSelectionModelChange={(newSelection) => {
            setSelectedReservations(
              newSelection.map(id => reservations.find(res => res.id === id))
            );
          }}

          onCellKeyDown={(params, event) => {
            if (!apiRef.current) return;
          
            const colunas = apiRef.current.getAllColumns();
            if (!colunas || colunas.length === 0) return;
          
            const currentIndex = colunas.findIndex(col => col.field === params.field);
            if (currentIndex === -1) return;
          
            const rowId = params.id;
            const isEditable = colunas[currentIndex]?.editable;
          
            if (!isEditable) return;
          
            const cellMode = apiRef.current.getCellMode(rowId, params.field);
          
            // Obtém o input ativo
            const input = event.target;
          
            // Se não for um campo de texto, ignora a navegação
            if (!input || typeof input.value !== "string") return;
          
            const cursorPos = input.selectionStart;
            const textLength = input.value.length;
          
            // 🔹 Se o campo estiver vazio ou o cursor estiver no início/final, permite navegação
            const moveLeft = event.key === "ArrowLeft" && (cursorPos === 0 || textLength === 0);
            const moveRight = event.key === "ArrowRight" && (cursorPos === textLength || textLength === 0);
            const moveWithEnter = event.key === "Enter"; // 🔥 Agora permite avançar com Enter!
          
            if (!moveLeft && !moveRight && !moveWithEnter) return;
          
            event.preventDefault(); // Evita o comportamento padrão das teclas
          
            let nextIndex = currentIndex + (moveRight || moveWithEnter ? 1 : -1);
          
            while (
              nextIndex >= 0 &&
              nextIndex < colunas.length &&
              (!colunas[nextIndex]?.editable || colunas[nextIndex]?.field === "reserva") // Ignora "reserva"
            ) {
              nextIndex += moveRight || moveWithEnter ? 1 : -1;
            }
          
            if (nextIndex >= 0 && nextIndex < colunas.length) {
              const nextField = colunas[nextIndex].field;
          
              // 🔍 Garante que a célula anterior está em modo de edição antes de sair
              if (cellMode === "edit") {
                apiRef.current.stopCellEditMode({ id: rowId, field: params.field });
              }
          
              setTimeout(() => {
                const nextCellMode = apiRef.current.getCellMode(rowId, nextField);
                apiRef.current.setCellFocus(rowId, nextField);
          
                if (nextCellMode === "view") {
                  apiRef.current.startCellEditMode({ id: rowId, field: nextField });
                }
              }, 50);
            }
          }}
          
          
          rowHeight={30}
          processRowUpdate={handleRowEdit}
          onProcessRowUpdateError={(error) => console.error("Erro ao atualizar reserva:", error)}
          
          sx={{
            height: "900px",
            overflow: "auto",
            "& .MuiDataGrid-columnHeaders": {
              position: "sticky",
              top: 0,
              backgroundColor: "white",
              zIndex: 100,
            },
            "& .copied-row": {
              backgroundColor: "rgba(255, 215, 0, 0.3)"
            },
            "& .MuiDataGrid-cell": {
              borderRight: "1px solid #ddd",
            },
            "& .MuiDataGrid-cell:last-child": {
              borderRight: "none",
            },
            "& .MuiDataGrid-row": {
              borderBottom: "1px solid #ddd"
            }
          }}
        />
<Typography variant="h6" gutterBottom>
    Notas da Viagem
  </Typography>
  <TextField
    value={tripNotas}
    onChange={(e) => setTripNotas(e.target.value)}
    placeholder="Notas sobre a viagem..."
    fullWidth
    multiline
    rows={4}
    variant="outlined"
    sx={{ backgroundColor: "white", borderRadius: "5px" }}
  />
  <Button
    variant="contained"
    color="error"
    onClick={handleSaveNotas}
    style={{
      backgroundColor: "darkred",
      color: "white",
      marginTop: "10px",
      padding: "10px 16px",
      borderRadius: "5px",
      fontSize: "14px",
      border: "none",
      cursor: "pointer"
    }}
  >
    Guardar Notas
  </Button>

        </Box>
       


        {/* Secção da Imagem e Resumos */}
        {busImage && (
          <Box sx={{ display: "flex", gap: 4, width: "100%" }}>
            {/* Botões e Controlo */}
            <Box
              sx={{
                maxWidth: "40%",
                minWidth: "300px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2
              }}
            >
             
              
              <Button
                variant="contained"
                color="error"
                onClick={() => setModalOpen(true)}
                style={{
                  backgroundColor: "darkred",
                  color: "white",
                  padding: "10px",
                  borderRadius: "5px",
                  fontSize: "14px",
                  border: "none",
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                Mudar Autocarro
              </Button>
              <BusChangeModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onChangeBus={handleChangeBus}
                tripId={tripId}
                dataviagem={datatrip}
              />
              {/*<Button
                variant="contained"
                color="error"
                onClick={() => handleBlockReservations(selectedReservations)}
                style={{
                  backgroundColor: "darkred",
                  color: "white",
                  padding: "10px",
                  borderRadius: "5px",
                  fontSize: "14px",
                  border: "none",
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                Criar Reservas em Bloco
              </Button>*/}
              <Button
                variant="contained"
                color="error"
                disabled={selectedReservations.length === 0}
                onClick={() => setModalMoveWithinTripOpen(true)}
                style={{
                  backgroundColor: "darkred",
                  color: "white",
                  padding: "10px",
                  borderRadius: "5px",
                  fontSize: "14px",
                  border: "none",
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                Mover Reservas (Mesma Viagem)
              </Button>
              <Button
                variant="contained"
                color="error"
                disabled={selectedReservations.length !== 2}
                onClick={handleSwapReservations}
                style={{
                  backgroundColor: "darkred",
                  color: "white",
                  padding: "10px",
                  borderRadius: "5px",
                  fontSize: "14px",
                  border: "none",
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                Trocar Passageiro de Lugar
              </Button>
              <Button
                variant="contained"
                style={{
                  backgroundColor: "darkred",
                  color: "white",
                  padding: "10px",
                  borderRadius: "5px",
                  fontSize: "14px",
                  width: "100%"
                }}
                disabled={selectedReservations.length === 0}
                onClick={async () => {
                  const response = await fetch(`http://94.143.231.141:3010/trips`);
                  const trips = await response.json();
                  setAvailableTrips(trips.filter(trip => trip.id !== tripId));
                  setModalMoveBatchOpen(true);
                }}
              >
                Mover {selectedReservations.length} Reserva(s) (Outra Viagem)
              </Button>
              <MoveReservationsWithinTripModal
                open={modalMoveWithinTripOpen}
                onClose={() => setModalMoveWithinTripOpen(false)}
                tripId={tripId}
                selectedReservations={selectedReservations}
                onConfirm={handleMoveReservationsWithinTrip}
              />


              <Typography variant="h6" gutterBottom style={{
                  
                  marginTop: "100px"
                 
                }}>
                Preço Total:
              </Typography>
              <Box
                sx={{
                  background: "darkred",
                  color: "white",
                  padding: "10px",
                  borderRadius: "5px",
                  boxShadow: "1px 1px 5px rgba(0,0,0,0.1)"
                }}
              >
                {Object.entries(totalPreco).map(([moeda, total]) => (
                  <Typography key={moeda} variant="body1">
                    <strong>Total ({moeda}):</strong> {total.toFixed(2)}
                  </Typography>
                ))}
              </Box>

              <Typography variant="h6" gutterBottom>
                Frequência de Preços:
              </Typography>
              <Box
                sx={{
                  background: "darkred",
                  color: "white",
                  padding: "10px",
                  borderRadius: "5px",
                  boxShadow: "1px 1px 5px rgba(0,0,0,0.1)"
                }}
              >
                {Object.entries(priceCounts).length > 0 ? (
                  Object.entries(priceCounts).map(([price, count]) => (
                    <Typography key={price} variant="body1">
                      {count} pessoa(s) a {price}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Nenhum preço registado.
                  </Typography>
                )}
              </Box>


              <Button
  variant="contained"
  color="error"
  onClick={() =>
    handlePrintAllTickets(
      reservations,
      datatrip,
      formatDate,
      handleRowEdit  // Passa a função de update para o backend
    )
  }
  style={{
    backgroundColor: "darkred",
    color: "white",
    padding: "10px",
    marginTop: "100px",
    borderRadius: "5px",
    fontSize: "14px",
    border: "none",
    cursor: "pointer",
    width: "100%"
  }}
>
  Gerar Todos os Bilhetes
</Button>



              <Button
                variant="contained"
                color="error"
                onClick={() =>
                  handlePrintList(
                    reservations,
                    origem,
                    destino,
                    datatrip,
                    busName,
                    motorista,
                    entrySummary,
                    closeSummary,
                    formatDate,
                    priceCounts,
                    tripNotas
                  )
                }
                style={{
                  backgroundColor: "darkred",
                  color: "white",
                  padding: "10px",
                  borderRadius: "5px",
                  fontSize: "14px",
                  border: "none",
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                Gerar Listagem de Passageiros
              </Button>

              <Button
                variant="contained"
                color="error"
                onClick={() => handleSendEmail(motorista, origem, destino, datatrip, busName)}
                style={{
                  backgroundColor: "darkred",
                  color: "white",
                  padding: "10px",
                  borderRadius: "5px",
                  fontSize: "14px",
                  border: "none",
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                Enviar Email
              </Button>
            </Box>



            {/* Coluna da imagem do autocarro */}
            <Box
              sx={{
                maxWidth: "40%",
                minWidth: "300px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2
              }}
            >
              <img
                src={busImage}
                alt="Autocarro"
                style={{ width: "100%", height: "auto", borderRadius: "8px" }}
              />
            </Box>

            {/* Coluna dos resumos */}
            <Box
              sx={{
                maxWidth: "40%",
                minWidth: "300px",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3
              }}
            >
              <Typography variant="h6" gutterBottom>
                Resumo das Entradas:
              </Typography>
              <Box
                sx={{
                  background: "darkred",
                  color: "white",
                  padding: "10px",
                  borderRadius: "5px",
                  boxShadow: "1px 1px 5px rgba(0,0,0,0.1)"
                }}
              >  
              <Typography variant="body1">
              <strong>Total de Passageiros:</strong> {Object.values(entrySummary).reduce((acc, val) => acc + val, 0)} passageiros
            </Typography>
            </Box>
              <Box
                sx={{
                  background: "darkred",
                  color: "white",
                  padding: "10px",
                  borderRadius: "5px",
                  boxShadow: "1px 1px 5px rgba(0,0,0,0.1)"
                }}
              >  
                {Object.keys(entrySummary).length > 0 ? (
                  Object.entries(entrySummary).map(([entrada, count]) => (
                    <Typography key={entrada} variant="body1">
                      <strong>{entrada}:</strong> {count} passageiros
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Nenhuma entrada registada.
                  </Typography>
                )}
              </Box>

              <Typography variant="h6" gutterBottom>
                Resumo das Saídas:
              </Typography>
              <Box
                sx={{
                  background: "darkred",
                  color: "white",
                  padding: "10px",
                  borderRadius: "5px",
                  boxShadow: "1px 1px 5px rgba(0,0,0,0.1)"
                }}
              >
                {Object.keys(closeSummary).length > 0 ? (
                  Object.entries(closeSummary).map(([saida, count]) => (
                    <Typography key={saida} variant="body1">
                      <strong>{saida}:</strong> {count} passageiros
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    Nenhuma saída registada.
                  </Typography>
                )}
              </Box>

             
             
            </Box>
          </Box>
        )}
      </Box>

      <MoveReservationModal
        open={modalMoveOpen}
        onClose={() => setModalMoveOpen(false)}
        reservations={reservations}
        onMove={handleMoveReservation}
      />
      <MoveReservationsBatchModal
        open={modalMoveBatchOpen}
        onClose={() => setModalMoveBatchOpen(false)}
        trips={availableTrips}
        selectedReservations={selectedReservations}
        onMove={handleMoveReservationsInBatch}
      />
      <MoveReservationTripModal
        open={modalMoveTripOpen}
        onClose={() => setModalMoveTripOpen(false)}
        trips={availableTrips
          .filter(trip => {
            if (!trip.dataviagem) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tripDate = new Date(trip.dataviagem);
            if (isNaN(tripDate)) {
              console.warn(`⚠️ Data inválida para tripId ${trip.id}:`, trip.dataviagem);
              return false;
            }
            tripDate.setHours(0, 0, 0, 0);
            return tripDate >= today;
          })
          .sort((a, b) => new Date(a.dataviagem) - new Date(b.dataviagem))
          .map(trip => ({
            ...trip,
            formattedDate: new Date(trip.dataviagem).toLocaleDateString("pt-PT")
          }))}
        onMove={handleMoveReservationTrip}
      />
      <SelectReturnSeatModal
        open={modalReturnOpen}
        onClose={() => setModalReturnOpen(false)}
        tripId={returnTripId}
        tripOriginalDate={datatrip}
        onConfirm={async (selectedSeat) => {
          setModalReturnOpen(false);
          if (returnReservationData) {
            const entradaCorreta =
              returnReservationData.saida &&
              !returnReservationData.saida.match(/\d{2}\/\d{2}\/\d{4}/)
                ? returnReservationData.saida
                : origemtrip;

            const saidaCorreta =
              returnReservationData.entrada &&
              !returnReservationData.entrada.match(/\d{2}\/\d{2}\/\d{4}/)
                ? returnReservationData.entrada
                : destinotrip;

            const formattedReservation = `${returnReservationData.reserva}.v `;
            const updatedReservationData = {
              ...returnReservationData,
              lugar: selectedSeat,
              reserva: formattedReservation,
              entrada: saidaCorreta,
              saida: entradaCorreta,
              volta: formatDate(datatrip),
              preco: "",
              moeda: "",
            };

            console.log("🛑 Reserva de regresso antes de enviar:", updatedReservationData);
            let resCreateReturn = await fetch(`http://94.143.231.141:3010/reservations/create`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...updatedReservationData,
                createdBy: localStorage.getItem("email") || "desconhecido"
              }),
            });

            if (!resCreateReturn.ok) {
              console.error("❌ Erro ao criar reserva de regresso!", await resCreateReturn.text());
              return;
            }

            console.log(`✅ Reserva de regresso criada no lugar ${selectedSeat}!`);
            fetchReservations();
          }
        }}
      />
    </Box>
  );
};

export default Reservation;
