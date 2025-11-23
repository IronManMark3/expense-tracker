const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const CATEGORIES = ['Food','Travel','Groceries','Friend','Bills','Entertainment','Health','Other'];

router.get('/categories', auth, (req, res) => res.json(CATEGORIES));

module.exports = router;
