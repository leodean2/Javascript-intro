const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// @route   POST api/orders
// @desc    Create an order
router.post('/', auth, async (req, res) => {
  const {
    customer_name,
    customer_email,
    customer_phone,
    customer_address,
    items,
    total_amount,
  } = req.body;

  try {
    const newOrder = new Order({
      user: req.user.id,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      items,
      total_amount,
    });

    const order = await newOrder.save();

    // Update stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product_id, {
        $inc: { stock_quantity: -item.quantity },
      });
    }

    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/orders
// @desc    Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ created_at: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/orders/me
// @desc    Get logged in user's orders
router.get('/me', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ created_at: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/orders/:id
// @desc    Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/orders/:id/status
// @desc    Update order status
router.put('/:id/status', async (req, res) => {
  const { status } = req.body;

  try {
    let order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ msg: 'Order not found' });

    order.status = status;
    order.updated_at = Date.now();

    await order.save();

    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
