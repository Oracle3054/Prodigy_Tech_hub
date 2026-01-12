// server.js
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch'); // npm i node-fetch@2
const http = require('http');
const crypto = require('crypto');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// config from .env
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET || 'sk_test_xxx';
const PORT = process.env.PORT || 3000;

// in-memory store for demo (use DB in production)
const payments = [];

// serve static files (student.html and admin.html must be in same folder)
app.use(express.static(__dirname));

// parse json with raw body available for webhook verification
app.use('/webhook', bodyParser.raw({ type: '*/*' }));
app.use(bodyParser.json()); // for other routes

// route: client asks server to verify reference after inline success
app.post('/verify', async (req, res) => {
  const { paystack_reference, tx_ref, student_name, email, amount, course } = req.body;
  try {
    const r = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(paystack_reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });
    const j = await r.json();
    if (j.status && j.data && j.data.status === 'success') {
      // record payment
      const record = {
        reference: j.data.reference,
        status: 'success',
        amount: amount || (j.data.amount / 100),
        student_name: student_name || (j.data.metadata && j.data.metadata.student_name),
        email: email || j.data.customer && j.data.customer.email,
        course: course || (j.data.metadata && j.data.metadata.course),
        time: Date.now()
      };
      payments.push(record);
      // emit to admins
      io.emit('new_payment', record);
      // optional: send SMS via Termii/Twilio here (call a function)
      // await sendSmsAdmin(`Payment: ₦${record.amount} from ${record.student_name}`);
      return res.json({ ok: true, record });
    } else {
      return res.json({ ok: false, message: 'Payment not successful', raw: j });
    }
  } catch (err) {
    console.error('verify error', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Paystack webhook endpoint (Paystack posts here when status changes)
// Paystack signs the payload with your secret key; verify signature
app.post('/webhook', (req, res) => {
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(req.body).digest('hex');
  const signature = req.headers['x-paystack-signature'];
  if (signature !== hash) {
    console.warn('Invalid signature for webhook');
    return res.status(400).send('invalid signature');
  }
  const payload = JSON.parse(req.body.toString());
  // payload.event and payload.data present
  const event = payload.event;
  const data = payload.data;
  console.log('Received webhook', event);

  // for successful charge, push and emit
  if (event === 'charge.success' || (data && data.status === 'success')) {
    const record = {
      reference: data.reference,
      status: 'success',
      amount: data.amount / 100,
      student_name: (data.metadata && data.metadata.student_name) || (data.customer && data.customer.first_name) || 'Student',
      email: data.customer && data.customer.email,
      course: data.metadata && data.metadata.course,
      time: Date.now()
    };
    payments.push(record);
    io.emit('new_payment', record);
    // optional: send SMS to admin
    // sendSmsAdmin(`New payment: ₦${record.amount} — ${record.student_name}`);
  }

  res.sendStatus(200);
});

io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);
  socket.on('admin_ready', () => {
    // send initial recent payments
    socket.emit('initial_payments', payments.slice(-50).reverse());
  });
});

// Optional SMS sender (uncomment & implement with Termii or Twilio SDK)
/*
async function sendSmsAdmin(message){
  const termiiKey = process.env.TERMII_KEY;
  const adminPhone = process.env.ADMIN_PHONE; // e.g. "23480xxxx"
  if(!termiiKey || !adminPhone) return;
  // Example with Termii REST (replace with provider details)
  await fetch('https://termii.com/api/sms/send', {
    method:'POST',
    headers:{'Content-Type':'application/json', 'Authorization': `Bearer ${termiiKey}`},
    body: JSON.stringify({
      to: adminPhone,
      from: 'Prodigy',
      sms: message
    })
  });
}
*/

server.listen(PORT, ()=> console.log(`Server running on http://localhost:${PORT}`));
