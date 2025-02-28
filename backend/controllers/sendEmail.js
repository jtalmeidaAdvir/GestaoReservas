const nodemailer = require("nodemailer");

const sendEmail = async (req, res) => {
    console.log("📩 Requisição recebida:", req.body);

    const { emailDestinatario, emailCC, assunto, anexos } = req.body;

    if (!emailDestinatario || !anexos || anexos.length === 0) {
        return res.status(400).json({ message: "Faltam parâmetros obrigatórios." });
    }


    try {

        

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "noreply.advir@gmail.com",
                pass: "ihpgedswadmqtceh", // ⚠️ Guarda isto num `.env` e usa `process.env.EMAIL_PASS`
            },
        });

        const mailOptions = {
            from: "noreply.advir@gmail.com",
            to: emailDestinatario,
            cc: emailCC,
            replyTo: emailCC ? emailCC.split(",")[0].trim() : undefined,
            subject: assunto,
            text: "Segue em anexo os bilhetes e a listagem de passageiros.",
            attachments: anexos.map(anexo => ({
                filename: anexo.nome,
                content: Buffer.from(anexo.conteudo, "base64"),
                encoding: "base64"
            }))
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "Email enviado com sucesso!" });
    } catch (error) {
        console.error("Erro ao enviar email:", error);
        res.status(500).json({ message: "Erro ao enviar email." });
    }
};

// ✅ Certifica-te que estás a exportar corretamente a função
module.exports = sendEmail;
