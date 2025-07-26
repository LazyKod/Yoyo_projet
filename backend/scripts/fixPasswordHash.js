import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import connectDB from '../config/database.js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const fixPasswordHashes = async () => {
  try {
    console.log('🚀 Démarrage du script de correction...\n');
    
    // Connexion à la base de données
    await connectDB();
    console.log('📊 Connexion à MongoDB établie\n');

    // Trouver tous les utilisateurs
    const users = await User.find({});
    console.log(`👥 ${users.length} utilisateur(s) trouvé(s)\n`);

    if (users.length === 0) {
      console.log('⚠️  Aucun utilisateur trouvé en base de données');
      process.exit(0);
    }

    for (const user of users) {
      console.log(`👤 Traitement de: ${user.email}`);
      console.log(`   Mot de passe actuel: ${user.password.substring(0, 20)}...`);
      
      // Vérifier si le mot de passe est déjà hashé (commence par $2a$ ou $2b$)
      const isAlreadyHashed = user.password.startsWith('$2a$') || 
                             user.password.startsWith('$2b$') || 
                             user.password.startsWith('$2y$');
      
      if (isAlreadyHashed) {
        console.log(`   ✅ Mot de passe déjà hashé (longueur: ${user.password.length})`);
        
        // Test de validation du hash existant
        try {
          const testResult = await bcrypt.compare('password', user.password);
          console.log(`   🧪 Test avec 'password': ${testResult ? '✅ Fonctionne' : '❌ Ne fonctionne pas'}`);
        } catch (error) {
          console.log(`   ⚠️  Erreur de test: ${error.message}`);
        }
        console.log('');
        continue;
      }

      // Le mot de passe est en texte brut, on le hash
      console.log(`   🔐 Hash du mot de passe en cours...`);
      console.log(`   📝 Mot de passe original: "${user.password}"`);
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      
      console.log(`   🔑 Nouveau hash généré: ${hashedPassword.substring(0, 30)}...`);
      
      // Mettre à jour en base sans déclencher les hooks
      const updateResult = await User.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword } }
      );
      
      if (updateResult.modifiedCount === 1) {
        console.log(`   ✅ Mot de passe mis à jour avec succès`);
        
        // Vérification immédiate
        const updatedUser = await User.findById(user._id);
        const testValid = await updatedUser.comparePassword(user.password);
        console.log(`   🎯 Test de validation: ${testValid ? '✅ OK' : '❌ ECHEC'}`);
      } else {
        console.log(`   ❌ Échec de la mise à jour`);
      }
      
      console.log('');
    }

    console.log('🎉 Correction terminée!\n');
    
    // Test final avec l'utilisateur admin
    console.log('🧪 Test final de connexion admin...');
    const adminUser = await User.findOne({ email: 'admin@armor.com' });
    
    if (adminUser) {
      console.log(`📧 Admin trouvé: ${adminUser.email}`);
      console.log(`🔐 Hash stocké: ${adminUser.password.substring(0, 30)}...`);
      
      const testPasswords = ['password', 'Password', 'admin'];
      
      for (const testPwd of testPasswords) {
        try {
          const isValid = await adminUser.comparePassword(testPwd);
          console.log(`   Test "${testPwd}": ${isValid ? '✅ VALIDE' : '❌ INVALIDE'}`);
          
          if (isValid) {
            console.log(`\n🎊 SUCCÈS! Vous pouvez maintenant vous connecter avec:`);
            console.log(`   📧 Email: admin@armor.com`);
            console.log(`   🔑 Mot de passe: ${testPwd}`);
            break;
          }
        } catch (error) {
          console.log(`   Test "${testPwd}": ❌ ERREUR - ${error.message}`);
        }
      }
    } else {
      console.log('❌ Utilisateur admin introuvable');
    }
    
    console.log('\n✨ Script terminé avec succès!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution du script:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

// Lancer le script
fixPasswordHashes();