import jsPDF from "jspdf";
import logoVPL from "../../../assets/logo.png";

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


function formatDatePorExtenso(dateInput) {
  if (!dateInput) return "----";
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];
  const date = new Date(dateInput);
  const dia = date.getUTCDate();
  const mes = meses[date.getUTCMonth()];
  const ano = date.getUTCFullYear();
  return `${dia} ${mes} de ${ano}`;
}

async function handleRePrintAllTickets(
  reservations,
  datatrip,
  formatDate,
  handleRowEdit,
  returnPDF = false
) {
  try {
    const reprintableReservations = reservations.filter(
      (row) => row.reserva && row.nomePassageiro
    );

    if (reprintableReservations.length === 0) {
      alert("Não há bilhetes válidos para reimprimir.");
      return;
    }

    const pdf = new jsPDF("l", "mm", "a4");

    const ticketWidth = 147;
    const ticketHeight = 70;
    const leftMarginCol1 = 25;
    const leftMarginCol2 = 25;
    const columns = 2;
    const rows = 3;
    const logoWidth = 20;
    const logoHeight = 8;

    const horizontalSpace = (297 - ticketWidth * columns) / (columns + 1);
    const verticalSpace = (215 - ticketHeight * rows) / (rows + 1);

    let ticketCount = 0;

    pdf.addFont("helvetica", "regular", "normal");
    pdf.addFont("helvetica", "bold", "bold");

    reprintableReservations.forEach((row) => {
      const reservaLimpa = row.reserva ? row.reserva.replace(/\..*$/, "") : "----";
      const voltaDateParsed = parseVoltaDate(row.volta);
      const dataIdaTexto = formatDatePorExtenso(datatrip);
      const dataVoltaTexto = voltaDateParsed ? formatDatePorExtenso(voltaDateParsed) : "----";

      if (ticketCount >= columns * rows) {
        pdf.addPage();
        ticketCount = 0;
      }

      const col = ticketCount % columns;
      const rowNum = Math.floor(ticketCount / columns);
      const xOffset = horizontalSpace + col * (ticketWidth + horizontalSpace);
      const yOffset = verticalSpace + rowNum * (ticketHeight + verticalSpace);
      const leftMargin = col === 0 ? leftMarginCol1 : leftMarginCol2;
      const contentAreaX = xOffset + leftMargin;
      const usableWidth = ticketWidth - leftMargin;

      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(xOffset, yOffset, ticketWidth, ticketHeight, 3, 3);
      pdf.setFillColor(255, 255, 255);
      pdf.rect(xOffset, yOffset, ticketWidth, 12, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text("VPL - Viagens Póvoa de Lanhoso Lda", contentAreaX, yOffset + 8);
      pdf.addImage(logoVPL, "PNG", xOffset + ticketWidth - logoWidth - 5, yOffset + 2, logoWidth, logoHeight);

      pdf.setFillColor(245, 245, 245);
      pdf.roundedRect(xOffset + ticketWidth - 38, yOffset + 14, 35, 10, 2, 2, "F");
      pdf.text(`Reserva ${reservaLimpa}`, xOffset + ticketWidth - 30, yOffset + 20);

      pdf.setFillColor(245, 245, 245);
      pdf.roundedRect(xOffset + ticketWidth - 122, yOffset + 14, 35, 10, 2, 2, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Bilhete ${row.bilhete || "----"}`, xOffset + ticketWidth - 115, yOffset + 20);

      const fieldHeight = 7;
      const fieldMargin = 3;

      const campos = [
        ["NOME", `${row.nomePassageiro} ${row.apelidoPassageiro || ""}`],
        ["PREÇO", "PAGO"],
        ["ENT", row.entrada || "----"],
        ["IDA", dataIdaTexto],
        ["SAI", row.saida || "----"],
        ["VOLTA", dataVoltaTexto]
      ];

      campos.forEach(([label, value], index) => {
        const isLeft = index % 2 === 0;
        const x = contentAreaX + (isLeft ? 0 : usableWidth / 2 + fieldMargin);
        const y = yOffset + 26 + Math.floor(index / 2) * 10;
        const width = usableWidth / 2 - (isLeft ? fieldMargin : fieldMargin * 2);

        pdf.setFillColor(245, 245, 245);
        pdf.roundedRect(x, y, width, fieldHeight, 1, 1, "F");
      });

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
      pdf.text(`${row.nomePassageiro} ${row.apelidoPassageiro || ""}`, contentAreaX + 15, yOffset + 30);
      pdf.text("PAGO", contentAreaX + usableWidth / 2 + fieldMargin + 5, yOffset + 30);
      pdf.text(`${row.entrada || "----"}`, contentAreaX + 15, yOffset + 40);
      pdf.text(dataIdaTexto, contentAreaX + usableWidth / 2 + fieldMargin + 5, yOffset + 40);
      pdf.text(`${row.saida || "----"}`, contentAreaX + 15, yOffset + 50);
      pdf.text(dataVoltaTexto, contentAreaX + usableWidth / 2 + fieldMargin + 5, yOffset + 50);

      const carPrice = parseFloat(row.valorCarro || 0);
      const volumePrice = parseFloat(row.valorVolume || 0);
      const hasCarro = carPrice > 0;
      const hasBagagem = volumePrice > 0;
      let textoExtra = "";
      if (hasCarro && hasBagagem) textoExtra = " - Inclui Carro e Bagagem Extra";
      else if (hasCarro) textoExtra = " - Inclui Carro";
      else if (hasBagagem) textoExtra = " - Inclui Bagagem Extra";

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

      if (textoExtra) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(0, 0, 0);
        pdf.text(textoExtra, xOffset + 100, yOffset + ticketHeight - 12);
      }

      ticketCount++;
    });

    const formattedDate = formatDate(datatrip).replace(/\//g, "-");
    const fileName = `Bilhetes_Reimpressao_${formattedDate}.pdf`;

    if (returnPDF) return pdf;
    else pdf.save(fileName);

  } catch (error) {
    console.error("Erro ao gerar bilhetes de reimpressão:", error);
    alert("Ocorreu um erro ao gerar bilhetes de reimpressão.");
  }
}

export default handleRePrintAllTickets;
