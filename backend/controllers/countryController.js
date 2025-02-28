const { Country } = require("../models");
const jwt = require("jsonwebtoken");

exports.createCountry = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Token não fornecido" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { nome, codigo } = req.body;

        const newCountry = await Country.create({ 
            nome, 
            codigo, 
            createdBy: decoded.id 
        });

        res.status(201).json(newCountry);
    } catch (error) {
        console.error("Erro ao criar país:", error);
        res.status(500).json({ error: "Erro ao criar país" });
    }
};

exports.getAllCountries = async (req, res) => {
    try {
        const countries = await Country.findAll();
        res.json(countries);
    } catch (error) {
        console.error("Erro ao listar países:", error);
        res.status(500).json({ error: "Erro ao listar países" });
    }
};

exports.updateCountry = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, codigo, isActive } = req.body;

        const country = await Country.findByPk(id);
        if (!country) return res.status(404).json({ error: "País não encontrado" });

        await country.update({ nome, codigo, isActive, updatedOn: new Date().toISOString() });

        res.json({ message: "País atualizado com sucesso!", country });
    } catch (error) {
        console.error("Erro ao atualizar país:", error);
        res.status(500).json({ error: "Erro ao atualizar país" });
    }
};

exports.deleteCountry = async (req, res) => {
    try {
        const { id } = req.params;
        const country = await Country.findByPk(id);
        if (!country) return res.status(404).json({ error: "País não encontrado" });

        await country.update({ isActive: false, updatedOn: new Date().toISOString() });

        res.json({ message: `País ${id} desativado` });
    } catch (error) {
        console.error("Erro ao desativar país:", error);
        res.status(500).json({ error: "Erro ao desativar país" });
    }
};
