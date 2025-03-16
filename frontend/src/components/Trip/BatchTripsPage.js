import React, { useState, useEffect } from "react";
import { Form, Button, Card, Container } from "react-bootstrap";
import moment from "moment";

// Componente para seleção do autocarro por data
const DateBusSelector = ({ dateEntry, onBusChange, onRemove }) => {
  const [buses, setBuses] = useState([]);

  // Buscar os autocarros disponíveis para a data deste registo
  useEffect(() => {
    if (dateEntry.data) {
      fetch(`https://backendreservasnunes.advir.pt/buses/available?date=${dateEntry.data}`)
        .then((response) => response.json())
        .then((data) => {
          const activeSortedBuses = Array.isArray(data)
            ? data.filter((bus) => bus.isActive).sort((a, b) => a.nome.localeCompare(b.nome))
            : [];
          setBuses(activeSortedBuses);
        })
        .catch((error) => console.error("Erro ao carregar autocarros:", error));
    }
  }, [dateEntry.data]);

  return (
    <Card className="mb-3">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center">
          <strong>Data: {moment(dateEntry.data).format("DD/MM/YYYY")}</strong>
          <Button variant="danger" size="sm" onClick={() => onRemove(dateEntry.data)}>
            Remover
          </Button>
        </div>
        <Form.Group className="mt-2">
          <Form.Label>Autocarro</Form.Label>
          <Form.Control
            as="select"
            value={dateEntry.busId}
            onChange={(e) => onBusChange(dateEntry.data, e.target.value)}
            required
          >
            <option value="">Selecione um autocarro</option>
            {buses.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.nome}
              </option>
            ))}
          </Form.Control>
        </Form.Group>
      </Card.Body>
    </Card>
  );
};

const CriarViagemMultiData = () => {
  // Estado para a data que se pretende adicionar à lista
  const [dataAtual, setDataAtual] = useState(moment().format("YYYY-MM-DD"));
  // Cada entrada possui: data e o autocarro selecionado (busId)
  const [datasSelecionadas, setDatasSelecionadas] = useState([]);

  // Estados dos dados globais da viagem
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [motorista, setMotorista] = useState("");
  const [horaPartida, setHoraPartida] = useState("");
  const [horaChegada, setHoraChegada] = useState("");

  const [cities, setCities] = useState([]);

  // Buscar as cidades (exemplo: filtrar "Portugal" e "Suiça")
  useEffect(() => {
    fetch("https://backendreservasnunes.advir.pt/cities")
      .then((response) => response.json())
      .then((data) => {
        const sortedCities = Array.isArray(data)
          ? data
              .filter((city) => city.nome === "Portugal" || city.nome === "Suiça")
              .sort((a, b) => a.nome.localeCompare(b.nome))
          : [];
        setCities(sortedCities);
      })
      .catch((error) => {
        console.error("Erro ao carregar cidades:", error);
        setCities([]);
      });
  }, []);

  // Adiciona uma nova data (se não estiver já presente)
  const adicionarData = () => {
    if (!dataAtual) return;
    if (!datasSelecionadas.some((entry) => entry.data === dataAtual)) {
      setDatasSelecionadas([...datasSelecionadas, { data: dataAtual, busId: "" }]);
    }
  };

  // Remove uma data da lista
  const removerData = (dataToRemove) => {
    setDatasSelecionadas(datasSelecionadas.filter((entry) => entry.data !== dataToRemove));
  };

  // Atualiza o autocarro selecionado para uma data
  const atualizarBus = (data, busId) => {
    setDatasSelecionadas(
      datasSelecionadas.map((entry) =>
        entry.data === data ? { ...entry, busId } : entry
      )
    );
  };

  // Submete o formulário criando uma viagem individual para cada data
  const handleSubmit = async (e) => {
    e.preventDefault();

    const trips = datasSelecionadas.map((entry) => ({
      dataViagem: entry.data,
      busId: entry.busId,
      origem,
      destino,
      motorista,
      horaPartida,
      horaChegada,
    }));

    try {
      // Envia uma requisição para cada viagem individualmente
      const responses = await Promise.all(
        trips.map(async (trip) => {
          const response = await fetch("https://backendreservasnunes.advir.pt/trips/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(trip),
          });
          if (!response.ok) {
            throw new Error("Erro ao criar uma das viagens");
          }
          return response.json();
        })
      );
      console.log("Viagens criadas com sucesso:", responses);
      alert("Viagens criadas com sucesso!");

      // Limpa os campos e a lista de datas após a criação
      setDatasSelecionadas([]);
      setOrigem("");
      setDestino("");
      setMotorista("");
      setHoraPartida("");
      setHoraChegada("");
    } catch (error) {
      console.error("Erro ao criar viagens:", error);
      alert("Erro ao criar viagens");
    }
  };

  return (
    <Container className="mt-4">
      <h2>Criar Viagens</h2>

      {/* Seção para selecionar e adicionar datas */}
      <Card className="mb-3">
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Selecionar Data</Form.Label>
            <Form.Control
              type="date"
              value={dataAtual}
              onChange={(e) => setDataAtual(e.target.value)}
            />
          </Form.Group>
          <Button variant="primary" onClick={adicionarData} style={{backgroundColor:"darkred", borderColor:"darkred"}
          }>
            Adicionar Data
          </Button>
        </Card.Body>
      </Card>

      {/* Lista de datas com seleção de autocarro para cada */}
      {datasSelecionadas.map((entry) => (
        <DateBusSelector
          key={entry.data}
          dateEntry={entry}
          onBusChange={atualizarBus}
          onRemove={removerData}
        />
      ))}

      {/* Formulário com os dados globais da viagem */}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Origem</Form.Label>
          <Form.Control
            as="select"
            value={origem}
            onChange={(e) => setOrigem(e.target.value)}
            required
          >
            <option value="">Selecione a origem</option>
            {cities.map((city) => (
              <option key={city.id} value={city.nome}>
                {city.nome}
              </option>
            ))}
          </Form.Control>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Destino</Form.Label>
          <Form.Control
            as="select"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            required
          >
            <option value="">Selecione o destino</option>
            {cities.map((city) => (
              <option key={city.id} value={city.nome}>
                {city.nome}
              </option>
            ))}
          </Form.Control>
        </Form.Group>
{/*
        <Form.Group className="mb-3">
          <Form.Label>Motorista</Form.Label>
          <Form.Control
            type="text"
            value={motorista}
            onChange={(e) => setMotorista(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Hora de Partida</Form.Label>
          <Form.Control
            type="time"
            value={horaPartida}
            onChange={(e) => setHoraPartida(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Hora de Chegada</Form.Label>
          <Form.Control
            type="time"
            value={horaChegada}
            onChange={(e) => setHoraChegada(e.target.value)}
            required
          />
        </Form.Group>
        */}

        <Button variant="success" type="submit" style={{backgroundColor:"darkred", borderColor:"darkred"}
          }>
          Criar Viagens para os Dias Selecionados
        </Button>
      </Form>
    </Container>
  );
};

export default CriarViagemMultiData;
