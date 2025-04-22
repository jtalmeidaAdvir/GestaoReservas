import jsPDF from "jspdf";
import logoVPL from "../../../assets/logo.png";

async function handlePrintAllTickets(
  reservations,
  datatrip,
  formatDate,
  handleRowEdit, // atenção: tens de passar a função handleRowEdit aqui
  returnPDF = false
) {
  try {
    // 1) Filtrar apenas as reservas que têm 'reserva' e não estão impressas
    const unprintedReservations = reservations.filter(
      (row) => row.reserva && !row.impresso
    );

    

    if (unprintedReservations.length === 0) {
      alert("Não há bilhetes por imprimir.");
      return;
    }

    // 2) Buscar o último número de bilhete ao backend
    const lastTicketResponse = await fetch("https://backendreservasnunes.advir.pt/reservations/lastTicket");
    if (!lastTicketResponse.ok) {
      throw new Error("Erro ao obter último nº de bilhete do backend.");
    }
    const lastTicketData = await lastTicketResponse.json();
    let nextTicketNumber = parseInt(lastTicketData.bilhete, 10) + 1;

    // 3) Para cada reserva não-impressa, atribuir bilhete + marcar impresso + atualizar backend
    for (const row of unprintedReservations) {
      const paddedBilhete = String(nextTicketNumber).padStart(4, "0");
      row.bilhete = paddedBilhete;
      row.impresso = true;

      await handleRowEdit(row);
      nextTicketNumber++;
    }

    // 4) Gera o PDF só para as reservas que acabaste de marcar e que tenham nome
    const finalReservationsToPrint = unprintedReservations.filter(

      (row) => row.nomePassageiro
    
    );

    if (finalReservationsToPrint.length === 0) {
      alert("Não há bilhetes válidos por imprimir.");
      return;
    }

    const pdf = new jsPDF("l", "mm", "a4");
  
  
    // Definições de layout
    const ticketWidth = 147;
    const ticketHeight = 70;
    const leftMarginCol1 = 25;
    const leftMarginCol2 = 30;
    const columns = 2;
    const rows = 3;
    const maxTicketsPerPage = columns * rows;
    const logoWidth = 20;
    const logoHeight = 8;

    const horizontalSpace = (297 - ticketWidth * columns) / (columns + 1);
    const verticalSpace = (215 - ticketHeight * rows) / (rows + 1);

    let ticketCount = 0;

    // Adicionar fontes
    pdf.addFont("helvetica", "regular", "normal");
    pdf.addFont("helvetica", "bold", "bold");

    finalReservationsToPrint.forEach((row) => {
      // limpar sufixos do nº de reserva
     const reservaLimpa = row.reserva
       ? row.reserva.replace(/\..*$/, "")
       : "----";
      if (ticketCount >= maxTicketsPerPage) {
        pdf.addPage();
        ticketCount = 0;
      }

      // Posicionamento do bilhete na página
      const col = ticketCount % columns;
      const rowNum = Math.floor(ticketCount / columns);
      const xOffset = horizontalSpace + col * (ticketWidth + horizontalSpace);
      const yOffset = verticalSpace + rowNum * (ticketHeight + verticalSpace);
      const leftMargin = col === 0 ? leftMarginCol1 : leftMarginCol2;
      const contentAreaX = xOffset + leftMargin;
      const usableWidth = ticketWidth - leftMargin;

      // Desenhar borda e faixa superior
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(xOffset, yOffset, ticketWidth, ticketHeight, 3, 3);

      pdf.setFillColor(255, 255, 255);
      pdf.rect(xOffset, yOffset, ticketWidth, 12, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text("VPL - Viagens Póvoa de Lanhoso", contentAreaX, yOffset + 8);

      // Logo no canto direito
      pdf.addImage(
        logoVPL,
        "PNG",
        xOffset + ticketWidth - logoWidth - 5,
        yOffset + 2,
        logoWidth,
        logoHeight
      );

      // Nº da RESERVA
      pdf.setFillColor(245, 245, 245);
      pdf.roundedRect(xOffset + ticketWidth - 40, yOffset + 14, 35, 10, 2, 2, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Nº ${reservaLimpa}`, xOffset + ticketWidth - 28, yOffset + 20);

      // Nº do BILHETE (mais à esquerda)
      pdf.text(
        `Bilhete ${row.bilhete || "----"}`,
        xOffset + ticketWidth - 120,
        yOffset + 20
      );

      // Campos de texto do bilhete
      pdf.setTextColor(80, 80, 80);
      pdf.setFontSize(9);

      const fieldHeight = 7;
      const fieldMargin = 3;

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

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(100, 100, 100);

      pdf.text("NOME", contentAreaX + 2, yOffset + 30);
      pdf.text("DATA", contentAreaX + usableWidth / 2 + fieldMargin + 2, yOffset + 30);
      pdf.text("IDA", contentAreaX + 2, yOffset + 40);
      pdf.text("VOLTA", contentAreaX + usableWidth / 2 + fieldMargin + 2, yOffset + 40);
      pdf.text("LUGAR", contentAreaX + 2, yOffset + 50);
      pdf.text("PREÇO", contentAreaX + usableWidth / 2 + fieldMargin + 2, yOffset + 50);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);

      // Nome e Data
      const nameText = `${row.nomePassageiro} ${row.apelidoPassageiro || ""}`;
      pdf.text(nameText, contentAreaX + 15, yOffset + 30);
      pdf.text(
        datatrip ? formatDate(datatrip) : "----",
        contentAreaX + usableWidth / 2 + fieldMargin + 15,
        yOffset + 30
      );

      // Ida / Volta / Lugar
      pdf.text(`${row.saida || "----"}`, contentAreaX + 15, yOffset + 40);
      pdf.text(
        `${row.volta || "----"}`,
        contentAreaX + usableWidth / 2 + fieldMargin + 15,
        yOffset + 40
      );
      pdf.text(`${row.lugar || "----"}`, contentAreaX + 15, yOffset + 50);

      // Preço = preco + valorCarro + valorVolume
      const basePrice = parseFloat(row.preco || 0);
      const carPrice = parseFloat(row.valorCarro || 0);
      const volumePrice = parseFloat(row.valorVolume || 0);
      const finalPrice = basePrice + carPrice + volumePrice;

      if (finalPrice > 0) {
        pdf.text(
          `${finalPrice.toFixed(2)}${row.moeda || "€"}`,
          contentAreaX + usableWidth / 2 + fieldMargin + 15,
          yOffset + 50
        );
      } else {
        pdf.text(
          "----",
          contentAreaX + usableWidth / 2 + fieldMargin + 15,
          yOffset + 50
        );
      }

      // Carro/Bagagem -> vamos imprimir no rodapé
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

      // Parte inferior do bilhete (rodapé)
      pdf.setFillColor(255, 255, 255);
      pdf.rect(xOffset, yOffset + ticketHeight - 15, ticketWidth, 15, "F");

      pdf.setFontSize(6);
      pdf.setTextColor(80, 80, 80);

      const footerText =
        "Linhas Regulares e Internacionais Póvoa de Lanhoso - Zurique. Licença Comunitária nº 200260 - NIF 506163016";
      const textWidth = pdf.getTextWidth(footerText);
      const centerX = xOffset + ticketWidth / 1.8 - textWidth / 2;
      pdf.text(footerText, centerX, yOffset + ticketHeight - 6);

      // Se houver textoExtra (carro/bagagem), mostra-o mais à esquerda no rodapé
      if (textoExtra) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(0, 0, 0);
        // Ajusta a coordenada X consoante a formatação que quiseres
        pdf.text(textoExtra, xOffset + 100, yOffset + ticketHeight - 12);
      }

      ticketCount++;
    });

    const formattedDate = formatDate(datatrip).replace(/\//g, "-");
    const fileName = `Bilhetes_Reserva_${formattedDate}.pdf`;

    if (returnPDF) {
      return pdf;
    } else {
      pdf.save(fileName);
    }
  } catch (error) {
    console.error("Erro ao gerar bilhetes em lote:", error);
    alert("Ocorreu um erro ao gerar bilhetes em lote.");
  }
}

export default handlePrintAllTickets;
