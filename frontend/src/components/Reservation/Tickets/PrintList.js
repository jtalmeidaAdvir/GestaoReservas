import jsPDF from "jspdf";
import "jspdf-autotable";

const handlePrintList = async (reservations, origemCidade, destinoCidade, datatrip, busName, motorista, entrySummary, closeSummary, formatDate, PriceCounts, returnPDF = false) => {
    if (!reservations || reservations.length === 0) {
        alert("Não há reservas para baixar.");
        return;
    }

    // Criar PDF
    const pdf = new jsPDF("p", "mm", "a4");

    // Título da viagem
    pdf.setFontSize(14);
    pdf.text(`${origemCidade} -> ${destinoCidade}`, 105, 15, { align: "center" });

    pdf.setFontSize(10);
    pdf.text(`Data: ${formatDate(datatrip)} | Autocarro: ${busName} | Motorista: ${motorista}`, 60, 25);

    // Resumo das entradas, saídas e preços
    let startY = 40;
    pdf.autoTable({
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
        headStyles: { fillColor: [200, 0, 0] }, // Vermelho escuro para cabeçalhos
    });

    // Definir posição inicial da tabela de passageiros
    startY = pdf.lastAutoTable.finalY + 10;

    pdf.setFontSize(12);
    pdf.text("Listagem de Passageiros", 85, startY);
    startY += 5;

    // Criar tabela dos passageiros
    pdf.autoTable({
        startY,
        head: [["Lugar", "Preço", "Reserva", "Entrada", "Saída", "Volta", "Nome", "Telefone", "Carro"]],
        body: reservations
            .filter(row => row.nomePassageiro)
            .map(row => [
                row.lugar || "----",
                row.preco ? row.preco + "€" : "----",
                row.reserva || "----",
                row.entrada || "----",
                row.saida || "----",
                row.volta || "----",
                `${row.apelidoPassageiro || ""}, ${row.nomePassageiro || ""}`,
                row.telefone || "----",
                row.carro || "----"
            ]),
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [200, 0, 0] }, // Vermelho escuro para cabeçalhos
    });

    // Gerar nome do ficheiro com data, origem e destino
    const formattedDate = formatDate(datatrip).replace(/\//g, "-"); // Substitui barras por traços para evitar problemas no nome do ficheiro
    const fileName = `Lista_${origemCidade}_para_${destinoCidade}_${formattedDate}.pdf`;

    // Verificar se deve retornar o PDF ou fazer download
    if (returnPDF) {
        return pdf; // 🚀 Retorna o PDF para envio por email
    } else {
        pdf.save(fileName); // 🔽 Faz download no frontend com o novo nome
    }
};

export default handlePrintList;
