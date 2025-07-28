import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema({
  numeroArticle: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  designation: {
    type: String,
    required: true,
    trim: true
  },
  technologie: {
    type: String,
    required: true,
    trim: true
  },
  familleProduit: {
    type: String,
    required: false,
    default: 'APS BulkNiv2',
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
  prixUnitaire: {
    type: Number,
    required: true,
    min: 0
  },
  unite: {
    type: String,
    required: false,
    default: 'PCE',
    enum: ['PCE', 'KG', 'L', 'M'],
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  stockReserve: {
    type: Number,
    default: 0,
    min: 0
  },
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual pour le stock disponible
articleSchema.virtual('stockDisponible').get(function() {
  return this.stock - this.stockReserve;
});

// Index pour améliorer les performances
articleSchema.index({ technologie: 1 });
articleSchema.index({ familleProduit: 1 });

export default mongoose.model('Article', articleSchema);