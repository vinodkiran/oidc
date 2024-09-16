import {Issuer, Client, Strategy as OpenIDStrategy, TokenSet, UserinfoResponse} from 'openid-client';
import passport from "passport";
import {Express, NextFunction, Request, Response} from "express";
import jwt from 'jsonwebtoken';

// OIDC Client Configuration
let client: Client;

export const initializeOIDC = async (app: Express) => {
    const issuer = await Issuer.discover(process.env.OPENID_ISSUER_BASE_URL!);
    client = new issuer.Client({
        client_id: process.env.OPENID_CLIENT_ID!,
        client_secret: process.env.OPENID_CLIENT_SECRET!,
        redirect_uris: [process.env.OPENID_CALLBACK_URL!],
        routes: {
            login: '/openid/login',
            logout: '/openid/logout',
            postLogoutRedirect: process.env.APP_BASE_URL!,
        }
    });

    const openidLogin = new OpenIDStrategy(
        {
            client,
            params: {
                scope: process.env.OPENID_SCOPE
            },
        },
        async (tokenset: TokenSet, userinfo: UserinfoResponse, done:any) => {
            try {
                console.log(`[openidStrategy] verify login openidId: ${userinfo.sub}`);
                console.log('[openidStrategy] very login tokenset and userinfo', { tokenset, userinfo });

                // let user = await findUser({ openidId: userinfo.sub });
                // logger.info(
                //     `[openidStrategy] user ${user ? 'found' : 'not found'} with openidId: ${userinfo.sub}`,
                // );
                //
                // if (!user) {
                //     user = await findUser({ email: userinfo.email });
                //     logger.info(
                //         `[openidStrategy] user ${user ? 'found' : 'not found'} with email: ${
                //             userinfo.email
                //         } for openidId: ${userinfo.sub}`,
                //     );
                // }
                const user = {
                    email: userinfo.email,
                    name: userinfo.name,
                    verified: userinfo.email_verified,
                    token: tokenset.id_token,
                    workspaceId: 'aaa'
                }
                done(null, user);
            } catch (err) {
                console.error('[openidStrategy] login failed', err);
                done(err, null);
            }
        },
    );
    passport.use('openid', openidLogin);

    const oauthHandler = async (req: any, res: any) => {
        try {
            console.log('oauth handler user :: ' + JSON.stringify(req.user));
            // Return the token as a cookie in our response.
            res.cookie('token', req.user.token, { httpOnly: true, secure: false })
                .redirect(process.env.APP_BASE_URL!);
        } catch (err) {
            console.log('Error in setting authentication tokens:', err);
        }
    };

    app.get(
        '/openid/login',
        passport.authenticate('openid', {
            session: true,
        }),
    );

    // Logout route
    app.get('/openid/logout', (req: Request, res: Response) => {
        // Use passport's req.logout() to end the session
        req.logout((err) => {
            if (err) {
                console.error('Logout error:', err);
                return res.status(500).send('Error during logout');
            }

            // Clear the ID token cookie
            res.clearCookie('token', {
                httpOnly: true
            });
            console.log('Logged out successfully, redirecting to home page');
            res.redirect(process.env.APP_BASE_URL!);
        });
    });

    app.get(
        '/callback',
        passport.authenticate('openid', {
            failureRedirect: process.env.APP_BASE_URL!,
            failureMessage: true,
            session: true,
        }),
        oauthHandler,
    );

    //http://localhost:3000/api/v1/msal/redirect
    app.get('/api/v1/msal/redirect',
        passport.authenticate('openid', {
            failureRedirect: process.env.APP_BASE_URL!,
            failureMessage: true,
            session: true,
        }),
        oauthHandler
    );
}

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const idToken = req.cookies['token']; // Get the token from the cookie

        if (!idToken) {
            return res.status(401).send('Unauthorized: No token provided');
        }

        // Decode the ID token header to get the key ID (kid)
        const decodedHeader: any = jwt.decode(idToken, { complete: true });
        console.log('decodedHeader :: ', decodedHeader);

        console.log('user :: ', req.user);
        // const publicKeysUrl = process.env.OPENID_KEYS_URL!;
        // const { data } = await axios.get(publicKeysUrl);
        // console.log('data :: ', data);
        // const keys = data.keys;
        //
        // console.log('keys :: ', keys);
        // const kid = decodedHeader?.header.kid;
        // console.log('kid :: ', kid);
        // // Find the matching public key
        // const key = keys.find((k: any) => k.kid === kid);
        // if (!key) {
        //     return res.status(401).send('Unauthorized: Invalid token key');
        // }
        //
        // console.log('key :: ', key);
        // console.log('key.x5c :: ', key.x5c);
        // // Construct the public key in PEM format
        // const publicKey = `-----BEGIN CERTIFICATE-----\n${key.x5c[0]}\n-----END CERTIFICATE-----`;
        //
        // console.log('publicKey :: ', publicKey);
        // // Verify the token
        // const verifiedToken = jwt.verify(idToken, publicKey, {
        //     algorithms: ['RS256'],
        //     issuer: process.env.OPENID_ISSUER_BASE_URL,
        //     audience: process.env.OPENID_CLIENT_ID
        // });

        // req.user = verifiedToken; // Attach verified token info to request for further use
        next();
    } catch (error) {
        console.error('Token validation error:', error);
        res.status(401).send('Unauthorized: Invalid token');
    }
}