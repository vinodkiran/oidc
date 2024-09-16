import express from 'express';
import dotenv from 'dotenv';
import session from "express-session";
import passport from "passport";
import {initializeOIDC} from "./initializeOIDC";
import cookieParser from "cookie-parser";
import {initializeLDAP} from "./initializeLDAP";

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(cookieParser());

// Configure session middleware
app.use(
    session({
        secret: process.env.EXPRESS_SESSION_SECRET!,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false, httpOnly: true },
    })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware to parse JSON requests
app.use(express.json());

const authProvider = process.env.AUTHENTICATION_PROVIDER;
console.log('authProvider :: ', authProvider)
const authOptions: string[] = authProvider?.split(':') as string[]

if (authOptions && authOptions[0] === 'openid') {
    // Initialize the auth middleware with the dynamic config
    initializeOIDC(app).then(() => {
        console.log('initializeOIDC :: done');
    }).catch(console.error);
}

if (authOptions && authOptions[0] === 'ldap') {
    // Initialize the auth middleware with the dynamic config
    initializeLDAP(app).then(() => {
        console.log('initializeLDAP :: done');
    }).catch(console.error);
}

passport.serializeUser((user: any, done) => {
    console.log('serializeUser :: ', user);
    done(null, user);
});

passport.deserializeUser((user: any, done) => {
    console.log('deserializeUser :: ', user);
    done(null, user);
});



// Define the home route
app.get('/', (req, res) => {
    const user: any = req.user;
    console.log('user :: ',  req.user);
    res.send(user ? `[${process.env.AUTHENTICATION_PROVIDER}] Hello ${user?.name} (email:${user?.email})` : `[${process.env.AUTHENTICATION_PROVIDER}] Welcome! Please log in.`);
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
