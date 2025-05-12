import jsPDF from "jspdf";
import logoVPL from "../../../assets/logo.png"; // Caminho para o logo dentro do projeto

const handlePrintTicket = (row, datatrip, formatDate, returnPDF = false, dataVoltaManual = null) => {
  if (!row || !row.nomePassageiro) {
    alert("Informações da reserva inválidas.");
    return;
  }

  const parseVoltaDate = (input) => {
    if (!input || input.toLowerCase() === "aberto") return null;
  
    // Verifica se está no formato yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return new Date(input);
    }
  
    // Verifica se está no formato dd/mm/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
      const [dd, mm, yyyy] = input.split("/");
      return new Date(`${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`);
    }
  
    // Se o formato for inválido, retorna null
    return null;
  };
  
  

  const formatDatePorExtenso = (dateInput) => {
    if (!dateInput) return "----";
  
    const meses = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];
  
    const date = new Date(dateInput);
    const dia = date.getUTCDate(); // usar UTC para evitar timezone issues
    const mes = meses[date.getUTCMonth()];
    const ano = date.getUTCFullYear();
  
    return `${dia} ${mes} de ${ano}`;
  };

  

  const pdf = new jsPDF("l", "mm", "a4");
  const isAlreadyFormatted = (value) => typeof value === "string" && /[a-z]+ de \d{4}/i.test(value);
  const dataIdaTexto = datatrip
  ? (isAlreadyFormatted(datatrip) ? datatrip : formatDatePorExtenso(datatrip))
  : "----";

  const voltaDateParsed = parseVoltaDate(row.volta);
  const dataVoltaTexto = voltaDateParsed
    ? formatDatePorExtenso(voltaDateParsed)
    : "----";
  

  const reservaLimpa = row.reserva
  ? row.reserva.replace(/\..*$/, "")  // remove tudo desde o primeiro ponto
  : "----";



  


  
  
  // Dimensões do bilhete (14.7cm x 7cm convertidos para mm)
  const ticketWidth = 147;
  const ticketHeight = 70;
  const leftMarginCol1 = 25; 
  const leftMarginCol2 = 25; 
  const columns = 2;
  const rows = 3;
  const maxTicketsPerPage = columns * rows;
  const logoWidth = 20;
  const logoHeight = 8;

  // Espaço entre bilhetes
  const horizontalSpace = (297 - ticketWidth * columns) / (columns + 1);
  const verticalSpace = (215 - ticketHeight * rows) / (rows + 1);

  let ticketCount = 0;

  // Adicionar fontes
  pdf.addFont("helvetica", "regular", "normal");
  pdf.addFont("helvetica", "bold", "bold");

  // --------------------------
  // Calcula posicionamento do bilhete na página
  // --------------------------
  const col = ticketCount % columns;
  const rowNum = Math.floor(ticketCount / columns);

  const xOffset = horizontalSpace + col * (ticketWidth + horizontalSpace);
  const yOffset = verticalSpace + rowNum * (ticketHeight + verticalSpace);
  const leftMargin = col === 0 ? leftMarginCol1 : leftMarginCol2;

  // Área útil do bilhete (descontando a margem lateral)
  const contentAreaX = xOffset + leftMargin;
  const usableWidth = ticketWidth - leftMargin;

  // --------------------------
  // Desenhar o contorno e topo do bilhete
  // --------------------------
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(xOffset, yOffset, ticketWidth, ticketHeight, 3, 3);

  pdf.setFillColor(255, 255, 255);
  pdf.rect(xOffset, yOffset, ticketWidth, 12, "F");

  // Cabeçalho (título + logo)
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text("VPL - Viagens Póvoa de Lanhoso Lda", contentAreaX, yOffset + 8);

  pdf.addImage(
    logoVPL,
    "PNG",
    xOffset + ticketWidth - logoWidth - 5,
    yOffset + 2,
    logoWidth,
    logoHeight
  );

  // --------------------------
  // Nº da Reserva e Nº do Bilhete
  // --------------------------
  // Caixa cinza para o nº da reserva
  pdf.setFillColor(245, 245, 245);
  pdf.roundedRect(xOffset + ticketWidth - 38, yOffset + 14, 35, 10, 2, 2, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Reserva ${reservaLimpa}`,
    xOffset + ticketWidth - 30,
    yOffset + 20
  );

  // Bilhete mais à esquerda
  pdf.setFillColor(245, 245, 245);
  pdf.roundedRect(xOffset + ticketWidth - 122, yOffset + 14, 35, 10, 2, 2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(0, 0, 0);
  pdf.text(
    `Bilhete ${row.bilhete || "----"}`,
    xOffset + ticketWidth - 115,
    yOffset + 20
  );

  // --------------------------
  // Campos de texto (Nome, Data, Ida, Volta, Lugar, Preço)
  // --------------------------
  pdf.setTextColor(80, 80, 80);
  pdf.setFontSize(9);

  const fieldHeight = 7;
  const fieldMargin = 3;

  // Caixas de fundo (campos do bilhete)
  pdf.setFillColor(245, 245, 245);
  pdf.roundedRect(
    contentAreaX,
    yOffset + 26,
    usableWidth / 2 - fieldMargin,
    fieldHeight,
    1,
    1,
    "F"
  );
  pdf.roundedRect(
    contentAreaX + usableWidth / 2 + fieldMargin,
    yOffset + 26,
    usableWidth / 2 - fieldMargin * 2,
    fieldHeight,
    1,
    1,
    "F"
  );
  pdf.roundedRect(
    contentAreaX,
    yOffset + 36,
    usableWidth / 2 - fieldMargin,
    fieldHeight,
    1,
    1,
    "F"
  );
  pdf.roundedRect(
    contentAreaX + usableWidth / 2 + fieldMargin,
    yOffset + 36,
    usableWidth / 2 - fieldMargin * 2,
    fieldHeight,
    1,
    1,
    "F"
  );
  pdf.roundedRect(
    contentAreaX,
    yOffset + 46,
    usableWidth / 2 - fieldMargin,
    fieldHeight,
    1,
    1,
    "F"
  );
  pdf.roundedRect(
    contentAreaX + usableWidth / 2 + fieldMargin,
    yOffset + 46,
    usableWidth / 2 - fieldMargin * 2,
    fieldHeight,
    1,
    1,
    "F"
  );

  // Títulos dos campos
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(100, 100, 100);

  pdf.text("NOME", contentAreaX + 2, yOffset + 30);
  pdf.text("PREÇO", contentAreaX + usableWidth / 2 + fieldMargin + 44, yOffset + 30);
  pdf.text("ENT", contentAreaX + 2, yOffset + 40);
  pdf.text("IDA", contentAreaX + usableWidth / 2 + fieldMargin + 48, yOffset + 40);
  
  pdf.text("SAI", contentAreaX + 2, yOffset + 50);
  pdf.text("VOLTA", contentAreaX + usableWidth / 2 + fieldMargin + 44, yOffset + 50);

  // Valores dos campos
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(0, 0, 0);

  const nameText = `${row.nomePassageiro} ${row.apelidoPassageiro || ""}`;
  pdf.text(nameText, contentAreaX + 15, yOffset + 30);
  pdf.text(dataIdaTexto, contentAreaX + usableWidth / 2 + fieldMargin + 5, yOffset + 40);

  
  pdf.text(`${row.entrada || "----"}`, contentAreaX + 15, yOffset + 40);
  pdf.text(dataVoltaTexto, contentAreaX + usableWidth / 2 + fieldMargin + 5, yOffset + 50);

  
  pdf.text(`${row.saida || "----"}`, contentAreaX + 15, yOffset + 50);

  // --------------------------
  // Cálculo do Preço Final
  // --------------------------
  const basePrice = parseFloat(row.preco || 0);
  const carPrice = parseFloat(row.valorCarro || 0);
  const volumePrice = parseFloat(row.valorVolume || 0);
  const finalPrice = basePrice + carPrice + volumePrice;

  if (finalPrice > 0) {
    pdf.text(
      `${finalPrice.toFixed(2)}${row.moeda || "€"}`,
      contentAreaX + usableWidth / 2 + fieldMargin + 5,
      yOffset + 30
      
    );
  } else {
    pdf.text(
      "----",
      contentAreaX + usableWidth / 2 + fieldMargin + 5,
      yOffset + 50
    );
  }

  // --------------------------
  // Verificar se inclui carro/bagagem
  // --------------------------
  const hasCarro = carPrice > 0;
  const hasBagagem = volumePrice > 0;
  let textoExtra = "";
  if (hasCarro && hasBagagem) {
    textoExtra = " - Inclui Carro e Bagagem Extra";
  } else if (hasCarro) {
    textoExtra = " - Inclui Carro";
  } else if (hasBagagem) {
    textoExtra = " - Inclui Bagagem Extra";
  }

  // --------------------------
  // Rodapé
  // --------------------------
  pdf.setFillColor(255, 255, 255);
  pdf.rect(xOffset, yOffset + ticketHeight - 15, ticketWidth, 15, "F");

  pdf.setFontSize(6);
  pdf.setTextColor(80, 80, 80);
  const footerText =
  "Linhas Regulares e Internacionais Póvoa de Lanhoso - Zurique. Licença Comunitária nº 200260 - NIF 506163016";
const phoneText = "Tel: 00444981010 Tlm: 0792545839 Tel: 253730030 Tlm: 919404080";

const textWidth = pdf.getTextWidth(footerText);
const phoneTextWidth = pdf.getTextWidth(phoneText);

const centerX = xOffset + ticketWidth / 1.8;

pdf.text(footerText, centerX - textWidth / 2, yOffset + ticketHeight - 6);
pdf.text(phoneText, centerX - phoneTextWidth / 2, yOffset + ticketHeight - 2); // 4 unidades abaixo

  // Imprimir o texto extra no rodapé, se existir
  if (textoExtra) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(0, 0, 0);
    // Ajustar esta coordenada se quiseres posicionar o texto noutro sítio
    pdf.text(textoExtra, xOffset + 100, yOffset + ticketHeight - 12);
  }

  // --------------------------
  // Finalização: nome do ficheiro + return
  // --------------------------
  const formattedDate = formatDate(datatrip).replace(/\//g, "-");
  const fileName = `Bilhete_Reserva_${formattedDate}.pdf`;

  if (returnPDF) {
    return pdf; // devolve o objeto PDF, se necessário
  } else {
    pdf.save(fileName); // salva diretamente
  }
};

export default handlePrintTicket;
