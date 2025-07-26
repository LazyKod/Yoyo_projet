import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    // Options de connexion recommandées
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    // Connexion à MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
    console.log(`📊 Base de données: ${conn.connection.name}`);
    
    // Gestion des événements de connexion
    mongoose.connection.on('connected', () => {
      console.log('🔗 Mongoose connecté à MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Erreur de connexion MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Mongoose déconnecté de MongoDB');
    });

    // Fermeture propre de la connexion lors de l'arrêt de l'application
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🛑 Connexion MongoDB fermée suite à l\'arrêt de l\'application');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB:', error.message);
    
    // En développement, on peut continuer sans MongoDB
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Mode développement: continuation sans MongoDB');
      console.log('💡 Vérifiez votre MONGODB_URI dans le fichier .env');
    } else {
      // En production, on arrête l'application
      process.exit(1);
    }
  }
};

export default connectDB;