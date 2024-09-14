import express from 'express';
import { auth, requiresAuth } from 'express-openid-connect';
import dotenv from 'dotenv';
import { initializeOpenID } from './oidcConfig';
import session from "express-session";
import passport from "passport";

// Load environment variables from .env file
dotenv.config();

const app = express();

// Configure session middleware
app.use(
    session({
        secret: 'LONG_RANDOM_SECRET', // Use a strong secret for signing the cookie
        resave: false,
        saveUninitialized: true,
    })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Get the OIDC configuration dynamically based on the selected provider
const oidcConfig = initializeOpenID();

// Initialize the auth middleware with the dynamic config
app.use(auth(oidcConfig));

// Integrate `express-openid-connect` with Passport
passport.serializeUser((user: any, done) => {
    console.log('serializeUser :: ', user);
    done(null, user);
});

passport.deserializeUser((user: any, done) => {
    console.log('deserializeUser :: ', user);
    done(null, user);
});

// Define a custom login route
app.get('/oidc/login', (req, res) => {
    res.oidc.login({
        returnTo: '/',
        authorizationParams: {
            scope: process.env.OPENID_SCOPE,
            response_type:  process.env.OPENID_RESPONSE_TYPE,
        }
    });
});

// Define a protected route
app.get('/profile', requiresAuth(), (req, res) => {
    console.log(' /profile');
    res.json(req.oidc.user);
});

// Logout route
app.get('/oidc/logout', (req, res) => {
    req.logout(() => {
        console.log(' /logout');
        res.redirect('/');
    });
});

//http://localhost:3000/api/v1/msal/redirect
app.get('/api/v1/msal/redirect', (req, res) => {
    res.json(req.oidc.user);
});

// Define the home route
app.get('/', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? `[${process.env.AUTHENTICATION_PROVIDER}] Hello ${req.oidc.user?.name} (email:${req.oidc.user?.email})` : `[${process.env.AUTHENTICATION_PROVIDER}] Welcome! Please log in.`);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
