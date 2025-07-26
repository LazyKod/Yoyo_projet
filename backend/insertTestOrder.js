import mongoose from 'mongoose';
import Order from './models/Order.js';

async function run() {
  try {
    await mongoose.connect('mongodb://localhost:27017/armor_orders');
    console.log("✅ MongoDB connecté");

    const testOrder = new Order({
      technologie: "APS BulkNiv2",
      familleProduit: "APS BulkNiv2",
      groupeCouverture: "PF",
      quantiteCommandee: 10,
      quantiteALivrer: 10,
      clientLivreId: "test123",
      clientLivreFinal: "youssefboudad61@gmail.com",  // mail
      dateCreation: new Date("2025-07-20T00:00:00Z"),
      typeCommande: "ZIG",
      dateLivraison: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Livraison dans 2 jours a verifier 
      confirmations: [],
      unite: "PCE"
    });

    await testOrder.save();
    console.log("✅ Commande test insérée !");
  } catch (err) {
    console.error("❌ Erreur :", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB déconnecté");
  }
}

run();
