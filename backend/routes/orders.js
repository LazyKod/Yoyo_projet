import express from 'express';
import Order from '../models/Order.js';

const router = express.Router();

// Route pour récupérer toutes les commandes
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, status } = req.query;
    
    // Construire le filtre de recherche
    let filter = {};
    
    if (search) {
      filter.$or = [
        { clientLivreFinal: { $regex: search, $options: 'i' } },
        { technologie: { $regex: search, $options: 'i' } },
        { clientLivreId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status === 'confirmed') {
      filter['confirmations.0'] = { $exists: true };
    } else if (status === 'unconfirmed') {
      filter['confirmations.0'] = { $exists: false };
    }

    const orders = await Order.find(filter)
      .sort({ dateCreation: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Transformer les données pour correspondre au format attendu par le frontend
    const transformedOrders = orders.map(order => ({
      id: order._id.toString(),
      poste: order.clientLivreId,
      numeroArticle: order.technologie,
      designation: `${order.technologie} - ${order.familleProduit}`,
      technologie: order.technologie,
      familleProduit: order.familleProduit,
      quantiteCommandee: order.quantiteCommandee,
      quantiteExpediee: order.quantiteExpediee,
      quantiteALivrer: order.quantiteALivrer,
      quantiteEnPreparation: order.quantiteEnPreparation,
      clientFinal: order.clientLivreFinal,
      dateCreation: order.dateCreation.toISOString().split('T')[0],
      dateConfirmation: order.confirmations.length > 0 
        ? order.confirmations[order.confirmations.length - 1].date.toISOString().split('T')[0]
        : undefined,
      typCommande: order.typeCommande,
      dateLivraison: order.dateLivraison.toISOString().split('T')[0],
      unite: order.unite,
      confirmations: order.confirmations
    }));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: transformedOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes'
    });
  }
});

// Route pour créer une nouvelle commande
router.post('/', async (req, res) => {
  try {
    const orderData = req.body;

    // Validation des champs requis
    const requiredFields = [
      'clientFinal', 'technologie', 'quantiteCommandee', 'dateLivraison'
    ];

    for (const field of requiredFields) {
      if (!orderData[field]) {
        return res.status(400).json({
          success: false,
          message: `Le champ ${field} est requis`
        });
      }
    }

    // Créer la nouvelle commande
    const newOrder = new Order({
      technologie: orderData.technologie,
      familleProduit: orderData.familleProduit || 'APS BulkNiv2',
      groupeCouverture: orderData.groupeCouverture || 'PF',
      quantiteCommandee: orderData.quantiteCommandee,
      quantiteExpediee: 0,
      quantiteALivrer: orderData.quantiteCommandee,
      quantiteEnPreparation: 0,
      clientLivreId: orderData.clientLivreId || '32290',
      clientLivreFinal: orderData.clientFinal,
      dateCreation: new Date(),
      typeCommande: orderData.typCommande || 'ZIG',
      dateLivraison: new Date(orderData.dateLivraison),
      unite: orderData.unite || 'PCE',
      confirmations: orderData.commandeConfirmee ? 
        [{ quantite: orderData.quantiteCommandee, date: new Date() }] : []
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: savedOrder
    });

  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de la commande'
    });
  }
});

// Route pour confirmer une commande (partiellement ou totalement)
router.put('/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantiteConfirmee, dateConfirmation } = req.body;

    if (!quantiteConfirmee || !dateConfirmation) {
      return res.status(400).json({
        success: false,
        message: 'Quantité confirmée et date de confirmation requises'
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Utiliser la méthode du modèle pour ajouter la confirmation
    await order.ajouterConfirmation(quantiteConfirmee, new Date(dateConfirmation));

    res.json({
      success: true,
      message: 'Commande confirmée avec succès',
      data: order
    });

  } catch (error) {
    console.error('Erreur lors de la confirmation de la commande:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur serveur lors de la confirmation'
    });
  }
});

// Route pour récupérer une commande spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la commande'
    });
  }
});

// Route pour mettre à jour une commande
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const order = await Order.findByIdAndUpdate(
      id,
      {
        technologie: updateData.technologie,
        familleProduit: updateData.familleProduit,
        groupeCouverture: updateData.groupeCouverture,
        quantiteCommandee: updateData.quantiteCommandee,
        quantiteALivrer: updateData.quantiteALivrer || updateData.quantiteCommandee,
        clientLivreFinal: updateData.clientFinal,
        dateLivraison: new Date(updateData.dateLivraison),
        typeCommande: updateData.typCommande,
        unite: updateData.unite
      },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Commande mise à jour avec succès',
      data: order
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la commande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour'
    });
  }
});

// Route pour supprimer une commande
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Commande supprimée avec succès',
      data: order
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la commande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression'
    });
  }
});

export default router;