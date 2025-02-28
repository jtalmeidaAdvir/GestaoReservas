const { Trip, Bus, Reservation } = require("../models");
const {Op, Sequelize} = require("sequelize")



// Função para formatar data/hora corretamente para MSSQL
const formatDateTimeForSQL = (dateTime) => {
    if (!dateTime) return null;
    const date = new Date(dateTime);
    return date.toISOString().slice(0, 19).replace("T", " "); // Converte para "YYYY-MM-DD HH:mm:ss"
};

// Criar uma viagem para um autocarro específico
exports.createTrip = async (req, res) => {
    try {
        console.log("Dados recebidos no backend:", req.body); // 🔥 Debug

        const { busId, dataViagem, origem, destino,motorista, horaPartida, horaChegada } = req.body;

        if (!dataViagem) return res.status(400).json({ error: "Data da viagem não fornecida" });

        // Verificar se o autocarro já tem uma viagem nesse dia
        const existingTrip = await Trip.findOne({
            where: {
                busId,
                dataviagem: dataViagem
            }
        });

        if (existingTrip) {
            return res.status(400).json({ error: "Este autocarro já tem uma viagem registada neste dia." });
        }

        // Criar nova viagem
        const newTrip = await Trip.create({
            busId,
            dataviagem: dataViagem, // ✅ Armazena a data corretamente
            origem,
            destino,
            motorista,
            horaPartida,
            horaChegada
        });

        res.status(201).json(newTrip);
    } catch (error) {
        console.error("Erro ao criar viagem:", error);
        res.status(500).json({ error: "Erro ao criar viagem" });
    }
};

// Obter todas as viagens
exports.getAllTrips = async (req, res) => {
    try {
        const trips = await Trip.findAll({ include: Bus });
        res.json(trips);
    } catch (error) {
        console.error("Erro ao listar viagens:", error);
        res.status(500).json({ error: "Erro ao listar viagens" });
    }
};



// Obter uma viagem pelo ID
exports.getTripById = async (req, res) => {
    try {
        const { id } = req.params;
        const trip = await Trip.findByPk(id, { include: Bus });

        if (!trip) return res.status(404).json({ error: "Viagem não encontrada" });

        res.json(trip);
    } catch (error) {
        console.error("Erro ao obter viagem:", error);
        res.status(500).json({ error: "Erro ao obter viagem" });
    }
};


exports.getTripsByDate = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ error: "Data não fornecida" });


        const trips = await Trip.findAll({
            where: {
                isActive: true , // ✅ Apenas viagens ativas
                dataviagem: {
                    
                    [Op.eq]: date // ✅ Comparando corretamente como STRING
                }
            },
            include: Bus
        });


        res.json(trips);
    } catch (error) {
        console.error("Erro ao buscar viagens:", error);
        res.status(500).json({ error: "Erro ao buscar viagens" });
    }
};

exports.getTripsDates = async (req, res) => {
    try {
        const trips = await Trip.findAll({
            attributes: ["dataviagem"], // ✅ Buscar apenas as datas das viagens
            group: ["dataviagem"] // ✅ Remover duplicados (se houver várias viagens no mesmo dia)
        });

        res.json(trips);
    } catch (error) {
        console.error("Erro ao buscar datas das viagens:", error);
        res.status(500).json({ error: "Erro ao buscar datas das viagens" });
    }
};


exports.getTripWithBus = async (req, res) => {
    try {
        const { tripId } = req.params;

        const trip = await Trip.findByPk(tripId, {
            include: Bus
        });

        if (!trip) {
            return res.status(404).json({ error: "Viagem não encontrada" });
        }

        const reservations = await Reservation.findAll({
            where: { tripId }
        });

        res.json({ trip, reservations });
    } catch (error) {
        console.error("Erro ao buscar viagem:", error);
        res.status(500).json({ error: "Erro ao buscar viagem" });
    }
};


// Obter a quantidade de viagens por data e incluir "origem - destino"
exports.getTripsSummary = async (req, res) => {
    console.log("📡 Rota /trips/summary foi chamada!"); // 🔍 Debug
    try {
        const trips = await Trip.findAll({
            attributes: [
                [Sequelize.literal("CAST(dataviagem AS DATE)"), "dataviagem"],
                [Sequelize.fn("COUNT", Sequelize.col("dataviagem")), "total_viagens"],
                [Sequelize.fn("STRING_AGG", Sequelize.literal("origem + ' - ' + destino"), "', '"), "nomes_viagens"],
                [Sequelize.fn("STRING_AGG", Sequelize.literal("CONVERT(NVARCHAR, horapartida, 108)"), "', '"), "horas_partida"],
                [Sequelize.fn("STRING_AGG", Sequelize.literal("CONVERT(NVARCHAR, horachegada, 108)"), "', '"), "horas_chegada"]
            ],
            where: { isActive: true }, // ✅ Apenas viagens ativas
            group: [Sequelize.literal("CAST(dataviagem AS DATE)")],
            order: [[Sequelize.literal("CAST(dataviagem AS DATE)"), "ASC"]]
        });

        console.log("📊 Dados das viagens:", trips.map(t => t.toJSON())); // ✅ Debug
        res.json(trips);
    } catch (error) {
        console.error("❌ Erro ao buscar resumo das viagens:", error);
        res.status(500).json({ error: "Erro ao buscar resumo das viagens" });
    }
};




exports.updateTripMotorista = async (req, res) => {
    try {
        const { tripId } = req.params;
        const { motorista } = req.body;


        if (!motorista) {
            return res.status(400).json({ error: "O campo motorista é obrigatório" });
        }

        const trip = await Trip.findByPk(tripId);

        if (!trip) {
            return res.status(404).json({ error: "Viagem não encontrada" });
        }

        trip.motorista = motorista;
        await trip.save();


        res.json({ success: true, message: "Motorista atualizado com sucesso!" });
    } catch (error) {
        console.error("❌ Erro ao atualizar motorista:", error);
        res.status(500).json({ error: "Erro ao atualizar motorista" });
    }
};



// GET /trips/return?origem=XYZ&destino=ABC&dataviagem=2025-12-25&createIfNotFound=true
exports.findOrCreateReturnTrip = async (req, res) => {
    try {
        const { origem, destino, dataviagem, createIfNotFound } = req.query;

        // Tentar encontrar a viagem
        const tripRegresso = await Trip.findOne({
            where: { origem, destino, dataviagem }
        });

        if (tripRegresso) {
            // Se existir, devolve
            return res.json(tripRegresso);
        }

        // Se não existir e vier "createIfNotFound=true", criamos
        if (createIfNotFound === "true") {
            const newTrip = await Trip.create({
                origem,
                destino,
                dataviagem
                // Podes preencher outras colunas, se tiveres
            });
            return res.json(newTrip);
        }

        // Caso não encontre e não se queira criar automaticamente, devolve 404
        return res.status(404).json({ error: "Viagem de regresso não encontrada." });
    } catch (error) {
        console.error("🔥 Erro ao procurar/criar viagem de regresso:", error);
        return res.status(500).json({ error: "Erro interno do servidor" });
    }
};


exports.disableTrip = async (req, res) => {
    try {
        const { id } = req.params;
        const trip = await Trip.findByPk(id);

        if (!trip) return res.status(404).json({ error: "Viagem não encontrada" });

        trip.isActive = false;
        await trip.save();

        res.json({ message: "Viagem desativada com sucesso." });
    } catch (error) {
        console.error("Erro ao desativar viagem:", error);
        res.status(500).json({ error: "Erro ao desativar viagem." });
    }
};


exports.reactivateTrip = async (req, res) => {
    try {
        const { id } = req.params;
        const trip = await Trip.findByPk(id);

        if (!trip) return res.status(404).json({ error: "Viagem não encontrada" });

        trip.isActive = true;
        await trip.save();

        res.json({ message: "Viagem reativada com sucesso." });
    } catch (error) {
        console.error("Erro ao reativar viagem:", error);
        res.status(500).json({ error: "Erro ao reativar viagem." });
    }
};


exports.deleteTripPermanently = async (req, res) => {
    try {
        const { id } = req.params;
        const trip = await Trip.findByPk(id);

        if (!trip) return res.status(404).json({ error: "Viagem não encontrada" });

        await trip.destroy();
        res.json({ message: "Viagem eliminada permanentemente." });
    } catch (error) {
        console.error("Erro ao eliminar viagem:", error);
        res.status(500).json({ error: "Erro ao eliminar viagem." });
    }
};

exports.updateTrip = async (req, res) => {
    try {
        const { id } = req.params;
        const { origem, destino, dataviagem, motorista, horaPartida, horaChegada } = req.body;

        console.log("🔍 Dados recebidos para atualização:", req.body); // Debug

        const trip = await Trip.findByPk(id);
        if (!trip) return res.status(404).json({ error: "Viagem não encontrada" });

        trip.origem = origem;
        trip.destino = destino;
        trip.dataviagem = dataviagem;
        trip.motorista = motorista;
        trip.horaPartida = formatDateTimeForSQL(horaPartida);
        trip.horaChegada = formatDateTimeForSQL(horaChegada);

        await trip.save();

        res.json({ message: "Viagem atualizada com sucesso!", trip });
    } catch (error) {
        console.error("❌ Erro ao atualizar viagem:", error);
        res.status(500).json({ error: "Erro ao atualizar viagem." });
    }
};

// Obter os lugares disponíveis para uma viagem específica
exports.getAvailableSeats = async (req, res) => {
    try {
        const { tripId } = req.params;

        // Verificar se a viagem existe
        const trip = await Trip.findByPk(tripId, {
            include: Bus
        });

        if (!trip) {
            return res.status(404).json({ error: "Viagem não encontrada" });
        }

        // Obter todas as reservas feitas para esta viagem
        const reservations = await Reservation.findAll({
            where: { tripId }
        });

        // Criar um array com todos os lugares do autocarro
        const totalLugares = trip.Bus ? trip.Bus.nlugares : 0;
        const lugaresOcupados = reservations.map(res => res.lugar);
        const lugaresDisponiveis = Array.from({ length: totalLugares }, (_, i) => i + 1)
            .filter(lugar => !lugaresOcupados.includes(lugar));

        res.json(lugaresDisponiveis);
    } catch (error) {
        console.error("❌ Erro ao buscar lugares disponíveis:", error);
        res.status(500).json({ error: "Erro ao buscar lugares disponíveis" });
    }
};
