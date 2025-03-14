import React, { useState, useEffect, useRef } from "react";
import { DataGrid,useGridApiRef } from "@mui/x-data-grid";
import { Button, Box, IconButton, Typography,TextField,Autocomplete,Modal,Select,MenuItem, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { io } from "socket.io-client";
import BusChangeModal from "./Moves/BusChangeModal";
import handlePrintList from "./Tickets/PrintList";
import handlePrintTicket from "./Tickets/PrintTicket";
import handlePrintAllTickets from "./Tickets/PrintAllTickets";
import {calculatePriceCounts,calculatePrecoTotal,calculateCloseSummary,calculateEntrySummary} from "./Tickets/Summarys"
import MoveReservationModal from "./Moves/MoveReservationModal";
import MoveReservationTripModal from "./Moves/MoveReservationTripModal";
import MoveReservationsBatchModal from "./Moves/MoveReservationsBatchModal";
import SelectReturnSeatModal from "./SelectReturnSeatModal";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";







const socket = io("http://localhost:3010", {
    transports: ["websocket"],
    path: "/socket.io/",
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
    timeout: 5000
});




const Reservation = ({tripId}) => {
    console.log("📌 tripId recebido no Reservation:", tripId);

    const [datatrip, setDataTrip] = useState(null);
    const [origemtrip, setOrigemTrip] = useState(null);
    const [destinotrip, setDestinoTrip] = useState(null);
    const [reservations, setReservations] = useState([]);
    const [motorista, setMotorista] = useState([]);
    const [origemCidade, setorigemCidade] = useState([]);
    const [destinoCidade, setdestinoCidade] = useState([]);
    const [busSeats, setBusSeats] = useState(0);
    const [busImage, setBusImage] = useState("");
    const [busName, setBusName] = useState("");
    const [entrySummary, setEntrySummary] = useState({}); // Estado para o resumo das entradas
    const [closeSummary, setCloseSummary] = useState({}); // Estado para o resumo das saidas
    const [loading,setLoading] = useState(true);
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


    const apiRef = useGridApiRef();

    const handleSwapReservations = async () => {
        if (selectedReservations.length !== 2) {
          alert("Por favor, selecione exatamente duas reservas para trocar de lugar.");
          return;
        }
        // Extrai as duas reservas selecionadas
        const [res1, res2] = selectedReservations;
        
        // Define os novos lugares (troca)
        const novoLugarRes1 = res2.lugar;
        const novoLugarRes2 = res1.lugar;
      
        // Atualiza o estado local (supondo que 'id' representa o número do lugar)
        setReservations(prevReservations =>
          prevReservations.map(r => {
            if (r.id === res1.id) return { ...r, lugar: novoLugarRes1, id: novoLugarRes1 };
            if (r.id === res2.id) return { ...r, lugar: novoLugarRes2, id: novoLugarRes2 };
            return r;
          })
        );
      
        // Atualiza cada reserva no backend
        await handleRowEdit({ ...res1, lugar: novoLugarRes1 });
        await handleRowEdit({ ...res2, lugar: novoLugarRes2 });
      
        // Recarrega as reservas para refletir as alterações
        
        fetchReservations();
        apiRef.current.setRowSelectionModel([]); // 🔥 Limpa a seleção da `DataGrid` diretamente



        
      };
      

    useEffect(() => {
        fetch("https://backendreservasnunes.advir.pt/cities")
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



  const handleMoveReservationsWithinTrip = async (updates) => {
    console.log("🏁 Movendo reservas dentro da mesma viagem:", updates);
    
    // Atualiza o estado local das reservas
    setReservations((prevReservations) =>
      prevReservations.map(res => {
        const update = updates.find(item => item.id === res.id);
        return update ? { ...res, lugar: update.newSeat } : res;
      })
    );
  
    // Atualiza cada reserva no backend
    for (const update of updates) {
      const reservation = reservations.find(r => r.id === update.id);
      if (reservation) {
        await handleRowEdit({
          ...reservation,
          // Apenas atualiza o assento (lugar)
          lugar: update.newSeat
        });
      }
    }
  
    // Recarrega as reservas para refletir as alterações
    fetchReservations();
    apiRef.current.setRowSelectionModel([]); // 🔥 Limpa a seleção da `DataGrid` diretamente

  };
  

  const MoveReservationsWithinTripModal = ({ open, onClose, tripId, selectedReservations, onConfirm }) => {
    const [availableSeats, setAvailableSeats] = useState([]);
    const [reservationsWithSeats, setReservationsWithSeats] = useState([]);
  
    // Buscar os lugares disponíveis quando o modal abrir
    useEffect(() => {
      if (open) {
        fetch(`https://backendreservasnunes.advir.pt/reservations/trip/${tripId}`)
          .then((response) => response.json())
          .then((data) => {
            if (data && Array.isArray(data.freeSeats)) {
              // Certifica-te de que os lugares estão ordenados numericamente
              const sortedSeats = [...data.freeSeats].sort((a, b) => a - b);
              setAvailableSeats(sortedSeats);
              setReservationsWithSeats(
                selectedReservations.map((res) => ({ ...res, selectedSeat: null }))
              );
            } else {
              setAvailableSeats([]);
            }
          })
          .catch((error) => {
            console.error("Erro ao buscar lugares disponíveis:", error);
            setAvailableSeats([]);
          });
      }
    }, [open, tripId, selectedReservations]);
  
    // Quando o primeiro combo for preenchido, auto-preencher os restantes com os lugares disponíveis
    useEffect(() => {
      if (reservationsWithSeats.length > 0 && reservationsWithSeats[0].selectedSeat) {
        // Garante que os lugares disponíveis estão ordenados
        const sortedSeats = [...availableSeats].sort((a, b) => a - b);
        const firstSeat = Number(reservationsWithSeats[0].selectedSeat);
        const startIndex = sortedSeats.findIndex((seat) => Number(seat) >= firstSeat);
        if (startIndex !== -1) {
          const updated = reservationsWithSeats.map((res, index) => {
            // O primeiro já foi definido
            if (index === 0) return res;
            // Se ainda não tiver sido selecionado, auto-preenche com o próximo lugar disponível
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
      setReservationsWithSeats((prev) =>
        prev.map((res) =>
          res.id === reservationId ? { ...res, selectedSeat: seat } : res
        )
      );
    };
  
    const handleConfirmMove = () => {
      // Cria o array de atualizações no formato: { id: <id da reserva>, newSeat: <novo lugar> }
      const updates = reservationsWithSeats.map((res) => ({
        id: res.id,
        newSeat: res.selectedSeat,
      }));
      console.log("Reservas para mover:", updates);
      onConfirm(updates);
      onClose();
    };
  
    const isReadyToConfirm = reservationsWithSeats.every((res) => res.selectedSeat);
  
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
  
          {/* Lista de reservas com dropdown dos lugares disponíveis */}
          <Box sx={{ mt: 2 }}>
            {reservationsWithSeats.map((res, index) => (
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
                      .filter((seat) =>
                        // Excluir os lugares que já foram selecionados noutras reservas (exceto o da reserva atual)
                        !reservationsWithSeats.some(
                          (r) => r.id !== res.id && r.selectedSeat === seat
                        )
                      )
                      .map((seat) => (
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
            <Button
              variant="contained"
              style={{ backgroundColor: "darkred", color: "white" }}
              onClick={onClose}
            >
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
      

    const handleSendEmail = (motorista, origemtrip, destinotrip, datatrip, busName) => {


        const destinatario = ""; // Podes deixar em branco para o utilizador preencher
        const assunto = `Documentos da Viagem de ${origemtrip} → ${destinotrip} - ${datatrip} - ${busName}`;
        const corpo = `Olá,\n\nSegue abaixo as informações da viagem:\n\n🚌 Motorista: ${motorista}\n📍 Origem: ${origemtrip}\n📍 Destino: ${destinotrip}\n📅 Data: ${datatrip}\n🚍 Autocarro: ${busName}\n\nCumprimentos,\n`;
    
        // Criar o link mailto
        const mailtoLink = `mailto:${destinatario}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
    
        // Abrir o cliente de email (Outlook, Gmail, etc.)
        window.location.href = mailtoLink;
    };
    
    
    const handleMoveReservation = async (newSeat) => {
        setReservations((prevReservations) => {
            let updatedReservations = [...prevReservations];
    
            // Encontrar a reserva original
            const originalIndex = updatedReservations.findIndex(res => res.id === reservationToMove.id);
            const newPositionIndex = updatedReservations.findIndex(res => res.id === newSeat);
    
            if (originalIndex !== -1 && newPositionIndex !== -1) {
                // Guardar reserva original
                const reservaOriginal = { ...updatedReservations[originalIndex] };
    
                // Criar uma linha vazia na posição original
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
    
                // Atualizar reserva no novo lugar
                updatedReservations[newPositionIndex] = {
                    ...reservaOriginal,
                    id: newSeat,
                    lugar: newSeat
                };
    
                console.log(`✅ Reserva movida para o lugar ${newSeat}`);
    
                // Chamar handleRowEdit para guardar no backend
                handleRowEdit(updatedReservations[newPositionIndex]);
            }
            


            return updatedReservations;
            apiRef.current.setRowSelectionModel([]); // 🔥 Limpa a seleção da `DataGrid` diretamente
        });
    };


    const handleMoveReservationTrip = async (newTripId, newSeat, newTripDate) => {
        setReservations((prevReservations) => {
            let updatedReservations = [...prevReservations];
    
            // Obter a data de hoje sem horas, minutos e segundos
            const today = new Date();
            today.setHours(0, 0, 0, 0);
    
            // Encontrar a reserva original
            const originalIndex = updatedReservations.findIndex(res => res.id === reservationToMoveTrip.id);
    
            if (originalIndex !== -1) {
                // Criar uma nova reserva com a nova viagem e o novo lugar
                const reservaOriginal = { 
                    ...updatedReservations[originalIndex], 
                    tripId: newTripId, 
                    lugar: newSeat,
                    tripDate: newTripDate
                };
    
                // Apagar a reserva do estado atual
                updatedReservations.splice(originalIndex, 1);
    
                console.log(`✅ Reserva movida para a viagem ${newTripId} no lugar ${newSeat}`);
    
                // Chamar handleRowEdit para guardar no backend
                handleRowEdit(reservaOriginal);
            }
    
            // Filtrar apenas as reservas cuja data seja igual ou posterior a hoje
            return updatedReservations.filter(res => {
                if (!res.tripDate) return false; // Se não houver data, ignora
    
                const tripDate = new Date(res.tripDate);
                tripDate.setHours(0, 0, 0, 0); // Remover horas para comparação correta
    
                return tripDate >= today;
            });
        });
    };


    const handleDeleteReservation = async (numeroReserva) => {
        console.log("🔍 Tentando eliminar reserva com número:", numeroReserva);
    
        if (!numeroReserva) {
            console.error("❌ Número de reserva inválido");
            return;
        }
    
        if (!window.confirm(`Tem certeza que deseja eliminar a reserva Nº ${numeroReserva}?`)) return;
    
        try {
            // Agora eliminamos diretamente pelo número da reserva
            const response = await fetch(`https://backendreservasnunes.advir.pt/reservations/delete/${numeroReserva}`, {
                method: "DELETE",
            });
    
            if (response.ok) {
                alert(`Reserva Nº ${numeroReserva} eliminada com sucesso!`);
                fetchReservations(); // Atualizar a lista após a eliminação
            } else {
                const errorText = await response.text();
                console.error("Erro ao eliminar reserva:", errorText);
            }
        } catch (error) {
            console.error("🔥 Erro ao eliminar reserva:", error);
        }
    };
    

    const handleChangeBus = async (busId) => {
        try {
            // 1️⃣ Obter detalhes do novo autocarro
            const busInfoResponse = await fetch(`https://backendreservasnunes.advir.pt/buses/${busId}`);
            const busInfo = await busInfoResponse.json();
    
            if (!busInfo || !busInfo.nlugares) {
                alert("❌ Erro ao obter informações do novo autocarro.");
                return;
            }
    
            const newBusSeats = busInfo.nlugares; // Número total de lugares do novo autocarro
    
            // 2️⃣ Obter os lugares disponíveis no novo autocarro
            const availableSeatsResponse = await fetch(`https://backendreservasnunes.advir.pt/trips/${tripId}/available-seats`);
            const availableSeatsData = await availableSeatsResponse.json();
    
            if (!availableSeatsData || !Array.isArray(availableSeatsData) || availableSeatsData.length === 0) {
                alert("❌ Erro: Não há lugares disponíveis no novo autocarro.");
                return;
            }
    
            // Ordenar os lugares disponíveis
            const sortedAvailableSeats = availableSeatsData.sort((a, b) => a - b);
    
            // 3️⃣ Obter reservas ativas ordenadas pelo número do lugar
            const activeReservations = reservations
                .filter(res => res.reserva && res.reserva.trim() !== "") // Apenas reservas ativas
                .sort((a, b) => a.lugar - b.lugar); // Ordenar por lugar original
    
            if (activeReservations.length > sortedAvailableSeats.length) {
                alert(`❌ Erro: O novo autocarro tem apenas ${sortedAvailableSeats.length} lugares disponíveis, 
                       mas existem ${activeReservations.length} reservas ativas.`);
                return;
            }
    
            // 4️⃣ Atribuir os primeiros lugares disponíveis às reservas ativas
            const updatedReservations = activeReservations.map((reservation, index) => ({
                ...reservation,
                lugar: sortedAvailableSeats[index], // Novo lugar atribuído sequencialmente
                tripId: tripId, // Garantir que continuam na mesma viagem
            }));
    
            console.log("🚍 Novo Autocarro:", busInfo.nome);
            console.log("🎟️ Reservas reatribuídas:", updatedReservations);
    
            // 5️⃣ Atualizar o autocarro da viagem
            const updateBusResponse = await fetch(`https://backendreservasnunes.advir.pt/trips/${tripId}/bus`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ busId }),
            });
    
            if (!updateBusResponse.ok) {
                console.error("❌ Erro ao atualizar autocarro:", await updateBusResponse.text());
                return;
            }
    
            // 6️⃣ Atualizar as reservas no backend
            for (const updatedRes of updatedReservations) {
                await handleRowEdit(updatedRes);
            }
    
            alert("✅ Autocarro atualizado e reservas reorganizadas com sucesso!");
            setModalOpen(false); // Fecha o modal
                

            fetchReservations(); // Atualiza os dados
            apiRef.current.setRowSelectionModel([]); // 🔥 Limpa a seleção da `DataGrid` diretamente
    
        } catch (error) {
            console.error("🔥 Erro ao mudar autocarro:", error);
        }
    };
    

    const handleMoveReservationsInBatch = async (newTripId, reservationsToMove) => {
        
        console.log("🏁 Movendo reservas:", reservationsToMove);
    
        setReservations((prevReservations) => {
            return prevReservations.map(res => {
                const movedReservation = reservationsToMove.find(movedRes => movedRes.id === res.id);
                return movedReservation
                    ? { ...movedReservation, tripId: newTripId, lugar: movedReservation.newSeat } // ✅ O lugar correto agora é atualizado
                    : res;
            });
        });
    
        for (const res of reservationsToMove) {
            await handleRowEdit({
                ...res,
                tripId: newTripId,
                lugar: res.newSeat, // ✅ Agora o backend recebe o novo lugar correto
            });
        }

        fetchReservations(); // Atualiza a lista para refletir as mudanças reais do backend
        apiRef.current.setRowSelectionModel([]); // 🔥 Limpa a seleção da `DataGrid` diretamente
    };


    const handleRowEdit = async (updatedRow, oldRow = {}) => {
        try {
            console.log("🔍 A atualizar reserva para o lugar:", updatedRow.id);
            
            if (!updatedRow) {
                console.error("❌ Erro: updatedRow é undefined");
                return;
            }
    
            if (!updatedRow.reserva) {
                let lastReservationResponse = await fetch(`https://backendreservasnunes.advir.pt/reservations/last`);
                let lastReservation = await lastReservationResponse.json();
                let newReservaNumber = lastReservation?.reserva ? parseInt(lastReservation.reserva) + 1 : 1;
                updatedRow.reserva = String(newReservaNumber).padStart(4, "0");
                console.log("📌 Nova reserva atribuída:", updatedRow.reserva);
            }
    
            const userEmail = localStorage.getItem("email") || "desconhecido";
    
            let checkResponse = await fetch(`https://backendreservasnunes.advir.pt/reservations/by-reserva/${updatedRow.reserva}`);
            if (checkResponse.ok) {
                const existingReservation = await checkResponse.json();
                let response = await fetch(`https://backendreservasnunes.advir.pt/reservations/${existingReservation.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...updatedRow, updatedBy: userEmail }),
                });
                if (!response.ok) throw new Error("Erro ao atualizar reserva");
            } else {
                let response = await fetch(`https://backendreservasnunes.advir.pt/reservations/create`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...updatedRow, tripId, createdBy: userEmail }),
                });
                if (!response.ok) throw new Error(`Erro ao criar reserva: ${await response.text()}`);
            }
    
            // 🔥 Verifica se "volta" foi alterado e dispara o modal de regresso
            if (oldRow && oldRow.volta !== undefined && oldRow.volta !== updatedRow.volta && updatedRow.volta) {
                console.log(`🔙 Criando reserva de volta para ${updatedRow.volta}`);
    
                const origemDeIda = origemtrip;
                const destinoDeIda = destinotrip;
                const [day, month, year] = updatedRow.volta.split("/");
                const dbFormatDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    
                const tripRegressoResponse = await fetch(
                    `https://backendreservasnunes.advir.pt/trips/return?origem=${destinoDeIda}&destino=${origemDeIda}&dataviagem=${dbFormatDate}`
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
    
            return updatedRow;
    
        } catch (error) {
            console.error("🔥 Erro ao atualizar reserva:", error);
            throw error;
        }
    };
    

    const handleBlockReservations = async (reservasSelecionadas) => {
      try {
          if (reservasSelecionadas.length === 0) {
              alert("❌ Seleciona pelo menos uma reserva para bloquear.");
              return;
          }
  
          // Obter a reserva principal (a que será usada como base)
          const reservaPrincipal = reservasSelecionadas[0];
  
          if (!reservaPrincipal.reserva) {
              alert("❌ A reserva principal não tem número de reserva válido.");
              return;
          }
  
          // Define o número base com base na reserva principal (exemplo: "0001")
          const baseReserva = reservaPrincipal.reserva;
  
          // Atualizar cada reserva com base na reserva principal
          const promises = reservasSelecionadas.map(async (reserva, index) => {
              // Se for a primeira (reserva principal), mantém os dados originais
              const isReservaPrincipal = index === 0;
              const reservaNumero = isReservaPrincipal ? baseReserva : `${baseReserva}.${index}`;
  
              const reservaAtualizada = {
                  ...reservaPrincipal, // Copia os dados da principal
                  reserva: reservaNumero, // Define o número único
                  id: reserva.id, // Mantém o ID correto
                  lugar: reserva.lugar, // Mantém o lugar correto
                  
                  // Apenas reservas copiadas terão os campos email, telefone e obs com "*"
                  email: isReservaPrincipal ? reservaPrincipal.email : "*",
                  telefone: isReservaPrincipal ? reservaPrincipal.telefone : "*",
                  obs: isReservaPrincipal ? reservaPrincipal.obs : "*",
              };
  
              console.log(`🔄 Criando reserva ${reservaNumero} com base na reserva ${baseReserva}`);
  
              // Enviar para o backend
              return handleRowEdit(reservaAtualizada);
          });
  
          await Promise.all(promises);
  
          alert(`✅ Reservas em bloco criadas com base na reserva ${baseReserva}`);
          fetchReservations(); // Atualiza a lista
          apiRef.current.setRowSelectionModel([]); // Limpa a seleção
  
      } catch (error) {
          console.error("❌ Erro ao criar reservas em bloco:", error);
      }
  };
  
    
      
    const handleSaveMotorista = async () => {
        try {
            const response = await fetch(`https://backendreservasnunes.advir.pt/trips/${tripId}/motorista`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ motorista }),
            });
    
            if (response.ok) {
                console.log("✅ Motorista atualizado com sucesso!");
                alert("Motorista guardado com sucesso.")
                fetchReservations(); // Atualiza os dados na UI
            } else {
                console.error("❌ Erro ao atualizar motorista:", await response.text());
            }
        } catch (error) {
            console.error("🔥 Erro ao atualizar motorista:", error);
        }
    };

    
    const handleSaveOrigemDestino = async () => {
      try {
          const response = await fetch(`https://backendreservasnunes.advir.pt/trips/${tripId}/origemdestino`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ origemCidade,destinoCidade }),
          });
  
          if (response.ok) {
              console.log("✅ Origem e Destino atualizado com sucesso!");
              alert("Origem e Destino guardado com sucesso.")
              fetchReservations(); // Atualiza os dados na UI
          } else {
              console.error("❌ Erro ao atualizar Origem e Destino:", await response.text());
          }
      } catch (error) {
          console.error("🔥 Erro ao atualizar Origem e Destino:", error);
      }
    };









    const printRef = useRef();



    const fetchReservations = async () => {
        if (!tripId || isNaN(tripId) || Number(tripId) <= 0) {
            console.error("❌ tripId inválido. Abortando fetch.");
            return;
        }
    
        try {
            const response = await fetch(`https://backendreservasnunes.advir.pt/trips/trip/${tripId}`);
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
                setorigemCidade(data.trip.origemCidade || "");
                setdestinoCidade(data.trip.destinoCidade || "");
                setBusName(data.trip.Bus?.nome || "");
                setDataTrip(data.trip.dataviagem || "");
    
                // 🔥 Buscar a lista de cidades com países
                const citiesResponse = await fetch(`https://backendreservasnunes.advir.pt/cities`);
                const citiesData = await citiesResponse.json();
                console.log("📩 Lista de cidades recebida:", citiesData);
    
                // Obter a cidade de origem e verificar o país
                const cidadeOrigem = citiesData.find(city => city.nome.toLowerCase() === data.trip.origem.toLowerCase());
    
                console.log("🏙️ Cidade de origem encontrada:", cidadeOrigem);
    
                let moedaPadrao = "€"; // Default para Portugal
                if (cidadeOrigem && cidadeOrigem.Country) {
                    console.log("🌍 País da cidade de origem:", cidadeOrigem.Country.nome);

                    // Normalizar nome do país para evitar erros de acentos, maiúsculas ou espaços
                    const paisOrigem = cidadeOrigem.Country.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

                    if (paisOrigem === "suica") {
                        moedaPadrao = "Fr"; // Franco suíço para cidades da Suíça
                    }
                }

    
                const initialReservations = Array.from({ length: data.trip.Bus?.nlugares || 0 }, (_, index) => ({
                    id: index + 1,
                    lugar: index + 1,
                    preco: "",
                    moeda: moedaPadrao, // Agora definido com base no país
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
                    const updatedReservations = initialReservations.map((row) => {
                        const matchingReservation = data.reservations.find((res) => res.lugar === row.id);
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
    
            // Divide os dados colados por tabulação ou espaço
            let pastedValues = pastedText.split(/\t|\s{2,}/);
    
            // Verifica se tem o número de colunas esperadas
            if (pastedValues.length >= 14) { // Número de colunas esperado
                console.log("📌 Dados colados:", pastedValues);
                
                const [id, drag, moeda, preco, entrada, reserva, apelidoPassageiro, nomePassageiro, saida, volta, telefone, email, obs, carro] = pastedValues;
    
                setReservations((prevReservations) => {
                    let updatedReservations = [...prevReservations];
    
                    // Encontrar a linha original pelo número da reserva
                    const originalIndex = updatedReservations.findIndex(row => row.reserva === reserva);
                    const newPositionIndex = updatedReservations.findIndex(row => row.id === parseInt(id));
    
                    if (originalIndex !== -1 && newPositionIndex !== -1 && originalIndex !== newPositionIndex) {
                        console.log(`🔄 Movendo reserva ${reserva} do lugar ${updatedReservations[originalIndex].id} para ${id}`);
    
                        // Guardar os dados da reserva original
                        const reservaOriginal = { ...updatedReservations[originalIndex] };
    
                        // Criar uma linha vazia na posição original
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
                            reserva: "" // Limpa o campo de reserva na posição original
                        };
    
                        // Colar na nova posição
                        updatedReservations[newPositionIndex] = {
                            ...reservaOriginal,
                            id: parseInt(id),
                            lugar: parseInt(id), // Atualiza corretamente o lugar
                            drag, moeda, preco, entrada, reserva, apelidoPassageiro, nomePassageiro, saida, volta, telefone, email, obs, carro
                        };
    
                        console.log("✅ Reserva movida corretamente!");
                    } else {
                        console.warn(`⚠️ A reserva ${reserva} não foi encontrada para troca, atualizando apenas os dados.`);
    
                        return updatedReservations.map((row) =>
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

    
    
    const columns = [
        { field: "id", headerName: "Lugar", width: 60, editable: false },    
        { field: "moeda", headerName: "", width: 10, editable: false },
        { field: "preco", headerName: "Preço", width: 80, editable: true }, 
        {
            field: "entrada",
            headerName: "Entrada",
            width: 100,
            editable: true,
            renderEditCell: (params) => {
              return (
                <Autocomplete
                  freeSolo
                  options={cities.map((city) => city.nome)}
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
                          event.preventDefault(); // Evita comportamento padrão
                          
                          let newValue = paramsInput.inputProps.value; // Obtém o que está escrito
          
                          // **Se houver uma opção correspondente na lista, usa-a**
                          const selectedOption = cities.find(city => city.nome.toLowerCase() === newValue.toLowerCase());
                          if (selectedOption) {
                            newValue = selectedOption.nome;
                          }
          
                          // **Atualiza o valor no DataGrid**
                          params.api.setEditCellValue({
                            id: params.id,
                            field: params.field,
                            value: newValue,
                          });
          
                          // **Garante que a célula sai do modo de edição sem erro**
                          if (params.id !== undefined && params.field !== undefined) {
                            params.api.stopCellEditMode({ id: params.id, field: params.field });
                          }
          
                          // **Tab move corretamente para a próxima célula**
                          if (event.key === "Tab") {
                            setTimeout(() => {
                              const columns = params.api.getAllColumns();
                              const currentColumnIndex = columns.findIndex(col => col.field === params.field);
          
                              if (currentColumnIndex !== -1 && currentColumnIndex < columns.length - 1) {
                                const nextField = columns[currentColumnIndex + 1].field;
                                params.api.setCellFocus(params.id, nextField);
                              }
                            }, 50); // Pequeno atraso para garantir que a célula sai do modo de edição antes de avançar
                          }
                        }
                      }}
                    />
                  )}
                />
              );
            },
          }
          
          
          
          
          
          ,
        { field: "reserva", headerName: "Reserva", width: 80, sortable: false, editable: false },
        { field: "apelidoPassageiro", headerName: "Apelido", width: 100, editable: true },
        { field: "nomePassageiro", headerName: "Nome", width: 100, editable: true },
        { field: "saida", headerName: "Saida", width: 100, editable: true,  renderEditCell: (params) => {
            return (
              <Autocomplete
                freeSolo
                options={cities.map((city) => city.nome)}
                value={params.value || ""}
                onChange={(event, newValue) => {
                  params.api.setEditCellValue({
                    id: params.id,
                    field: params.field,
                    value: newValue,
                  });
                }}
                style={{ width: '400px' }} // Ajusta a largura conforme necessário

                renderInput={(paramsInput) => (
                    <TextField
                    {...paramsInput}
                    variant="standard"
                    autoFocus
                    inputRef={(input) => input && input.focus()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === "Tab") {
                        event.preventDefault(); // Evita comportamento padrão
                        
                        let newValue = paramsInput.inputProps.value; // Obtém o que está escrito
        
                        // **Se houver uma opção correspondente na lista, usa-a**
                        const selectedOption = cities.find(city => city.nome.toLowerCase() === newValue.toLowerCase());
                        if (selectedOption) {
                          newValue = selectedOption.nome;
                        }
        
                        // **Atualiza o valor no DataGrid**
                        params.api.setEditCellValue({
                          id: params.id,
                          field: params.field,
                          value: newValue,
                        });
        
                        // **Garante que a célula sai do modo de edição sem erro**
                        if (params.id !== undefined && params.field !== undefined) {
                          params.api.stopCellEditMode({ id: params.id, field: params.field });
                        }
        
                        // **Tab move corretamente para a próxima célula**
                        if (event.key === "Tab") {
                          setTimeout(() => {
                            const columns = params.api.getAllColumns();
                            const currentColumnIndex = columns.findIndex(col => col.field === params.field);
        
                            if (currentColumnIndex !== -1 && currentColumnIndex < columns.length - 1) {
                              const nextField = columns[currentColumnIndex + 1].field;
                              params.api.setCellFocus(params.id, nextField);
                            }
                          }, 50); // Pequeno atraso para garantir que a célula sai do modo de edição antes de avançar
                        }
                      }
                    }}
                  />
                )}
              />
            );
          },
        },
        { field: "volta", headerName: "Volta", width: 100, editable: true },
        { field: "telefone", headerName: "Tel.", width: 100, editable: true },
        { field: "email", headerName: "Email", width: 120, editable: true },
        { field: "obs", headerName: "OBS.", width: 350, editable: true },
        { field: "carro", headerName: "Carro", width: 200, editable: true },
        {
            field: "bilhete",
            headerName: "Bilhete",
            width: 120,
            renderCell: (params) => (
                params.row.reserva ? (
                    <Button
                        onClick={() => handlePrintTicket(params.row, datatrip, formatDate)}
                        variant="outlined"
                        style={{ height: "15px", fontSize: "12px", color: "darkred", borderColor: "darkred" }}
                    >
                        Gerar
                    </Button>
                ) : null
            )
        },
        {
        field: "eliminar",
        headerName: "Eliminar",
        width: 100,
        renderCell: (params) => (
            params.row.reserva ? (
                <Button
                    variant="outlined"
                    style={{ height: "15px", fontSize: "12px", color: "darkred", borderColor: "darkred" }}
                    color="error"
                    size="small"
                    onClick={() => {
                        console.log("🗑️ Reserva a eliminar:", params.row.reserva); // ✅ Agora passa a reserva
                        handleDeleteReservation(params.row.reserva);
                    }}
                >
                    Eliminar
                </Button>
            ) : null
        )
    }

        

        
        
        
    ];
    

    return (
        <Box sx={{ width: "100%", padding: 2, width:"600px" }}>
            {busName ? (
                <p>
                    <b>Autocarro:</b> {busName} <b> Data:</b> {formatDate(datatrip)}<b> Viagem:</b> {origemtrip} → {destinotrip}
                </p>
            ) : (
                <Typography variant="h4" gutterBottom>
                    Carregando viagem...
                </Typography>
            )}



 
    
        {/* Layout Flexbox para Tabela e Imagem */}
        <Box sx={{ display: "flex", gap: 4, alignItems: "flex-start", mt: 2 }}>
            
            {/* Secção da Tabela (Esquerda) */}
            <Box sx={{ flexGrow: 1 }}>
            <DataGrid
                rows={reservations}
                apiRef={apiRef}

                columns={columns}
                autoHeight={false} // Desativar autoHeight para permitir altura fixa
                hideFooter
                checkboxSelection
                disableRowSelectionOnClick
                selectionModel={rowSelectionModel} // 🔥 Garante que as seleções são controladas

                onRowSelectionModelChange={(newSelection) => {
                    setSelectedReservations(newSelection.map(id => reservations.find(res => res.id === id)));
                }}
                rowHeight={30}
                processRowUpdate={handleRowEdit}
                onProcessRowUpdateError={(error) => console.error("Erro ao atualizar reserva:", error)}
                sx={{
                    height: "800px",
                    overflow: "auto",
                    "& .MuiDataGrid-columnHeaders": {
                        position: "sticky",
                        top: 0,
                        backgroundColor: "white",
                        zIndex: 100, // Mantém o cabeçalho fixo sem conflitos
                    },
                    "& .css-tewekw": {
                        zIndex: 0 // Força o mesmo comportamento que encontraste
                    },
                    "& .MuiDataGrid-cell": {
                        borderRight: "1px solid #ddd", // Adiciona a linha de separação entre colunas
                    },
                    "& .MuiDataGrid-cell:last-child": {
                        borderRight: "none", // Remove a borda da última coluna para evitar duplo traço
                    },
                    "& .MuiDataGrid-row": {
                        borderBottom: "1px solid #ddd" // Linha de separação entre as linhas
                    }
                }}
            />







            </Box>
    
          {/* Secção da Imagem e Resumos (Direita) */}
    {busImage && (
    <Box sx={{
        display: "flex",
        justifyContent: "space-between", // Mantém os elementos lado a lado
        gap: 4,
        width: "100%"
    }}>
        {/* Coluna 1: botões */}
        <Box sx={{
            maxWidth: "40%",
            minWidth: "300px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2
        }}>
            <TextField
                label="Motorista"
                variant="outlined"
                fullWidth
                value={motorista}
                onChange={(e) => setMotorista(e.target.value)}
            />
            <Button variant="contained" color="error" onClick={handleSaveMotorista}style={{
                    backgroundColor: "darkred",
                    color: "white",
                    padding: "10px",
                    borderRadius: "5px",
                    fontSize: "14px",
                    border: "none",
                    cursor: "pointer",
                    width: "100%"
                }}>
                Guardar Motorista
            </Button>
            <TextField
                label="Origem"
                variant="outlined"
                fullWidth
                value={origemCidade}
                onChange={(e) => setorigemCidade(e.target.value)}
            />
            <TextField
                label="Destino"
                variant="outlined"
                fullWidth
                value={destinoCidade}
                onChange={(e) => setdestinoCidade(e.target.value)}
            />
            <Button variant="contained" color="error" onClick={handleSaveOrigemDestino}style={{
                    backgroundColor: "darkred",
                    color: "white",
                    padding: "10px",
                    borderRadius: "5px",
                    fontSize: "14px",
                    border: "none",
                    cursor: "pointer",
                    width: "100%"
                }}>
                Guardar Origem e Destino
            </Button>
            <Button variant="contained" color="error" onClick={() => setModalOpen(true)}style={{
                    backgroundColor: "darkred",
                    color: "white",
                    padding: "10px",
                    borderRadius: "5px",
                    fontSize: "14px",
                    border: "none",
                    cursor: "pointer",
                    width: "100%"
                }}>
                Mudar Autocarro
            </Button>
            <BusChangeModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onChangeBus={handleChangeBus}
                tripId={tripId}
                dataviagem={datatrip}
            />
            
          
            <Button 
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
</Button>
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
  Trocar Lugares
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
        const response = await fetch(`https://backendreservasnunes.advir.pt/trips`);
        const trips = await response.json();
        setAvailableTrips(trips.filter(trip => trip.id !== tripId));

        setModalMoveBatchOpen(true); // ✅ Agora isto está definido
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


        </Box>

        {/* Coluna 2: Imagem do autocarro */}
        <Box sx={{
            maxWidth: "40%",
            minWidth: "300px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2
        }}>
            
            <img
                src={busImage}
                alt="Autocarro"
                style={{ width: "100%", height: "auto", borderRadius: "8px" }}
            />


        </Box>

        {/* Coluna 2: Resumos */}
        <Box sx={{
            maxWidth: "40%",
            minWidth: "300px",
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3
        }}>
            {/* Resumo das Entradas */}
            <Typography variant="h6" gutterBottom>Resumo das Entradas:</Typography>
            <Box sx={{ background: "darkred",color:"white", padding: "10px", borderRadius: "5px", boxShadow: "1px 1px 5px rgba(0,0,0,0.1)" }}>
                {Object.keys(entrySummary).length > 0 ? (
                    Object.entries(entrySummary).map(([entrada, count]) => (
                        <Typography key={entrada} variant="body1">
                            <strong>{entrada}:</strong> {count} passageiros
                        </Typography>
                    ))
                ) : (
                    <Typography variant="body2" color="textSecondary">Nenhuma entrada registada.</Typography>
                )}
            </Box>

            {/* Resumo das Saídas */}
            <Typography variant="h6" gutterBottom>Resumo das Saídas:</Typography>
            <Box sx={{ background: "darkred",color:"white",  padding: "10px", borderRadius: "5px", boxShadow: "1px 1px 5px rgba(0,0,0,0.1)" }}>
                {Object.keys(closeSummary).length > 0 ? (
                    Object.entries(closeSummary).map(([saida, count]) => (
                        <Typography key={saida} variant="body1">
                            <strong>{saida}:</strong> {count} passageiros
                        </Typography>
                    ))
                ) : (
                    <Typography variant="body2" color="textSecondary">Nenhuma saída registada.</Typography>
                )}
            </Box>

            {/* Preço Total */}
            <Typography variant="h6" gutterBottom>Preço Total:</Typography>
            <Box sx={{ background: "darkred",color:"white",  padding: "10px", borderRadius: "5px", boxShadow: "1px 1px 5px rgba(0,0,0,0.1)" }}>
                {Object.entries(totalPreco).map(([moeda, total]) => (
                    <Typography key={moeda} variant="body1">
                        <strong>Total ({moeda}):</strong> {total.toFixed(2)}
                    </Typography>
                ))}
            </Box>

            {/* Frequência de Preços */}
            <Typography variant="h6" gutterBottom>Frequência de Preços:</Typography>
            <Box sx={{ background: "darkred",color:"white",  padding: "10px", borderRadius: "5px", boxShadow: "1px 1px 5px rgba(0,0,0,0.1)" }}>
                {Object.entries(priceCounts).length > 0 ? (
                    Object.entries(priceCounts).map(([price, count]) => (
                        <Typography key={price} variant="body1">
                            {count} pessoa(s) a {price}
                        </Typography>
                    ))
                ) : (
                    <Typography variant="body2" color="textSecondary">Nenhum preço registado.</Typography>
                )}
            </Box>
            <Button variant="contained" color="error" onClick={() => handlePrintAllTickets(reservations, datatrip, formatDate)}style={{
                    backgroundColor: "darkred",
                    color: "white",
                    padding: "10px",
                    borderRadius: "5px",
                    fontSize: "14px",
                    border: "none",
                    cursor: "pointer",
                    width: "100%"
                }}>
                Gerar Todos os Bilhetes
            </Button>

            <Button variant="contained" color="error" onClick={() => handlePrintList(
                reservations, origemCidade, destinoCidade, datatrip, busName, motorista, entrySummary, closeSummary, formatDate, priceCounts
            )}style={{
                backgroundColor: "darkred",
                color: "white",
                padding: "10px",
                borderRadius: "5px",
                fontSize: "14px",
                border: "none",
                cursor: "pointer",
                width: "100%"
            }}>
                Gerar Listagem de Passageiros
            </Button>
            <Button 
    variant="contained" 
    color="error" 
    onClick={() => handleSendEmail(motorista, origemtrip, destinotrip, datatrip, busName)}
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
                    if (!trip.dataviagem) return false; // Ignora viagens sem data

                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // Normalizar data de hoje

                    const tripDate = new Date(trip.dataviagem);
                    if (isNaN(tripDate)) {
                        console.warn(`⚠️ Data inválida para tripId ${trip.id}:`, trip.dataviagem);
                        return false;
                    }
                    
                    tripDate.setHours(0, 0, 0, 0); // Normalizar data da viagem
                    
                    return tripDate >= today;
                })
                .sort((a, b) => new Date(a.dataviagem) - new Date(b.dataviagem)) // Ordenar por data crescente
                .map(trip => ({
                    ...trip,
                    formattedDate: new Date(trip.dataviagem).toLocaleDateString('pt-PT') // Formatar para dd/mm/aaaa
                }))}
            onMove={handleMoveReservationTrip}
        />

<SelectReturnSeatModal
    open={modalReturnOpen}
    onClose={() => setModalReturnOpen(false)}
    tripId={returnTripId}
    tripOriginalDate={datatrip} // ✅ Aqui está correto
    onConfirm={async (selectedSeat) => {
        setModalReturnOpen(false);
        
        if (returnReservationData) {
            const entradaCorreta = returnReservationData.saida && !returnReservationData.saida.match(/\d{2}\/\d{2}\/\d{4}/) 
                ? returnReservationData.saida 
                : origemtrip;

            const saidaCorreta = returnReservationData.entrada && !returnReservationData.entrada.match(/\d{2}\/\d{2}\/\d{4}/) 
                ? returnReservationData.entrada 
                : destinotrip;

                const formattedReservation = `${returnReservationData.reserva}.v `;

            const updatedReservationData = {
                ...returnReservationData,
                
                lugar: selectedSeat,
                reserva: formattedReservation, // ✅ Agora o campo reserva inclui ".v"
                entrada: saidaCorreta,
                saida: entradaCorreta,
                volta: formatDate(datatrip), // ✅ Alterar para 'datatrip' em vez de 'tripOriginalDate'
                preco: "",
                moeda: "",
            };

            console.log("🛑 Reserva de regresso antes de enviar:", updatedReservationData);

            let resCreateReturn = await fetch(`https://backendreservasnunes.advir.pt/reservations/create`, {
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
            fetchReservations(); // Atualizar a lista de reservas
        }
    }}
/>
    </Box>  
    );
};

export default Reservation;