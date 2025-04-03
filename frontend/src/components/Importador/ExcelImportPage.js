import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { 
  Box, 
  Typography, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem 
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const ExcelImportPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const fileInputRef = useRef(null);

  // Buscar as viagens disponíveis e ordená-las por data (campo dataviagem)
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await fetch(`https://backendreservasnunes.advir.pt/trips`);
        const data = await response.json();
        const sortedTrips = data.sort(
          (a, b) => new Date(a.dataviagem) - new Date(b.dataviagem)
        );
        setTrips(sortedTrips);
      } catch (error) {
        console.error("Erro ao buscar viagens:", error);
      }
    };

    fetchTrips();
  }, []);

  // Função para baixar o template Excel com os cabeçalhos necessários
  const downloadTemplate = () => {
    const wsData = [
      [
        "id",
        "moeda",
        "preco",
        "entrada",
        "reserva", // valor importado; será armazenado em reserva_old
        "apelidoPassageiro",
        "nomePassageiro",
        "saida",
        "volta",
        "telefone",
        "email",
        "obs",
        "carro"
      ]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });

    const s2ab = (s) => {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < s.length; i++) {
        view[i] = s.charCodeAt(i) & 0xff;
      }
      return buf;
    };

    const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_reservas.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Função para ler o ficheiro Excel importado
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const binaryStr = e.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      // Converter os dados para JSON (assume que a primeira linha contém os cabeçalhos)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      // Mapeia os dados para o formato esperado pela DataGrid
      const rows = jsonData.map((row, index) => ({
        id: row.id || index + 1,
        moeda: row.moeda || "",
        preco: row.preco || "",
        entrada: row.entrada || "",
        reserva: row.reserva || "", // valor importado; será transferido para reserva_old
        apelidoPassageiro: row.apelidoPassageiro || "",
        nomePassageiro: row.nomePassageiro || "",
        saida: row.saida || "",
        volta: row.volta || "",
        telefone: row.telefone || "",
        email: row.email || "",
        obs: row.obs || "",
        carro: row.carro || ""
      }));

      setReservations(rows);
    };

    reader.readAsBinaryString(file);
  };

  // Definição das colunas para a DataGrid
  const columns = [
    { field: "id", headerName: "Lugar", width: 60 },
    { field: "moeda", headerName: "Moeda", width: 80 },
    { field: "preco", headerName: "Preço", width: 80 },
    { field: "entrada", headerName: "Entrada", width: 100 },
    { field: "reserva", headerName: "Reserva", width: 80 },
    { field: "apelidoPassageiro", headerName: "Apelido", width: 100 },
    { field: "nomePassageiro", headerName: "Nome", width: 100 },
    { field: "saida", headerName: "Saída", width: 100 },
    { field: "volta", headerName: "Volta", width: 110 },
    { field: "telefone", headerName: "Tel.", width: 100 },
    { field: "email", headerName: "Email", width: 120 },
    { field: "obs", headerName: "OBS.", width: 350 },
    { field: "carro", headerName: "Carro", width: 200 }
  ];

  // Função para importar as reservas utilizando a lógica de incremento de reserva
  const handleImportReservations = async () => {
    if (!selectedTripId) {
      alert("Por favor, seleccione uma viagem.");
      return;
    }
    if (reservations.length === 0) {
      alert("Não há reservas para importar.");
      return;
    }
    setLoading(true);

    const userEmail = localStorage.getItem("email") || "desconhecido";

    // Para cada reserva importada...
    for (const reservation of reservations) {
      // Cria um objeto com os dados da reserva,
      // associando o tripId, definindo o lugar e armazenando o valor importado de "reserva" em "reserva_old"
      let updatedRow = {
        ...reservation,
        tripId: selectedTripId,
        lugar: reservation.id,
        reserva_old: reservation.reserva // guarda o valor importado
      };

      // Incrementa o número da reserva:
      try {
        const lastReservationResponse = await fetch(`https://backendreservasnunes.advir.pt/reservations/last`);
        const lastReservation = await lastReservationResponse.json();
        const newReservaNumber = lastReservation?.reserva ? parseInt(lastReservation.reserva) + 1 : 1;
        updatedRow.reserva = String(newReservaNumber).padStart(4, "0");
        console.log("Nova reserva atribuída:", updatedRow.reserva);
      } catch (error) {
        console.error("Erro ao buscar última reserva:", error);
      }

      // Verifica se já existe uma reserva com esse número e atualiza ou cria conforme necessário
      try {
        const checkResponse = await fetch(`https://backendreservasnunes.advir.pt/reservations/by-reserva/${updatedRow.reserva}`);
        if (checkResponse.ok) {
          const existingReservation = await checkResponse.json();
          const response = await fetch(`https://backendreservasnunes.advir.pt/reservations/${existingReservation.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...updatedRow, updatedBy: userEmail }),
          });
          if (!response.ok) {
            console.error("Erro ao atualizar reserva:", await response.text());
          }
        } else {
          const response = await fetch(`https://backendreservasnunes.advir.pt/reservations/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...updatedRow, createdBy: userEmail }),
          });
          if (!response.ok) {
            console.error("Erro ao criar reserva:", await response.text());
          }
        }
      } catch (error) {
        console.error("Erro no processo de importação:", error);
      }
    }

    setLoading(false);
    alert("Reservas importadas com sucesso para a viagem!");
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        Importador de Excel para Viagem
      </Typography>

      {/* Combo para seleccionar a viagem */}
      <Box sx={{ marginBottom: 2 }}>
        <FormControl fullWidth>
          <InputLabel id="trip-select-label">Selecione a Viagem</InputLabel>
          <Select
            labelId="trip-select-label"
            value={selectedTripId}
            label="Selecione a Viagem"
            onChange={(e) => setSelectedTripId(e.target.value)}
          >
            {trips.map((trip) => (
              <MenuItem key={trip.id} value={trip.id}>
                {trip.origem} → {trip.destino} ({trip.dataviagem})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: "flex", gap: 2, marginBottom: 2 }}>
        <Button
          variant="contained"
          onClick={downloadTemplate}
          sx={{ backgroundColor: "darkred", color: "white" }}
        >
          Baixar Template Excel
        </Button>
        <Button
          variant="contained"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          sx={{ backgroundColor: "darkred", color: "white" }}
        >
          Seleccionar Ficheiro Excel
        </Button>
      </Box>
      <input
        type="file"
        accept=".xls,.xlsx"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <Box sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={reservations}
          columns={columns}
          rowHeight={30}
          disableRowSelectionOnClick
        />
      </Box>
      <Box sx={{ marginTop: 2 }}>
        <Button
          variant="contained"
          onClick={handleImportReservations}
          disabled={loading || reservations.length === 0 || !selectedTripId}
          sx={{ backgroundColor: "darkred", color: "white" }}
        >
          {loading ? "A importar..." : "Importar Reservas para a Viagem"}
        </Button>
      </Box>
    </Box>
  );
};

export default ExcelImportPage;
