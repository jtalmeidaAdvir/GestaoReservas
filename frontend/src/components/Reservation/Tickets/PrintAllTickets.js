import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const handlePrintAllTickets = async (reservations, datatrip, formatDate, returnPDF = false) => {
    if (!reservations || reservations.length === 0) {
        alert("Não há reservas para baixar.");
        return;
    }

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const margin = 15;
    const ticketWidth = pageWidth - 2 * margin;
    const ticketHeight = 42;
    const maxTicketsPerPage = 6;
    let yOffset = 10;
    let ticketCount = 0;

    reservations.filter(row => row.nomePassageiro).forEach((row, index) => {
        if (ticketCount >= maxTicketsPerPage) {
            pdf.addPage();
            yOffset = 10;
            ticketCount = 0;
        }

        // Cabeçalho
        pdf.setFontSize(9);
        pdf.setTextColor(51, 51, 51);
        pdf.text("VPL - Viagens Póvoa de Lanhoso", margin + 5, yOffset + 7);
        pdf.setTextColor(211, 47, 47);
        pdf.text(`Nº Reserva: ${row.reserva || "----"}`, ticketWidth - 45, yOffset + 7);

        // Linha divisória
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin + 5, yOffset + 9, ticketWidth + margin - 5, yOffset + 9);

        // Informações do passageiro
        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Passageiro: ${row.nomePassageiro} ${row.apelidoPassageiro || ""}`, margin + 5, yOffset + 15);
        pdf.text(`Data: ${datatrip ? formatDate(datatrip) : "----"}`, ticketWidth - 45, yOffset + 15);

        pdf.text(`Ida: ${row.entrada || "----"}`, margin + 5, yOffset + 22);
        pdf.text(`Volta: ${row.volta || "----"}`, ticketWidth - 45, yOffset + 22);

        pdf.text(`Lugar: ${row.lugar || "----"}`, margin + 5, yOffset + 29);
        pdf.text(`Preço: ${row.preco ? row.preco + "€" : "----"}`, ticketWidth - 45, yOffset + 29);

        // Linha divisória
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin + 5, yOffset + 33, ticketWidth + margin - 5, yOffset + 33);

        // Rodapé do bilhete
        pdf.setFontSize(5);
        pdf.setTextColor(85, 85, 85);
        pdf.text(
            "Linhas Regulares e Internacionais Póvoa de Lanhoso - Zurique. Licença Comunitária nº 200260 - NIF 506163016",
            margin + 45,
            yOffset + 40,
            { maxWidth: ticketWidth - 10 }
        );

        yOffset += ticketHeight + 5;
        ticketCount++;
    });

    // Gerar nome do ficheiro com a data formatada
    const formattedDate = formatDate(datatrip).replace(/\//g, "-"); // Substitui barras por traços
    const fileName = `Bilhetes_Reserva_${formattedDate}.pdf`;

    if (returnPDF) {
        return pdf;
    } else {
        pdf.save(fileName);
    }
};

export default handlePrintAllTickets;
