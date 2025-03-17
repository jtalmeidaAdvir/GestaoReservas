const { City, Country } = require("../models");
const jwt = require("jsonwebtoken");

exports.createCity = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Token não fornecido" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { nome, countryId } = req.body;

        const country = await Country.findByPk(countryId);
        if (!country) return res.status(404).json({ error: "País não encontrado" });

        const newCity = await City.create({ nome, countryId, createdBy: decoded.id });

        res.status(201).json(newCity);
    } catch (error) {
        console.error("Erro ao criar cidade:", error);
        res.status(500).json({ error: "Erro ao criar cidade" });
    }
};

exports.getAllCities = async (req, res) => {
    try {
        const cities = await City.findAll({ include: { model: Country, attributes: ["nome"] } });
        res.json(cities);
    } catch (error) {
        console.error("Erro ao listar cidades:", error);
        res.status(500).json({ error: "Erro ao listar cidades" });
    }
};

exports.updateCity = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, countryId, isActive } = req.body;

        const city = await City.findByPk(id);
        if (!city) return res.status(404).json({ error: "Cidade não encontrada" });

        // Se countryId for enviado, valida o país
        if (countryId !== undefined) {
            const country = await Country.findByPk(countryId);
            if (!country) return res.status(404).json({ error: "País não encontrado" });
        }

        await city.update({
            nome: nome !== undefined ? nome : city.nome,
            countryId: countryId !== undefined ? countryId : city.countryId,
            isActive: isActive !== undefined ? isActive : city.isActive,
            updatedOn: new Date().toISOString()
        });

        res.json({ message: "Cidade atualizada com sucesso!", city });
    } catch (error) {
        console.error("Erro ao atualizar cidade:", error);
        res.status(500).json({ error: "Erro ao atualizar cidade" });
    }
};


exports.deleteCity = async (req, res) => {
    try {
        const { id } = req.params;
        const city = await City.findByPk(id);
        if (!city) return res.status(404).json({ error: "Cidade não encontrada" });

        // Elimina o registo permanentemente da base de dados
        await city.destroy();

        res.json({ message: `Cidade ${id} eliminada permanentemente` });
    } catch (error) {
        console.error("Erro ao eliminar cidade:", error);
        res.status(500).json({ error: "Erro ao eliminar cidade" });
    }
};




exports.getCityById = async (req, res) => {
    try {
        const { id } = req.params;
        const city = await City.findByPk(id);
        if (!city) return res.status(404).json({ error: "Cidade não encontrada" });
        res.json(city);
    } catch (error) {
        console.error("Erro ao buscar a cidade:", error);
        res.status(500).json({ error: "Erro ao buscar a cidade" });
    }
};
