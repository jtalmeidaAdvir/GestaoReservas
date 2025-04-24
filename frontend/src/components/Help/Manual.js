import React, { useState } from "react";
import { Container, Card, Button, ListGroup } from "react-bootstrap";
import "../../styles/manual.css";

const sections = [
  "Criar Reservas",
  "Criação da Viagem de Volta",
  "Editar ou Remover Viagens",
  "Criar País/Cidade",
  "Criar Autocarro",
  "Criar Viagens",
  "Criar Bilhetes",
  "Agenda de Viagens",
  "Mover Passageiros",
  "Pesquisa de Reservas",
  "Criação de Listagens",
  "Visão do Autocarro e Gerar Bilhetes e Listas",
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

            {activeSection === "Criar Reservas" && (
  <>
    <p>Acede à <strong>Agenda</strong> e seleciona a viagem para a qual desejas criar a reserva.</p>
    <p>No formulário de reserva:</p>
    <ol>
      <li>Seleciona a <strong>Data da Viagem</strong> e a <strong>Cidade de Entrada</strong> (onde o passageiro entra).</li>
      <li>De seguida, escolhe a <strong>Cidade de Saída</strong> — o sistema filtra automaticamente cidades do país oposto.</li>
      <li>Se aplicável, seleciona a <strong>Data de Volta</strong> ou deixa como <em>Aberto</em>.</li>
      <li>Marca se o passageiro é uma <strong>Criança</strong> — isso irá ajustar os bilhetes disponíveis.</li>
      <li>Escolhe o tipo de <strong>Bilhete</strong> ou deixa o sistema escolher automaticamente.</li>
      <li>Preenche os dados do passageiro: <strong>nome</strong>, <strong>apelido</strong>, <strong>telefone</strong>, e opcionalmente <strong>carro</strong>, <strong>valor carro</strong>, <strong>valor volume</strong> e <strong>observações</strong>.</li>
      <li>Verifica o campo <strong>Total Bilhete</strong>, que é calculado automaticamente.</li>
      <li>Clica em <strong>+ Adicionar Passageiro</strong> para adicionar à lista. O sistema atribui automaticamente o próximo lugar disponível.</li>
    </ol>
    <p>Podes repetir os passos para adicionar vários passageiros ao mesmo bloco de reserva (ex: familiares).</p>
    <p>Após preencher todos os passageiros, clica em <strong>Guardar</strong> para gravar todas as reservas de uma vez.</p>
    <p>Se alguma reserva tiver data de volta, o sistema irá abrir um <strong>modal</strong> para escolher o lugar da viagem de regresso.</p>
    <p>Podes também <strong>Imprimir todos os bilhetes</strong> após guardar, ou imprimir individualmente através do ícone da impressora.</p>
    <p><em>Nota:</em> Se clicares numa reserva já existente na tabela, os dados serão carregados para edição.</p>
  </>
            )}


            {activeSection === "Criar Bilhetes" && (
              <>
                <p>Acede à <strong>aba de Bilhetes</strong> no menu lateral.</p>
                <p>Esta secção permite-te criar diferentes tipos de bilhetes (ex: Adulto Ida, Criança Ida e Volta, etc.), associando‑os a um país e valor.</p>

                <ol>
                  <li>No formulário de criação, insere o <strong>valor</strong> do bilhete (ex: 35.00).</li>
                  <li>Preenche o campo <strong>descrição</strong> (ex: "Adulto Ida e Volta", "Criança Ida").</li>
                  <li>Escolhe o <strong>país</strong> ao qual este bilhete se aplica (Portugal ou Suíça).</li>
                  <li>Clica em <strong>Criar</strong> para guardar o bilhete.</li>
                </ol>

                <p>⚠️ Estes bilhetes serão automaticamente sugeridos no momento de criar reservas, de acordo com:</p>
                <ul>
                  <li>Se é adulto ou criança (campo “Criança” na reserva)</li>
                  <li>Se a reserva tem data de volta preenchida</li>
                  <li>País de origem da viagem</li>
                </ul>

                <p>Após criar o bilhete, este ficará disponível no menu de seleção na página de reservas.</p>
              </>
            )}


            {activeSection === "Criar Viagens" && (
              <>
                <p>Acede à secção <strong>"Criar Viagens"</strong> no menu lateral para criar viagens com uma ou mais datas.</p>

                <ol>
                  <li>Escolhe a <strong>Data da Viagem</strong> no seletor de data.</li>
                  <li>Clica em <strong>“Adicionar Data”</strong> para adicionar essa data à lista de criação.</li>
                  <li>Repete o processo se quiseres criar viagens para vários dias.</li>
                  <li>Para cada data, seleciona o <strong>Autocarro disponível</strong> para essa data.</li>
                  <li>Assinala a opção <strong>"Viagem de Volta"</strong> se quiseres criar automaticamente a viagem de regresso.</li>
                  <li>Define a <strong>Data da Viagem de Volta</strong>, se aplicável.</li>
                  <li>Seleciona a <strong>Origem</strong> e o <strong>Destino</strong> da viagem (obrigatórios).</li>
                  <li>Clica em <strong>“Criar Viagens para os Dias Selecionados”</strong> para submeter.</li>
                </ol>

                <p>⚙️ O sistema irá criar automaticamente:</p>
                <ul>
                  <li>Viagens de ida com os dados preenchidos</li>
                  <li>Viagens de volta, com origem/destino trocados, se selecionado</li>
                </ul>

                <p>✅ As viagens ficarão disponíveis de imediato na agenda e na criação de reservas.</p>

                <p> Existindo ainda a possibilidade de criar diretamente na agenda, entrando no dia e criando a viagem.</p>

                <p><em>Nota: apenas são permitidos autocarros marcados como <strong>ativos</strong> e <strong>disponíveis</strong> na data selecionada.</em></p>
              </>
            )}


            {activeSection === "Agenda de Viagens" && (
              <>
                <p>A <strong>Agenda de Viagens</strong> permite visualizar e navegar pelas viagens agendadas num calendário interativo.</p>

                <h6>📆 Funcionalidades principais:</h6>
                <ul>
                  <li>Visualização mensal, semanal ou diária das viagens.</li>
                  <li>Eventos codificados por cor, com base na direção:
                    <ul>
                      <li><span style={{ color: "green" }}>Verde</span>: Portugal → Suíça</li>
                      <li><span style={{ color: "darkred" }}>Vermelho escuro</span>: Suíça → Portugal</li>
                      <li><span style={{ color: "lightgray" }}>Cinza claro</span>: Direção desconhecida</li>
                    </ul>
                  </li>
                  <li>Pesquisa rápida de reservas por:
                    <ul>
                      <li>📄 Número de reserva</li>
                      <li>📱 Número de telefone</li>
                      <li>👤 Nome e apelido do passageiro</li>
                    </ul>
                  </li>
                  <li>Consulta e gestão de:
                    <ul>
                      <li>📋 Reservas com <strong>volta em aberto</strong></li>
                      <li>🗑️ Reservas <strong>eliminadas (lista negra)</strong></li>
                    </ul>
                  </li>
                </ul>

                <h6>🔎 Como pesquisar reservas:</h6>
                <ol>
                  <li>Insere o número de reserva, telefone ou nome completo.</li>
                  <li>Clica no botão correspondente.</li>
                  <li>Se a reserva existir, serás redirecionado para a página de viagens com a data e viagem automaticamente selecionadas.</li>
                </ol>

                <h6>📋 Reservas com volta em aberto:</h6>
                <ul>
                  <li>Ao clicar em "📋 Ver Reservas em Aberto", é apresentado um modal com todas as reservas que ainda não têm viagem de regresso.</li>
                  <li>Podes pesquisar dentro da listagem e clicar numa reserva para ser redirecionado.</li>
                </ul>

                <h6>🗑️ Lista Negra:</h6>
                <ul>
                  <li>Consulta todas as reservas removidas do sistema.</li>
                  <li>Podes eliminar permanentemente da lista negra, se necessário.</li>
                </ul>

                <h6>🗓️ Ações no Calendário:</h6>
                <ul>
                  <li><strong>Clique numa data:</strong> Abre diretamente a página de viagens com a data selecionada.</li>
                  <li><strong>Clique num evento (viagem):</strong> Abre a página de viagens com foco nessa viagem.</li>
                </ul>

                <p>O sistema memoriza automaticamente a tua última visualização e data selecionada, para manteres o contexto entre páginas.</p>
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


              {activeSection === "Visão do Autocarro e Gerar Bilhetes e Listas" && (
                <>
                  <p>A página de <strong>Reservas</strong> permite gerir todos os passageiros associados a uma viagem específica, com funcionalidades avançadas para edição, impressão, movimentação e estatísticas.</p>

                  <h6>🧾 Funcionalidades principais:</h6>
                  <ul>
                    <li>Visualização completa de todos os lugares disponíveis no autocarro.</li>
                    <li>Edição rápida de:
                      <ul>
                        <li>👤 Nome e apelido do passageiro</li>
                        <li>📍 Entrada e saída</li>
                        <li>🚗 Carro e volumes</li>
                        <li>💬 Observações</li>
                        <li>📧 Contactos</li>
                      </ul>
                    </li>
                    <li>Atribuição automática de número de reserva e bilhete</li>
                    <li>Geração individual ou em massa de bilhetes PDF</li>
                    <li>Listagem de passageiros com totalizadores de entradas, saídas e preços</li>
                    <li>Resumo de passageiros por cidade</li>
                    <li>Geração e envio de e-mail com os dados da viagem</li>
                  </ul>

                  <h6>🔁 Gestão de movimentos de reservas:</h6>
                  <ul>
                    <li><strong>Mover dentro da mesma viagem:</strong> Seleciona várias reservas e escolhe novos lugares.</li>
                    <li><strong>Trocar passageiros de lugar:</strong> Seleciona duas reservas e troca as posições.</li>
                    <li><strong>Mover para outra viagem:</strong> Seleciona reservas e reatribui-as a outra viagem futura.</li>
                  </ul>

                  <h6>📋 Cópia e colagem de reservas:</h6>
                  <ul>
                    <li>Copiar uma reserva principal e colar em lugares vazios para criar subreservas.</li>
                    <li>Campos como <code>email</code>, <code>telefone</code> e <code>obs</code> são limpos nas subreservas.</li>
                  </ul>

                  <h6>🛫 Viagens de regresso:</h6>
                  <ul>
                    <li>Ao preencher a data de <strong>volta</strong>, o sistema procura automaticamente viagens no sentido inverso.</li>
                    <li>É apresentado um modal para escolher o lugar da viagem de regresso.</li>
                  </ul>

                  <h6>🚌 Mudança de autocarro:</h6>
                  <ul>
                    <li>Permite trocar de autocarro mantendo todas as reservas válidas.</li>
                    <li>Valida se há lugares suficientes e reposiciona os passageiros automaticamente.</li>
                  </ul>

                  <h6>🗑️ Eliminação de reservas:</h6>
                  <ul>
                    <li>Botão para eliminar uma reserva individual.</li>
                    <li>Se existir viagem de regresso, o sistema pergunta se deseja eliminar ambas.</li>
                  </ul>

                  <h6>💶 Preços e estatísticas:</h6>
                  <ul>
                    <li>Seleção de preços disponível diretamente na célula “Preço”.</li>
                    <li>Resumo com:
                      <ul>
                        <li>💰 Total por moeda</li>
                        <li>📊 Frequência por preço</li>
                        <li>🚏 Total de entradas e saídas por cidade</li>
                      </ul>
                    </li>
                  </ul>

                  <h6>📝 Notas da viagem:</h6>
                  <ul>
                    <li>Campo livre para inserir observações gerais sobre a viagem.</li>
                    <li>Guardado com um clique no botão "Guardar Notas".</li>
                  </ul>

                </>
              )}


              {activeSection === "Criar Autocarro" && (
                <>
                  <p>Na <strong>Aba de Autocarros</strong>, adiciona um novo veículo à frota.</p>
                  <p>Inclui informações essenciais.</p>
                  <p>Podes adicionar uma imagem da árvore do autocarro para facilitar a identificação.</p>
                </>
              )}


              {activeSection === "Criação de Listagens" && (
                <>
                  <p>Acede à página de <strong>Criação de Listagens</strong> no menu lateral para visualizar todas as reservas em cada lugar do autocarro e gerir trocas de passageiros entre viagens.</p>

                  <p>Esta funcionalidade permite-te:</p>
                  <ul>
                    <li>Visualizar graficamente todas as reservas (por lugar).</li>
                    <li>Identificar lugares livres e ocupados.</li>
                    <li>Trocar passageiros entre duas viagens diferentes.</li>
                    <li>Mover reservas para lugares vagos noutra viagem.</li>
                  </ul>

                  <h6>📌 Como fazer uma troca/movimentação:</h6>
                  <ol>
                    <li>Seleciona uma <strong>reserva existente</strong> na 1ª viagem (circular laranja).</li>
                    <li>Seleciona o <strong>destino da troca</strong> noutra viagem — pode ser um lugar vago (círculo azul com número) ou outra reserva.</li>
                    <li>Repete o processo para múltiplos pares de troca.</li>
                    <li>Clica no botão <strong>“Trocar/Mover Reservas Entre Viagens”</strong> para confirmar.</li>
                  </ol>

                  <h6>ℹ️ Lógica:</h6>
                  <ul>
                    <li>Se trocares 2 reservas existentes, os passageiros trocam de autocarro e lugar.</li>
                    <li>Se moveres uma reserva para um lugar vazio, essa reserva muda de autocarro e ocupa o lugar.</li>
                    <li>O terceiro autocarro (caso exista) está bloqueada para transferências.</li>
                  </ul>

                  <h6>🎯 Legenda:</h6>
                  <ul>
                    <li><strong>Laranja</strong> – Reserva selecionada para mover</li>
                    <li><strong>Azul</strong> – Lugar destino selecionado</li>
                  </ul>

                  <p>No final, todas as alterações são guardadas automaticamente na base de dados.</p>
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
