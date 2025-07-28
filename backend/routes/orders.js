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
        { clientLivreId: isNaN(search) ? undefined : Number(search) },
        { 'articles.technologie': { $regex: search, $options: 'i' } },
        { 'articles.familleProduit': { $regex: search, $options: 'i' } }
      ].filter(condition => condition.clientLivreId !== undefined || condition.clientLivreFinal || condition['articles.technologie'] || condition['articles.familleProduit']);
    }
    
    if (status === 'confirmed') {
      filter.statut = { $ne: 'brouillon' };
    } else if (status === 'unconfirmed') {
      filter.statut = 'brouillon';
    }

    const orders = await Order.find(filter)
      .sort({ dateCreation: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Order.countDocuments(filter);

    // Transformer les données pour compatibilité avec le frontend
    const transformedOrders = orders.map(order => {
      // Vérifications de sécurité pour éviter les erreurs
      const safeOrder = {
        ...order,
        _id: order._id || '',
        clientLivreId: order.clientLivreId || 0,
        clientLivreFinal: order.clientLivreFinal || 'Client inconnu',
        articles: Array.isArray(order.articles) ? order.articles : [],
        dateCreation: order.dateCreation || order.createdAt || new Date(),
        dateLivraison: order.dateLivraison || new Date(),
        typeCommande: order.typeCommande || 'ZIG',
        statut: order.statut || 'brouillon'
      };

      return {
        ...safeOrder,
        id: safeOrder._id.toString(),
        poste: safeOrder.clientLivreId.toString(),
        // Pour compatibilité, on prend le premier article comme référence
        numeroArticle: safeOrder.articles[0]?.technologie || '',
        designation: safeOrder.articles[0]?.familleProduit || '',
        technologie: safeOrder.articles[0]?.technologie || '',
        familleProduit: safeOrder.articles[0]?.familleProduit || '',
        quantiteCommandee: safeOrder.articles.reduce((sum, art) => sum + (art.quantiteCommandee || 0), 0),
        quantiteExpediee: safeOrder.articles.reduce((sum, art) => sum + (art.quantiteExpediee || 0), 0),
        quantiteALivrer: safeOrder.articles.reduce((sum, art) => sum + (art.quantiteALivrer || 0), 0),
        quantiteEnPreparation: safeOrder.articles.reduce((sum, art) => sum + (art.quantiteEnPreparation || 0), 0),
        clientFinal: safeOrder.clientLivreFinal,
        dateConfirmation: safeOrder.statut !== 'brouillon' ? safeOrder.updatedAt : null,
        typCommande: safeOrder.typeCommande,
        unite: safeOrder.articles[0]?.unite || 'PCE'
      };
    });

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

// Route pour créer une nouvelle commande multi-articles
router.post('/', async (req, res) => {
  try {
    const { clientId, articles, dateLivraison, typeCommande, notes } = req.body;

    // Validation des champs requis
    if (!clientId || !articles || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Client ID et articles requis'
      });
    }

    // Récupérer les informations du client
    const Client = (await import('../models/Client.js')).default;
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    // Récupérer les informations des articles
    const Article = (await import('../models/Article.js')).default;
    const articlesData = [];
    
    for (const articleReq of articles) {
      const article = await Article.findById(articleReq.articleId);
      if (!article) {
        return res.status(404).json({
          success: false,
          message: `Article non trouvé: ${articleReq.articleId}`
        });
      }
      
      // Vérifier le stock disponible
      const stockDisponible = (article.stock || 0) - (article.stockReserve || 0);
      if (articleReq.quantite > stockDisponible) {
        return res.status(400).json({
          success: false,
          message: `Stock insuffisant pour ${article.numeroArticle}`
        });
      }
      
      articlesData.push({
        technologie: article.technologie,
        familleProduit: article.familleProduit,
        groupeCouverture: 'PF',
        quantiteCommandee: articleReq.quantite,
        quantiteALivrer: articleReq.quantite,
        quantiteExpediee: 0,
        quantiteEnPreparation: 0,
        unite: article.unite,
        confirmations: []
      });
    }

    // Créer la nouvelle commande
    const newOrder = new Order({
      clientLivreId: Math.floor(Math.random() * 90000) + 10000, // Générer un ID client temporaire
      clientLivreFinal: client.nom,
      articles: articlesData,
      dateLivraison: new Date(dateLivraison),
      typeCommande: typeCommande || 'ZIG',
      statut: 'brouillon',
      notes: notes || ''
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

// Route pour confirmer une commande
router.put('/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    if (order.statut !== 'brouillon') {
      return res.status(400).json({
        success: false,
        message: 'Cette commande est déjà confirmée'
      });
    }

    await order.confirmerCommande();

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

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Mettre à jour les champs autorisés
    if (updateData.clientLivreFinal) order.clientLivreFinal = updateData.clientLivreFinal;
    if (updateData.dateLivraison) order.dateLivraison = new Date(updateData.dateLivraison);
    if (updateData.typeCommande) order.typeCommande = updateData.typeCommande;
    
    // Mettre à jour les articles si fournis
    if (updateData.articles && Array.isArray(updateData.articles)) {
      order.articles = updateData.articles.map(article => ({
        technologie: article.technologie,
        familleProduit: article.familleProduit,
        groupeCouverture: article.groupeCouverture || 'PF',
        quantiteCommandee: article.quantiteCommandee,
        quantiteALivrer: article.quantiteALivrer || article.quantiteCommandee,
        quantiteExpediee: article.quantiteExpediee || 0,
        quantiteEnPreparation: article.quantiteEnPreparation || 0,
        unite: article.unite || 'PCE',
        confirmations: article.confirmations || []
      }));
    }

    const updatedOrder = await order.save();

    res.json({
      success: true,
      message: 'Commande modifiée avec succès',
      data: updatedOrder
    });

  } catch (error) {
    console.error('Erreur lors de la modification de la commande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la modification'
    });
  }
});

// Route pour supprimer une commande
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    await Order.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Commande supprimée avec succès'
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