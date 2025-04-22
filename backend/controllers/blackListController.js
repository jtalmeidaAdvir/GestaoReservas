// controllers/blackListController.js
const { BlackList, Trip } = require("../models"); // importa do index.js

// GET /blacklist
const getAllBlackList = async (req, res) => {
  try {
    // Se quiseres incluir a viagem associada:
    // const data = await BlackList.findAll({ include: [{ model: Trip }] });
    const data = await BlackList.findAll();
    return res.status(200).json(data);
  } catch (error) {
    console.error("🔥 Erro ao buscar ListaNegra:", error);
    return res.status(500).json({
      message: "Erro ao buscar dados da Lista Negra",
      error: error.message,
    });
  }
};

// DELETE /blacklist/:id
const deleteFromBlackList = async (req, res) => {
    const { id } = req.params;
    try {
      const item = await BlackList.findByPk(id);
      if (!item) {
        return res.status(404).json({ message: "Reserva não encontrada na lista negra." });
      }
  
      await item.destroy();
      return res.status(200).json({ message: "Reserva removida da lista negra com sucesso." });
    } catch (error) {
      console.error("🔥 Erro ao remover da Lista Negra:", error);
      return res.status(500).json({
        message: "Erro ao remover reserva da Lista Negra",
        error: error.message,
      });
    }
  };
  
  module.exports = {
    getAllBlackList,
    deleteFromBlackList,
  };