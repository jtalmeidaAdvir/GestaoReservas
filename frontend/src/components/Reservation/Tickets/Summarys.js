// Função para calcular o resumo das entradas
export const calculateEntrySummary = (reservations) => {
    return reservations.reduce((acc, res) => {
        if (res.entrada) {
            acc[res.entrada] = (acc[res.entrada] || 0) + 1;
        }
        return acc;
    }, {});
};

// Função para calcular o resumo das saídas
export const calculateCloseSummary = (reservations) => {
    return reservations.reduce((acc, res) => {
        if (res.saida) {
            acc[res.saida] = (acc[res.saida] || 0) + 1;
        }
        return acc;
    }, {});
};

// Função para calcular o preço total por moeda
export const calculatePrecoTotal = (reservations) => {
    return reservations.reduce((acc, res) => {
        if (res.preco && res.moeda) {
            acc[res.moeda] = (acc[res.moeda] || 0) + parseFloat(res.preco);
        }
        return acc;
    }, {});
};

// Função para contar quantas pessoas têm cada preço
export const calculatePriceCounts = (reservations) => {
    return reservations.reduce((acc, res) => {
        if (res.preco) {
            const priceKey = res.preco;
            acc[priceKey] = (acc[priceKey] || 0) + 1;
        }
        return acc;
    }, {});
};
