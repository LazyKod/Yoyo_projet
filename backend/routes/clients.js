import express from 'express';
import Client from '../models/Client.js';

const router = express.Router();

// Route pour récupérer tous les clients
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    
    let filter = { actif: true };
    
    if (search) {
      filter.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const clients = await Client.find(filter)
      .sort({ nom: 1 })
      .lean();

    // Vérifier les champs requis
    const safeClients = clients.map(client => ({
      ...client,
      _id: client._id || '',
      nom: client.nom || 'Client inconnu',
      email: client.email || 'email@inconnu.com',
      telephone: client.telephone || '',
      adresse: client.adresse || {}
    }));

    res.json({
      success: true,
      data: safeClients
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des clients'
    });
  }
});

// Route pour créer un nouveau client
router.post('/', async (req, res) => {
  try {
    const clientData = req.body;

    // Validation des champs requis
    const requiredFields = ['nom', 'email'];
    for (const field of requiredFields) {
      if (!clientData[field]) {
        return res.status(400).json({
          success: false,
          message: `Le champ ${field} est requis`
        });
      }
    }

    const newClient = new Client(clientData);
    const savedClient = await newClient.save();

    res.status(201).json({
      success: true,
      message: 'Client créé avec succès',
      data: savedClient
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Un client avec cet email existe déjà'
      });
    }
    
    console.error('Erreur lors de la création du client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du client'
    });
  }
});

export default router;