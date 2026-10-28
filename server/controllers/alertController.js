import PestAlert from '../models/PestAlert.js';

export const createAlert = async (req, res) => {
  try {
    const { title, description, severity, region } = req.body;

    if (!title || !description || !severity || !region) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const alert = await PestAlert.create({
      title,
      description,
      severity,
      region,
      createdBy: req.user.id, // Using req.user.id from your JWT
    });

    res.status(201).json(alert);
  } catch (err) {
    console.error('createAlert error:', err);
    res.status(500).json({ message: 'Server error while creating alert.' });
  }
};

export const getActiveAlerts = async (req, res) => {
  try {
    const alerts = await PestAlert.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    console.error('getActiveAlerts error:', err);
    res.status(500).json({ message: 'Server error while fetching alerts.' });
  }
};