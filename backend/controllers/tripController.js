const { Trip, Bus, Reservation, City, Country } = require("../models");
const { Op, Sequelize, fn, col, where } = require("sequelize");

const moment = require("moment");




exports.getTripsSummaryByMonth = async (req, res) => {
    console.log("📡 Rota /trips/summary-by-month foi chamada!");

    const { month } = req.query; // Espera um parâmetro no formato 'YYYY-MM'
    if (!month) {
        return res.status(400).json({ error: 'O parâmetro "month" é obrigatório no formato YYYY-MM.' });
    }

    // Define o início e o fim do mês
    const startDate = `${month}-01`;
    const endDate = moment(startDate).add(1, "month").format("YYYY-MM-DD");

    try {
        const trips = await Trip.findAll({
            attributes: [
                [literal("CAST(dataviagem AS DATE)"), "dataviagem"],
                [fn("COUNT", col("dataviagem")), "total_viagens"],
                [fn("STRING_AGG", literal("CAST(origem AS NVARCHAR) + ' - ' + CAST(destino AS NVARCHAR)"), ", "), "nomes_viagens"],
                [fn("STRING_AGG", literal("COALESCE(CAST(horapartida AS NVARCHAR), 'Sem horário')"), ", "), "horas_partida"],
                [fn("STRING_AGG", literal("COALESCE(CAST(horachegada AS NVARCHAR), 'Sem horário')"), ", "), "horas_chegada"],
                [fn("STRING_AGG", literal("CAST(id AS NVARCHAR)"), ", "), "ids_viagens"]
            ],
            where: {
                isActive: true,
                dataviagem: {
                    [Op.gte]: startDate,
                    [Op.lt]: endDate
                }
            },
            group: [literal("CAST(dataviagem AS DATE)")],
            order: [[literal("CAST(dataviagem AS DATE)"), "ASC"]]
        });

        console.log("📊 Dados das viagens do mês:", trips.map(t => t.toJSON()));
        res.json(trips);
    } catch (error) {
        console.error("❌ ERRO NO BACKEND:", error);
        res.status(500).json({ error: "Erro ao buscar resumo das viagens", details: error.message });
    }
};

// Função para formatar data/hora corretamente para MSSQL
const formatDateTimeForSQL = (dateTime) => {
    if (!dateTime) return null;
    const date = new Date(dateTime);
    return date.toISOString().slice(0, 19).replace("T", " "); // Converte para "YYYY-MM-DD HH:mm:ss"
};

// Criar uma viagem para um autocarro específico
// Criar uma viagem para um autocarro específico
exports.createTrip = async (req, res) => {
    try {
        console.log("Dados recebidos no backend:", req.body); // 🔥 Debug

        const { busId, dataViagem, origem, origemCidade, destino, destinoCidade, motorista,notas, horaPartida, horaChegada } = req.body;

        if (!dataViagem) return res.status(400).json({ error: "Data da viagem não fornecida" });

        const newTrip = await Trip.create({
            busId,
            dataviagem: dataViagem,
            origem,
            origemCidade,
            destino,
            destinoCidade,
            motorista,
            notas,
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

// Obter a quantidade de viagens por data e incluir "origem - destino" + IDs
exports.getTripsSummary = async (req, res) => {
    console.log("📡 Rota /trips/summary foi chamada!"); // 🔍 Debug

    try {
        const trips = await Trip.findAll({
            attributes: [
                [Sequelize.literal("CAST(dataviagem AS DATE)"), "dataviagem"],
                [Sequelize.fn("COUNT", Sequelize.col("dataviagem")), "total_viagens"],
                [Sequelize.fn("STRING_AGG", Sequelize.literal("CAST(origem AS NVARCHAR) + ' - ' + CAST(destino AS NVARCHAR)"), ", "), "nomes_viagens"],
                [Sequelize.fn("STRING_AGG", Sequelize.literal("COALESCE(CAST(horapartida AS NVARCHAR), 'Sem horário')"), ", "), "horas_partida"],
                [Sequelize.fn("STRING_AGG", Sequelize.literal("COALESCE(CAST(horachegada AS NVARCHAR), 'Sem horário')"), ", "), "horas_chegada"],
                [Sequelize.fn("STRING_AGG", Sequelize.literal("CAST(id AS NVARCHAR)"), ", "), "ids_viagens"]
            ],
            where: { isActive: true },
            group: [Sequelize.literal("CAST(dataviagem AS DATE)")],
            order: [[Sequelize.literal("CAST(dataviagem AS DATE)"), "ASC"]]
        });

        console.log("📊 Dados das viagens com IDs:", trips.map(t => t.toJSON())); // ✅ Debug
        res.json(trips);
    } catch (error) {
        console.error("❌ ERRO NO BACKEND:", error);
        res.status(500).json({ error: "Erro ao buscar resumo das viagens", details: error.message });
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


exports.updateTripNotas = async (req, res) => {
    try {
        const { tripId } = req.params;
        const { notas } = req.body;


        if (!notas) {
            return res.status(400).json({ error: "O campo notas é obrigatório" });
        }

        const trip = await Trip.findByPk(tripId);

        if (!trip) {
            return res.status(404).json({ error: "Viagem não encontrada" });
        }

        trip.notas = notas;
        await trip.save();


        res.json({ success: true, message: "Notas atualizadas com sucesso!" });
    } catch (error) {
        console.error("❌ Erro ao atualizar notas:", error);
        res.status(500).json({ error: "Erro ao atualizar notas" });
    }
};




// Função auxiliar para normalizar nomes (acentos + caixa)
// utils/normalize.js (se quiseres criar como utilitário)
const normalize = (str) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  

// GET /trips/return?origem=XYZ&destino=ABC&dataviagem=2025-12-25&createIfNotFound=true
exports.findOrCreateReturnTrip = async (req, res) => {
    try {
      const { origem, destino, dataviagem } = req.query;
  
      const cidadeOrigem = await City.findOne({
        where: where(fn("lower", col("City.nome")), origem.toLowerCase()),
        include: Country,
      });
  
      const cidadeDestino = await City.findOne({
        where: where(fn("lower", col("City.nome")), destino.toLowerCase()),
        include: Country,
      });
  
      if (!cidadeOrigem || !cidadeDestino) {
        return res.status(404).json({ error: "Cidades não encontradas." });
      }
  
      const paisOrigem = cidadeOrigem.Country.nome;
      const paisDestino = cidadeDestino.Country.nome;
  
      const cidadesOrigem = await City.findAll({
        include: {
          model: Country,
          where: { nome: paisDestino },
        },
      });
  
      const cidadesDestino = await City.findAll({
        include: {
          model: Country,
          where: { nome: paisOrigem },
        },
      });
  
      const nomesOrigem = cidadesOrigem.map((c) => c.nome);
      const nomesDestino = cidadesDestino.map((c) => c.nome);
  
      const viagem = await Trip.findOne({
        where: {
            origem: { [Op.in]: nomesDestino },    // Origem: cidades da Suiça
            destino: { [Op.in]: nomesOrigem },      // Destino: cidades de Portugal
            dataviagem: dataviagem
          },
          
        include: [{ model: Bus }]
      });
      
      
  
      if (!viagem) {
        return res.status(404).json({ error: "Viagem de regresso não encontrada." });
      }
  
      return res.json(viagem);
    } catch (err) {
      console.error("Erro ao procurar viagem de regresso:", err);
      return res.status(500).json({ error: "Erro interno do servidor." });
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
        const { origem, origemCidade, destino, destinoCidade, dataviagem, motorista, horaPartida, horaChegada } = req.body;

        console.log("🔍 Dados recebidos para atualização:", req.body); // Debug

        const trip = await Trip.findByPk(id);
        if (!trip) return res.status(404).json({ error: "Viagem não encontrada" });

        trip.origem = origem;
        trip.origemCidade = origemCidade;  // ✅ Novo campo
        trip.destino = destino;
        trip.destinoCidade = destinoCidade;  // ✅ Novo campo
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


exports.updateTripOrigemDestino = async (req, res) => {
    try {
        const { tripId } = req.params;
        const { origem, destino } = req.body;

        if (!origem || !destino) {
            return res.status(400).json({ error: "Os campos origem e destino são obrigatórios" });
        }

        const trip = await Trip.findByPk(tripId);

        if (!trip) {
            return res.status(404).json({ error: "Viagem não encontrada" });
        }


        trip.origem = origem || trip.origem; // Mantém o valor atual se não for fornecido
        trip.destino = destino || trip.destino; // Mantém o valor atual se não for fornecido

        await trip.save();

        res.json({ success: true, message: "Origem e destino atualizados com sucesso!" });
    } catch (error) {
        console.error("❌ Erro ao atualizar origem e destino:", error);
        res.status(500).json({ error: "Erro ao atualizar origem e destino" });
    }
};
