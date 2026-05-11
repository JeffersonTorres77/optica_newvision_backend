const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'mail.opticanewvisionlens.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 10000,
    socketTimeout: 10000,
    logger: false,
    debug: false
});

function htmlToText(html) {
    return String(html || '')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/tr>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/\r/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
}

const correo = {
    send: async (to, subject, html) => {
        try {
            // Configurar el correo
            const mailOptions = {
                // from: process.env.EMAIL_USER,
                from: `"${process.env.EMAIL_NAME}" <${process.env.EMAIL_USER}>`,
                to, // Destinatario
                subject, // Asunto
                html: html, // Cuerpo del correo (HTML opcional),
                text: htmlToText(html),
                headers: {
                    'X-Mailer': 'NodeMailer',
                    'X-Priority': '1'
                }
            };
    
            const info = await transporter.sendMail(mailOptions);
            console.log('Correo enviado:', info.messageId);
            return info;
        } catch (err) {
            console.error('Error al enviar el correo:', err);
            throw err;
        }
    }
};

module.exports = correo;
