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

    console.log('✅ Client trouvé pour création:', client.nom);
    console.log('📍 Adresse1 du client:', JSON.stringify(client.adresse1, null, 2));
    console.log('📍 Adresse2 du client:', JSON.stringify(client.adresse2, null, 2));
    
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
      clientLivreId: client._id.toString(), // Utiliser l'ID MongoDB du client
      clientLivreFinal: client.nom,
      articles: articlesData,
      dateLivraison: new Date(dateLivraison),
      typeCommande: typeCommande || 'ZIG',
      statut: 'brouillon',
      notes: notes || ''
    });

    const savedOrder = await newOrder.save();

    // Ajouter les informations complètes du client à la réponse
    const orderWithClient = {
      ...savedOrder.toObject(),
      client: {
        nom: client.nom || '',
        entreprise: client.entreprise || '',
        email: client.email || '',
        telephone: client.telephone || '',
        fax: client.fax || '',
        adresse1: {
          rue: client.adresse1?.rue || '',
          ville: client.adresse1?.ville || '',
          codePostal: client.adresse1?.codePostal || '',
          pays: client.adresse1?.pays || 'France'
        },
        adresse2: {
          rue: client.adresse2?.rue || '',
          ville: client.adresse2?.ville || '',
          codePostal: client.adresse2?.codePostal || '',
          pays: client.adresse2?.pays || 'France'
        },
        memeAdresseLivraison: client.memeAdresseLivraison !== false
      }
    };

    console.log('✅ Commande créée avec client:', JSON.stringify(orderWithClient.client, null, 2));

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: orderWithClient
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

    // Récupérer les informations du client
    const Client = (await import('../models/Client.js')).default;
    
    console.log('🔍 Recherche client avec clientLivreId:', order.clientLivreId);
    
    // Essayer de trouver le client par ID MongoDB d'abord
    let client = null;
    
    // Si clientLivreId ressemble à un ObjectId MongoDB
    if (order.clientLivreId && order.clientLivreId.length === 24) {
      try {
        client = await Client.findById(order.clientLivreId);
        console.log('🔍 Client trouvé par ID MongoDB:', client ? client.nom : 'Aucun');
      } catch (err) {
        console.log('❌ Erreur recherche par ID:', err.message);
      }
    }
    
    // Si pas trouvé, chercher par nom
    if (!client) {
      client = await Client.findOne({ nom: order.clientLivreFinal });
      console.log('🔍 Client trouvé par nom:', client ? client.nom : 'Aucun');
    }
    
    // Si toujours pas trouvé, chercher par entreprise
    if (!client) {
      client = await Client.findOne({ entreprise: order.clientLivreFinal });
      console.log('🔍 Client trouvé par entreprise:', client ? client.nom : 'Aucun');
    }
    
    if (client) {
      console.log('📍 CLIENT TROUVÉ - Données complètes:', JSON.stringify({
        nom: client.nom,
        entreprise: client.entreprise,
        telephone: client.telephone,
        adresse1: client.adresse1,
        adresse2: client.adresse2,
        memeAdresseLivraison: client.memeAdresseLivraison
      }, null, 2));
    }
    
    let orderWithClient = order.toObject();
    if (client) {
      orderWithClient.client = {
        nom: client.nom || '',
        entreprise: client.entreprise || '',
        email: client.email || '',
        telephone: client.telephone || '',
        fax: client.fax || '',
        adresse1: {
          rue: client.adresse1?.rue || '',
          ville: client.adresse1?.ville || '',
          codePostal: client.adresse1?.codePostal || '',
          pays: client.adresse1?.pays || 'France'
        },
        adresse2: {
          rue: client.adresse2?.rue || '',
          ville: client.adresse2?.ville || '',
          codePostal: client.adresse2?.codePostal || '',
          pays: client.adresse2?.pays || 'France'
        },
        memeAdresseLivraison: client.memeAdresseLivraison !== false
      };
      
      console.log('📍 DONNÉES CLIENT PRÉPARÉES POUR ENVOI:', JSON.stringify(orderWithClient.client, null, 2));
    } else {
      console.log('❌ Client non trouvé, utilisation des données par défaut');
      orderWithClient.client = {
        nom: order.clientLivreFinal,
        entreprise: order.clientLivreFinal,
        email: '',
        telephone: '',
        fax: '',
        adresse1: { rue: '', ville: '', codePostal: '', pays: 'France' },
        adresse2: { rue: '', ville: '', codePostal: '', pays: 'France' },
        memeAdresseLivraison: true
      };
    }
    
    console.log('✅ Réponse finale client:', JSON.stringify(orderWithClient.client, null, 2));
    
    res.json({
      success: true,
      data: orderWithClient
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la commande:', error);
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
    const { clientId, articles, dateLivraison, typeCommande, notes } = req.body;

    console.log('Données reçues pour modification:', { clientId, articles, dateLivraison, typeCommande, notes });
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Récupérer les informations du client si fourni
    if (clientId) {
      const Client = (await import('../models/Client.js')).default;
      const client = await Client.findById(clientId);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }
      order.clientLivreFinal = client.nom;
    }

    // Mettre à jour les champs
    if (dateLivraison) order.dateLivraison = new Date(dateLivraison);
    if (typeCommande) order.typeCommande = typeCommande;
    if (notes !== undefined) order.notes = notes;
    
    // Mettre à jour les articles si fournis
    if (articles && Array.isArray(articles)) {
      const Article = (await import('../models/Article.js')).default;
      const articlesData = [];
      
      for (const articleReq of articles) {
        console.log('Traitement article:', articleReq);
        
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
          familleProduit: article.familleProduit || 'APS BulkNiv2',
          groupeCouverture: 'PF',
          quantiteCommandee: articleReq.quantite,
          quantiteALivrer: articleReq.quantite,
          quantiteExpediee: 0,
          quantiteEnPreparation: 0,
          unite: article.unite || 'PCE',
          confirmations: []
        });
      }
      
      console.log('Articles transformés:', articlesData);
      order.articles = articlesData;
    }

    console.log('Commande avant sauvegarde:', order);
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