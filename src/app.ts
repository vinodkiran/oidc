import express from 'express';
import { auth, requiresAuth } from 'express-openid-connect';
import dotenv from 'dotenv';
import { getOidcConfig } from './oidcConfig';

// Load environment variables from .env file
dotenv.config();

const app = express();

// Get the OIDC configuration dynamically based on the selected provider
const oidcConfig = getOidcConfig();

// Initialize the auth middleware with the dynamic config
app.use(auth(oidcConfig));

// Define a custom login route
app.get('/login', (req, res) => {
    res.oidc.login({
        returnTo: '/',
        authorizationParams: {
            scope: 'openid profile email',
            response_type: 'code',
        }
    });
});

// Define a protected route
app.get('/profile', requiresAuth(), (req, res) => {
    console.log(' /profile');
    res.json(req.oidc.user);
});

//http://localhost:3000/api/v1/msal/redirect
app.get('/api/v1/msal/redirect', (req, res) => {
    console.log(' callback :: /api/v1/msal/redirect');
    res.json(req.oidc.user);
});

// Define the home route
app.get('/', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? `[${process.env.OIDC_PROVIDER}] Hello ${req.oidc.user?.name} (email:${req.oidc.user?.email})` : `[${process.env.OIDC_PROVIDER}] Welcome! Please log in.`);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
