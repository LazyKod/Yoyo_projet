import express from 'express';
import Order from '../models/Order.js';
import Client from '../models/Client.js';
import Article from '../models/Article.js';

const router = express.Router();

// Route pour récupérer toutes les commandes
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, status } = req.query;
    
    // Construire le filtre de recherche
    let filter = {};
    
    if (search) {
      filter.$or = [
        { numeroCommande: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status === 'confirmed') {
      filter.statut = { $ne: 'brouillon' };
    } else if (status === 'unconfirmed') {
      filter.statut = 'brouillon';
    }

    const orders = await Order.find(filter)
      .populate('clientId', 'nom email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: orders,
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
    const { clientId, articles, dateLivraison, typeCommande, notes } = req.body;

    // Validation des champs requis
    if (!clientId || !articles || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Client et articles requis'
      });
    }

    // Vérifier que le client existe
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(400).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    // Vérifier les articles et les stocks
    const articlesData = [];
    for (const articleCmd of articles) {
      const article = await Article.findById(articleCmd.articleId);
      if (!article) {
        return res.status(400).json({
          success: false,
          message: `Article ${articleCmd.articleId} non trouvé`
        });
      }

      if (article.stockDisponible < articleCmd.quantite) {
        return res.status(400).json({
          success: false,
          message: `Stock insuffisant pour ${article.numeroArticle}`
        });
      }

      articlesData.push({
        articleId: article._id,
        numeroArticle: article.numeroArticle,
        designation: article.designation,
        quantite: articleCmd.quantite,
        prixUnitaire: article.prixUnitaire,
        unite: article.unite
      });

      // Réserver le stock
      article.stockReserve += articleCmd.quantite;
      await article.save();
    }

    // Générer le numéro de commande
    const numeroCommande = await Order.genererNumeroCommande();

    // Créer la nouvelle commande
    const newOrder = new Order({
      numeroCommande,
      clientId,
      articles: articlesData,
      dateLivraison: new Date(dateLivraison),
      typeCommande: typeCommande || 'ZIG',
      notes
    });

    const savedOrder = await newOrder.save();
    await savedOrder.populate('clientId', 'nom email');

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
    await order.populate('clientId', 'nom email');

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
    const order = await Order.findById(id).populate('clientId', 'nom email');

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

    // Libérer les stocks réservés
    for (const articleCmd of order.articles) {
      const article = await Article.findById(articleCmd.articleId);
      if (article) {
        article.stockReserve = Math.max(0, article.stockReserve - articleCmd.quantite);
        await article.save();
      }
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