import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Select,
  Autocomplete,
  Button,
  FormControl,
  InputLabel,
  Modal,
  Grid,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SelectReturnSeatModal from "./SelectReturnSeatModal";
import { fetchPrices } from "../../services/apiPrices"; // Ajusta o caminho se necessário

const SearchTripPage = () => {
  // Estados principais da reserva
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
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


  const tripOptions = availableTrips.map((trip) => {
    const dateStr = new Date(trip.dataviagem).toLocaleDateString("pt-PT");
    return {
      id: trip.id,
      label: `${trip.origem} → ${trip.destino} | ${dateStr}`,
      origem: trip.origem,
      destino: trip.destino,
      dateStr: dateStr,
    };
  });
  

  const getPricesForTrip = (tripId) => {
    console.log(">> getPricesForTrip tripId:", tripId);
    const foundTrip = availableTrips.find((t) => t.id === tripId);
    if (!foundTrip) {
      console.log("   Nenhuma trip encontrada com ID:", tripId);
      return [];
    }
  
    console.log("   foundTrip:", foundTrip);
    const originCity = cities.find(
      (c) => c.nome.toLowerCase() === foundTrip.origem?.toLowerCase()
    );
    if (!originCity) {
      console.log("   Nenhuma city encontrada com nome:", foundTrip.origem);
      return [];
    }
  
    console.log("   originCity:", originCity);
  
    // Ajustar se for "countryId" em minúsculas
    const filtered = prices.filter((p) => p.countryId === originCity.countryId);
    console.log("   filtered prices:", filtered);
  
    return filtered;
  };
  


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
      if (!modalReturnOpen && returnQueue.length > 0) {
        const next = returnQueue[0];
        await openReturnModal(next.reserva, next); // abre o modal para o primeiro da fila
        setReturnQueue((prev) => prev.slice(1)); // remove o primeiro da fila
      }
    };
    processNext();
  }, [returnQueue, modalReturnOpen]);

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
  const openReturnModal = async (
    reservaBase,
    reservaData = selectedReservation
  ) => {
    if (!reservaData.volta) {
      alert("Por favor, preencha a data de regresso na reserva.");
      return;
    }

    const tripIdReturn = await getReturnTripId(reservaData);
    const tripData = availableTrips.find(
      (trip) => trip.id === reservaData.tripId
    );

    if (tripIdReturn && tripData) {
      setReturnReservationData({
        ...reservaData,
        reserva: reservaBase,
        tripReturnId: tripIdReturn,
        mainTripDate: tripData.dataviagem,
      });
      setModalReturnOpen(true);
    } else {
      alert("Nenhuma viagem de regresso encontrada.");
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

      const url = `http://localhost:3010/trips/return?origem=${encodeURIComponent(
        origem
      )}&destino=${encodeURIComponent(destino)}&dataviagem=${dbFormatDate}`;
      console.log("URL de busca da viagem de regresso:", url);

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
        `http://localhost:3010/trips/${tripIdReturn}/available-seats`
      );
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

  // Criar reserva de regresso
  const handleCreateReturnTrip = async (selectedSeat, tripDate) => {
    if (!returnReservationData) return;

    const formattedReserva = `${returnReservationData.reserva}.v`;

    const updatedReservationData = {
      ...returnReservationData,
      entrada: returnReservationData.saida,
      saida: returnReservationData.entrada,
      lugar: selectedSeat,
      reserva: formattedReserva,
      preco: "",
      moeda: "",
      tripId: returnReservationData.tripReturnId,
      volta: tripDate,
    };

    try {
      const res = await fetch(`http://localhost:3010/reservations/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedReservationData,
          createdBy: localStorage.getItem("email") || "admin",
        }),
      });

      if (!res.ok) {
        console.error("Erro ao criar reserva de regresso:", await res.text());
        return;
      }

      alert("Reserva de regresso criada com sucesso!");
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
  const handleTripSelect = async (selectedTripId) => {
    const trip = availableTrips.find((t) => t.id === selectedTripId);
    let moeda = "€";
    const origemCity = cities.find(
      (c) => c.nome.toLowerCase() === trip.origem?.toLowerCase()
    );
    const pais = origemCity?.Country?.nome
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    if (pais === "suica") moeda = "Fr";

    try {
      const res = await fetch(`http://localhost:3010/reservations/trip/${selectedTripId}`);
      const data = await res.json();
      const seats = Array.isArray(data.freeSeats)
        ? data.freeSeats.sort((a, b) => a - b)
        : [];
      setAvailableSeats(seats);
      setSelectedReservation((prev) => ({
        ...prev,
        tripId: selectedTripId,
        moeda,
        lugar: seats[0] || "",
      }));
    } catch (error) {
      console.error("Erro ao buscar lugares disponíveis:", error);
    }
  };

  // Carrega dados iniciais: cidades, viagens, reservas, países
  useEffect(() => {
    fetch("http://localhost:3010/cities")
      .then((res) => res.json())
      .then((data) => {
        const sorted = Array.isArray(data)
          ? data.sort((a, b) => a.nome.localeCompare(b.nome))
          : [];
        setCities(sorted);
      })
      .catch((err) => {
        console.error("Erro ao buscar cidades:", err);
        setCities([]);
      });

    fetchAllReservations();

    fetch("http://localhost:3010/countries")
      .then((res) => res.json())
      .then((data) => setCountries(data))
      .catch((err) => {
        console.error("Erro ao buscar países:", err);
        setCountries([]);
      });

    fetch("http://localhost:3010/trips")
      .then((res) => res.json())
      .then((data) => {
        const sortedTrips = data
          .filter((trip) => !!trip.dataviagem)
          .sort((a, b) => new Date(a.dataviagem) - new Date(b.dataviagem));
        setAvailableTrips(sortedTrips);
      })
      .catch((err) => {
        console.error("Erro ao buscar viagens:", err);
      });
  }, []);

  const fetchAllReservations = async () => {
    try {
      const res = await fetch("http://localhost:3010/reservations/all");
      const data = await res.json();
      const sorted = data.sort(
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
    fetchAllReservations();
  }, []);

  // Definição das colunas do DataGrid
  const columns = [
    { field: "reserva", headerName: "Reserva", width: 100 },
    { field: "preco", headerName: "Preço", width: 80 },
    { field: "moeda", headerName: "Moeda", width: 80 },
    
    { field: "apelidoPassageiro", headerName: "Apelido", width: 150 },
    { field: "nomePassageiro", headerName: "Nome", width: 150 },
    { field: "entrada", headerName: "Entrada", width: 120 },
    { field: "saida", headerName: "Saída", width: 120 },
    { field: "dataviagem", headerName: "Data da Viagem", width: 130 },
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
        const lastRes = await fetch("http://localhost:3010/reservations/last");
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
      ? `http://localhost:3010/reservations/${reservationData.id}`
      : "http://localhost:3010/reservations/create";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...reservationData,
        bilhete: reservationData.bilhete,
        reserva: reservaCode,
        [reservationData.id ? "updatedBy" : "createdBy"]: email,
      }),
    });

    return response.ok;
  };

  // Handler para salvar a reserva principal e as reservas adicionais
  const handleSaveAll = async () => {
    let blockCode = selectedReservation.reserva;

    // Se houver passageiros adicionais e ainda não tivermos blockCode definido, gera-se aqui
    if (multiPassengers.length > 0 && !blockCode) {
      try {
        const lastRes = await fetch("http://localhost:3010/reservations/last");
        const lastData = await lastRes.json();
        const lastNumber = lastData?.reserva ? parseInt(lastData.reserva) : 0;
        blockCode = String(lastNumber + 1).padStart(4, "0");

        // Reserva principal
        const mainReservation = { ...selectedReservation, reserva: blockCode };
        // Passageiros adicionais com a reserva -> "blockCode.1", "blockCode.2", etc.
        const additionalReservations = multiPassengers.map((p, index) => ({
          ...p,
          reserva: `${blockCode}.${index + 1}`,
        }));

        // Salva a reserva principal
        const principalSaved = await saveReservation(mainReservation);
        if (!principalSaved) {
          alert("Erro ao salvar a reserva principal.");
          return;
        }
        // Salva os passageiros adicionais
        for (const passenger of additionalReservations) {
          const saved = await saveReservation(passenger);
          if (!saved) {
            alert("Erro ao criar uma das reservas adicionais.");
            return;
          }
        }

        // Coloca na fila (returnQueue) quem tiver data de volta preenchida
        const toOpenModals = [];
        if (selectedReservation.volta) {
          toOpenModals.push({ ...selectedReservation, reserva: blockCode });
        }
        additionalReservations.forEach((p) => {
          if (p.volta) {
            toOpenModals.push(p);
          }
        });
        setReturnQueue(toOpenModals);

        alert("Reserva (e passageiros adicionais) criados/atualizados com sucesso!");
        fetchAllReservations();
        // Limpa formulário
        setSelectedReservation({
          nomePassageiro: "",
          apelidoPassageiro: "",
          entrada: "",
          saida: "",
          telefone: "",
          email:"",
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
        });
        setMultiPassengers([]);
        setAvailableSeats([]);
      } catch (error) {
        console.error("Erro ao gerar número da reserva (bloco):", error);
        alert("Erro ao gerar número da reserva!");
      }
    } else {
      // Caso seja apenas o principal OU já exista blockCode
      const principalSaved = await saveReservation({
        ...selectedReservation,
        reserva: blockCode,
      });
      if (principalSaved) {
        alert("Reserva criada/atualizada com sucesso!");
        fetchAllReservations();

        // Verifica se há datas de volta tanto no principal quanto nos adicionais
        const toOpenModals = [];
        if (selectedReservation.volta) {
          toOpenModals.push({ ...selectedReservation, reserva: blockCode });
        }
        multiPassengers.forEach((p) => {
          if (p.volta) {
            toOpenModals.push(p);
          }
        });
        setReturnQueue(toOpenModals);

        // Limpa formulário
        setSelectedReservation({
          nomePassageiro: "",
          apelidoPassageiro: "",
          entrada: "",
          saida: "",
          telefone: "",
          email:"",
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
        });
      } else {
        alert("Erro ao salvar a reserva principal.");
      }
    }
  };

  // Função utilitária para atualizar um passageiro adicional no array multiPassengers
  const updateMultiPassengerField = (index, field, value) => {
    setMultiPassengers((prevPassengers) => {
      const updated = [...prevPassengers];
      updated[index][field] = value;
      // Se for valorCarro, valorVolume ou bilhete (priceId), recalcular:
      if (["valorCarro", "valorVolume", "selectedPriceId"].includes(field)) {
        const valorCarroNum = parseFloat(updated[index].valorCarro) || 0;
        const valorVolumeNum = parseFloat(updated[index].valorVolume) || 0;
        const base = parseFloat(updated[index].precoBase) || 0;
        updated[index].preco = (base + valorCarroNum + valorVolumeNum).toFixed(2);
      }
      return updated;
    });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" gutterBottom>
        Criar nova reserva
      </Typography>

      {selectedReservation && (
        <Box sx={{ mt: 4, p: 2, border: "1px solid #ccc", borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            {selectedReservation?.id ? "Editar Reserva" : "Nova Reserva"}
          </Typography>

          {/* FORMULÁRIO PRINCIPAL (numa só linha, com scroll horizontal) */}
          <Grid
            container
            spacing={2}
            direction="row"
            wrap="nowrap"
            sx={{ overflowX: "auto" }}
          >
            <Grid item xs="auto">
            <Autocomplete
  sx={{ minWidth: 300 }}
  options={tripOptions}
  getOptionLabel={(option) => option.label}
  // para permitir que o utilizador escreva livremente e filtre
  filterOptions={(options, state) =>
    options.filter((option) =>
      option.label.toLowerCase().includes(state.inputValue.toLowerCase())
    )
  }
  // se quiser mostrar o valor atual (caso esteja a editar)
  value={
    tripOptions.find((opt) => opt.id === selectedReservation.tripId) || null
  }
  onChange={(event, newValue) => {
    if (newValue) {
      // Chamamos handleTripSelect com o id da viagem selecionada
      handleTripSelect(newValue.id);
    } else {
      // Se apagar o campo, ficamos sem viagem selecionada
      setSelectedReservation((prev) => ({
        ...prev,
        tripId: "",
      }));
      setAvailableSeats([]);
    }
  }}
  renderInput={(params) => (
    <TextField
      {...params}
      label="Selecionar Viagem"
      variant="outlined"
    />
  )}
/>


            </Grid>

            <Grid item xs="auto">
              <TextField
                label="Nome"
                value={selectedReservation.nomePassageiro || ""}
                onChange={(e) =>
                  setSelectedReservation({
                    ...selectedReservation,
                    nomePassageiro: e.target.value,
                  })
                }
                fullWidth
              />
            </Grid>

            <Grid item xs="auto">
              <TextField
                label="Apelido"
                value={selectedReservation.apelidoPassageiro || ""}
                onChange={(e) =>
                  setSelectedReservation({
                    ...selectedReservation,
                    apelidoPassageiro: e.target.value,
                  })
                }
                fullWidth
              />
            </Grid>

            <Grid item xs="auto">
              <TextField
                label="Telefone"
                value={selectedReservation.telefone || ""}
                onChange={(e) =>
                  setSelectedReservation({
                    ...selectedReservation,
                    telefone: e.target.value,
                  })
                }
                fullWidth
              />
            </Grid>

            <Grid item xs="auto">
              <TextField
                label="Email"
                value={selectedReservation.email || ""}
                onChange={(e) =>
                  setSelectedReservation({
                    ...selectedReservation,
                    email: e.target.value,
                  })
                }
                fullWidth
              />
            </Grid>

            <Grid item xs="auto">
              <TextField
                label="Data Volta (dd/mm/aaaa)"
                value={selectedReservation.volta || ""}
                onChange={(e) =>
                  setSelectedReservation({
                    ...selectedReservation,
                    volta: e.target.value,
                  })
                }
                fullWidth
              />
            </Grid>

            <Grid item xs="auto">
              <TextField
                label="Carro"
                value={selectedReservation.carro || ""}
                onChange={(e) =>
                  setSelectedReservation({
                    ...selectedReservation,
                    carro: e.target.value,
                  })
                }
                fullWidth
              />
            </Grid>

            <Grid item xs="auto">
              <Autocomplete
                options={cities.map((c) => c.nome)}
                value={selectedReservation.entrada || ""}
                onChange={(e, newValue) =>
                  setSelectedReservation({
                    ...selectedReservation,
                    entrada: newValue,
                  })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Entrada" fullWidth />
                )}
                sx={{ minWidth: 200 }}
              />
            </Grid>

            <Grid item xs="auto">
              <Autocomplete
                options={cities.map((c) => c.nome)}
                value={selectedReservation.saida || ""}
                onChange={(e, newValue) =>
                  setSelectedReservation({
                    ...selectedReservation,
                    saida: newValue,
                  })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Saída" fullWidth />
                )}
                sx={{ minWidth: 200 }}
              />
            </Grid>

            <Grid item xs="auto">
            <FormControl fullWidth sx={{ minWidth: 150 }}>
  <InputLabel>Bilhete</InputLabel>
  <Select
    // Em vez de value={selectedPriceId}, use:
    value={selectedReservation.bilhete || ""}
    label="Bilhete"
    onChange={(e) => {
      const priceId = e.target.value;
      // Atualizamos o campo bilhete dentro do selectedReservation
      const price = prices.find((p) => p.id === priceId) || {};
      const base = parseFloat(price.valor || 0);

      setSelectedReservation((prev) => ({
        ...prev,
        bilhete: priceId,       // <--- Guardar o bilhete aqui
        preco: base.toFixed(2), // recalcula o preco base
        moeda: getMoedaByCountryId(price.countryId)
            // ou set com getMoedaByCountryId, se quiser
      }));
      setPrecoBase(base);
    }}
  >
    {getPricesForTrip(selectedReservation.tripId).map((price) => (
  <MenuItem key={price.id} value={price.id}>
    {/* chama a função para descobrir a moeda */}
    {price.valor} {getMoedaByCountryId(price.countryId)} - {price.descricao}
  </MenuItem>
))}

  </Select>
</FormControl>


            </Grid>

            <Grid item xs="auto">
              <TextField
                label="Valor Carro"
                value={selectedReservation.valorCarro || ""}
                onChange={(e) =>
                  setSelectedReservation({
                    ...selectedReservation,
                    valorCarro: e.target.value,
                  })
                }
                fullWidth
              />
            </Grid>

            <Grid item xs="auto">
              <TextField
                label="Valor Volume"
                value={selectedReservation.valorVolume || ""}
                onChange={(e) =>
                  setSelectedReservation({
                    ...selectedReservation,
                    valorVolume: e.target.value,
                  })
                }
                fullWidth
              />
            </Grid>

            <Grid item xs="auto">
              <TextField
                label="OBS."
                value={selectedReservation.obs || ""}
                onChange={(e) =>
                  setSelectedReservation({
                    ...selectedReservation,
                    obs: e.target.value,
                  })
                }
                multiline
                fullWidth
                sx={{ minWidth: 300 }}
              />
            </Grid>
          </Grid>

          {/* PASSAGEIROS ADICIONAIS (cada um no seu bloco, também numa só linha) */}
          {multiPassengers.map((passageiro, index) => (
            <Box
              key={index}
              sx={{
                mt: 2,
                border: "1px solid #ccc",
                borderRadius: 2,
                p: 2,
                bgcolor: "#f9f9f9",
              }}
            >
              <Typography variant="h6" sx={{ mb: 1 }}>
                Passageiro Adicional {index + 1} ({passageiro.reserva})
              </Typography>

              <Grid
                container
                spacing={2}
                direction="row"
                wrap="nowrap"
                sx={{ overflowX: "auto" }}
              >



<Grid item xs="auto">
<Autocomplete
  sx={{ minWidth: 300 }}
  options={tripOptions}
  getOptionLabel={(option) => option.label}
  // para permitir que o utilizador escreva livremente e filtre
  filterOptions={(options, state) =>
    options.filter((option) =>
      option.label.toLowerCase().includes(state.inputValue.toLowerCase())
    )
  }
  // se quiser mostrar o valor atual (caso esteja a editar)
  value={
    tripOptions.find((opt) => opt.id === selectedReservation.tripId) || null
  }
  onChange={(event, newValue) => {
    if (newValue) {
      // Chamamos handleTripSelect com o id da viagem selecionada
      handleTripSelect(newValue.id);
    } else {
      // Se apagar o campo, ficamos sem viagem selecionada
      setSelectedReservation((prev) => ({
        ...prev,
        tripId: "",
      }));
      setAvailableSeats([]);
    }
  }}
  renderInput={(params) => (
    <TextField
      {...params}
      label="Selecionar Viagem"
      variant="outlined"
    />
  )}
/>

</Grid>



                
                <Grid item xs="auto">
                  
                  <TextField
                    label="Nome"
                    value={passageiro.nomePassageiro || ""}
                    onChange={(e) =>
                      updateMultiPassengerField(
                        index,
                        "nomePassageiro",
                        e.target.value
                      )
                    }
                    fullWidth
                  />
                </Grid>

                <Grid item xs="auto">
                  <TextField
                    label="Apelido"
                    value={passageiro.apelidoPassageiro || ""}
                    onChange={(e) =>
                      updateMultiPassengerField(
                        index,
                        "apelidoPassageiro",
                        e.target.value
                      )
                    }
                    fullWidth
                  />
                </Grid>

                <Grid item xs="auto">
                  <TextField
                    label="Telefone"
                    value={passageiro.telefone || ""}
                    onChange={(e) =>
                      updateMultiPassengerField(
                        index,
                        "telefone",
                        e.target.value
                      )
                    }
                    fullWidth
                  />
                </Grid>

                <Grid item xs="auto">
              <TextField
                label="Email"
                value={selectedReservation.email || ""}
                onChange={(e) =>
                  setSelectedReservation({
                    ...selectedReservation,
                    email: e.target.value,
                  })
                }
                fullWidth
              />
            </Grid>

                <Grid item xs="auto">
                  <TextField
                    label="Data Volta (dd/mm/aaaa)"
                    value={passageiro.volta || ""}
                    onChange={(e) =>
                      updateMultiPassengerField(index, "volta", e.target.value)
                    }
                    fullWidth
                  />
                </Grid>

                <Grid item xs="auto">
                  <TextField
                    label="Carro"
                    value={passageiro.carro || ""}
                    onChange={(e) =>
                      updateMultiPassengerField(index, "carro", e.target.value)
                    }
                    fullWidth
                  />
                </Grid>

                <Grid item xs="auto">
                  <Autocomplete
                    options={cities.map((c) => c.nome)}
                    value={passageiro.entrada || ""}
                    onChange={(e, newValue) =>
                      updateMultiPassengerField(index, "entrada", newValue)
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Entrada" fullWidth />
                    )}
                    sx={{ minWidth: 200 }}
                  />
                </Grid>

                <Grid item xs="auto">
                  <Autocomplete
                    options={cities.map((c) => c.nome)}
                    value={passageiro.saida || ""}
                    onChange={(e, newValue) =>
                      updateMultiPassengerField(index, "saida", newValue)
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Saída" fullWidth />
                    )}
                    sx={{ minWidth: 200 }}
                  />
                </Grid>

                <Grid item xs="auto">
                <FormControl fullWidth sx={{ minWidth: 150 }}>
  <InputLabel>Bilhete</InputLabel>
  <Select
    // Em vez de value={selectedPriceId}, use o bilhete do passageiro
    value={passageiro.bilhete || ""}
    label="Bilhete"
    onChange={(e) => {
      const priceId = e.target.value;
      const price = prices.find((p) => p.id === priceId) || {};
      const base = parseFloat(price.valor || 0);

      // Atualiza o passageiro com o bilhete selecionado e recalcula preco
      setMultiPassengers((prev) => {
        const updated = [...prev];
        updated[index].bilhete = priceId;
        updated[index].precoBase = base;
        // se quiser também armazenar a 'moeda':
        // updated[index].moeda = "€" ou getMoedaByCountryId( ... ) ...
        // E recalcular se tiver valorCarro, valorVolume, etc.
        const valorCarroNum = parseFloat(updated[index].valorCarro) || 0;
        const valorVolumeNum = parseFloat(updated[index].valorVolume) || 0;
        updated[index].preco = (base + valorCarroNum + valorVolumeNum).toFixed(2);
        return updated;
      });
    }}
  >
    {getPricesForTrip(
      // Se cada passageiro usar a mesma trip do principal:
      selectedReservation.tripId

      // Ou, se cada passageiro tiver a sua "passageiro.tripId":
      // passageiro.tripId || selectedReservation.tripId
    ).map((price) => (
      <MenuItem key={price.id} value={price.id}>
        {price.valor} - {price.descricao}
      </MenuItem>
    ))}
  </Select>
</FormControl>


                </Grid>

                <Grid item xs="auto">
                  <TextField
                    label="Valor Carro"
                    value={passageiro.valorCarro || ""}
                    onChange={(e) =>
                      updateMultiPassengerField(
                        index,
                        "valorCarro",
                        e.target.value
                      )
                    }
                    fullWidth
                  />
                </Grid>

                <Grid item xs="auto">
                  <TextField
                    label="Valor Volume"
                    value={passageiro.valorVolume || ""}
                    onChange={(e) =>
                      updateMultiPassengerField(
                        index,
                        "valorVolume",
                        e.target.value
                      )
                    }
                    fullWidth
                  />
                </Grid>

                <Grid item xs="auto" sx={{ minWidth: 300 }}>
                  <TextField
                    label="OBS."
                    value={passageiro.obs || ""}
                    onChange={(e) =>
                      updateMultiPassengerField(index, "obs", e.target.value)
                    }
                    fullWidth
                    multiline
                  />
                </Grid>

             
              </Grid>

              <Box sx={{ mt: 1 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    const updated = multiPassengers.filter(
                      (_, i) => i !== index
                    );
                    setMultiPassengers(updated);
                  }}
                >
                  Remover
                </Button>
              </Box>
            </Box>
          ))}

          {/* BOTÕES FINAIS (Limpar, Guardar, Adicionar) */}
          <Box sx={{ mt: 3, display: "flex", flexWrap: "wrap", gap: 2 }}>
            <Button
              variant="outlined"
              style={{ backgroundColor: "white", color: "darkred", borderColor: "darkred" }}
              onClick={() =>
                setSelectedReservation({
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
                  lugar: "",
                  volta: "",
                  valorCarro: "",
                  valorVolume: "",
                  impresso: "",
                  bilhete: "",
                })
              }
            >
              Limpar Formulário
            </Button>

            <Button
              variant="contained"
              style={{ backgroundColor: "darkred", color: "white" }}
              onClick={handleSaveAll}
            >
              Guardar Alterações
            </Button>

            <Button
              variant="contained"
              style={{ backgroundColor: "darkred", color: "white" }}
              onClick={() => {
                // Adiciona um novo passageiro adicional
                const nextSub = generateNextSubReserva();
                const nextSeat =
                  availableSeats[multiPassengers.length + 1] || "";
                const novaReserva = {
                  ...selectedReservation,
                  reserva: nextSub,
                  lugar: nextSeat,
                  id: undefined,
                  precoBase: precoBase.toString(),
                };
                setMultiPassengers([...multiPassengers, novaReserva]);
              }}
            >
              + Adicionar Passageiro
            </Button>
          </Box>
        </Box>
      )}

      {/* Lista de Reservas */}
      <Typography variant="h4" gutterBottom>
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
            .filter((r) =>
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
            }))}
          columns={columns}
          onRowClick={(params) => {
            
            
            const clicked = params.row;
            if (clicked.impresso === "1") {
              alert("Esta reserva já foi impressa; não pode ser alterada.");
              return false;
            }
            
            // Se a reserva for do tipo "0001.1", baseCode é "0001"
            const baseCode = clicked.reserva.includes(".")
              ? clicked.reserva.split(".")[0]
              : clicked.reserva;
            const main =
              reservations.find((r) => r.reserva === baseCode) || clicked;
            const additionals = reservations.filter((r) =>
              r.reserva.startsWith(`${baseCode}.`)
            );
            
            // Ajusta estados
            setSelectedReservation(main);
            setMultiPassengers(additionals);
          }}
          autoHeight
          pageSize={15}
          loading={loading}
          rowsPerPageOptions={[15, 30, 50]}
          sx={{ backgroundColor: "#fff", borderRadius: 2, boxShadow: 2 }}
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
    </Box>
  );
};

export default SearchTripPage;
