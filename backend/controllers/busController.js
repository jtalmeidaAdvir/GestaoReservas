const { Bus, Trip } = require("../models"); // ✅ Certifica-te que Trip está importado
const { Op } = require("sequelize"); // ✅ Para usar Op.notIn

const jwt = require("jsonwebtoken");
const multer = require("multer");

// Configuração do multer para armazenar a imagem na memória
const storage = multer.memoryStorage();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
});




// Criar um novo autocarro
// Criar um novo autocarro
exports.createBus = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Token não fornecido" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const { nome, nlugares, email } = req.body;
        const imagem = req.file ? req.file.buffer : null; // Obtém o buffer da imagem

        const newBus = await Bus.create({ 
            nome, 
            nlugares: Number(nlugares), // ✅ Converte para número
            imagem, 
            isActive: true, 
            createdBy: email, 
            createdOn: new Date(), // <-- Adiciona a data de criação
            updatedOn: new Date()  // <-- Adiciona a data de atualização
        });
        

        res.status(201).json(newBus);
    } catch (error) {
        console.error("Erro ao criar autocarro:", error);
        res.status(500).json({ error: "Erro ao criar autocarro" });
    }
};



// Obter um autocarro pelo ID e retornar a imagem como base64
exports.getBusById = async (req, res) => {
    try {
        const { id } = req.params;
        const bus = await Bus.findByPk(id);

        if (!bus) return res.status(404).json({ error: "Autocarro não encontrado" });

        if (bus.imagem) {
            // Converter imagem para base64 antes de enviar
            const imageBase64 = bus.imagem.toString("base64");
            res.json({ ...bus.toJSON(), imagem: imageBase64 });
        } else {
            res.json(bus);
        }
    } catch (error) {
        console.error("Erro ao obter autocarro:", error);
        res.status(500).json({ error: "Erro ao obter autocarro" });
    }
};

// Atualizar um autocarro com nova imagem
exports.updateBus = async (req, res) => {
    try {
        console.log("🟡 Recebendo pedido de atualização para ID:", req.params.id);
        console.log("🟡 Dados recebidos:", req.body);
        console.log("🟡 Ficheiro recebido:", req.file ? "Sim" : "Não");

        const { id } = req.params;
        const { nome, nlugares, isActive } = req.body;
        const novaImagem = req.file ? req.file.buffer : null;

        const bus = await Bus.findByPk(id);
        if (!bus) {
            console.log("🔴 Autocarro não encontrado.");
            return res.status(404).json({ error: "Autocarro não encontrado" });
        }

        console.log("🟢 Autocarro encontrado:", bus);

        // Criar um objeto com os dados a atualizar
        let updateData = {
            nome,
            nlugares,
            isActive,
            updatedOn: new Date().toISOString()
        };

        // Se uma nova imagem for enviada, atualizar a imagem
        if (novaImagem) {
            updateData.imagem = novaImagem;
        }

        // Atualizar apenas os campos necessários
        await bus.update(updateData);

        console.log("✅ Autocarro atualizado com sucesso!");
        res.json({ message: "Autocarro atualizado com sucesso!", bus });
    } catch (error) {
        console.error("🔴 Erro ao atualizar autocarro:", error);
        res.status(500).json({ error: error.message || "Erro ao atualizar autocarro" });
    }
};




// 🔥 **ADICIONA ESTA FUNÇÃO PARA CORRIGIR O ERRO**
exports.getAllBuses = async (req, res) => {
    try {
        const buses = await Bus.findAll();
        res.json(buses);
    } catch (error) {
        console.error("Erro ao listar autocarros:", error);
        res.status(500).json({ error: "Erro ao listar autocarros" });
    }
};



// "Apagar" um autocarro (desativar)
exports.deleteBus = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Token não fornecido" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const { id } = req.params;
        const bus = await Bus.findByPk(id);
        if (!bus) return res.status(404).json({ error: "Autocarro não encontrado" });

        await bus.update({ 
            isActive: false, 
            updatedBy: userId, 
            updatedOn: new Date().toISOString() // ✅ Corrigido para string ISO 8601
        });

        res.json({ message: `Autocarro ${id} desativado por utilizador ${userId}` });
    } catch (error) {
        console.error("Erro ao desativar autocarro:", error);
        res.status(500).json({ error: "Erro ao desativar autocarro" });
    }
};


// Reativar um autocarro
exports.reactivateBus = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Token não fornecido" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const { id } = req.params;
        const bus = await Bus.findByPk(id);
        if (!bus) return res.status(404).json({ error: "Autocarro não encontrado" });

        await bus.update({ 
            isActive: true, 
            updatedBy: userId, 
            updatedOn: new Date().toISOString() 
        });

        res.json({ message: `Autocarro ${id} reativado por utilizador ${userId}` });
    } catch (error) {
        console.error("Erro ao reativar autocarro:", error);
        res.status(500).json({ error: "Erro ao reativar autocarro" });
    }
};


// Eliminar permanentemente um autocarro
exports.permanentDeleteBus = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Token não fornecido" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const { id } = req.params;
        const bus = await Bus.findByPk(id);
        if (!bus) return res.status(404).json({ error: "Autocarro não encontrado" });

        await bus.destroy(); // Eliminar permanentemente

        res.json({ message: `Autocarro ${id} eliminado permanentemente por utilizador ${userId}` });
    } catch (error) {
        console.error("Erro ao eliminar permanentemente autocarro:", error);
        res.status(500).json({ error: "Erro ao eliminar permanentemente autocarro" });
    }
};

exports.getAvailableBuses = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ error: "Data não fornecida" });
        }

        console.log(`🕵️ Buscando autocarros disponíveis para a data: ${date}`);

        // Buscar os IDs dos autocarros que já têm viagem nesse dia
        const usedBusIds = await Trip.findAll({
            attributes: ["busId"],
            where: { dataviagem: date }
        }).then(trips => trips.map(trip => trip.busId));

        console.log("🔍 Autocarros ocupados:", usedBusIds);

        // Buscar autocarros que NÃO estão na lista de usados
        const availableBuses = await Bus.findAll({
            where: {
                id: { [Op.notIn]: usedBusIds }
            }
        });

        console.log("✅ Autocarros disponíveis:", availableBuses.length > 0 ? availableBuses : "Nenhum disponível");

        res.json(Array.isArray(availableBuses) ? availableBuses : []);
    } catch (error) {
        console.error("❌ Erro ao buscar autocarros disponíveis:", error);
        res.status(500).json({ error: "Erro ao obter autocarro" });
    }
};




// Atualizar o autocarro de uma viagem
exports.updateTripBus = async (req, res) => {
    try {
        const { tripId } = req.params;
        const { busId } = req.body;

        const trip = await Trip.findByPk(tripId);
        if (!trip) {
            return res.status(404).json({ error: "Viagem não encontrada" });
        }

        const bus = await Bus.findByPk(busId);
        if (!bus) {
            return res.status(404).json({ error: "Autocarro não encontrado" });
        }

        await trip.update({ busId });

        console.log(`🚌 Viagem ${tripId} agora usa o autocarro ${busId}`);
        res.json({ message: "Autocarro atualizado com sucesso", trip });
    } catch (error) {
        console.error("Erro ao atualizar autocarro:", error);
        res.status(500).json({ error: "Erro ao atualizar autocarro" });
    }
};