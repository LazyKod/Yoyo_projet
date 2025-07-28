import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Client from '../models/Client.js';
import Article from '../models/Article.js';
import Client from '../models/Client.js';
import Article from '../models/Article.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse une date au format DD/MM/YYYY
const parseDate = (dateStr) => {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
};

// Importation des commandes depuis Book2.csv
export const importOrdersFromCSV = async () => {
  try {
    // Vérifier si des commandes existent déjà
    const existingOrdersCount = await Order.countDocuments();
    if (existingOrdersCount > 0) {
      console.log(`✅ ${existingOrdersCount} commandes déjà présentes en base`);
      return await Order.find().limit(10);
    }

    // Créer des clients et articles par défaut
    await createDefaultClientsAndArticles();

    // Créer des clients et articles par défaut
    await createDefaultClientsAndArticles();

    const csvPath = path.join(__dirname, '../../data/Book2.csv');
    if (!fs.existsSync(csvPath)) {
      console.log('⚠️ Fichier Book2.csv non trouvé, création d\'exemples...');
      return await createSampleOrders();
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      console.log('⚠️ Fichier CSV vide, création d\'exemples...');
      return await createSampleOrders();
    }

    // Créer des commandes d'exemple avec le nouveau format
    return await createSampleOrders();
  } catch (error) {
    console.error('❌ Erreur import commandes :', error);
    const count = await Order.countDocuments();
    if (count === 0) return await createSampleOrders();
    return [];
  }
};

// Importation des utilisateurs depuis Book3.csv
export const importUsersFromCSV = async () => {
  try {
    const existingUsersCount = await User.countDocuments();
    if (existingUsersCount > 0) {
      console.log(`✅ ${existingUsersCount} utilisateurs déjà présents`);
      return await User.find().limit(10);
    }

    const csvPath = path.join(__dirname, '../../data/Book3.csv');
    if (!fs.existsSync(csvPath)) {
      console.log('⚠️ Fichier Book3.csv non trouvé, création d\'utilisateurs par défaut...');
      return await createDefaultUsers();
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      console.log('⚠️ Fichier CSV vide, création d\'utilisateurs par défaut...');
      return await createDefaultUsers();
    }

    const dataLines = lines.slice(1);
    const result = [];

    for (const line of dataLines) {
      const columns = line.split(';').map(col => col.trim());
      if (columns.length < 3) continue;

      const user = new User({
        email: columns[1] || 'admin@armor.com',
        password: columns[2] || 'password',
        nom: columns[1] === 'admin@armor.com' ? 'Administrateur' : 'Utilisateur',
        role: columns[1] === 'admin@armor.com' ? 'admin' : 'user'
      });

      await user.save(); // 🔒 Le hook `pre('save')` hash le mot de passe
      result.push(user);
    }

    console.log(`✅ ${result.length} utilisateurs importés depuis Book3.csv`);
    return result;
  } catch (error) {
    console.error('❌ Erreur import utilisateurs :', error);
    const count = await User.countDocuments();
    if (count === 0) return await createDefaultUsers();
    return [];
  }
};

// Créer des clients et articles par défaut
const createDefaultClientsAndArticles = async () => {
  // Créer des clients par défaut
  const clientsCount = await Client.countDocuments();
  if (clientsCount === 0) {
    const defaultClients = [
      {
        nom: 'ARMOR PRINT SOLUTIONS S.A.S.',
        email: 'contact@armor.com',
        telephone: '02 96 54 71 00',
        adresse: {
          rue: 'Zone Industrielle de Kergaradec',
          ville: 'La Chapelle-sur-Erdre',
          codePostal: '44240',
          pays: 'France'
        }
      },
      {
        nom: 'TECH SOLUTIONS SARL',
        email: 'info@techsolutions.fr',
        telephone: '01 23 45 67 89',
        adresse: {
          rue: '15 Avenue des Technologies',
          ville: 'Paris',
          codePostal: '75001',
          pays: 'France'
        }
      }
    ];

    await Client.insertMany(defaultClients);
    console.log(`✅ ${defaultClients.length} clients par défaut créés`);
  }

  // Créer des articles par défaut
  const articlesCount = await Article.countDocuments();
  if (articlesCount === 0) {
    const defaultArticles = [
      {
        numeroArticle: 'TON111',
        designation: 'Toner compatible HP CE390A',
        technologie: 'TON111',
        familleProduit: 'APS BulkNiv2',
        prixUnitaire: 45.50,
        unite: 'PCE',
        stock: 100
      },
      {
        numeroArticle: 'TON121',
        designation: 'Toner compatible Canon CRG-728',
        technologie: 'TON121',
        familleProduit: 'APS BulkNiv2',
        prixUnitaire: 52.30,
        unite: 'PCE',
        stock: 75
      },
      {
        numeroArticle: 'TON120',
        designation: 'Toner compatible Brother TN-2320',
        technologie: 'TON120',
        familleProduit: 'APS Finished Product',
        prixUnitaire: 38.90,
        unite: 'PCE',
        stock: 150
      }
    ];

    await Article.insertMany(defaultArticles);
    console.log(`✅ ${defaultArticles.length} articles par défaut créés`);
  }
};

// Créer des clients et articles par défaut
const createDefaultClientsAndArticles = async () => {
  // Créer des clients par défaut
  const clientsCount = await Client.countDocuments();
  if (clientsCount === 0) {
    const defaultClients = [
      {
        nom: 'ARMOR PRINT SOLUTIONS S.A.S.',
        email: 'contact@armor.com',
        telephone: '02 96 54 71 00',
        adresse: {
          rue: 'Zone Industrielle de Kergaradec',
          ville: 'La Chapelle-sur-Erdre',
          codePostal: '44240',
          pays: 'France'
        }
      },
      {
        nom: 'TECH SOLUTIONS SARL',
        email: 'info@techsolutions.fr',
        telephone: '01 23 45 67 89',
        adresse: {
          rue: '15 Avenue des Technologies',
          ville: 'Paris',
          codePostal: '75001',
          pays: 'France'
        }
      }
    ];

    await Client.insertMany(defaultClients);
    console.log(`✅ ${defaultClients.length} clients par défaut créés`);
  }

  // Créer des articles par défaut
  const articlesCount = await Article.countDocuments();
  if (articlesCount === 0) {
    const defaultArticles = [
      {
        numeroArticle: 'TON111',
        designation: 'Toner compatible HP CE390A',
        technologie: 'TON111',
        familleProduit: 'APS BulkNiv2',
        prixUnitaire: 45.50,
        unite: 'PCE',
        stock: 100
      },
      {
        numeroArticle: 'TON121',
        designation: 'Toner compatible Canon CRG-728',
        technologie: 'TON121',
        familleProduit: 'APS BulkNiv2',
        prixUnitaire: 52.30,
        unite: 'PCE',
        stock: 75
      },
      {
        numeroArticle: 'TON120',
        designation: 'Toner compatible Brother TN-2320',
        technologie: 'TON120',
        familleProduit: 'APS Finished Product',
        prixUnitaire: 38.90,
        unite: 'PCE',
        stock: 150
      }
    ];

    await Article.insertMany(defaultArticles);
    console.log(`✅ ${defaultArticles.length} articles par défaut créés`);
  }
};

// Commandes d'exemple
const createSampleOrders = async () => {
  const existing = await Order.countDocuments();
  if (existing > 0) return [];

  const sampleOrders = [
    {
      clientLivreId: 32290,
      clientLivreFinal: 'ARMOR PRINT SOLUTIONS S.A.S.',
      articles: [
        {
          technologie: 'TON111',
          familleProduit: 'APS BulkNiv2',
          groupeCouverture: 'PF',
          quantiteCommandee: 4,
          quantiteALivrer: 4,
          quantiteExpediee: 0,
          quantiteEnPreparation: 0,
          unite: 'PCE',
          confirmations: []
        },
        {
          technologie: 'TON121',
          familleProduit: 'APS BulkNiv2',
          groupeCouverture: 'PF',
          quantiteCommandee: 2,
          quantiteALivrer: 2,
          quantiteExpediee: 0,
          quantiteEnPreparation: 0,
          unite: 'PCE',
          confirmations: []
        }
      ],
      typeCommande: 'ZIG',
      dateLivraison: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Dans 30 jours
      statut: 'confirmee'
    },
    {
      clientLivreId: 32291,
      clientLivreFinal: 'TECH SOLUTIONS SARL',
      articles: [
        {
          technologie: 'TON120',
          familleProduit: 'APS Finished Product',
          groupeCouverture: 'PF',
          quantiteCommandee: 3,
          quantiteALivrer: 3,
          quantiteExpediee: 0,
          quantiteEnPreparation: 0,
          unite: 'PCE',
          confirmations: []
        },
        {
          technologie: 'INK201',
          familleProduit: 'APS Cartridge',
          groupeCouverture: 'PF',
          quantiteCommandee: 5,
          quantiteALivrer: 5,
          quantiteExpediee: 0,
          quantiteEnPreparation: 0,
          unite: 'PCE',
          confirmations: []
        }
      ],
      typeCommande: 'ZIG',
      dateLivraison: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Dans 15 jours
      statut: 'brouillon'
    }
  ];

  const result = await Order.insertMany(sampleOrders);
  console.log(`✅ ${result.length} commandes d'exemple créées`);
  return result;
};

// Utilisateurs par défaut
const createDefaultUsers = async () => {
  const existing = await User.countDocuments();
  if (existing > 0) return [];

  const defaultUsers = [
    {
      email: 'admin@armor.com',
      password: 'password',
      nom: 'Administrateur',
      role: 'admin'
    },
    {
      email: 'user@armor.com',
      password: 'password',
      nom: 'Utilisateur',
      role: 'user'
    }
  ];

  const result = [];

  for (const userData of defaultUsers) {
    const user = new User(userData);
    await user.save();
    result.push(user);
  } 


  console.log(`✅ ${result.length} utilisateurs par défaut créés`);
  return result;
};