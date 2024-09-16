// @ts-ignore
import { Strategy as LdapStrategy, Options as LdapOptions } from 'passport-ldapauth';
import passport from "passport";
import {Express, NextFunction, Request, Response} from "express";


export const initializeLDAP = async (app: Express) => {
    // LDAP configuration using environment variables
    const LDAP_OPTIONS: LdapOptions = {
        server: {
            url: process.env.LDAP_URL || '',
            bindDN: process.env.LDAP_BIND_DN || '',
            bindCredentials: process.env.LDAP_BIND_CREDENTIALS || '',
            searchBase: process.env.LDAP_SEARCH_BASE || '',
            searchFilter: process.env.LDAP_SEARCH_FILTER || ''
        },
        usernameField: 'email',
        passwordField: 'password',
    };

    console.log('LDAP_OPTIONS :: ', LDAP_OPTIONS);

    // Initialize Passport with LDAP strategy
    passport.use(new LdapStrategy(LDAP_OPTIONS));

    // Route for LDAP authentication
    app.post(
        '/ldap/login',
        passport.authenticate('ldapauth', { session: true }),
        (req: Request, res: Response) => {
            console.log('LDAP login successful');
            console.log('User info:', req.user);
            // If authentication is successful, send a response with user info
            res.json({
                message: 'Authenticated successfully',
                user: req.user,
            });
        }
    );

    // Route for logging out
    app.post('/ldap/logout', (req: Request, res: Response) => {
        req.logout((err) => {
            if (err) {
                console.error('Error logging out:', err);
                return res.status(500).json({ message: 'Failed to log out', error: err.message });
            }

            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                    return res.status(500).json({ message: 'Failed to destroy session', error: err.message });
                }

                res.clearCookie('connect.sid'); // Clear the session cookie
                res.json({ message: 'Logged out successfully' });
            });
        });
    });

    // Define a protected route
    app.get('/profile', (req, res) => {
        console.log('/profile :: ', req.isAuthenticated());
        res.json(req.user);
    });

    console.log('/ldap/login :: ', 'LDAP login route initialized');
}

// Middleware to check if user is authenticated
const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
};