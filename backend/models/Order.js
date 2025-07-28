import mongoose from 'mongoose';

const confirmationSchema = new mongoose.Schema({
  quantite: {
    type: Number,
    required: true,
    min: 0
  },
  dateConfirmation: {
    type: Date,
    required: true,
    default: Date.now
  }
}, { _id: false });

const articleCommandeSchema = new mongoose.Schema({
  technologie: {
    type: String,
    required: true,
    trim: true
  },
  familleProduit: {
    type: String,
    required: true,
    trim: true
  },
  groupeCouverture: {
    type: String,
    required: true,
    default: 'PF'
  },
  quantiteCommandee: {
    type: Number,
    required: true,
    min: 1
  },
  quantiteExpediee: {
    type: Number,
    default: 0,
    min: 0
  },
  quantiteALivrer: {
    type: Number,
    required: true,
    min: 0
  },
  quantiteEnPreparation: {
    type: Number,
    default: 0,
    min: 0
  },
  unite: {
    type: String,
    required: true,
    enum: ['PCE', 'KG', 'L', 'M'],
    default: 'PCE'
  },
  confirmations: [confirmationSchema]
}, { _id: false });

const orderSchema = new mongoose.Schema({
  // Informations client (compatible avec votre structure)
  clientLivreId: {
    type: Number,
    required: true
  },
  clientLivreFinal: {
    type: String,
    required: true,
    trim: true
  },
  
  // Articles multiples (nouveau)
  articles: [articleCommandeSchema],
  
  // Informations de commande
  dateCreation: {
    type: Date,
    required: true,
    default: Date.now
  },
  typeCommande: {
    type: String,
    required: true,
    enum: ['ZIG', 'STD'],
    default: 'ZIG'
  },
  dateLivraison: {
    type: Date,
    required: true
  },
  
  // Statut global de la commande
  statut: {
    type: String,
    enum: ['brouillon', 'confirmee', 'en_preparation', 'expediee', 'livree'],
    default: 'brouillon'
  },
  
  // Notes optionnelles
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual pour calculer la quantité totale commandée
orderSchema.virtual('quantiteTotaleCommandee').get(function() {
  return this.articles.reduce((total, article) => total + article.quantiteCommandee, 0);
});

// Virtual pour calculer la quantité totale confirmée
orderSchema.virtual('quantiteTotaleConfirmee').get(function() {
  return this.articles.reduce((total, article) => {
    const confirme = article.confirmations.reduce((sum, conf) => sum + conf.quantite, 0);
    return total + confirme;
  }, 0);
});

// Virtual pour vérifier si la commande est entièrement confirmée
orderSchema.virtual('estEntierementConfirmee').get(function() {
  return this.quantiteTotaleCommandee === this.quantiteTotaleConfirmee;
});

// Méthode pour ajouter un article à la commande
orderSchema.methods.ajouterArticle = function(articleData) {
  this.articles.push({
    technologie: articleData.technologie,
    familleProduit: articleData.familleProduit,
    groupeCouverture: articleData.groupeCouverture || 'PF',
    quantiteCommandee: articleData.quantiteCommandee,
    quantiteALivrer: articleData.quantiteCommandee,
    unite: articleData.unite || 'PCE',
    confirmations: []
  });
  return this.save();
};

// Méthode pour confirmer une quantité d'un article spécifique
orderSchema.methods.confirmerArticle = function(indexArticle, quantite) {
  if (indexArticle >= 0 && indexArticle < this.articles.length) {
    this.articles[indexArticle].confirmations.push({
      quantite: quantite,
      dateConfirmation: new Date()
    });
    return this.save();
  }
  throw new Error('Index d\'article invalide');
};

// Méthode pour confirmer toute la commande
orderSchema.methods.confirmerCommande = function() {
  if (this.statut === 'brouillon') {
    this.statut = 'confirmee';
    
    // Confirmer tous les articles non confirmés
    this.articles.forEach(article => {
      const quantiteConfirmee = article.confirmations.reduce((sum, conf) => sum + conf.quantite, 0);
      const quantiteRestante = article.quantiteCommandee - quantiteConfirmee;
      
      if (quantiteRestante > 0) {
        article.confirmations.push({
          quantite: quantiteRestante,
          dateConfirmation: new Date()
        });
      }
    });
    
    return this.save();
  }
  throw new Error('Cette commande ne peut pas être confirmée');
};

// Index pour améliorer les performances
orderSchema.index({ clientLivreId: 1 });
orderSchema.index({ clientLivreFinal: 1 });
orderSchema.index({ statut: 1 });
orderSchema.index({ dateCreation: -1 });
orderSchema.index({ dateLivraison: 1 });

export default mongoose.model('Order', orderSchema);