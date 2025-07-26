import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import { importOrdersFromCSV, importUsersFromCSV } from './utils/csvImporter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Fonction d'initialisation de la base de données
const initializeDatabase = async () => {
  try {
    // Connecter à MongoDB
    await connectDB();
    
    // Importer les données depuis les fichiers CSV
    console.log('📊 Importation des données depuis les fichiers CSV...');
    await importUsersFromCSV();
    await importOrdersFromCSV();
    
    console.log('✅ Base de données initialisée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
  }
};

// Initialiser la base de données au démarrage
initializeDatabase();

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Serveur opérationnel avec MongoDB', 
    timestamp: new Date().toISOString(),
    database: 'MongoDB connecté'
  });
});

// Servir les fichiers statiques en production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
} else {
  // Route de base pour le développement
  app.get('/', (req, res) => {
    res.json({ 
      message: 'API Armor Print Solutions - Gestion des commandes avec MongoDB',
      status: 'Serveur opérationnel',
      endpoints: {
        auth: '/api/auth/login',
        orders: '/api/orders',
        health: '/api/health'
      }
    });
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📡 API disponible sur http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend disponible sur http://localhost:3000`);
});
import { startCron } from './cron.js';

startCron();

