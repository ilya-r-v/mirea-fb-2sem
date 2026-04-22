const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: [true, 'Поле first_name обязательно'],
      trim: true,
      maxlength: 100,
    },
    last_name: {
      type: String,
      required: [true, 'Поле last_name обязательно'],
      trim: true,
      maxlength: 100,
    },
    age: {
      type: Number,
      required: [true, 'Поле age обязательно'],
      min: [0, 'Возраст не может быть отрицательным'],
      max: [150, 'Возраст не может превышать 150'],
    },
    created_at: {
      type: Number,
      default: () => Math.floor(Date.now() / 1000),
    },
    updated_at: {
      type: Number,
      default: () => Math.floor(Date.now() / 1000),
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

userSchema.index({ last_name: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
