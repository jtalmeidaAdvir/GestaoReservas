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
    tripNotas, // <--- adiciona este parâmetro
    returnPDF = false
) => {
    if (!reservations || reservations.length === 0) {
        alert("Não há reservas para baixar.");
        return;
    }

    const formattedDate = formatDate(datatrip).replace(/\//g, "-");

    const getBaseReserva = reserva => reserva?.split(".")[0] || reserva;

    const groupedReservations = {};
    reservations
        .filter(row => row.nomePassageiro)
        .forEach(row => {
            const base = getBaseReserva(row.reserva);
            if (!groupedReservations[base]) groupedReservations[base] = [];
            groupedReservations[base].push(row);
        });

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

    let afterResumoY = pdfComPreco.lastAutoTable.finalY;

    if (tripNotas && tripNotas.trim() !== "") {
        pdfComPreco.setFontSize(10);
        pdfComPreco.text("Notas da Viagem:", 14, afterResumoY + 8);
    
        pdfComPreco.setFontSize(9);
        const splitNotas = pdfComPreco.splitTextToSize(tripNotas, 180);
        const alturaNotas = splitNotas.length * 5;
        const notasY = afterResumoY + 13;
        
        // Se o conteúdo das notas ultrapassar a página, cria nova página
        if (notasY + alturaNotas > 280) { // margem inferior de segurança
            pdfComPreco.addPage();
            pdfComPreco.setFontSize(10);
            pdfComPreco.text("Notas da Viagem:", 14, 20);
            pdfComPreco.setFontSize(9);
            pdfComPreco.text(splitNotas, 14, 25);
            afterResumoY = 25 + alturaNotas;
        } else {
            pdfComPreco.setFontSize(10);
            pdfComPreco.text("Notas da Viagem:", 14, notasY - 5);
            pdfComPreco.setFontSize(9);
            pdfComPreco.text(splitNotas, 14, notasY);
            afterResumoY = notasY + alturaNotas;
        }
    }        
    
   // Usa o Y correto depois das notas
let startYListagem = afterResumoY + 10;

// ⚠️ Usa esta linha!
startY = startYListagem;

pdfComPreco.setFontSize(12);
pdfComPreco.text("Listagem de Passageiros", 85, startY);
startY += 5;


    const passengerBody = [];
    Object.entries(groupedReservations).forEach(([base, group]) => {
        const hasMultiplePassengers = group.length > 1;

        group.forEach((row, idx) => {


            const baseReserva = getBaseReserva(row.reserva);
            const precoBase = parseFloat(row.preco) || 0;
            const valorCarro = parseFloat(row.valorCarro) || 0;
            const valorVolume = parseFloat(row.valorVolume) || 0;
            const precoTotal = precoBase + valorCarro + valorVolume;
            
            const linha = [
                row.lugar || "----",
                precoTotal ? `${precoTotal} ${row.moeda || ""}` : "----",

                hasMultiplePassengers && idx > 0 ? `*${baseReserva}` : (row.reserva || "----"),
                row.entrada || "----",
                row.saida || "----",
                row.volta || "----",
                `${row.apelidoPassageiro || ""}, ${row.nomePassageiro || ""}`,
                row.telefone || "----",
                row.carro || "----",
                row.obs || "----"
            ];
            


            if (hasMultiplePassengers) {
                passengerBody.push(
                    linha.map(cell => ({
                        content: cell,
                        styles: { fillColor: [255, 255, 255] }
                    }))
                );
            } else {
                passengerBody.push(linha);
            }
        });
    });

    pdfComPreco.autoTable({
        startY,
        head: [["Lugar", "Preço", "Reserva", "Entrada", "Saída", "Volta", "Nome", "Telefone", "Carro", "OBS"]],
        body: passengerBody,
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 3 },
        headStyles: { fillColor: [200, 0, 0] },
    });

    const fileNameComPreco = `Lista_${origemCidade}_para_${destinoCidade}_${formattedDate}.pdf`;
    pdfComPreco.save(fileNameComPreco);




    const pdfNomes = new jsPDF("p", "mm", "a4");

    pdfNomes.setFontSize(14);
    pdfNomes.text(`${origemCidade} -> ${destinoCidade}`, 105, 15, { align: "center" });
    
    pdfNomes.setFontSize(10);
    pdfNomes.text(
        `Data: ${formatDate(datatrip)} | Autocarro: ${busName} | Motorista: ${motorista}`,
        60,
        25
    );
    
    pdfNomes.setFontSize(12);
    pdfNomes.text("Listagem Passageiros", 85, 35);
    
    // === Preparar nomes ===
    const nomesLista = [];
    Object.entries(groupedReservations).forEach(([_, group]) => {
        group.forEach(row => {
            nomesLista.push(`${row.nomePassageiro || ""} ${row.apelidoPassageiro || ""}`);
        });
    });
    
    // === Parâmetros para layout manual ===
    const col1X = 20;
    const col2X = 110;
    startY = 45;
    const lineHeight = 5;
    const maxLines = 45;
    
    pdfNomes.setFontSize(9);
    
    // Escrever os nomes em duas colunas
    for (let i = 0; i < nomesLista.length; i++) {
        const y = startY + (i % maxLines) * lineHeight;
        const x = i < maxLines ? col1X : col2X;
        pdfNomes.text(nomesLista[i], x, y);
    }
    
    const fileNameNomes = `Lista_${origemCidade}_para_${destinoCidade}_${formattedDate}_Nomes.pdf`;
    pdfNomes.save(fileNameNomes);
    





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
    idx === 0 ? (row.reserva || "----") : `*${getBaseReserva(row.reserva)}`,

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

    const fileNameSemPreco = `Listagem Carregamento ${origemCidade}_para_${destinoCidade}_${formattedDate}.pdf`;
    pdfSemPreco.save(fileNameSemPreco);
};

export default handlePrintList;
