import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * User Schema — supports both 'farmer' and 'admin' roles.
 * Passwords are hashed via a pre-save hook (never stored in plain text).
 * refreshToken is stored server-side so it can be invalidated on logout.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'user.name_required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'user.email_required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'user.email_invalid'],
    },
    password: {
      type: String,
      required: [true, 'user.password_required'],
      minlength: [8, 'user.password_too_short'],
    },
    role: {
      type: String,
      enum: {
        values: ['farmer', 'admin'],
        message: 'user.role_invalid',
      },
      default: 'farmer',
    },
    refreshToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

/* ------------------------------------------------------------------ */
/*  Pre-save hook — hash password only when it has been modified       */
/* ------------------------------------------------------------------ */
userSchema.pre('save', async function (next) {
  // Only hash if the password field was changed (or is new)
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------ */
/*  Instance method — compare a plain-text password against the hash  */
/* ------------------------------------------------------------------ */
userSchema.methods.comparePassword = async function (plainText) {
  return bcrypt.compare(plainText, this.password);
};

/* ------------------------------------------------------------------ */
/*  Remove sensitive fields from any JSON serialisation               */
/* ------------------------------------------------------------------ */
userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.refreshToken;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

export default User;
