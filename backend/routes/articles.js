import express from 'express';
import Article from '../models/Article.js';

const router = express.Router();

// Route pour récupérer tous les articles
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    
    let filter = { actif: true };
    
    if (search) {
      filter.$or = [
        { numeroArticle: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
        { technologie: { $regex: search, $options: 'i' } }
      ];
    }

    const articles = await Article.find(filter)
      .sort({ numeroArticle: 1 })
      .lean();

    // Ajouter le stock disponible
    const articlesWithStock = articles.map(article => ({
      ...article,
      stockDisponible: article.stock - article.stockReserve
    }));

    res.json({
      success: true,
      data: articlesWithStock
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des articles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des articles'
    });
  }
});

// Route pour créer un nouvel article
router.post('/', async (req, res) => {
  try {
    const articleData = req.body;

    // Validation des champs requis
    const requiredFields = ['numeroArticle', 'designation', 'technologie', 'prixUnitaire'];
    for (const field of requiredFields) {
      if (!articleData[field]) {
        return res.status(400).json({
          success: false,
          message: `Le champ ${field} est requis`
        });
      }
    }

    const newArticle = new Article(articleData);
    const savedArticle = await newArticle.save();

    res.status(201).json({
      success: true,
      message: 'Article créé avec succès',
      data: savedArticle
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Un article avec ce numéro existe déjà'
      });
    }
    
    console.error('Erreur lors de la création de l\'article:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de l\'article'
    });
  }
});

export default router;