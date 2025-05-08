import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Collapse,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Select,
  Autocomplete,
  Checkbox,
  FormControlLabel, 
  Button,
  FormControl,
  InputLabel,
  Modal,
  Grid,
} from "@mui/material";

import DeleteIcon from '@mui/icons-material/Delete';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';

import { DataGrid } from "@mui/x-data-grid";
import SelectReturnSeatModal from "./SelectReturnSeatModal";
import { fetchPrices } from "../../services/apiPrices"; // Ajusta o caminho se necessário

import handlePrintTicket from "../Reservation/Tickets/PrintTicket";
import handlePrintAllTickets from "../Reservation/Tickets/PrintAllTickets";


import handleRePrintTicket from "../Reservation/Tickets/RePrintTicket";
import handleRePrintAllTickets from "../Reservation/Tickets/RePrintAllTickets";
const getToken = () => localStorage.getItem("token");



const SearchTripPage = () => {
  // Estados principais da reserva
  const [reservations, setReservations] = useState([]);
  const [isChild, setIsChild] = useState(false); 
  const [loading, setLoading] = useState(true);
  const [editingPassengerIndex, setEditingPassengerIndex] = useState(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);



  // Propriedades comuns para os campos: largura, texto a negrito e espaçamento reduzido
  const commonFieldProps = {
    size: "small",
    sx: {
      width: { xs: "100%", sm: 220 },
      "& .MuiInputBase-input": { fontWeight: "bold" },
      "& .MuiInputLabel-root": { fontWeight: "bold" },
      m: 0,
    },
    InputProps: { style: { fontWeight: "bold" } },
    InputLabelProps: { style: { fontWeight: "bold" } },
  };
  
  

  const [selectedReservation, setSelectedReservation] = useState({
    nomePassageiro: "",
    apelidoPassageiro: "",
    entrada: "",
    saida: "",
    telefone: "",
    carro: "",
    obs: "",
    preco: "",
    moeda: "",
    tripId: "",
    reserva: "",
    volta: "",
    lugar: "",
    valorCarro: "",
    valorVolume: "",
    impresso: "",
    bilhete: "",
  });

  // Lista de viagens disponíveis, lista de cidades e lugares disponíveis
  const [availableTrips, setAvailableTrips] = useState([]);
  const [cities, setCities] = useState([]);
  const [availableSeats, setAvailableSeats] = useState([]); // Lugares disponíveis para a viagem selecionada

  // Pesquisa rápida no DataGrid
  const [searchTerm, setSearchTerm] = useState("");

  // Lista de passageiros adicionais
  const [multiPassengerOptions, setMultiPassengerOptions] = useState({});

  const [multiPassengers, setMultiPassengers] = useState([]);

  // Estados para a criação da viagem de volta
  const [modalReturnOpen, setModalReturnOpen] = useState(false);
  const [returnReservationData, setReturnReservationData] = useState(null);
  const [selectedReturnSeat, setSelectedReturnSeat] = useState("");
  const [availableReturnSeats, setAvailableReturnSeats] = useState([]);
  const [returnQueue, setReturnQueue] = useState([]);

  // Preços e países (para determinar moeda e/ou cálculo de valores)
  const [prices, setPrices] = useState([]);
  const [selectedPriceId, setSelectedPriceId] = useState("");
  const [countries, setCountries] = useState([]);

  // Preço base do bilhete selecionado (no formulário principal)
  const [precoBase, setPrecoBase] = useState(0);

  const [entradaOptions, setEntradaOptions] = useState([]);
  const [saidaOptions, setSaidaOptions] = useState([]);
  
  const [totalReserva, setTotalReserva] = useState(0);
  const [selectedRow, setSelectedRow] = useState(null);

  const [mainReservation, setMainReservation] = useState({});
  const [subPassengers, setSubPassengers] = useState([]);

  const [isManualPriceSelection, setIsManualPriceSelection] = useState(false);
  const [dateInputValue, setDateInputValue] = useState("");


  useEffect(() => {
    const totalAdicionais = multiPassengers.reduce((acc, p) => {
      return acc + (parseFloat(p.preco) || 0);
    }, 0);
  
    setTotalReserva((totalAdicionais).toFixed(2));
  }, [selectedReservation.preco, multiPassengers]);
  

  const gerarProximaSubReserva = () => {
    if (multiPassengers.length === 0) return "";
  
    // Encontra o código base (ex: "0001")
    const principal = multiPassengers.find(p => p.reserva && !p.reserva.includes("."));
    if (!principal || !principal.reserva) return "";
  
    const base = principal.reserva;
  
    // Verifica quantas subreservas já existem
    const subreservas = multiPassengers.filter(p => p.reserva?.startsWith(`${base}.`));
    const numerosUsados = subreservas.map(s => {
      const partes = s.reserva.split(".");
      return parseInt(partes[1]) || 0;
    });
  
    const proximoNumero = numerosUsados.length > 0
      ? Math.max(...numerosUsados) + 1
      : 1;
  
    return `${base}.${proximoNumero}`;
  };




  const handleSinglePrint = async (row) => {
    const tripDate = availableTrips.find(t => t.id === row.tripId)?.dataviagem;
    if (row.impresso === 1 || row.impresso === "1") {
      // Reimpressão
      await handleRePrintTicket(row, tripDate, formatDate);
    } else {
      // Impressão pela primeira vez
      await handlePrintAndMarkSingle(row);
    }
  };



  // -------------------------------------------------------------
// Imprime 1 bilhete, gerando nº de bilhete e marcando impresso
// -------------------------------------------------------------
const handlePrintAndMarkSingle = async (row) => {
  try {
    // 0) Encontrar o id se ainda não existir
    if (!row.id) {
      const dbRow = reservations.find(
        (r) => r.reserva === row.reserva && r.tripId === row.tripId
      );
      if (dbRow) row.id = dbRow.id;
    }

    // 1) Se continuar sem id, avisa e sai
    if (!row.id) {
      alert("Esta reserva ainda não está gravada. Guarda antes de imprimir.");
      return;
    }


    // 3) Próximo nº de bilhete
    const resp = await fetch("https://nunes.entigra.pt/backend/reservations/lastTicket",{
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      }
      
    });
    if (!resp.ok) throw new Error("Falha a obter último nº de bilhete");
    const last = await resp.json();
    row.bilhete = String(parseInt(last.bilhete, 10) + 1).padStart(4, "0");
    row.impresso = 1;

    // 4) Gravar alteração (PUT)
    await handleRowEdit(row);

    // 5) Gerar PDF
    const tripDate = availableTrips.find(t => t.id === row.tripId)?.dataviagem;
    await handlePrintTicket(row, tripDate, formatDate);

  } catch (e) {
    console.error("Erro ao imprimir bilhete:", e);
    alert("Erro ao imprimir bilhete.");
  }
};


  

const tripOptions = availableTrips
  .filter((trip) => trip.Bus?.nome?.toLowerCase() === "vazio")  // <-- novo filtro
  .map((trip) => {

    const dateStr = new Date(trip.dataviagem).toLocaleDateString("pt-PT", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    
  
    // descobrir a cidade de origem dentro do array cities
    const origemCity = cities.find(
      (c) => c.nome.toLowerCase() === trip.origem.toLowerCase()
    );
  
    // normalizar o nome do país (sem acentos e em minúsculas)
    const paisOrigem = origemCity?.Country?.nome
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase() || "";
  
    return {
      id: trip.id,
      label: `${dateStr}`,
      origem: trip.origem,
      destino: trip.destino,
      dateStr,
      paisOrigem,          //  <-- novo campo
    };
  });


  // Datas da viagem de volta (origen/destino trocados em relação à ida)
/* utilitário: devolve o nome do país (sem acentos, em minúsculas)
   a partir do nome da cidade                                       */
   const getPaisNormalizado = (cityName) => {
    const c = cities.find(
      (c) => c.nome?.toLowerCase() === cityName?.toLowerCase()
    );
    return c?.Country?.nome
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase() || "";
  };
  
  /* opções para o campo Data Volta – agora filtradas por PAÍS */
  const returnTripOptions = React.useMemo(() => {
    if (!selectedReservation.tripId) return [{ id: "Aberto", label: "Aberto" }];
  
    const ida = availableTrips.find(t => t.id === selectedReservation.tripId);
    if (!ida) return [{ id: "Aberto", label: "Aberto" }];
  
    const paisOrigIda = getPaisNormalizado(ida.origem);
    const paisDestIda = getPaisNormalizado(ida.destino);
  
    const viagensInversas = availableTrips
  .filter(t => {
    const paisOrigT = getPaisNormalizado(t.origem);
    const paisDestT = getPaisNormalizado(t.destino);
    const isAutocarroVazio = t.Bus?.nome?.toLowerCase() === "vazio";

    const idaDate = new Date(ida.dataviagem);
    const voltaDate = new Date(t.dataviagem);
    idaDate.setHours(0, 0, 0, 0);
    voltaDate.setHours(0, 0, 0, 0);

    return (
      paisOrigT === paisDestIda &&
      paisDestT === paisOrigIda &&
      isAutocarroVazio &&
      voltaDate > idaDate
    );
  })


      .sort((a, b) => new Date(a.dataviagem) - new Date(b.dataviagem))
      .map(t => {
        const dataFormatada = new Date(t.dataviagem).toLocaleDateString("pt-PT");
        const labelFormatada = new Date(t.dataviagem).toLocaleDateString("pt-PT", {
          day: "numeric",
          month: "long",
          year: "numeric"
        });
      
        return {
          id: t.id,
          label: labelFormatada, // mostra como "2 maio 2025"
          data: dataFormatada     // guarda como "02/05/2025"
        };
      });
      
  
    /* devolve "Aberto" + viagens ordenadas */
    return [{ id: "Aberto", label: "Aberto" }, ...viagensInversas];
  }, [selectedReservation.tripId, availableTrips, cities]);
  
  

  
  // Elimina a reserva na BD (move‑a para ListaNegra) e actualiza a UI
const handleDeletePassenger = async (row, index) => {
  if (!row.id) {
        setMultiPassengers(prev => prev.filter((_, i) => i !== index));
        return;
      }
  const ok = window.confirm(
    `Tens a certeza que queres eliminar a reserva ${row.reserva}?`
  );
  if (!ok) return;

  try {
    // 👉 ajusta a rota se o teu ficheiro de routes usar outro path
    const resp = await fetch(
      `https://nunes.entigra.pt/backend/reservations/delete/${row.reserva}`,
      { 
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        
      method: "DELETE" }
    );

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(txt || "Erro ao eliminar reserva");
    }

    // 1) retira do array visível
    setMultiPassengers((prev) => prev.filter((_, i) => i !== index));

    // 2) refresca a lista global
    fetchAllReservations();

    alert(`Reserva ${row.reserva} eliminada com sucesso!`);
  } catch (err) {
    console.error("Erro ao eliminar reserva:", err);
    alert("Falhou a eliminação da reserva.");
  }
};

// Sempre que mudar qualquer dado que influencia o bilhete, 
// repor seleção manual e tentar auto-preencher
useEffect(() => {
  // Repor flag de seleção manual
  setIsManualPriceSelection(false);

  // Só tenta preencher se tivermos tripId e cidades selecionadas
  if (
    selectedReservation.tripId &&
    selectedReservation.entrada &&
    selectedReservation.saida
  ) {
    preencherBilheteAutomaticamente(
      selectedReservation.tripId,
      selectedReservation.volta,
      isChild
    );
  }
}, [
  selectedReservation.tripId,
  selectedReservation.entrada,
  selectedReservation.saida,
  selectedReservation.volta,
  isChild
]);


// Converte uma data ISO (yyyy‑mm‑dd…) para dd/mm/aaaa
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("pt-PT");

// Recebe a reserva modificada (bilhete atribuído, impresso=1)  
// e reaproveita a tua saveReservation + refresh
const handleRowEdit = async (updatedRow) => {
  await saveReservation(updatedRow);   // PUT no backend
  await fetchAllReservations();        // refresca a lista
};



  // devolve o 1.º lugar que continua livre
const getNextFreeSeat = () => {
  return availableSeats.find(
    s => !multiPassengers.some(p => p.lugar === s)
  ) || "";        // "" caso já não haja lugares
};



const preencherBilheteAutomaticamente = (tripId, voltaValue, childFlag = isChild) => {
  const temVolta = voltaValue &&
    voltaValue.trim() !== "" &&
    (voltaValue.trim().toLowerCase() !== "aberto" ? true : true); // "aberto" é tratado como ida e volta

  let sortedPrices = getPricesForTrip(tripId)
    .map(p => ({
      ...p,
      descNorm: p.descricao.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(),
    }))
    .filter(p => childFlag ? p.descNorm.includes("crianca") : p.descNorm.includes("adulto"))
    .sort((a, b) => getBilheteOrder(a.descricao) - getBilheteOrder(b.descricao));

  if (!sortedPrices.length) return;

  let chosen;
  if (temVolta) {
    chosen = sortedPrices.find(p => p.descNorm.includes("ida e volta"));
  }

  if (!chosen) {
    chosen = sortedPrices.find(p => p.descNorm.includes("ida") && !p.descNorm.includes("ida e volta"));
  }

  if (!chosen) {
    chosen = sortedPrices[0];
  }

  if (!chosen) return;

  const base = parseFloat(chosen.valor || 0);
  const moeda = getMoedaByCountryId(chosen.countryId);


  if (isManualPriceSelection) return; // ⛔️ se o utilizador escolheu, não alteras nada


  setSelectedReservation(prev => ({
    
    ...prev,
    bilhete: chosen.id,
    preco: base.toFixed(2),
    moeda,
  }));

  setPrecoBase(base);
};

  
  
  
  
  
  const additionalPassengerColumns = [
    {
      field: "tripId",
      headerName: "Viagem",
      width: 200,
      renderCell: (params) => {
        const trip = tripOptions.find((opt) => opt.id === params.value);
        return trip ? trip.label : params.value;
      },
    },
    {
      field: "reserva",
      headerName: "Reserva",
      width: 100,
      renderCell: ({ value }) => {
        const code = String(value ?? "");
        return code.includes(".") ? "*" : code;   // sub‑reservas → *, principal → 0004
      },
    },
    

    
   
    { field: "nomePassageiro", headerName: "Nome", width: 150 },
    { field: "apelidoPassageiro", headerName: "Apelido", width: 150 },
    { field: "entrada", headerName: "Entrada", width: 130 },
    { field: "saida", headerName: "Saída", width: 130 },
    { field: "preco", headerName: "Total Bilhete", width: 120 },
    {
      field: "actions",
      headerName: "Ações",
      width: 180,
      renderCell: (params) => {
        const row = params.row;                               // <‑‑ agora existe
        const tripDate = availableTrips.find(                 // <‑‑ idem
          (t) => t.id === row.tripId
        )?.dataviagem;
        const index = params.row._index;
        return (
          <>
            

            <Button
              variant="contained"
              size="small"
              sx={{ backgroundColor: "darkred", color: "white", minWidth: 30, mr: 1 }}
              onClick={() => {
                const p = multiPassengers[index];
              
                // 1) carrega os dados do passageiro a editar
                setSelectedReservation({
                  ...p,
                  preco: p.preco,
                  precoBase: parseFloat(p.precoBase || 0),
                  id: p.id,
                });
              
                /* ---- NÃO precisamos de validar o lugar aqui ---- */
              
                setPrecoBase(parseFloat(p.precoBase || 0));
                setEditingPassengerIndex(index);
              
                // mantém os seats actuais mas não altera o lugar dele
                if (p.tripId) handleTripSelect(p.tripId, true);
              }}
              
            >
              <EditIcon fontSize="small" />
            </Button>

            <Button
              variant="contained"
              size="small"
              sx={{ backgroundColor: "darkred", color: "white", mr: 1, minWidth: 30 }}
              onClick={() => handleSinglePrint(row)}
            >
              <PrintIcon fontSize="small" />
            </Button>



            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => handleDeletePassenger(row, index)}
              sx={{ minWidth: 30,  backgroundColor: "darkred", color: "white", }}
            >
              <DeleteIcon fontSize="small" />
            </Button>



            
          </>
        );
      },
    },
   
  ];
  

  const additionalPassengerRows = multiPassengers.map((p, i) => ({
    ...p,
    _rowId: i,     // apenas para o DataGrid
    _index: i,     // continua a ser usado nos botões
  }));
  
  useEffect(() => {
    // Quando muda a viagem, apaga o bilhete atual para evitar "conflitos"
    setSelectedReservation((prev) => ({ ...prev, bilhete: "" }));
  }, [selectedReservation.tripId]);
  
  useEffect(() => {
    if (
      selectedReservation.tripId &&
      selectedReservation.entrada &&
      selectedReservation.saida
    ) {
      preencherBilheteAutomaticamente(
        selectedReservation.tripId,
        selectedReservation.volta,
        isChild
      );
    }
  }, [
    selectedReservation.tripId,
    selectedReservation.entrada,
    selectedReservation.saida,
    selectedReservation.volta,
    isChild, // Adiciona esta dependência se ainda não tiveres
  ]);
  
  
  
  
  useEffect(() => {
    if (!selectedReservation.tripId || !precoBase) return;
    if (isManualPriceSelection) return; // 👈 ignora se foi seleção manual
  
    const bilhetesPossiveis = getPricesForTrip(selectedReservation.tripId);
    const matchingPrice = bilhetesPossiveis.find(
      (p) => parseFloat(p.valor) === parseFloat(precoBase)
    );
  
    if (matchingPrice) {
      setSelectedReservation((prev) => ({
        ...prev,
        bilhete: matchingPrice.id,
        moeda: getMoedaByCountryId(matchingPrice.countryId),
      }));
    } else {
      setSelectedReservation((prev) => ({
        ...prev,
        bilhete: "",
      }));
    }
  }, [precoBase, selectedReservation.tripId, isManualPriceSelection]);
  

  

  const getCidadesDoPaisOposto = (cidadeSelecionada) => {
    const cidade = cities.find(c => c.nome === cidadeSelecionada);
    if (!cidade || !cidade.Country) return [];
  
    const paisOrigem = cidade.Country.nome
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const paisDestino = paisOrigem === "portugal" ? "suica" : "portugal";
  
    return cities.filter(
      c => c.Country &&
      c.Country.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === paisDestino
    );
  };
  


  const getPricesForTrip = (tripId) => {
    const foundTrip = availableTrips.find((t) => t.id === tripId);
    if (!foundTrip) {
      return [];
    }
  
    const originCity = cities.find(
      (c) => c.nome.toLowerCase() === foundTrip.origem?.toLowerCase()
    );
    if (!originCity) {
      return [];
    }
  
  
    // Ajustar se for "countryId" em minúsculas
    const filtered = prices.filter((p) => p.countryId === originCity.countryId);

  
    return filtered;
  };
  
  function getBilheteOrder(desc) {
    desc = desc
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  
    // 1 – Adulto Ida
    if (desc.includes("adulto") && desc.includes("ida") && !desc.includes("volta"))
      return 1;
  
    // 2 – Adulto Ida e Volta
    if (desc.includes("adulto") && desc.includes("ida e volta"))
      return 2;
  
    // 3 – Criança Ida
    if (desc.includes("crianca") && desc.includes("ida") && !desc.includes("volta"))
      return 3;
  
    // 4 – Criança Ida e Volta
    if (desc.includes("crianca") && desc.includes("ida e volta"))
      return 4;
  
    return 99;
  }
  
  
  
  

  // Carregar lista de preços ao montar o componente
  useEffect(() => {
    const carregarPrecos = async () => {
      try {
        const data = await fetchPrices();
        setPrices(data);
      } catch (err) {
        console.error("Erro ao buscar preços:", err);
      }
    };
    carregarPrecos();
  }, []);

  // Cálculo dinâmico do preço (principal) quando precoBase, valorCarro ou valorVolume mudam
  useEffect(() => {
    const valorCarroNum = parseFloat(selectedReservation.valorCarro) || 0;
    const valorVolumeNum = parseFloat(selectedReservation.valorVolume) || 0;
    const total = precoBase + valorCarroNum + valorVolumeNum;

    setSelectedReservation((prev) => ({
      ...prev,
      preco: total.toFixed(2),
    }));
  }, [precoBase, selectedReservation.valorCarro, selectedReservation.valorVolume]);

  // Processa criação de viagens de volta em fila
  useEffect(() => {
    const processNext = async () => {
      if (returnQueue.length > 0) {
        const next = returnQueue[0];
        await openReturnModal(next.reserva, next);
        setReturnQueue((prev) => prev.slice(1));
      }
    };
    processNext();
  }, [returnQueue]);
  

  // Buscar IDs de país e moeda
  const getCountryIdFromSelectedTrip = () => {
    const selectedTrip = availableTrips.find(
      (t) => t.id === selectedReservation.tripId
    );
    const origemCity = cities.find(
      (c) => c.nome.toLowerCase() === selectedTrip?.origem?.toLowerCase()
    );
    return origemCity?.CountryId || null;
  };

  const getMoedaByCountryId = (countryId) => {
    const country = countries.find((c) => c.id === countryId);
    if (!country) return "€"; // fallback, caso não encontre
    
    // Retiramos acentos do nome e convertemos para lowerCase
    const nome = country.nome
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    
    // Se for “suiça” => devolve "Fr", senão => "€"
    return nome === "suica" ? "Fr" : "€";
  };
  

// Abre modal para criar reserva de volta
// AUTOMATIZA A RESERVA DE REGRESSO (sem modal)
const openReturnModal = async (reservaBase, reservaData = selectedReservation) => {
  if (!reservaData.volta || reservaData.volta.toLowerCase() === "aberto") {
    return;
  }

  const tripIdReturn = await getReturnTripId(reservaData);
  if (!tripIdReturn) {
    console.error("Nenhuma viagem de regresso encontrada.");
    return;
  }

  try {
    const res = await fetch(`https://nunes.entigra.pt/backend/trips/${tripIdReturn}/available-seats`,{
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      }
      
    });
    const data = await res.json();
    const availableSeats = Array.isArray(data) ? data : [];

    if (availableSeats.length === 0) {
      console.error("Sem lugares disponíveis para a viagem de regresso.");
      return;
    }

    const selectedSeat = availableSeats[0].numero || availableSeats[0];

    const tripData = availableTrips.find((trip) => trip.id === reservaData.tripId);
    const mainTripDate = tripData?.dataviagem || null;

    await handleCreateReturnTrip(selectedSeat, mainTripDate, reservaData);


  } catch (error) {
    console.error("Erro ao criar automaticamente reserva de regresso:", error);
  }
};



  // Obter o tripId da viagem de regresso
  const getReturnTripId = async (reservation) => {
    try {
      const [day, month, year] = reservation.volta.split("/");
      const dbFormatDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
        2,
        "0"
      )}`;

      const origem = reservation.saida; // na volta, origem é a "saida" da ida
      const destino = reservation.entrada; // na volta, destino é a "entrada" da ida

      const url = `https://nunes.entigra.pt/backend/trips/return?origem=${encodeURIComponent(
        origem
      )}&destino=${encodeURIComponent(destino)}&dataviagem=${dbFormatDate}`;
      
      console.log("URL de busca da viagem de regresso:", url);
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });

      const res = await fetch(url);
      const data = await res.json();

      console.log("Resposta da viagem de regresso:", data);

      return data?.id || data?.trip?.id || null;
    } catch (err) {
      console.error("Erro ao procurar viagem de regresso:", err);
      return null;
    }
  };

  // Buscar lugares disponíveis para a viagem de regresso (usado no modal)
  const fetchAvailableReturnSeats = async (tripIdReturn) => {
    try {
      const res = await fetch(
        `https://nunes.entigra.pt/backend/trips/${tripIdReturn}/available-seats`
        ,{
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
          }
          
        });
      const data = await res.json();
      const formattedSeats = Array.isArray(data) ? data : [];
      setAvailableReturnSeats(
        formattedSeats.map((seat) => seat.numero || seat)
      );
      if (formattedSeats.length > 0) {
        setSelectedReturnSeat(
          formattedSeats[0].numero || formattedSeats[0]
        );
      }
    } catch (error) {
      console.error(
        "Erro ao buscar lugares disponíveis para a viagem de regresso:",
        error
      );
    }
  };


  const checkAndCreateReturnTripIfNeeded = async (oldReservation, newReservation) => {
    if (!oldReservation || !newReservation) return;
  
    const oldVolta = (oldReservation.volta || "").trim();
    const newVolta = (newReservation.volta || "").trim();
  
    if (oldVolta !== newVolta && newVolta && newVolta.toLowerCase() !== "aberto") {
      console.log("Data de volta alterada. A criar nova viagem de regresso...");
      
      // Se já tens o tripReturnId calculado:
      await openReturnModal(newReservation.reserva, newReservation);
    }
  };
  


 // Criar reserva de regresso
const handleCreateReturnTrip = async (selectedSeat, tripDate, basePassenger) => {
  if (!basePassenger) return;

  const formattedReserva = `${basePassenger.reserva}.v`;

  const updatedReservationData = {
    ...basePassenger,
    entrada: basePassenger.saida,
    saida: basePassenger.entrada,
    lugar: selectedSeat,
    reserva: formattedReserva,
    preco: "",
    moeda: "",
    tripId: basePassenger.tripReturnId,
    volta: tripDate,
  };

  try {
    const res = await fetch(`https://nunes.entigra.pt/backend/reservations/create`, {
      method: "POST",
      
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        
      
      body: JSON.stringify({
        ...updatedReservationData,
        createdBy: localStorage.getItem("email") || "admin",
      }),
    });

    if (!res.ok) {
      console.error("Erro ao criar reserva de regresso:", await res.text());
      return;
    }

    console.log("Reserva de regresso criada para:", formattedReserva);
    fetchAllReservations();
  } catch (error) {
    console.error("Erro ao criar reserva de regresso:", error);
  }
};


  const handleReturnModalConfirm = async (selectedSeat, tripDate) => {
    await handleCreateReturnTrip(selectedSeat, tripDate);
    setModalReturnOpen(false);
  };

  // Gera o código incremental para passageiros adicionais
  const generateNextSubReserva = () => {
    const baseCode = selectedReservation.reserva;
    if (!baseCode) return "";
    const count = multiPassengers.length;
    return `${baseCode}.${count + 1}`;
  };

  // Ao selecionar uma viagem, busca os lugares disponíveis
// utilitário — devolve todas as cidades de um país
const getCitiesByCountryId = (countryId) =>
  cities.filter((c) => c.countryId === countryId);

// ────────────────────────────────────────────────
const handleTripSelect = async (selectedTripId, keepSeat = false) => {
  /* 1.  encontrar a viagem escolhida */
  const trip = availableTrips.find((t) => t.id === selectedTripId);
  if (!trip) return;

  /* 2.  descobrir as cidades de origem e destino da viagem */
  const origemCity  = cities.find(
    (c) => c.nome.toLowerCase() === trip.origem?.toLowerCase()
  );
  const destinoCity = cities.find(
    (c) => c.nome.toLowerCase() === trip.destino?.toLowerCase()
  );

  /* 3.  definir a moeda (mantém‑se a tua lógica) */
  let moeda = "€";
  const paisOrigem = origemCity?.Country?.nome
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (paisOrigem === "suica") moeda = "Fr";

  /* 4.  filtrar as listas de Entrada e Saída */
  setEntradaOptions(
    origemCity ? getCitiesByCountryId(origemCity.countryId) : []
  );
  setSaidaOptions(
    destinoCity ? getCitiesByCountryId(destinoCity.countryId) : []
  );

  /* 5.  buscar lugares livres como já fazias */
  try {
    const res = await fetch(
      `https://nunes.entigra.pt/backend/reservations/trip/${selectedTripId}`
      ,{
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        }
        
      });
    const data  = await res.json();
    const seats = Array.isArray(data.freeSeats)
      ? data.freeSeats.sort((a, b) => a - b)
      : [];
    setAvailableSeats(seats);

    /* 6.  actualizar a reserva seleccionada
          (pré‑preenche Entrada/Saída se quiseres)           */
    setSelectedReservation((prev) => ({
      ...prev,
      tripId: selectedTripId,
      moeda,

      ...(keepSeat ? {} : { lugar: seats[0] || "" }),
    }));
  } catch (error) {
    console.error("Erro ao buscar lugares disponíveis:", error);
  }
};

  
  
  
  

  // Carrega dados iniciais: cidades, viagens, reservas, países
  useEffect(() => {
    fetch("https://nunes.entigra.pt/backend/cities",{
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      }
      
    })
      .then((res) => res.json())
      .then((data) => {
        const sorted = Array.isArray(data)
          ? data.sort((a, b) => a.nome.localeCompare(b.nome))
          : [];
        setCities(sorted);
        setEntradaOptions(sorted);
setSaidaOptions(sorted);

      })
      .catch((err) => {
        console.error("Erro ao buscar cidades:", err);
        setCities([]);
      });

    fetchAllReservations();

    fetch("https://nunes.entigra.pt/backend/countries",{
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
      }
      
    })
      .then((res) => res.json())
      .then((data) => setCountries(data))
      .catch((err) => {
        console.error("Erro ao buscar países:", err);
        setCountries([]);
      });

      fetch("https://nunes.entigra.pt/backend/trips",{
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        }
        
      })
      .then((res) => res.json())
      .then((data) => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); // ignora a hora, só compara datas
    
        const sortedTrips = data
          .filter((trip) => {
            if (!trip.dataviagem) return false;
            const dataViagem = new Date(trip.dataviagem);
            dataViagem.setHours(0, 0, 0, 0);
            return dataViagem >= hoje;
          })
          .sort((a, b) => new Date(a.dataviagem) - new Date(b.dataviagem));
    
        setAvailableTrips(sortedTrips);
      })
    
  }, []);

  const fetchAllReservations = async () => {
    try {
      const res = await fetch("https://nunes.entigra.pt/backend/reservations/all",{
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        }
        
      });
      const data = await res.json();
      // Garante que cada reserva tem a propriedade tripId
      const reservationsWithTripId = data.map(r => ({
        ...r,
        tripId: r.tripId || (r.Trip && r.Trip.id) || null,
      }));
      const sorted = reservationsWithTripId.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setReservations(sorted);
    } catch (err) {
      console.error("Erro ao buscar reservas:", err);
    } finally {
      setLoading(false);
    }
  };
  
  
  
  useEffect(() => {
    if (multiPassengers.length > 0 && editingPassengerIndex === null) {
      // assume que o índice 0 é sempre a principal
      setSelectedReservation(prev => ({
        ...multiPassengers[0],
        precoBase: parseFloat(multiPassengers[0].precoBase || multiPassengers[0].preco) || 0
      }));
    }
  }, [multiPassengers, editingPassengerIndex]);
  
  

  useEffect(() => {
    fetchAllReservations();
  }, []);

  // Definição das colunas do DataGrid
  const columns = [
    { field: "reserva", headerName: "Reserva", width: 100 },
    { field: "preco", headerName: "Preço", width: 80 },
    { field: "moeda", headerName: "Moeda", width: 80 },
    { field: "dataviagem", headerName: "Data da Viagem", width: 130 },
    { field: "apelidoPassageiro", headerName: "Apelido", width: 150 },
    { field: "nomePassageiro", headerName: "Nome", width: 150 },
    { field: "entrada", headerName: "Entrada", width: 120 },
    { field: "saida", headerName: "Saída", width: 120 },
    { field: "volta", headerName: "Volta", width: 130 },
    { field: "telefone", headerName: "Tel.", width: 130 },
    { field: "email", headerName: "Email", width: 200 },
    { field: "carro", headerName: "Carro", width: 100 },
    { field: "valorCarro", headerName: "Valor Carro", width: 130 },
    { field: "valorVolume", headerName: "Valor Volume", width: 130 },
    {
      field: "impresso",
      headerName: "Impresso",
      width: 130,
      renderCell: (params) => {
        if (!params || !params.value) {
          return "";
        }
        return params.value === "1" ? "✔" : "";
      },
    }
    
    ,
    { field: "bilhete", headerName: "Bilhete", width: 130 },
    { field: "obs", headerName: "Obs.", width: 400 },
    { field: "updatedBy", headerName: "Atualizado Por", width: 200 },
    { field: "updatedAt", headerName: "Atualizado Em", width: 200 },
    { field: "createdBy", headerName: "Criado Por", width: 200 },
    { field: "createdAt", headerName: "Criado Em", width: 200 },
  ];

  // Função para salvar uma reserva (principal ou adicional)
  const saveReservation = async (reservationData) => {
    const email = localStorage.getItem("email") || "admin";
    let reservaCode = reservationData.reserva;

    
    // Gerar código de reserva caso seja nova e não tenha ponto (p. ex. "0001")
    if (!reservationData.id && (!reservaCode || reservaCode.indexOf(".") === -1)) {
      try {
        const lastRes = await fetch("https://nunes.entigra.pt/backend/reservations/last",{
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
          }
          
        });
        const lastData = await lastRes.json();
        const lastNumber = lastData?.reserva ? parseInt(lastData.reserva) : 0;
        reservaCode = String(lastNumber + 1).padStart(4, "0");
      } catch (error) {
        console.error("Erro ao gerar número de reserva:", error);
        alert("Erro ao gerar número da reserva!");
        return false;
      }
    }

    const method = reservationData.id ? "PUT" : "POST";
    const url = reservationData.id
      ? `https://nunes.entigra.pt/backend/reservations/${reservationData.id}`
      : "https://nunes.entigra.pt/backend/reservations/create";

    const response = await fetch(url, {
      method,
    
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        
  
      body: JSON.stringify({
        ...reservationData,
       
        reserva: reservaCode,
        obs: reservationData.obs,
        entrada: reservationData.entrada,
        saida: reservationData.saida,
        lugar: reservationData.lugar,
        carro: reservationData.carro,
        telefone: reservationData.telefone,
        nomePassageiro: reservationData.nomePassageiro,
        apelidoPassageiro: reservationData.apelidoPassageiro,
        email: reservationData.email,
        tripId: reservationData.tripId,
        volta: reservationData.volta,
        valorCarro: reservationData.valorCarro,
        valorVolume: reservationData.valorVolume,
        impresso: reservationData.impresso,
        preco: reservationData.preco,
        precoBase: reservationData.precoBase,
        moeda: reservationData.moeda,
        [reservationData.id ? "updatedBy" : "createdBy"]: email,
      }),
      
    });

     if (!response.ok) {
         return null;
       }
       // devolve o objeto criado/atualizado
       const saved = await response.json();
       return saved;
      };

  // Handler para salvar a reserva principal e as reservas adicionais
  const handleSaveAll = async () => {
    if (multiPassengers.length === 0) {
      alert("Adiciona pelo menos uma reserva à lista.");
      return;
    }

      /* ----------------------------------------------------------
+   *   CASO 100 % UPDATE → evita gerar novo bloco/reserva
+   * ---------------------------------------------------------- */
  const soActualizacoes = multiPassengers.every(p => p.id);
  if (soActualizacoes) {
    for (const p of multiPassengers) {
      const old = reservations.find(r => r.id === p.id);
      if (old) {
        await checkAndCreateReturnTripIfNeeded(old, p);
      }
  
      const ok = await saveReservation(p);   // PUT
      if (!ok) {
        alert("Falhou a actualização de uma das reservas.");
        return;
      }
    }
    alert("Reservas actualizadas com sucesso!");
    fetchAllReservations();
    return;
  }
  
  
    try {
      // ------------------------------------------------------------------------
      // 1) ENCONTRAR QUAL É A RESERVA PRINCIPAL NO ARRAY
      // ------------------------------------------------------------------------
      // Critério comum: a reserva principal é a que não tem ponto (ex: "0001").
      // Se todas tiverem, então pegamos a primeira e extraímos o prefixo.
  
      let mainIndex = multiPassengers.findIndex((r) => {
        return r.reserva && !r.reserva.includes(".");
      });
  
      // Se não encontrou nenhuma que não tenha ".", assume a [0] por padrão
      if (mainIndex === -1) {
        mainIndex = 0;
      }
  
      // Agora, tens o objecto principal
      const mainReservationObj = multiPassengers[mainIndex];
  
      // ------------------------------------------------------------------------
      // 2) DETERMINAR O PREFIXO DO CÓDIGO (blockCode)
      // ------------------------------------------------------------------------
      let blockCode = ""; 
      if (mainReservationObj.reserva) {
        // Se a reserva for algo tipo "0001" ou "0001.1"
        // extrai sempre o prefixo antes do ponto
        blockCode = mainReservationObj.reserva.split(".")[0];
      }
  
      // Se a reserva for nova (sem ID) e sem blockCode, geramos agora
      if (!mainReservationObj.id && !blockCode) {
        const lastRes = await fetch("https://nunes.entigra.pt/backend/reservations/last",{
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
          }
          
        });
        const lastData = await lastRes.json();
        const lastNumber = lastData?.reserva ? parseInt(lastData.reserva) : 0;
        blockCode = String(lastNumber + 1).padStart(4, "0");
      }
  
      // ------------------------------------------------------------------------
      // 3) REORDENAR O ARRAY => principal + resto dos passageiros
      // ------------------------------------------------------------------------
      const reordered = [
        mainReservationObj,
        ...multiPassengers.filter((_, i) => i !== mainIndex),
      ];
  
      // ------------------------------------------------------------------------
      // 4) CONSTRUIR O OBJECTO PRINCIPAL SEM PONTO NO 'reserva'
      // ------------------------------------------------------------------------
      const mainReservation = {
        ...mainReservationObj,
        // Garante que o main terá o prefixo sem ponto
        reserva: blockCode,
      };
  
      // ------------------------------------------------------------------------
      // 5) CONSTRUIR AS SUBRESERVAS
      // ------------------------------------------------------------------------
      // Pega todos os que não são a primeira posição do reordered
      const additionalReservations = reordered.slice(1).map((passenger, index) => {
        // Se o passenger já tiver um ID, respeitamos esse ID.
        // Mas se a reserva não tiver ponto, damos um sufixo .1, .2, etc.
        let subCode = passenger.reserva;
        if (!subCode || !subCode.includes(".")) {
          // gerar "0001.1", "0001.2", ...
          subCode = `${blockCode}.${index + 1}`;
        }
        return {
          ...passenger,
          reserva: subCode,
        };
      });
  
      

      // ------------------------------------------------------------------------
      // 6) GRAVAR A RESERVA PRINCIPAL
      // ------------------------------------------------------------------------
      const savedMain = await saveReservation(mainReservation);
        if (!savedMain) {
          alert("Erro ao salvar a reserva principal.");
          return;
        }
  
      // ------------------------------------------------------------------------
      // 7) GRAVAR AS SUBRESERVAS
      // ------------------------------------------------------------------------
      const savedAdditionals = [];
        for (const passenger of additionalReservations) {
          const saved = await saveReservation(passenger);
          if (!saved) {
            alert("Erro ao criar/atualizar uma das reservas adicionais.");
            return;
          }
          savedAdditionals.push(saved);
        }
  
      // ------------------------------------------------------------------------
      // 8) LIMPAR ESTADOS E AVISAR
      // ------------------------------------------------------------------------
      setSuccessMessage(`Reserva Nº: ${blockCode}`);
      setSuccessModalOpen(true);

      const novoBloco = [savedMain, ...savedAdditionals];
      setMultiPassengers(novoBloco);
      setSelectedReservation(savedMain);

      
      setPrecoBase(parseFloat(mainReservation.precoBase) || 0);
      setEditingPassengerIndex(0);  // ← assume que a principal é a 0 no novo array
      setSelectedRow(mainReservation);

      


      // passageiro(s) com data de volta entram na fila
      const passageirosComVolta = [mainReservation, ...additionalReservations]
        .filter(p => p.volta?.trim());
      if (passageirosComVolta.length) {
        setReturnQueue(prev => [...prev, ...passageirosComVolta]);
      }

  
      fetchAllReservations();
  
    } catch (error) {
      console.error("Erro ao gerar número da reserva (bloco):", error);
      alert("Erro ao gerar número da reserva!");
    }
  };
  
  const uniqueTripOptions = useMemo(() => {
    const map = new Map();
    tripOptions.forEach(opt => {
      // chave composta: data (label) + origem + destino
      const key = `${opt.label}-${opt.origem}-${opt.destino}`;
      if (!map.has(key)) {
        map.set(key, opt);
      }
    });
    return Array.from(map.values());
  }, [tripOptions]);
  

  // Função utilitária para atualizar um passageiro adicional no array multiPassengers
  const updateMultiPassengerField = (index, field, value) => {
    setMultiPassengers((prevPassengers) => {
      const updated = [...prevPassengers];
      updated[index][field] = value;
  
      // Recalcula preço se necessário
      if (["valorCarro", "valorVolume", "selectedPriceId"].includes(field)) {
        const valorCarroNum = parseFloat(updated[index].valorCarro) || 0;
        const valorVolumeNum = parseFloat(updated[index].valorVolume) || 0;
        const base = parseFloat(updated[index].precoBase) || 0;
        updated[index].preco = (base + valorCarroNum + valorVolumeNum).toFixed(2);
      }
  
      // Atualizar opções de entrada/saída
      if (field === "entrada") {
        const saidaOptions = getCidadesDoPaisOposto(value);
        setMultiPassengerOptions(prev => ({
          ...prev,
          [index]: { ...(prev[index] || {}), saidaOptions }
        }));
      }
  
      if (field === "saida") {
        const entradaOptions = getCidadesDoPaisOposto(value);
        setMultiPassengerOptions(prev => ({
          ...prev,
          [index]: { ...(prev[index] || {}), entradaOptions }
        }));
      }
  
      return updated;
    });
  };
  
  const selectedOption = tripOptions.find(
    (opt) => opt.id === selectedReservation.tripId
  );
  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
  <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
    Gestão Reserva
  </Typography>
  

  {selectedReservation && (
    <Box sx={{ mt: 2, p: 1, border: "1px solid #ccc", borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
        {selectedReservation?.id ? "Editar Reserva" : "Nova Reserva"}
      </Typography>
      
      {editingPassengerIndex !== null && (
  <Typography
  variant="subtitle1"
  color="warning.main"
  sx={{ fontSize: "1.6rem", fontWeight: "bold" }}
>
  A editar: {selectedReservation.reserva || "(sem código)"}
</Typography>

)}

      {/* FORMULÁRIO PRINCIPAL */}
      <Box sx={{ display: "flex",gap:2, p: 1 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
      <Autocomplete
  options={uniqueTripOptions}
  getOptionLabel={opt => opt.label}
  inputValue={dateInputValue}
  onInputChange={(_, v) => setDateInputValue(v)}
  value={selectedOption}
  onChange={(_, newVal) => {
    if (newVal) {
      handleTripSelect(newVal.id);
      setDateInputValue(newVal.label);
    } else {
      setSelectedReservation(r => ({ ...r, tripId: "" }));
      setDateInputValue("");
    }
  }}
  filterOptions={(options, { inputValue }) => {
    const normalize = s => s.normalize("NFD")
                             .replace(/[\u0300-\u036f]/g, "")
                             .toLowerCase().trim();
    const words = normalize(inputValue).split(/\s+/).filter(Boolean);
    return options.filter(o =>
      words.every(w => normalize(o.label).includes(w))
    );
  }}
  
  

  /* ----------- ❶ pinta as linhas do menu ----------- */
  renderOption={(props, option) => (
    <Box
      component="li"
      {...props}
      sx={{
        color:
          option.paisOrigem === "suica"
            ? "red"     // origem Suíça → vermelho
            : option.paisOrigem === "portugal"
            ? "green"   // origem Portugal → verde
            : "inherit" // qualquer outro país
      }}
    >
      {option.label}
    </Box>
  )}
  /* ----------- ❷ pinta o valor seleccionado ----------- */
  sx={{
    minWidth: 170,
    "& .MuiAutocomplete-inputRoot": {
      color:
        selectedOption?.paisOrigem === "suica"
          ? "red"
          : selectedOption?.paisOrigem === "portugal"
          ? "green"
          : "inherit",
    },
    ...commonFieldProps.sx,  // mantém as tuas regras globais
  }}
  renderInput={(params) => (
    <TextField
      {...params}
      label="Selecionar Data"
      variant="outlined"
      size="small"
      sx={{ ...commonFieldProps.sx }}
    />
  )}
/>

<Autocomplete
  options={entradaOptions
    .filter((c) =>
      !["portugal", "suica"].includes(
        c.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      )
    )
    .map((c) => c.nome)}
  value={selectedReservation.entrada || ""}
  onChange={(e, newValue) =>
    setSelectedReservation((prev) => {
      const updated = { ...prev, entrada: newValue };
      if (newValue && updated.tripId) {
        preencherBilheteAutomaticamente(updated.tripId, updated.volta);
      }
      return updated;
    })
  }
  renderInput={(params) => (
    <TextField
      {...params}
      label="Entrada"
      sx={{ minWidth: 170, ...commonFieldProps.sx }}
    />
  )}
  size="small"
/>



<Autocomplete
  options={saidaOptions
    .filter((c) =>
      !["portugal", "suica"].includes(
        c.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      )
    )
    .map((c) => c.nome)}
  value={selectedReservation.saida || ""}
  onChange={(e, newValue) => {
    setSelectedReservation((prev) => ({
      ...prev,
      saida: newValue,
    }));
    setEntradaOptions(getCidadesDoPaisOposto(newValue));
  }}
  renderInput={(params) => (
    <TextField
      {...params}
      label="Saída"
      sx={{ minWidth: 170, ...commonFieldProps.sx }}
    />
  )}
  size="small"
/>







<Autocomplete
  options={returnTripOptions}
  getOptionLabel={(o) => o.label}
  value={
    returnTripOptions.find(
      o => o.id === selectedReservation.volta || o.data === selectedReservation.volta
    ) || null
  }
  
  onChange={(e, newVal) => {
    if (!newVal) {
      setSelectedReservation(prev => ({ ...prev, volta: "", tripReturnId: "" }));
      return;
    }

    if (newVal.id === "Aberto") {
      setSelectedReservation(prev => ({
        ...prev,
        volta: "Aberto",
        tripReturnId: "",
      }));
    } else {
      setSelectedReservation(prev => ({
        ...prev,
        volta: newVal.data,      // <--- aqui usas data e não label
        tripReturnId: newVal.id,
      }));
    }
    

    if (selectedReservation.tripId) {
      preencherBilheteAutomaticamente(
        selectedReservation.tripId,
        newVal?.label || "",
        isChild
      );
    }
  }}
  renderOption={(props, option) => {
    const ida = availableTrips.find(t => t.id === selectedReservation.tripId);
    const paisOrigIda = getPaisNormalizado(ida?.origem);
    const paisDestIda = getPaisNormalizado(ida?.destino);

    const viagemVolta = availableTrips.find(t => t.id === option.id);
    const paisOrigVolta = getPaisNormalizado(viagemVolta?.origem);
    const paisDestVolta = getPaisNormalizado(viagemVolta?.destino);

    const isReverse =
      paisOrigVolta === paisDestIda && paisDestVolta === paisOrigIda;

    return (
      <Box
        component="li"
        {...props}
        sx={{
          color: isReverse
            ? paisOrigVolta === "portugal"
              ? "green"
              : paisOrigVolta === "suica"
              ? "red"
              : "inherit"
            : "inherit",
        }}
      >
        {option.label}
      </Box>
    );
  }}
  renderInput={(params) => (
    <TextField
      {...params}
      label="Data Volta"
      size="small"
      sx={{ minWidth: 170, ...commonFieldProps.sx }}
    />
  )}
  sx={{
    minWidth: 170,
    "& .MuiAutocomplete-inputRoot": {
      color:
        getPaisNormalizado(cities.find(c => c.nome === selectedReservation.saida)?.Country?.nome) === "suica"
          ? "red"
          : "green",
    },
    ...commonFieldProps.sx,
  }}
/>










          
        </Stack>
      </Box>

      {/* NOVA BOX PARA TELEFONE, NOME, APELIDO */}
      <Box sx={{ display: "flex",gap:2, p: 1 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>

      <TextField
            label="Nome"
            value={selectedReservation.nomePassageiro || ""}
            onChange={(e) =>
              setSelectedReservation({ ...selectedReservation, nomePassageiro: e.target.value })
            }
            sx={{ minWidth: 170, ...commonFieldProps.sx }}size="small"
          />

          <TextField
            label="Apelido"
            value={selectedReservation.apelidoPassageiro || ""}
            onChange={(e) =>
              setSelectedReservation({ ...selectedReservation, apelidoPassageiro: e.target.value })
            }
            sx={{ minWidth: 170, ...commonFieldProps.sx }}size="small"
          />
          <TextField
            label="Telefone"
            value={selectedReservation.telefone || ""}
            onChange={(e) =>
              setSelectedReservation({ ...selectedReservation, telefone: e.target.value })
            }
            sx={{ minWidth: 170, ...commonFieldProps.sx }} size="small"
          />
<FormControlLabel
  control={
    <Checkbox
      checked={isChild}
      onChange={(e) => {
        const childChecked = e.target.checked;
        setIsChild(childChecked);

        setSelectedReservation((prev) => {
          const updated = { ...prev };

          if (updated.tripId && updated.entrada && updated.saida) {
            preencherBilheteAutomaticamente(
              updated.tripId,
              updated.volta,
              childChecked
            );
          }

          return updated;
        });
      }}
      sx={{ p: 0.5 }}
    />
  }
  label="Criança"
  sx={{ ml: 1 }}
/>
         
        </Stack>
      </Box>

      {/* BOX PARA CARRO E VALOR CARRO */}<Button
  variant="text"
  onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
  sx={{ color: "darkred", textTransform: "none", fontWeight: "bold" }}
>
  {mostrarDetalhes ? "Ocultar -" : "Mostrar Mais +"}
</Button>
<Collapse in={mostrarDetalhes} timeout="auto" unmountOnExit>

      <Box sx={{ display: "flex",gap:2, p: 1 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
  
          <TextField
            label="Carro OBS."
            value={selectedReservation.carro || ""}
            onChange={(e) =>
              setSelectedReservation({ ...selectedReservation, carro: e.target.value })
            }
            sx={{ minWidth: 170, ...commonFieldProps.sx }}size="small"
          />

          <TextField
            label="Valor Carro"
            value={selectedReservation.valorCarro || ""}
            onChange={(e) =>
              setSelectedReservation({ ...selectedReservation, valorCarro: e.target.value })
            }
            sx={{ minWidth: 170, ...commonFieldProps.sx }}size="small"
          />


        </Stack>
        <FormControl fullWidth sx={{ ...commonFieldProps.sx }}>
  <InputLabel>Bilhete</InputLabel>
  <Select
    key={`${selectedReservation.tripId}-${selectedReservation.moeda}`}
    value={selectedReservation.bilhete || ""}
    label="Bilhete"
    onChange={(e) => {
      setIsManualPriceSelection(true); // ← marca como seleção manual
      const priceId = e.target.value;
      const price = prices.find((p) => p.id === priceId) || {};
      const base = parseFloat(price.valor || 0);
    
      setSelectedReservation((prev) => ({
        ...prev,
        bilhete: priceId,
        preco: base.toFixed(2),
        moeda: getMoedaByCountryId(price.countryId),
      }));
      setPrecoBase(base);
    }}
    
    size="small"
    {...commonFieldProps}
  >
         {getPricesForTrip(selectedReservation.tripId)
      .map(p => ({
        ...p,
        descNorm: p.descricao
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
      }))
      .filter(p =>
        isChild               //  ← usa o estado correcto
          ? p.descNorm.includes("crianca")
          : p.descNorm.includes("adulto")
      )
      .sort((a, b) => getBilheteOrder(a.descricao) - getBilheteOrder(b.descricao))
      .map((price) => (
        <MenuItem key={price.id} value={price.id}>
          {price.valor} {getMoedaByCountryId(price.countryId)} - {price.descricao}
        </MenuItem>
      ))}
  </Select>
</FormControl>
      </Box>


      {/* BOX PARA OBS, VALOR VOLUME E TOTAL BILHETE */}
      <Box sx={{ display: "flex",gap:2, p: 1, marginBottom: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            label="OBS."
            value={selectedReservation.obs || ""}
            onChange={(e) =>
              setSelectedReservation({ ...selectedReservation, obs: e.target.value })
            }
            sx={{ minWidth: 170, ...commonFieldProps.sx }}size="small"
          />

          <TextField
            label="Valor Volume"
            value={selectedReservation.valorVolume || ""}
            onChange={(e) =>
              setSelectedReservation({ ...selectedReservation, valorVolume: e.target.value })
            }
            sx={{ minWidth: 170, ...commonFieldProps.sx }}size="small"
          />

          <TextField
            label="Total Bilhete"
            value={selectedReservation.preco || ""}
            InputProps={{ readOnly: true }}
            sx={{ minWidth: 170, ...commonFieldProps.sx }}size="small"
          />
            
            
       </Stack>     
   </Box>
   </Collapse>
            <Box sx={{ display: "flex",gap:2, p: 1, marginBottom: 2 }}>

            <Button
  variant="contained"
  style={{ backgroundColor: "darkred", color: "white" }}
  onClick={() => {
    const nextSeat = getNextFreeSeat();
    if (!nextSeat && editingPassengerIndex === null) {
      alert("Não há mais lugares disponíveis nesta viagem.");
      return;
    }

    const isEditing = editingPassengerIndex !== null;

    const seatToAssign = isEditing
      ? selectedReservation.lugar
      : nextSeat;

    if (!seatToAssign) {
      alert("Não há lugares disponíveis nesta viagem.");
      return;
    }

    const novaReserva = {
      ...selectedReservation,
      nomePassageiro: (selectedReservation.nomePassageiro || "").toUpperCase(),
      apelidoPassageiro: (selectedReservation.apelidoPassageiro || "").toUpperCase(),
      lugar: seatToAssign,
      reserva: isEditing
        ? selectedReservation.reserva
        : gerarProximaSubReserva(),
      id: isEditing ? selectedReservation.id : undefined,
      precoBase: precoBase.toString(),
    };
    

    if (isEditing) {
      const actualizados = [...multiPassengers];
      actualizados[editingPassengerIndex] = novaReserva;
      setMultiPassengers(actualizados);
      setEditingPassengerIndex(null);
      
    } else {
      if (
        novaReserva.reserva &&
        multiPassengers.some((r) => r.reserva === novaReserva.reserva)
      ) {
        alert("Já existe uma reserva com esse código!");
        return;
      }
      setMultiPassengers([...multiPassengers, novaReserva]);
      setSelectedReservation(prev => ({
        ...prev,
        nomePassageiro: "",  // limpa só o campo Nome
      }));
    }
  }}
>
  {editingPassengerIndex !== null ? "Atualizar Passageiro" : "+ Adicionar Passageiro"}
</Button>
<Button
      variant="outlined"
      style={{
        backgroundColor: "white",
        color: "darkred",
        borderColor: "darkred",
      }}
      onClick={() => {
        setMultiPassengers([]);
        setSelectedReservation({
          nomePassageiro: "",
          apelidoPassageiro: "",
          entrada: "",
          saida: "",
          telefone: "",
          email: "",
          carro: "",
          obs: "",
          preco: "",
          moeda: "",
          tripId: "",
          reserva: "",
          lugar: "",
          volta: "",
          valorCarro: "",
          valorVolume: "",
          impresso: "",
          bilhete: "",
          totalbilhete: "",
        });
        setPrecoBase(0);
        setEditingPassengerIndex(null);
      }}
    >
      Limpar
    </Button>



          
      </Box>

          {/* PASSAGEIROS ADICIONAIS (cada um no seu bloco, também numa só linha) */}
          {/* Cabeçalho */}
          {multiPassengers.length > 0 && (
  <Box sx={{ mt: 3, width: "100%" }}>
    <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
      Passageiros
    </Typography>

    <DataGrid
      rows={additionalPassengerRows}
      columns={additionalPassengerColumns}
      autoHeight
      hideFooterPagination
      disableRowSelectionOnClick
      getRowId={(row) => row._rowId}   // ←‑‑ usa _rowId, deixa o id intacto

      density="compact"
      sx={{
        backgroundColor: "#fff",
        borderRadius: 2,
        '& .MuiDataGrid-columnHeaders': {
          fontWeight: 'bold',
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ccc',
        },
        '& .MuiDataGrid-cell': {
          borderBottom: '1px solid #eee',
          borderRight: '1px solid #eee',
        },
        '& .MuiDataGrid-row': {
          '&:last-child .MuiDataGrid-cell': {
            borderBottom: 'none',
          },
        },
        '& .MuiDataGrid-columnSeparator': {
          display: 'none',
        },
      }}
    />
  </Box>
)}
{multiPassengers.length > 0 && (
<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
  <Box>
    <Button
      variant="outlined"
      style={{
        backgroundColor: "white",
        color: "darkred",
        borderColor: "darkred",
      }}
      onClick={() => {
        setMultiPassengers([]);
        setSelectedReservation({
          nomePassageiro: "",
          apelidoPassageiro: "",
          entrada: "",
          saida: "",
          telefone: "",
          email: "",
          carro: "",
          obs: "",
          preco: "",
          moeda: "",
          tripId: "",
          reserva: "",
          lugar: "",
          volta: "",
          valorCarro: "",
          valorVolume: "",
          impresso: "",
          bilhete: "",
          totalbilhete: "",
        });
        setPrecoBase(0);
        setEditingPassengerIndex(null);
      }}
    >
      Nova Reserva
    </Button>

    <Button
      variant="contained"
      style={{ backgroundColor: "darkred", color: "white", marginLeft: 8 }}
      onClick={handleSaveAll}
    >
      Guardar
    </Button>

    {selectedReservation.id && (
    <Button
    variant="contained"
    sx={{ backgroundColor: "darkred", color: "white", ml: 1 }}
    onClick={async () => {
      if (!multiPassengers.length) {
        alert("Nada para imprimir.");
        return;
      }
      const tripDate = availableTrips.find(
        (t) => t.id === selectedReservation.tripId
      )?.dataviagem;
  
      // 1) Filtra quais ainda não foram impressos
      const iniciais = multiPassengers.filter(p => p.impresso !== 1 && p.impresso !== "1");
      // 2) Filtra os que já têm impresso = 1
      const reimprimir = multiPassengers.filter(p => p.impresso === 1 || p.impresso === "1");
  
      // 3) Impressão inicial (vai incrementar e marcar impresso)
      if (iniciais.length) {
        await handlePrintAllTickets(
          iniciais,
          tripDate,
          formatDate,
          handleRowEdit
        );
      }
  
      // 4) Reimpressão (mantém o nº de bilhete)
      if (reimprimir.length) {
        await handleRePrintAllTickets(
          reimprimir,
          tripDate,
          formatDate,
          handleRowEdit
        );
      }
  
      // 5) Refresh da lista
      await fetchAllReservations();
    }}
  >
    Imprimir Todos
  </Button>
  
    
    )}


<TextField
    label="Total Reserva"
    value={totalReserva}
    InputProps={{ readOnly: true }}
    size="small"
    sx={{ width: 120, marginLeft: "570px" }}
  />
  </Box>

 
</Box>
)}

          {/* BOTÕES FINAIS (Limpar, Guardar, Adicionar) */}
          <Box sx={{ mt: 3, display: "flex",gap:2, flexWrap: "wrap", gap: 2 }}>
            
          
          </Box>
        </Box>
      )}

      {/* Lista de Reservas */}
      <Typography variant="h4" gutterBottom style={{ marginTop: "5rem" }}>
        Lista de Todas as Reservas
      </Typography>
      <TextField
        label="Pesquisar reserva, nome, apelido ou telefone"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
        InputProps={{ startAdornment: <Box sx={{ mr: 1, color: "gray" }}>🔍</Box> }}
      />

      <Box sx={{ width: "100%", overflowX: "auto" }}>
      <DataGrid
  rows={reservations
    .filter(r => {
      // Se houver texto na pesquisa, ignora o filtro pela viagem
      if (searchTerm.trim() !== "") {
        return true;
      }
      // Se não houver tripId selecionado, não mostra nada
      if (!selectedReservation.tripId) return false;
      // Converte para string para evitar discrepâncias de tipo
      const selectedTrip = String(selectedReservation.tripId);
      const reservationTrip = String(r.tripId);
      return reservationTrip === selectedTrip;
    })
    .filter(r =>
      `${r.reserva} ${r.nomePassageiro} ${r.apelidoPassageiro} ${r.telefone}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
    .map((r, idx) => ({
      ...r,
      id: r.id || idx,
      dataviagem: r?.Trip?.dataviagem
        ? new Date(r.Trip.dataviagem).toLocaleDateString("pt-PT")
        : "—",
    }))
  }
  columns={columns}
onRowClick={(params) => {
  const clicked = params.row;

  handleTripSelect(clicked.tripId, true);  // <-- refresca availableSeats
  // SEM o if (!selectedReservation.reserva)
  const baseCode = clicked.reserva.includes(".")
    ? clicked.reserva.split(".")[0]
    : clicked.reserva;

  const main = reservations.find((r) => r.reserva === baseCode) || clicked;
  const additionals = reservations.filter((r) =>
    r.reserva.startsWith(`${baseCode}.`)
  );

  const passageirosDoBloco = [main, ...additionals].map((r) => ({
    ...r,
    id: r.id,
    precoBase: r.precoBase || parseFloat(r.preco) || 0,
  }));

  setMultiPassengers(passageirosDoBloco);    
  setSelectedReservation(main);
  setSelectedRow(main);
  setTotalReserva("");
}}

  
  
  
  autoHeight
  pageSize={15}
  loading={loading}
  rowsPerPageOptions={[15, 30, 50]}
  density="compact"
    sx={{
      backgroundColor: "#fff",
      borderRadius: 2,
      '& .MuiDataGrid-columnHeaders': {
        fontWeight: 'bold',
        backgroundColor: '#f5f5f5', // opcional: cor de fundo do cabeçalho
        borderBottom: '1px solid #ccc',
      },
      '& .MuiDataGrid-cell': {
        borderBottom: '1px solid #eee', // linhas horizontais
        borderRight: '1px solid #eee',  // linhas verticais (parece Excel)
      },
      '& .MuiDataGrid-row': {
        '&:last-child .MuiDataGrid-cell': {
          borderBottom: 'none', // remove a linha extra no fim
        },
      },
      '& .MuiDataGrid-columnSeparator': {
        display: 'none', // remove os separadores de coluna padrão
      },}}
/>



      </Box>

      {/* Modal para escolher lugar na viagem de regresso */}
      {modalReturnOpen && returnReservationData?.tripReturnId && (
        <SelectReturnSeatModal
          open={modalReturnOpen}
          onClose={() => setModalReturnOpen(false)}
          tripId={returnReservationData.tripReturnId}
          mainTripDate={returnReservationData.mainTripDate}
          onConfirm={handleReturnModalConfirm}
        />
      )}

<Modal
  open={successModalOpen}
  onClose={() => setSuccessModalOpen(false)}
  aria-labelledby="modal-sucesso"
  aria-describedby="modal-mensagem-sucesso"
>
  <Box
    sx={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      bgcolor: "white",
      borderRadius: 2,
      boxShadow: 24,
      p: 4,
      minWidth: 300,
      maxWidth: 500,
      textAlign: "center",
    }}
  >
    <Typography id="modal-sucesso" variant="h6" component="h2" sx={{ fontWeight: "bold", mb: 2 }}>
      {successMessage}
    </Typography>
    <Typography id="modal-mensagem-sucesso" sx={{ mb: 3 }}>
      Reserva criada/atualizada com sucesso
    </Typography>
    <Button
      variant="contained"
      sx={{ backgroundColor: "darkred", color: "white" }}
      onClick={() => setSuccessModalOpen(false)}
    >
      OK
    </Button>
  </Box>
</Modal>

    </Box>
  );
};

export default SearchTripPage;
