import Consultation from '../models/Consultation.js';

/**
 * CREATE POST /api/consultations
 * Farmer creates a new consultation ticket
 */
export const createConsultation = async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ message: 'consultation.subject_required' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'consultation.message_required' });
    }

    const consultation = await Consultation.create({
      farmer: req.user.id,
      subject: subject.trim(),
      message: message.trim(),
    });

    return res.status(201).json({
      message: 'consultation.created',
      consultation,
    });
  } catch (err) {
    console.error('[createConsultation]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};

/**
 * READ GET /api/consultations/my
 * Farmer gets their own consultation tickets
 */
export const getMyConsultations = async (req, res) => {
  try {
    const consultations = await Consultation.find({ farmer: req.user.id })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: consultations.length,
      consultations,
    });
  } catch (err) {
    console.error('[getMyConsultations]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};

/**
 * READ ALL GET /api/consultations
 * Admin gets all consultation tickets across all farmers
 */
export const getAllConsultations = async (req, res) => {
  try {
    const consultations = await Consultation.find({})
      .populate('farmer', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: consultations.length,
      consultations,
    });
  } catch (err) {
    console.error('[getAllConsultations]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};

/**
 * UPDATE PUT /api/consultations/:id/reply
 * Admin updates the ticket with an adminReply and marks status as resolved
 */
export const replyToConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminReply } = req.body;

    if (!adminReply || !adminReply.trim()) {
      return res.status(400).json({ message: 'consultation.reply_required' });
    }

    const consultation = await Consultation.findById(id);

    if (!consultation) {
      return res.status(404).json({ message: 'consultation.not_found' });
    }

    consultation.adminReply = adminReply.trim();
    consultation.status = 'resolved';

    await consultation.save();

    return res.status(200).json({
      message: 'consultation.replied',
      consultation,
    });
  } catch (err) {
    console.error('[replyToConsultation]', err);
    return res.status(500).json({ message: 'server.internal_error' });
  }
};
