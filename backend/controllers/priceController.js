// controllers/priceController.js
const { Price, Country } = require("../models");




exports.createPrice = async (req, res) => {
    try {
        const { valor, descricao, countryId } = req.body;

        const country = await Country.findByPk(countryId);
        if (!country) return res.status(404).json({ message: "País não encontrado." });

        const price = await Price.create({
            valor,
            descricao,
            countryId
        });

        res.status(201).json(price);
    } catch (error) {
        console.error("❌ ERRO AO CRIAR PREÇO:", error);
        res.status(500).json({ message: "Erro ao criar preço", error: error.message });
    }
};



// controllers/priceController.js

exports.getAllPrices = async (req, res) => {
    try {
        const prices = await Price.findAll({
            include: [
                {
                    model: Country,
                    as: "Country"
                }
            ]
        });
        res.status(200).json(prices);
    } catch (error) {
        console.error("Erro ao listar preços:", error); // 👈 vê isto no terminal
        res.status(500).json({ message: "Erro ao listar preços", error: error.message });
    }
};


exports.getPriceById = async (req, res) => {
    try {
        const price = await Price.findByPk(req.params.id, { include: { model: Country, as: "Country" } });
        if (!price) return res.status(404).json({ message: "Preço não encontrado." });

        res.status(200).json(price);
    } catch (error) {
        res.status(500).json({ message: "Erro ao obter preço", error: error.message });
    }
};

exports.updatePrice = async (req, res) => {
    try {
        const price = await Price.findByPk(req.params.id);
        if (!price) return res.status(404).json({ message: "Preço não encontrado." });

        const { valor, descricao, isActive, updatedBy } = req.body;

        await price.update({
            valor: valor ?? price.valor,
            descricao: descricao ?? price.descricao,
            isActive: isActive ?? price.isActive,
        });

        res.status(200).json(price);
    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar preço", error: error.message });
    }
};

exports.deletePrice = async (req, res) => {
    try {
        const price = await Price.findByPk(req.params.id);
        if (!price) return res.status(404).json({ message: "Preço não encontrado." });

        await price.destroy();
        res.status(200).json({ message: "Preço eliminado com sucesso." });
    } catch (error) {
        res.status(500).json({ message: "Erro ao eliminar preço", error: error.message });
    }
};
