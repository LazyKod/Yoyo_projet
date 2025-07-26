import cron from 'node-cron';
import nodemailer from 'nodemailer';
import Order from './models/Order.js';

// Config SMTP 
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'youssefboudad61@gmail.com', // email Gmail
    pass: 'racy nzlx rvpk idjx', // mot de passe d'application Gmail
  }
});

function sendReminderEmail(order) {
  const mailOptions = {
    from: '"Ton Service" <youssefboudad61@gmail.com>', // Email expéditeur
    to: 'youssefboudad61@gmail.com',                    // Remplace par l'email du client ou un email test
    // Note : ici tu peux mettre order.clientLivreFinal si c'est un email valide
    subject: 'Relance confirmation commande',
    text: `
Bonjour,

Votre commande prévue pour le ${order.dateLivraison.toLocaleDateString()} n'est toujours pas entièrement confirmée.

Quantité commandée: ${order.quantiteCommandee} ${order.unite}
Quantité confirmée: ${order.quantiteTotaleConfirmee} ${order.unite}

Merci de nous contacter rapidement pour valider la livraison.

Cordialement,
L'équipe
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(`Erreur envoi mail commande ${order._id}:`, error);
    } else {
      console.log(`Mail relance envoyé pour commande ${order._id} à ${mailOptions.to}`);
    }
  });
}

export function startCron() {
  // Toutes les minutes (pour test rapide)
  cron.schedule('* * * * *', async () => {
    console.log("Vérification des commandes non entièrement confirmées avec livraison proche...");

    const now = new Date();
    const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    try {
      // Récupérer commandes avec dateLivraison dans 3 jours max
      const orders = await Order.find({
        dateLivraison: { $gte: now, $lte: in3days }
      });

      // Filtrer en JS selon ton virtual (non confirmées)
      const ordersToRemind = orders.filter(order => !order.estEntierementConfirmee);

      for (const order of ordersToRemind) {
        sendReminderEmail(order);
      }
    } catch (err) {
      console.error("Erreur vérification commandes :", err);
    }
  });
}

