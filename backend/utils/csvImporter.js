import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import Order from '../models/Order.js';
import User from '../models/User.js';

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
    await Order.deleteMany({});
    console.log('🗑️ Anciennes commandes supprimées');

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

    const dataLines = lines.slice(1);
    const orders = [];

    for (const line of dataLines) {
      const columns = line.split(';').map(col => col.trim());
      if (columns.length < 18) continue;

      const confirmations = [];
      for (let i = 0; i < 10; i++) {
        const qIndex = 12 + (i * 2);
        const dIndex = 13 + (i * 2);
        const quantite = parseInt(columns[qIndex]) || 0;
        const date = parseDate(columns[dIndex]);
        if (quantite > 0 && date) confirmations.push({ quantite, date });
      }

      const order = {
        technologie: columns[0] || 'TON111',
        familleProduit: columns[1] || 'APS BulkNiv2',
        groupeCouverture: columns[2] || 'PF',
        quantiteCommandee: parseInt(columns[3]) || 1,
        quantiteExpediee: parseInt(columns[4]) || 0,
        quantiteALivrer: parseInt(columns[5]) || 0,
        quantiteEnPreparation: parseInt(columns[6]) || 0,
        clientLivreId: columns[7] || '32290',
        clientLivreFinal: columns[8] || 'ARMOR PRINT SOLUTIONS S.A.S.',
        dateCreation: parseDate(columns[9]) || new Date(),
        typeCommande: columns[10] || 'ZIG',
        dateLivraison: parseDate(columns[11]) || new Date(),
        confirmations,
        unite: columns[17] || 'PCE'
      };

      orders.push(order);
    }

    const result = await Order.insertMany(orders);
    console.log(`✅ ${result.length} commandes importées depuis Book2.csv`);
    return result;
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

// Commandes d'exemple
const createSampleOrders = async () => {
  const existing = await Order.countDocuments();
  if (existing > 0) return [];

  const sampleOrders = [
    {
      technologie: 'TON111',
      familleProduit: 'APS BulkNiv2',
      groupeCouverture: 'PF',
      quantiteCommandee: 4,
      quantiteExpediee: 0,
      quantiteALivrer: 4,
      quantiteEnPreparation: 0,
      clientLivreId: '32290',
      clientLivreFinal: 'ARMOR PRINT SOLUTIONS S.A.S.',
      dateCreation: new Date('2024-02-05'),
      typeCommande: 'ZIG',
      dateLivraison: new Date('2024-02-27'),
      confirmations: [
        { quantite: 4, date: new Date('2024-05-07') }
      ],
      unite: 'PCE'
    },
    {
      technologie: 'TON121',
      familleProduit: 'APS BulkNiv2',
      groupeCouverture: 'PF',
      quantiteCommandee: 4,
      quantiteExpediee: 1,
      quantiteALivrer: 3,
      quantiteEnPreparation: 0,
      clientLivreId: '32290',
      clientLivreFinal: 'ARMOR PRINT SOLUTIONS S.A.S.',
      dateCreation: new Date('2024-02-05'),
      typeCommande: 'ZIG',
      dateLivraison: new Date('2024-02-27'),
      confirmations: [
        { quantite: 1, date: new Date('2024-02-20') },
        { quantite: 3, date: new Date('2024-05-07') }
      ],
      unite: 'PCE'
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
