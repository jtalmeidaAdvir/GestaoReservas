import jsPDF from "jspdf";
import logoVPL from "../../../assets/logo.png"; // Caminho para o logo dentro do projeto

const handlePrintTicket = (row, datatrip, formatDate, returnPDF = false) => {
    if (!row || !row.nomePassageiro) {
        alert("Informações da reserva inválidas.");
        return;
    }

    const pdf = new jsPDF("l", "mm", "a4");

    // Definições de dimensões do bilhete (14.7cm x 7cm convertidos para mm)
    const ticketWidth = 147;
    const ticketHeight = 70;
    const leftMarginCol1 = 25; // 2.5cm de reserva no lado esquerdo para primeira coluna
    const leftMarginCol2 = 30; // 4cm de reserva no lado esquerdo para segunda coluna
    const columns = 2;
    const rows = 3;
    const maxTicketsPerPage = columns * rows;
    const logoWidth = 20;  
    const logoHeight = 8;
    
    // Definir espaço entre bilhetes
    const horizontalSpace = (297 - (ticketWidth * columns)) / (columns + 1); // Para A4 paisagem: 297mm x 210mm
    const verticalSpace = (215 - (ticketHeight * rows)) / (rows + 1);

    let ticketCount = 0;

    // Adicionar fonte personalizada
    pdf.addFont("helvetica", "regular", "normal");
    pdf.addFont("helvetica", "bold", "bold");


        // Calcular posição do bilhete na página
        const col = ticketCount % columns;
        const rowNum = Math.floor(ticketCount / columns);
        
        // Posicionamento dos bilhetes com espaço distribuído uniformemente
        let xOffset = horizontalSpace + col * (ticketWidth + horizontalSpace);
        let yOffset = verticalSpace + rowNum * (ticketHeight + verticalSpace);
        
        // Determinar qual margem esquerda usar com base na coluna
        const leftMargin = col === 0 ? leftMarginCol1 : leftMarginCol2;
        
        // Área útil do bilhete (descontando a reserva do lado esquerdo)
        const contentAreaX = xOffset + leftMargin;
        const usableWidth = ticketWidth - leftMargin;

        // Desenhar borda do bilhete com cantos arredondados
        pdf.setDrawColor(255, 255, 255); // Vermelho escuro
        pdf.setLineWidth(0.5);
        pdf.roundedRect(xOffset, yOffset, ticketWidth, ticketHeight, 3, 3);
        
        // Faixa superior colorida
        pdf.setFillColor(255, 255, 255); // Vermelho escuro
        pdf.rect(xOffset, yOffset, ticketWidth, 12, 'F');
        
        // Cabeçalho com título e logo
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0); // Branco
        pdf.text("VPL - Viagens Póvoa de Lanhoso", contentAreaX, yOffset + 8);

        // Adiciona o logótipo no canto direito
        pdf.addImage(logoVPL, "PNG", xOffset + ticketWidth - logoWidth - 5, yOffset + 2, logoWidth, logoHeight);

        // Número da reserva destacado
        pdf.setFillColor(245, 245, 245); // Cinza claro
        pdf.roundedRect(xOffset + ticketWidth - 40, yOffset + 14, 35, 10, 2, 2, 'F');
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0); // Vermelho escuro
        pdf.text(`Nº ${row.reserva || "----"}`, xOffset + ticketWidth - 28, yOffset + 20);

        // Seção principal com informações do bilhete
        pdf.setTextColor(80, 80, 80); // Cinza escuro
        pdf.setFontSize(9);
        
        // Criar áreas para os campos (caixas com fundo claro)
        const fieldHeight = 7;
        const fieldMargin = 3;
        
        // Campo do nome
        pdf.setFillColor(245, 245, 245);
        pdf.roundedRect(contentAreaX, yOffset + 26, usableWidth / 2 - fieldMargin, fieldHeight, 1, 1, 'F');
        
        // Campo da data
        pdf.roundedRect(contentAreaX + usableWidth / 2 + fieldMargin, yOffset + 26, usableWidth / 2 - fieldMargin * 2, fieldHeight, 1, 1, 'F');
        
        // Campo da ida
        pdf.roundedRect(contentAreaX, yOffset + 36, usableWidth / 2 - fieldMargin, fieldHeight, 1, 1, 'F');
        
        // Campo da volta
        pdf.roundedRect(contentAreaX + usableWidth / 2 + fieldMargin, yOffset + 36, usableWidth / 2 - fieldMargin * 2, fieldHeight, 1, 1, 'F');
        
        // Campo do lugar
        pdf.roundedRect(contentAreaX, yOffset + 46, usableWidth / 2 - fieldMargin, fieldHeight, 1, 1, 'F');
        
        // Campo do preço
        pdf.roundedRect(contentAreaX + usableWidth / 2 + fieldMargin, yOffset + 46, usableWidth / 2 - fieldMargin * 2, fieldHeight, 1, 1, 'F');
        
        // Títulos dos campos
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(100, 100, 100);
        
        pdf.text("NOME", contentAreaX + 2, yOffset + 30);
        pdf.text("DATA", contentAreaX + usableWidth / 2 + fieldMargin + 2, yOffset + 30);
        pdf.text("IDA", contentAreaX + 2, yOffset + 40);
        pdf.text("VOLTA", contentAreaX + usableWidth / 2 + fieldMargin + 2, yOffset + 40);
        pdf.text("LUGAR", contentAreaX + 2, yOffset + 50);
        pdf.text("PREÇO", contentAreaX + usableWidth / 2 + fieldMargin + 2, yOffset + 50);
        
        // Valores dos campos
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);
        
        const nameText = `${row.nomePassageiro} ${row.apelidoPassageiro || ""}`;
        pdf.text(nameText, contentAreaX + 15, yOffset + 30);
        pdf.text(`${datatrip ? formatDate(datatrip) : "----"}`, contentAreaX + usableWidth / 2 + fieldMargin + 15, yOffset + 30);
        pdf.text(`${row.saida || "----"}`, contentAreaX + 15, yOffset + 40);
        pdf.text(`${row.volta || "----"}`, contentAreaX + usableWidth / 2 + fieldMargin + 15, yOffset + 40);
        pdf.text(`${row.lugar || "----"}`, contentAreaX + 15, yOffset + 50);
        pdf.text(`${row.preco ? row.preco + row.moeda : "----"}`, contentAreaX + usableWidth / 2 + fieldMargin + 15, yOffset + 50);
        
        // Parte inferior do bilhete com design
        pdf.setFillColor(255, 255, 255);
        pdf.rect(xOffset, yOffset + ticketHeight - 15, ticketWidth, 15, 'F');
        
        // Rodapé do bilhete
        pdf.setFontSize(6);
        pdf.setTextColor(80, 80, 80);
        const footerText = "Linhas Regulares e Internacionais Póvoa de Lanhoso - Zurique. Licença Comunitária nº 200260 - NIF 506163016";
        const textWidth = pdf.getTextWidth(footerText);
        const centerX = xOffset + (ticketWidth / 1.8) - (textWidth / 2);
        pdf.text(footerText, centerX, yOffset + ticketHeight - 6);

    const formattedDate = formatDate(datatrip).replace(/\//g, "-");
    const fileName = `Bilhetes_Reserva_${formattedDate}.pdf`;

    if (returnPDF) {
        return pdf;
    } else {
        pdf.save(fileName);
    }
};


export default handlePrintTicket;