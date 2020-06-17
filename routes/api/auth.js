const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');
//@ route GET api/auth
//@ Test route
//@ Public
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route POST api/auth
//@ Auth user and get token
//@ Public

router.post(
  '/',
  [
    check('email', 'Please have a valid email').isEmail(),
    check('password', 'Password is req').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Do the user exist? If not send err
      let user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'Invalid cred' }] });
      }

      //Is it a match?
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ errors: [{ msg: 'Invalid cred' }] });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      //Assign token
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 900000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error('err.message');
      res.status(500).send('Server Error Users Route');
    }
  }
);

module.exports = router;
