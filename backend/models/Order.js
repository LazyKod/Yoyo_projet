import mongoose from 'mongoose';

const articleCommandeSchema = new mongoose.Schema({
  articleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
    required: true
  },
  numeroArticle: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  quantite: {
    type: Number,
    required: true,
    min: 1
  },
  prixUnitaire: {
    type: Number,
    required: true,
    min: 0
  },
  unite: {
    type: String,
    required: true
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  numeroCommande: {
    type: String,
    required: true,
    unique: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  articles: [articleCommandeSchema],
  dateLivraison: {
    type: Date,
    required: true
  },
  typeCommande: {
    type: String,
    required: true,
    enum: ['ZIG', 'STD'],
    default: 'ZIG'
  },
  statut: {
    type: String,
    required: true,
    enum: ['brouillon', 'confirmee', 'en_preparation', 'expediee', 'livree'],
    default: 'brouillon'
  },
  dateConfirmation: {
    type: Date
  },
  montantHT: {
    type: Number,
    default: 0
  },
  tauxTVA: {
    type: Number,
    default: 20
  },
  montantTVA: {
    type: Number,
    default: 0
  },
  montantTTC: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual pour vérifier si la commande est confirmée
orderSchema.virtual('estConfirmee').get(function() {
  return this.statut !== 'brouillon';
});

// Méthode pour générer un numéro de commande
orderSchema.statics.genererNumeroCommande = async function() {
  const count = await this.countDocuments();
  const year = new Date().getFullYear();
  return `CMD-${year}-${(count + 1).toString().padStart(4, '0')}`;
};

// Méthode pour calculer les montants
orderSchema.methods.calculerMontants = function() {
  this.montantHT = this.articles.reduce((total, article) => {
    return total + (article.quantite * article.prixUnitaire);
  }, 0);
  
  this.montantTVA = this.montantHT * (this.tauxTVA / 100);
  this.montantTTC = this.montantHT + this.montantTVA;
};

// Méthode pour confirmer la commande
orderSchema.methods.confirmerCommande = function() {
  if (this.statut === 'brouillon') {
    this.statut = 'confirmee';
    this.dateConfirmation = new Date();
    return this.save();
  }
  throw new Error('Cette commande ne peut pas être confirmée');
};

// Hook pre-save pour calculer les montants
orderSchema.pre('save', function(next) {
  this.calculerMontants();
  next();
});

// Index pour améliorer les performances
orderSchema.index({ numeroCommande: 1 });
orderSchema.index({ clientId: 1 });
orderSchema.index({ statut: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model('Order', orderSchema);