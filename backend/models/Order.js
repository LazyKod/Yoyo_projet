import mongoose from 'mongoose';

const confirmationSchema = new mongoose.Schema({
  quantite: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  technologie: {
    type: String,
    required: true,
    trim: true
  },
  familleProduit: {
    type: String,
    required: true,
    enum: [
      'APS BulkNiv2',
      'APS Finished Product',
      'APS Laser Box',
      'APS Packaging Label',
      'APS Copier Box',
      'APS Cartridge Label',
      'APS Airbag/Insert/Inlay',
      'APS Packaging Other'
    ]
  },
  groupeCouverture: {
    type: String,
    required: true,
    enum: ['PF', 'OF'],
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
  clientLivreId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  clientLivreFinal: {
    type: String,
    required: true,
    trim: true
  },
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
  confirmations: [confirmationSchema],
  unite: {
    type: String,
    required: true,
    enum: ['PCE', 'KG', 'L', 'M'],
    default: 'PCE'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual pour calculer la quantité totale confirmée
orderSchema.virtual('quantiteTotaleConfirmee').get(function() {
  return this.confirmations.reduce((total, conf) => total + conf.quantite, 0);
});

// Virtual pour vérifier si la commande est entièrement confirmée
orderSchema.virtual('estEntierementConfirmee').get(function() {
  return this.quantiteTotaleConfirmee >= this.quantiteCommandee;
});

// Virtual pour obtenir la dernière date de confirmation
orderSchema.virtual('derniereDateConfirmation').get(function() {
  if (this.confirmations.length === 0) return null;
  return this.confirmations
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0].date;
});

// Index pour améliorer les performances de recherche
orderSchema.index({ clientLivreFinal: 1 });
orderSchema.index({ technologie: 1 });
orderSchema.index({ dateCreation: -1 });
orderSchema.index({ dateLivraison: 1 });
orderSchema.index({ 'confirmations.date': -1 });

// Méthode pour ajouter une confirmation
orderSchema.methods.ajouterConfirmation = function(quantite, date = new Date()) {
  const quantiteRestante = this.quantiteCommandee - this.quantiteTotaleConfirmee;
  
  if (quantite > quantiteRestante) {
    throw new Error(`Quantité trop élevée. Maximum: ${quantiteRestante}`);
  }
  
  this.confirmations.push({ quantite, date });
  this.quantiteALivrer = this.quantiteCommandee - this.quantiteTotaleConfirmee;
  
  return this.save();
};

export default mongoose.model('Order', orderSchema);