const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user'); // Adjust the path based on your folder structure

router.get('/login', (req, res) => {
    res.render('login', { message: req.flash('error') });
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
}));

router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

router.get('/register', (req, res) => {
    res.render('register');
});

router.post('/register', (req, res) => {
    const { username, password, name } = req.body;
    const newUser = new User({ username, password, name }); // In a real application, hash the password
    newUser.save((err) => {
        if (err) {
            req.flash('error', 'Registration failed. Try again.');
            res.redirect('/register');
        } else {
            res.redirect('/login');
        }
    });
});

module.exports = router;
