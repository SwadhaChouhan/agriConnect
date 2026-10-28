import User from '../models/User.js';
import Farm from '../models/Farm.js';
import Crop from '../models/Crop.js';

/**
 * GET /api/users
 * Restricted to admin
 * Returns all registered users (excluding sensitive credentials)
 */
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password -refreshToken')
      .sort({ createdAt: -1 });

    return res.status(200).json({ count: users.length, users });
  } catch (err) {
    console.error('[getUsers]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};

/**
 * DELETE /api/users/:id
 * Restricted to admin
 * Deletes a user by ID and cleans up associated farms and crops
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Guard: Prevent admin from deleting their own active account
    if (req.user && req.user.id === id) {
      return res.status(400).json({ message: 'user.cannot_delete_self' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'user.not_found' });
    }

    // Clean up all farms and crops owned by this user
    const farms = await Farm.find({ owner: id });
    const farmIds = farms.map((f) => f._id);

    if (farmIds.length > 0) {
      await Crop.deleteMany({ farm: { $in: farmIds } });
      await Farm.deleteMany({ owner: id });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({ message: 'user.deleted' });
  } catch (err) {
    console.error('[deleteUser]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};
