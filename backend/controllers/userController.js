// controllers/userController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
require("dotenv").config();  // Adiciona esta linha no topo do teu arquivo


exports.register = async (req, res) => {
    try {
        const { nome, apelido, email, password, telefone, tipo } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ nome, apelido, email, password: hashedPassword, telefone, tipo });
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: "Erro ao registar utilizador" });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ error: "Utilizador não encontrado" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Credenciais inválidas" });

        const token = jwt.sign({ id: user.id, tipo: user.tipo }, process.env.JWT_SECRET);
        res.json({ token, user, email });
    } catch (error) {
        res.status(500).json({ error: "Erro ao iniciar sessão" });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Erro ao obter utilizadores" });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ error: "Utilizador não encontrado" });
        }

        await user.destroy();
        res.json({ message: "Utilizador eliminado com sucesso" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao eliminar utilizador" });
    }
};


exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, apelido, email, telefone, tipo, password } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: "Utilizador não encontrado" });
        }

        // Se for enviada uma nova password, encripta antes de atualizar
        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }

        // Atualiza os campos enviados
        await user.update({ 
            nome: nome || user.nome,
            apelido: apelido || user.apelido,
            email: email || user.email,
            telefone: telefone || user.telefone,
            tipo: tipo || user.tipo
        });

        res.json({ message: "Utilizador atualizado com sucesso", user });
    } catch (error) {
        res.status(500).json({ error: "Erro ao atualizar utilizador" });
    }
};
