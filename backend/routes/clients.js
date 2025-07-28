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
        { entreprise: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { numeroClient: { $regex: search, $options: 'i' } }
      ];
    }

    const clients = await Client.find(filter)
      .sort({ nom: 1 })
      .lean();

    // Vérifier les champs requis et ajouter les adresses virtuelles
    const safeClients = clients.map(client => ({
      ...client,
      _id: client._id || '',
      nom: client.nom || 'Client inconnu',
      entreprise: client.entreprise || '',
      email: client.email || 'email@inconnu.com',
      telephone: client.telephone || '',
      fax: client.fax || '',
      adresse1: client.adresse1 || {},
      adresse2: client.adresse2 || {},
      memeAdresseLivraison: client.memeAdresseLivraison !== false,
      numeroClient: client.numeroClient || 'N/A'
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

    // Si memeAdresseLivraison est true, copier l'adresse principale
    if (clientData.memeAdresseLivraison) {
      clientData.adresse2 = clientData.adresse1;
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
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Un client avec ${field === 'email' ? 'cet email' : 'ce numéro'} existe déjà`
      });
    }
    
    console.error('Erreur lors de la création du client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du client'
    });
  }
});

// Route pour récupérer un client spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du client'
    });
  }
});

// Route pour mettre à jour un client
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const clientData = req.body;

    // Si memeAdresseLivraison est true, copier l'adresse principale
    if (clientData.memeAdresseLivraison) {
      clientData.adresse2 = clientData.adresse1;
    }

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      clientData,
      { new: true, runValidators: true }
    );

    if (!updatedClient) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Client mis à jour avec succès',
      data: updatedClient
    });

  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Un client avec ${field === 'email' ? 'cet email' : 'ce numéro'} existe déjà`
      });
    }
    
    console.error('Erreur lors de la mise à jour du client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du client'
    });
  }
});

// Route pour supprimer un client (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      { actif: false },
      { new: true }
    );

    if (!updatedClient) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Client supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du client'
    });
  }
});

export default router;