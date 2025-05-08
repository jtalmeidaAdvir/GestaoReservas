import React, { useState, useEffect } from "react";
import { Form, Button, Table, Container } from "react-bootstrap";
import moment from "moment";

// Componente que apresenta o selector de autocarro para uma data (viagem de ida)
const BusSelect = ({ data, busId, onChange }) => {
  const [buses, setBuses] = useState([]);

  useEffect(() => {
    if (data) {
      fetch(`https://nunes.entriga.pt/backend/buses/available?date=${data}`)
        .then((response) => response.json())
        .then((data) => {
          const activeSortedBuses = Array.isArray(data)
            ? data.filter((bus) => bus.isActive).sort((a, b) => a.nome.localeCompare(b.nome))
            : [];
          setBuses(activeSortedBuses);
  
          // Se quiseres usar o bus "vazio" como default
          const busVazio = activeSortedBuses.find((bus) => bus.nome.toLowerCase() === "vazio");
          if (busVazio) {
            onChange(busVazio.id);
          }
        })
        .catch((error) => console.error("Erro ao carregar autocarros:", error));
    }
  }, [data]);
  


  useEffect(() => {
    if (busId && buses.length > 0 && !buses.find((b) => b.id === busId)) {
      onChange(""); // limpa se o busId atual já não existir na lista
    }
  }, [buses, busId, onChange]);
  

  return (
    <Form.Control as="select" value={busId} onChange={(e) => onChange(e.target.value)} required>
      <option value="">Selecione o Autocarro</option>
      {buses.map((bus) => (
        <option key={bus.id} value={bus.id}>
          {bus.nome}
        </option>
      ))}
    </Form.Control>
  );
  
};

// Componente que apresenta as entradas numa tabela, permitindo editar a data de ida e, se activada, a data de volta
const TabelaDatas = ({ 
  datasSelecionadas, 
  onDataChange, 
  onBusChange, 
  onReturnTripChange, 
  onReturnDateChange, 
  onRemove 
}) => {
  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>Data Ida</th>
          <th>Autocarro</th>
          <th className="text-center">Viagem de Volta</th>
          <th>Data Volta</th>
          <th>Ação</th>
        </tr>
      </thead>
      <tbody>
        {datasSelecionadas.map((entry) => (
          <tr key={entry.id}>
            <td>
              <Form.Control
                type="date"
                value={entry.data}
                onChange={(e) => onDataChange(entry.id, e.target.value)}
                required
              />
            </td>
            <td>
              <BusSelect
                data={entry.data}
                busId={entry.busId}
                onChange={(value) => onBusChange(entry.id, value)}
              />
            </td>
            <td className="text-center">
              <Form.Check
                type="checkbox"
                checked={entry.returnTrip}
                onChange={(e) => onReturnTripChange(entry.id, e.target.checked)}
              />
            </td>
            <td>
              {entry.returnTrip && (
                <Form.Control
                  type="date"
                  value={entry.returnTripDate}
                  onChange={(e) => onReturnDateChange(entry.id, e.target.value)}
                  required
                />
              )}
            </td>
            <td>
              <Button variant="danger" size="sm" onClick={() => onRemove(entry.id)}>
                Remover
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

const CriarViagemMultiData = () => {
  const [dataAtual, setDataAtual] = useState(moment().format("YYYY-MM-DD"));
  // Cada entrada contém: id, data da viagem de ida, autocarro seleccionado, flag para viagem de volta e data da viagem de volta
  const [datasSelecionadas, setDatasSelecionadas] = useState([]);

  // Estados dos dados globais da viagem
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [motorista, setMotorista] = useState("");
  const [horaPartida, setHoraPartida] = useState("");
  const [horaChegada, setHoraChegada] = useState("");
  const [cities, setCities] = useState([]);

  useEffect(() => {
    fetch("https://nunes.entriga.pt/backend/cities")
      .then((response) => response.json())
      .then((data) => {
        const sortedCities = Array.isArray(data)
          ? data.filter((city) => city.nome === "Portugal" || city.nome === "Suiça")
              .sort((a, b) => a.nome.localeCompare(b.nome))
          : [];
        setCities(sortedCities);
      })
      .catch((error) => {
        console.error("Erro ao carregar cidades:", error);
        setCities([]);
      });
  }, []);

  // Adiciona uma nova entrada à tabela (permitindo entradas com datas iguais)
  // Define a data da viagem de volta por defeito igual à data da ida
  const adicionarData = () => {
    if (!dataAtual) return;
    const novaEntrada = {
      id: Date.now() + Math.random(),
      data: dataAtual,
      busId: "", // <- isto garante que começa como "vazio"
      returnTrip: false,
      returnTripDate: dataAtual,
    };
    
    setDatasSelecionadas([...datasSelecionadas, novaEntrada]);
  };

  const removerData = (idToRemove) => {
    setDatasSelecionadas(datasSelecionadas.filter((entry) => entry.id !== idToRemove));
  };

  // Atualiza a data da viagem de ida
  const atualizarData = (id, newDate) => {
    setDatasSelecionadas(
      datasSelecionadas.map((entry) =>
        entry.id === id ? { ...entry, data: newDate } : entry
      )
    );
  };

  const atualizarBus = (id, busId) => {
    setDatasSelecionadas(
      datasSelecionadas.map((entry) =>
        entry.id === id ? { ...entry, busId } : entry
      )
    );
  };

  const atualizarReturnTrip = (id, value) => {
    setDatasSelecionadas(
      datasSelecionadas.map((entry) =>
        entry.id === id ? { ...entry, returnTrip: value } : entry
      )
    );
  };

  const atualizarReturnDate = (id, newDate) => {
    setDatasSelecionadas(
      datasSelecionadas.map((entry) =>
        entry.id === id ? { ...entry, returnTripDate: newDate } : entry
      )
    );
  };

  // Submete o formulário criando as viagens de ida e, se seleccionado, as de volta (utilizando a data especificada)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const trips = [];
    datasSelecionadas.forEach((entry) => {
      trips.push({
        dataViagem: entry.data,
        busId: entry.busId,
        origem,
        destino,
        motorista,
        horaPartida,
        horaChegada,
        type: "ida",
      });
      if (entry.returnTrip) {
        trips.push({
          dataViagem: entry.returnTripDate,
          busId: entry.busId,
          origem: destino,
          destino: origem,
          motorista,
          horaPartida,
          horaChegada,
          type: "volta",
        });
      }
    });

    try {
      const responses = await Promise.all(
        trips.map(async (trip) => {
          const response = await fetch("https://nunes.entriga.pt/backend/trips/create", {
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
      //console.log("Viagens criadas com sucesso:", responses);
      

      // Limpa os campos e a tabela após a criação
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
      
      <Form onSubmit={handleSubmit}>
        
      
      <Form.Group className="mb-3">
          <Form.Label>Origem</Form.Label>
          <Form.Control
  as="select"
  value={origem}
  onChange={(e) => {
    const novaOrigem = e.target.value;
    setOrigem(novaOrigem);
    if (novaOrigem === "Portugal") {
      setDestino("Suiça");
    } else if (novaOrigem === "Suiça") {
      setDestino("Portugal");
    } else {
      setDestino("");
    }
  }}
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
  onChange={(e) => {
    const novoDestino = e.target.value;
    setDestino(novoDestino);
    if (novoDestino === "Portugal") {
      setOrigem("Suiça");
    } else if (novoDestino === "Suiça") {
      setOrigem("Portugal");
    } else {
      setOrigem("");
    }
  }}
  required
>
  <option value="">Selecione o destino</option>
  {cities.map((city) => (
    <option key={city.id} value={city.nome}>
      {city.nome}
    </option>
  ))}
</Form.Control>



<Form.Group className="mb-3" style={{ paddingTop: "30px" }}>
        <Form.Label>Selecionar Data</Form.Label>
        <Form.Control
          type="date"
          value={dataAtual}
          onChange={(e) => setDataAtual(e.target.value)}
        />
      </Form.Group>
<Button
        variant="primary"
        onClick={adicionarData}
        style={{ backgroundColor: "darkred", borderColor: "darkred" }}
        className="mb-3"
      >
        Adicionar Data
      </Button>





        </Form.Group>
      {datasSelecionadas.length > 0 && (
        <TabelaDatas
          datasSelecionadas={datasSelecionadas}
          onDataChange={atualizarData}
          onBusChange={atualizarBus}
          onReturnTripChange={atualizarReturnTrip}
          onReturnDateChange={atualizarReturnDate}
          onRemove={removerData}
        />
      )}

   

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
        <Button
          variant="success"
          type="submit"
          style={{ backgroundColor: "darkred", borderColor: "darkred" }}
        >
          Gravar
        </Button>
      </Form>
    </Container>
  );
};

export default CriarViagemMultiData;
