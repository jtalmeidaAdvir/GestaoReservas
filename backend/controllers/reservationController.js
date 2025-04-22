const { Reservation, Trip, Bus, BlackList,sequelize } = require("../models");
const { Op, Sequelize } = require("sequelize");

let io; // Variável global para armazenar io

exports.setSocketIO = (socketIo) => {
    io = socketIo;
};



// Buscar a última reserva para obter o maior número já usado
exports.getLastReservation = async (req, res) => {
    try {
        const lastReservation = await Reservation.findOne({
            order: [["reserva", "DESC"]], 
        });

        const lastReservaNumber = lastReservation ? parseInt(lastReservation.reserva, 10) : 0;
        res.json({ reserva: String(lastReservaNumber).padStart(4, "0") });
    } catch (error) {
        console.error("🔥 Erro ao buscar última reserva:", error);
        res.status(500).json({ error: "Erro ao buscar última reserva" });
    }
};




exports.createReservation = async (req, res) => {
    try {
        const { tripId, preco, precoBase, moeda, entrada, nomePassageiro, apelidoPassageiro, saida, volta, telefone, email, obs, lugar, carro, reserva,valorCarro, valorVolume, impresso, bilhete, createdBy } = req.body;

        console.log(`🔹 Tentando criar reserva Nº ${reserva} para o lugar ${lugar}`);

        const existingReservation = await Reservation.findOne({ where: { reserva, tripId } });

        if (existingReservation) {
            console.warn(`⚠️ Reserva Nº ${reserva} já existe para esta viagem!`);
            return res.status(400).json({ error: "Número de reserva já existe nesta viagem." });
        }

        const newReservation = await Reservation.create({
            tripId, lugar, reserva, valorCarro, valorVolume, preco, precoBase, moeda, entrada, nomePassageiro, apelidoPassageiro, saida, volta, telefone, email, obs, carro, createdBy
        });

        console.log("✅ Nova reserva criada:", newReservation.dataValues);

        if (io) {
            io.emit("reservationUpdated", { tripId });
        } else {
            console.warn("⚠️ WebSocket io não está definido!");
        }

        res.status(201).json(newReservation);
    } catch (error) {
        console.error("🔥 Erro ao criar reserva:", error);
        res.status(500).json({ error: "Erro ao criar reserva" });
    }
};


// Obter todas as reservas de uma viagem específica
exports.getReservationsByTrip = async (req, res) => {
    try {
        const { tripId } = req.params;
        const reservations = await Reservation.findAll({ where: { tripId: Number(req.params.tripId) } });

        res.json(reservations);
    } catch (error) {
        console.error("Erro ao listar reservas:", error);
        res.status(500).json({ error: "Erro ao listar reservas" });
    }
};

exports.updateReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const { updatedBy, ...updateData } = req.body; // Extraindo updatedBy do body

        console.log("🔍 Tentando atualizar reserva com ID:", id);

        const reservation = await Reservation.findByPk(id);
        if (!reservation) {
            console.error("❌ Reserva não encontrada:", id);
            return res.status(404).json({ error: "Reserva não encontrada" });
        }

        await reservation.update({ 
            ...updateData,
            updatedBy // Definir o updatedBy com o utilizador que fez a alteração
        });

        console.log("✅ Reserva atualizada:", reservation.dataValues);

        // 🔥 Emitir evento WebSocket para todos os clientes
        req.io.emit("reservationUpdated", { tripId: reservation.tripId });

        res.json({ message: "Reserva atualizada", reservation });
    } catch (error) {
        console.error("🔥 Erro ao atualizar reserva:", error);
        res.status(500).json({ error: "Erro ao atualizar reserva" });
    }
};




// Buscar reserva pelo campo "reserva"
exports.getReservationByReserva = async (req, res) => {
    try {
        const reservaNumber = req.params.reserva;
    
        // Inclui a relação com Trip
        const reservation = await Reservation.findOne({
          where: { reserva: reservaNumber },
          include: [{ model: Trip }] // ou { model: Trip, as: "trip" } se tiveres um alias
        });
    
        if (!reservation) {
          return res.status(404).json({ error: "Reserva não encontrada" });
        }
    
        // Agora `reservation` vem com a Trip associada dentro de `reservation.Trip`
        res.json(reservation);
      } catch (error) {
        console.error("Erro ao buscar reserva:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
      }
    };


    // Buscar reserva pelo campo "telefone"
exports.getReservationByPhone = async (req, res) => {
  try {
      const telefone = req.params.telefone;

      const reservation = await Reservation.findAll({
          where: { telefone },
          include: [{ model: Trip }]
      });

      if (!reservation) {
          return res.status(404).json({ error: "Reserva não encontrada" });
      }

      res.json(reservation);
  } catch (error) {
      console.error("Erro ao buscar reserva por telefone:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
  }
};


// 🔹 Buscar reserva pelo nome + apelido do passageiro
exports.getReservationByPassengerName = async (req, res) => {
  try {
      const { nome, apelido } = req.params;

      const reservations = await Reservation.findAll({
          where: {
              [Op.and]: [
                  { nomePassageiro: { [Op.like]: `%${nome}%` } },
                  { apelidoPassageiro: { [Op.like]: `%${apelido}%` } }
              ]
          },
          include: [{ model: Trip }]
      });

      if (!reservations || reservations.length === 0) {
          return res.status(404).json({ error: "Nenhuma reserva encontrada para este passageiro" });
      }

      res.json(reservations);
  } catch (error) {
      console.error("Erro ao buscar reserva por nome de passageiro:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
  }
};


// Atualizar apenas o lugar de uma reserva específica
exports.updateReservationPlace = async (req, res) => {
    try {
        const { reserva } = req.params;
        const { lugar, updatedBy } = req.body;

        console.log(`🔄 Tentando atualizar a reserva Nº ${reserva} para o lugar ${lugar}...`);

        const reservation = await Reservation.findOne({ where: { reserva } });
        if (!reservation) {
            console.warn(`❌ Reserva Nº ${reserva} não encontrada.`);
            return res.status(404).json({ error: "Reserva não encontrada" });
        }

        await reservation.update({ 
            lugar,
            updatedBy // Registar quem fez a atualização
        });

        console.log(`✅ Lugar atualizado para ${lugar} na reserva Nº ${reserva}.`);

        // Emitir evento WebSocket para atualizar no frontend
        req.io.emit("reservationUpdated", { tripId: reservation.tripId });

        res.json({ message: "Lugar atualizado com sucesso", reservation });
    } catch (error) {
        console.error("🔥 Erro ao atualizar lugar da reserva:", error);
        res.status(500).json({ error: "Erro ao atualizar lugar da reserva" });
    }
};




// controllers/reservationController.js

exports.createReturnReservation = async (req, res) => {
    try {
        const {
            reservaIda,
            origemIda,
            destinoIda,
            dataVolta,
            saidaIda,
            nomePassageiro,
            apelidoPassageiro,
            telefone,
            email,
            obs,
            preco,
            precoBase,
            moeda,
            carro,
            valorCarro,
            valorVolume,
            impresso,
            bilhete,
            createdBy
        } = req.body;

        // 🔹 Usar o mesmo número de reserva para a viagem de volta
        const reservaVolta = reservaIda; // ✅ Mesma reserva

        // 🔹 Encontrar ou criar a viagem de regresso
        const [tripRegresso, tripCreated] = await Trip.findOrCreate({
            where: { origem: destinoIda, destino: origemIda, dataviagem: dataVolta },
            defaults: { origem: destinoIda, destino: origemIda, dataviagem: dataVolta }
        });

        // 🔹 Criar a reserva de volta, permitindo duplicação no mesmo número de reserva
        const newReturnReservation = await Reservation.create({
            tripId: tripRegresso.id,
            reserva: reservaVolta, // ✅ Agora mantém-se igual
            preco,
            precoBase,
            moeda,
            entrada: saidaIda, 
            saida: dataVolta,  
            volta: null,        
            nomePassageiro,
            apelidoPassageiro,
            telefone,
            email,
            obs,
            carro,
            lugar: 0, // Define um lugar disponível mais tarde
            valorCarro,
            valorVolume,
            impresso,
            bilhete,
            createdBy
        });

        console.log(`✅ Reserva de regresso criada com o mesmo número: ${reservaVolta}`);

        req.io.emit("reservationUpdated", { tripId: tripRegresso.id });

        return res.status(201).json({
            message: "Reserva de regresso criada com sucesso",
            tripRegresso,
            newReturnReservation
        });

    } catch (error) {
        console.error("🔥 Erro ao criar reserva de regresso:", error);
        return res.status(500).json({ error: "Erro ao criar reserva de regresso" });
    }
};

  

  exports.ReturnReservationsOfBus = async (req, res) => {
    try {
        const { tripId } = req.params;

        // Buscar a viagem para obter o número total de lugares do autocarro
        const trip = await Trip.findOne({
            where: { id: tripId },
            include: [{ model: Bus, attributes: ["nlugares"] }] // Obter número de lugares do autocarro
        });

        if (!trip || !trip.Bus) {
            return res.status(404).json({ message: "Viagem ou autocarro não encontrados." });
        }

        const totalSeats = trip.Bus.nlugares;
        console.log(`🔍 Viagem ${tripId} tem ${totalSeats} lugares.`);

        // Buscar reservas já existentes para esta viagem
        const reservations = await Reservation.findAll({
            where: { tripId: Number(req.params.tripId) },
            attributes: ["lugar"]
        });

        // Criar uma lista de lugares ocupados
        const occupiedSeats = reservations.map(reservation => reservation.lugar);
        console.log(`✅ Lugares ocupados: ${occupiedSeats}`);

        // Criar lista de lugares disponíveis
        const allSeats = Array.from({ length: totalSeats }, (_, i) => i + 1);
        const freeSeats = allSeats.filter(seat => !occupiedSeats.includes(seat));

        console.log(`✅ Lugares livres: ${freeSeats}`);

        res.json({ freeSeats });
    } catch (error) {
        console.error("🔥 Erro ao buscar lugares disponíveis:", error);
        res.status(500).json({ message: "Erro no servidor ao buscar lugares disponíveis.", error: error.message });
    }
};





// controllers/reservationController.js

exports.deleteReservation = async (req, res) => {
    const { reserva } = req.params;
  
    try {
      let tripIdDeleted = null;              // ➊ variável para usar depois da transacção
  
      await sequelize.transaction(async (t) => {
        const reservation = await Reservation.findOne({
          where: { reserva },
          transaction: t,
        });
  
        if (!reservation) {
          // atira erro para ser apanhado fora da transaction
          throw new Error("NOT_FOUND");
        }
  
        tripIdDeleted = reservation.tripId;  // ➋ guardar antes de destruir
  
        // Clonar dados sem o id
        const dataToBlacklist = { ...reservation.get({ plain: true }) };
        delete dataToBlacklist.id;
        dataToBlacklist.deletedAt = new Date();
  
        await BlackList.create(dataToBlacklist, { transaction: t });
        await reservation.destroy({ transaction: t });
      });
  
      // ➌ Notificar via WebSocket se tivermos um tripId válido
      if (io && tripIdDeleted) {
        io.emit("reservationUpdated", { tripId: tripIdDeleted });
      }
  
      return res.json({
        message: `Reserva ${reserva} eliminada e movida para ListaNegra.`,
      });
    } catch (error) {
      if (error.message === "NOT_FOUND") {
        return res.status(404).json({ error: "Reserva não encontrada" });
      }
      console.error("🔥 Erro ao mover para ListaNegra:", error);
      return res.status(500).json({ error: "Erro ao eliminar reserva" });
    }
  };
  

exports.getOpenReturnReservations = async (req, res) => {
    try {
        const reservations = await Reservation.findAll({
            where: Sequelize.where(
                Sequelize.fn("LOWER", Sequelize.col("volta")),
                {
                    [Op.like]: "%aberto%"
                }
            ),
            include: [{ model: Trip }] // Opcional: inclui a viagem associada
        });

        if (!reservations || reservations.length === 0) {
            return res.status(404).json({ message: "Nenhuma reserva com 'volta' em aberto encontrada." });
        }

        res.json(reservations);
    } catch (error) {
        console.error("🔥 Erro ao buscar reservas com 'volta' em aberto:", error);
        res.status(500).json({ error: "Erro ao buscar reservas com volta em aberto" });
    }
};



exports.getAllReservations = async (req, res) => {
    try {
      const reservations = await Reservation.findAll({
        include: [{ model: Trip }], // Inclui dados da viagem
        order: [["createdAt", "DESC"]] // ou ["dataviagem", "DESC"] se preferires
      });
      res.json(reservations);
    } catch (err) {
        console.error("🔥 ERRO AO BUSCAR RESERVAS:");
        console.error(err.message);       // Erro principal
        console.error(err.original);      // Erro do SQL Server (RequestError)
        res.status(500).json({ erro: "Erro ao buscar reservas", detalhe: err.message });
      }
  };
  


exports.getLastTicket = async (req, res) => {
    try {
      // Lê o maior valor da coluna "bilhete" na tabela "reservations"
      const lastTicket = await Reservation.max("bilhete"); 
      // Se nunca existiu nenhum bilhete, retorna 0
      const lastBilhete = lastTicket || 0;
  
      return res.json({ bilhete: lastBilhete });
    } catch (error) {
      console.error("Erro ao buscar último bilhete:", error);
      return res.status(500).json({
        error: "Erro ao buscar último bilhete"
      });
    }
  };
  