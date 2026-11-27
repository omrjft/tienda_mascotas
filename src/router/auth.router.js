const express = require('express');
const router = express.Router();
const authController = require('../controller/auth.controller');

router
  .post('/login', authController.login)
  .get('/me', authController.me)
  .post('/logout', authController.logout)
  .post('/register', authController.register);

module.exports = router;
