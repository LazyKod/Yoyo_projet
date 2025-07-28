import mongoose from 'mongoose';

const adresseSchema = new mongoose.Schema({
  rue: { type: String, trim: true, default: '' },
  ville: { type: String, trim: true, default: '' },
  codePostal: { type: String, trim: true, default: '' },
  pays: { type: String, default: 'France', trim: true }
}, { _id: false });

const clientSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  entreprise: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
  },
  telephone: {
    type: String,
    trim: true,
    default: ''
  },
  fax: {
    type: String,
    trim: true,
    default: ''
  },
  // Adresse 1 (principale/facturation)
  adresse1: {
    type: adresseSchema,
    default: () => ({})
  },
  // Adresse 2 (livraison)
  adresse2: {
    type: adresseSchema,
    default: () => ({})
  },
  // Option pour utiliser la même adresse pour la livraison
  memeAdresseLivraison: {
    type: Boolean,
    default: true
  },
  numeroClient: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Générer automatiquement un numéro de client
clientSchema.pre('save', async function(next) {
  if (!this.numeroClient && this.isNew) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Client').countDocuments();
    this.numeroClient = `CLI-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

// Virtual pour l'adresse de livraison effective
clientSchema.virtual('adresseLivraisonEffective').get(function() {
  return this.memeAdresseLivraison ? this.adresse1 : this.adresse2;
});

// Index pour améliorer les performances
clientSchema.index({ nom: 1 });
clientSchema.index({ entreprise: 1 });

export default mongoose.model('Client', clientSchema);