import jsPDF from "jspdf";
import logoVPL from "../../../assets/logo.png"; // Caminho para o logo dentro do projeto

const handlePrintTicket = (row, datatrip, formatDate, returnPDF = false) => {
    if (!row || !row.nomePassageiro) {
        alert("Informações da reserva inválidas.");
        return;
    }

    const pdf = new jsPDF("l", "mm", "a4");

    const margin = 5;
    const ticketWidth = 135;
    const ticketHeight = 65;
    const logoWidth = 25;
    const logoHeight = 10;
    let xOffset = margin;
    let yOffset = margin;

    // Cabeçalho em negrito
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text("VPL - Viagens Póvoa de Lanhoso", xOffset + 5, yOffset + 10);

    // Adiciona o logótipo no canto direito
    pdf.addImage(logoVPL, "PNG", xOffset + ticketWidth - logoWidth - 5, yOffset + 2, logoWidth, logoHeight);

    pdf.setTextColor(0, 0, 0);
    pdf.text(`Nº  ${row.reserva || "----"}`, xOffset + ticketWidth / 1.2, yOffset + 30);

    // Linha divisória
    pdf.setDrawColor(200, 200, 200);
    pdf.line(xOffset + 5, yOffset + 14, xOffset + ticketWidth - 5, yOffset + 14);

    // Informações do passageiro com títulos em negrito
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);
    
    pdf.setFont("helvetica", "bold");
    pdf.text("Nome:", xOffset + 5, yOffset + 22);
    pdf.text("Data:", xOffset + ticketWidth / 2, yOffset + 22);
    pdf.text("Ida:", xOffset + 5, yOffset + 30);
    pdf.text("Volta:", xOffset + ticketWidth / 2, yOffset + 30);
    pdf.text("Lugar:", xOffset + 5, yOffset + 38);
    pdf.text("Preço:", xOffset + ticketWidth / 2, yOffset + 38);
    
    pdf.setFont("helvetica", "normal");
    pdf.text(`${row.nomePassageiro} ${row.apelidoPassageiro || ""}`, xOffset + 20, yOffset + 22);
    pdf.text(`${datatrip ? formatDate(datatrip) : "----"}`, xOffset + ticketWidth / 2 + 15, yOffset + 22);
    pdf.text(`${row.entrada || "----"}`, xOffset + 20, yOffset + 30);
    pdf.text(`${row.volta || "----"}`, xOffset + ticketWidth / 2 + 15, yOffset + 30);
    pdf.text(`${row.lugar || "----"}`, xOffset + 20, yOffset + 38);
    pdf.text(`${row.preco ? row.preco + row.moeda : "----"}`, xOffset + ticketWidth / 2 + 15, yOffset + 38);
    
    // Linha divisória inferior
    pdf.setDrawColor(200, 200, 200);
    pdf.line(xOffset + 5, yOffset + 45, xOffset + ticketWidth - 5, yOffset + 45);

    // Rodapé do bilhete
    pdf.setFontSize(6);
    pdf.setTextColor(85, 85, 85);
    const footerText = "Linhas Regulares e Internacionais Póvoa de Lanhoso - Zurique. Licença Comunitária nº 200260 - NIF 506163016";
    const textWidth = pdf.getTextWidth(footerText);
    const centerX = xOffset + (ticketWidth / 2) - (textWidth / 2);
    pdf.text(footerText, centerX, yOffset + ticketHeight - 15);

    const formattedDate = formatDate(datatrip).replace(/\//g, "-");
    const fileName = `Bilhete_Reserva_${formattedDate}.pdf`;

    if (returnPDF) {
        return pdf;
    } else {
        pdf.save(fileName);
    }
};

export default handlePrintTicket;