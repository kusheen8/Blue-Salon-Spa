/**
 * Appointments Routes
 */
import express from "express";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// In-memory store; replace with your database (MongoDB, Postgres, etc.)
const appointments = new Map();

// POST /api/appointments/book
router.post('/book', (req, res) => {
  const { clientName, phone, email, service, stylist, dateTime, notes } = req.body;
  if (!clientName || !service || !dateTime) {
    return res.status(400).json({ error: 'clientName, service, and dateTime are required' });
  }

  const id = uuidv4();
  const appointment = {
    id,
    clientName,
    phone,
    email,
    service,
    stylist,
    dateTime,
    notes,
    status: 'confirmed',
    createdAt: new Date(),
  };

  appointments.set(id, appointment);
  console.log(`[Appointment] Booked: ${clientName} - ${service} on ${dateTime}`);

  res.status(201).json({ success: true, appointment });
});

// GET /api/appointments/:id
router.get('/:id', (req, res) => {
  const apt = appointments.get(req.params.id);
  if (!apt) return res.status(404).json({ error: 'Appointment not found' });
  res.json(apt);
});

// GET /api/appointments (admin)
router.get('/', (req, res) => {
  res.json({ appointments: Array.from(appointments.values()) });
});

// PATCH /api/appointments/:id/cancel
router.patch('/:id/cancel', (req, res) => {
  const apt = appointments.get(req.params.id);
  if (!apt) return res.status(404).json({ error: 'Not found' });
  apt.status = 'cancelled';
  res.json({ success: true, appointment: apt });
});

export default router;
