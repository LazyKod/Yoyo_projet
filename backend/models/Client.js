import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
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
    trim: true
  },
  adresse: {
    rue: { type: String, trim: true },
    ville: { type: String, trim: true },
    codePostal: { type: String, trim: true },
    pays: { type: String, default: 'France', trim: true }
  },
  actif: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
clientSchema.index({ nom: 1 });

export default mongoose.model('Client', clientSchema);