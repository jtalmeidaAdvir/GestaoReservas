import jsPDF from "jspdf";
import "jspdf-autotable";

const handlePrintList = async (
    reservations,
    origemCidade,
    destinoCidade,
    datatrip,
    busName,
    motorista,
    entrySummary,
    closeSummary,
    formatDate,
    PriceCounts,
    returnPDF = false
) => {
    if (!reservations || reservations.length === 0) {
        alert("Não há reservas para baixar.");
        return;
    }

    const formattedDate = formatDate(datatrip).replace(/\//g, "-");

    // Função auxiliar para obter código base da reserva
    const getBaseReserva = reserva => reserva?.split(".")[0] || reserva;

    // Agrupar reservas por código base
    const groupedReservations = {};
    reservations
        .filter(row => row.nomePassageiro)
        .forEach(row => {
            const base = getBaseReserva(row.reserva);
            if (!groupedReservations[base]) groupedReservations[base] = [];
            groupedReservations[base].push(row);
        });

    // === PDF COM PREÇOS ===
    const pdfComPreco = new jsPDF("p", "mm", "a4");

    pdfComPreco.setFontSize(14);
    pdfComPreco.text(`${origemCidade} -> ${destinoCidade}`, 105, 15, { align: "center" });

    pdfComPreco.setFontSize(10);
    pdfComPreco.text(
        `Data: ${formatDate(datatrip)} | Autocarro: ${busName} | Motorista: ${motorista}`,
        60,
        25
    );

    let startY = 40;
    pdfComPreco.autoTable({
        startY,
        head: [["Resumo das Entradas", "Resumo das Saídas", "Resumo Preços"]],
        body: [
            [
                Object.entries(entrySummary).map(([entrada, count]) => `${entrada}: ${count} passageiros`).join("\n") || "Nenhuma entrada",
                Object.entries(closeSummary).map(([saida, count]) => `${saida}: ${count} passageiros`).join("\n") || "Nenhuma saída",
                Object.entries(PriceCounts).map(([priceKey, count]) => `${priceKey}: ${count} passageiros`).join("\n") || "Nenhum preço registrado"
            ]
        ],
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [200, 0, 0] },
    });

    startY = pdfComPreco.lastAutoTable.finalY + 10;
    pdfComPreco.setFontSize(12);
    pdfComPreco.text("Listagem de Passageiros", 85, startY);
    startY += 5;

    const passengerBody = [];
    Object.entries(groupedReservations).forEach(([base, group]) => {
        let totalGrupo = 0;
        const hasMultiplePassengers = group.length > 1;
    
        group.forEach((row, idx) => {
            const preco = parseFloat(row.preco) || 0;
            totalGrupo += preco;
    
            const linha = [
                row.lugar || "----",
                preco ? `${preco}` : "----",
                hasMultiplePassengers && idx > 0 ? "*" : (row.reserva || "----"),
                row.entrada || "----",
                row.saida || "----",
                row.volta || "----",
                `${row.apelidoPassageiro || ""}, ${row.nomePassageiro || ""}`,
                row.telefone || "----",
                row.carro || "----"
            ];
    
            // Se for parte de um grupo, aplicar estilo à linha toda
            if (hasMultiplePassengers) {
                passengerBody.push(
                    linha.map(cell => ({
                        content: cell,
                        styles: { fillColor: [245, 245, 245] } // tom pastel suave
                    }))
                );
            } else {
                passengerBody.push(linha); // reserva individual normal
            }
        });
    
        if (hasMultiplePassengers) {
            passengerBody.push([
                {
                    content: `Subtotal   ${ totalGrupo}`,
                    colSpan: 9,
                    styles: { fontStyle: 'bold', fillColor: [245, 245, 245],halign: 'right'}
                }
            ]);
        }
    });
    
    
    

    pdfComPreco.autoTable({
        startY,
        head: [["Lugar", "Preço", "Reserva", "Entrada", "Saída", "Volta", "Nome", "Telefone", "Carro"]],
        body: passengerBody,
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 3 },
        headStyles: { fillColor: [200, 0, 0] },
    });

    const fileNameComPreco = `Lista_${origemCidade}_para_${destinoCidade}_${formattedDate}.pdf`;
    pdfComPreco.save(fileNameComPreco);

    // === PDF SEM PREÇOS ===
    const pdfSemPreco = new jsPDF("p", "mm", "a4");

    pdfSemPreco.setFontSize(14);
    pdfSemPreco.text(`${origemCidade} -> ${destinoCidade}`, 105, 15, { align: "center" });

    pdfSemPreco.setFontSize(10);
    pdfSemPreco.text(
        `Data: ${formatDate(datatrip)} | Autocarro: ${busName} | Motorista: ${motorista}`,
        60,
        25
    );

    startY = 40;
    pdfSemPreco.autoTable({
        startY,
        head: [["Resumo das Entradas", "Resumo das Saídas"]],
        body: [
            [
                Object.entries(entrySummary).map(([entrada, count]) => `${entrada}: ${count} passageiros`).join("\n") || "Nenhuma entrada",
                Object.entries(closeSummary).map(([saida, count]) => `${saida}: ${count} passageiros`).join("\n") || "Nenhuma saída"
            ]
        ],
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [200, 0, 0] },
    });

    startY = pdfSemPreco.lastAutoTable.finalY + 10;
    pdfSemPreco.setFontSize(12);
    pdfSemPreco.text("Listagem de Passageiros", 85, startY);
    startY += 5;

    const passengerBodySemPreco = [];
    Object.entries(groupedReservations).forEach(([base, group]) => {
        group.forEach((row, idx) => {
            passengerBodySemPreco.push([
                row.lugar || "----",
                idx === 0 ? row.reserva || "----" : "*",
                row.entrada || "----",
                row.saida || "----",
                row.volta || "----",
                `${row.apelidoPassageiro || ""}, ${row.nomePassageiro || ""}`,
                row.telefone || "----",
                row.carro || "----"
            ]);
        });

    
    });

    pdfSemPreco.autoTable({
        startY,
        head: [["Lugar", "Reserva", "Entrada", "Saída", "Volta", "Nome", "Telefone", "Carro"]],
        body: passengerBodySemPreco,
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 3 },
        headStyles: { fillColor: [200, 0, 0] },
    });

    const fileNameSemPreco = `Lista_${origemCidade}_para_${destinoCidade}_${formattedDate}_SemPrecos.pdf`;
    pdfSemPreco.save(fileNameSemPreco);
};

export default handlePrintList;
