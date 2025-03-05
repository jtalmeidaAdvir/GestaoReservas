import React, { useState } from "react";
import { Container, Card, Button, ListGroup } from "react-bootstrap";
import "../../styles/manual.css";

const sections = [
  "Criar Viagens",
  "Editar ou Remover Viagens",
  "Criar País/Cidade",
  "Criar Autocarro",
  "Criar Reservas",
  "Mover Passageiros",
  "Imprimir Bilhetes e Listagem de Passageiros",
  "Criação da Viagem de Volta",
  "Pesquisa de Reservas"
];

const ManualPage = () => {
  const [activeSection, setActiveSection] = useState(sections[0]);

  return (
    <Container className="manual-container">
        <h2 style={{ textAlign: "center", margin: "0 0 20px 0", color: "darkred", fontSize: "28px" }}>Manual de Utilização</h2>
      <div className="manual-layout">
        <nav className="manual-sidebar">
          <ListGroup>
            {sections.map((section) => (
              <ListGroup.Item
                key={section}
                action
                active={section === activeSection}
                onClick={() => setActiveSection(section)}
              >
                {section}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </nav>

        <Card className="manual-card">
          <Card.Body>
            <Card.Title className="manual-title">{activeSection}</Card.Title>
            <Card.Text className="manual-text">
              {activeSection === "Criar Viagens" && (
                <>
                  <p>Acede à <strong>Agenda</strong> e seleciona a data desejada para a viagem.</p>
                  <p>Preenche todos os detalhes necessários, incluindo o ponto de partida, destino, horário e capacidade do autocarro.</p>
                  <p>Confirma a criação da viagem para que fique disponível no sistema.</p>
                </>
              )}
              {activeSection === "Editar ou Remover Viagens" && (
                <>
                  <p>Na <strong>Aba de Viagens</strong>, localiza a viagem que desejas modificar ou eliminar.</p>
                  <p>Para editar, ajusta os detalhes necessários, como horário, autocarro.</p>
                  <p>Para remover, certifica-te de que não há reservas ativas antes de proceder à eliminação.</p>
                </>
              )}
              {activeSection === "Criar País/Cidade" && (
                <>
                  <p>Acede à <strong>Aba de Países</strong> e adiciona um novo país ou cidade conforme necessário.</p>
                  <p>Preenche os dados obrigatórios, como nome do país ou cidade e eventuais detalhes adicionais.</p>
                  <p>Guarda as alterações para que as novas localidades fiquem disponíveis no sistema.</p>
                </>
              )}
              {activeSection === "Criar Autocarro" && (
                <>
                  <p>Na <strong>Aba de Autocarros</strong>, adiciona um novo veículo à frota.</p>
                  <p>Inclui informações essenciais.</p>
                  <p>Podes adicionar uma imagem da árvore do autocarro para facilitar a identificação.</p>
                </>
              )}
              {activeSection === "Criar Reservas" && (
                <>
                  <p>Acede à <strong>Agenda</strong> e seleciona a viagem para a qual desejas criar uma reserva.</p>
                  <p>Introduz os dados do passageiro, incluindo nome, contacto e eventuais preferências.</p>
                </>
              )}
              {activeSection === "Mover Passageiros" && (
                <>
                  <p>Na gestão de reservas, podes transferir passageiros entre diferentes viagens, conforme necessário.</p>
                  <p>Seleciona o passageiro e escolhe a viagem para onde desejas movê-lo.</p>
                  <p>Confirma a alteração para que a nova reserva fique corretamente registada.</p>
                  <p>Podes faze-lo individualmente ao clicar no botao mover do passageiro. Podes ainda faze-lo em bloco, selecionando os passageiros que desejam e clicar no
                    botão de mover em bloco os passageiros, e escolher os respetivos lugares que desejas colocar os mesmos.
                  </p>
                </>
              )}
              {activeSection === "Imprimir Bilhetes e Listagem de Passageiros" && (
                <>
                  <p>Dentro de cada viagem, podes gerar e imprimir bilhetes individuais ou uma listagem completa de passageiros.</p>
                  <p>Os bilhetes incluem detalhes como data, número do assento, entre outros.</p>
                  <p>A listagem de passageiros pode ser usada para conferência antes do embarque.</p>
                </>
              )}
              {activeSection === "Criação da Viagem de Volta" && (
                <>
                  <p>Se ao efetuar uma reserva for indicada uma data de regresso no formato "DD/MM/AAAA" e existir uma viagem correspondente para o regresso, o sistema irá sugerir automaticamente essa viagem para facilitar a reserva de retorno.</p>
                  <p>Esta funcionalidade permite otimizar a gestão das viagens de ida e volta para os passageiros.</p>
                </>
              )}
              {activeSection === "Pesquisa de Reservas" && (
                <>
                  <p>Na <strong>Aba da Agenda</strong>, utiliza o facilitador de pesquisa para encontrar reservas rapidamente.</p>
                  <p>Podes pesquisar pelo número da reserva, número de telefone do passageiro ou nome do mesmo.</p>
                  <p>Esta funcionalidade agiliza a consulta e gestão das reservas ativas.</p>
                </>
              )}
            </Card.Text>
          </Card.Body>
        </Card>
      </div>
      <p className="manual-footer">
  Powered by <a href="https://www.advir.pt" target="_blank" rel="noopener noreferrer">Advir Plan Consultoria</a>.
</p>
<p className="manual-footer">Para qualquer dúvida ligue 253 176 493.</p>

    </Container>
  );
};

export default ManualPage;
