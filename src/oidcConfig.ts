import { ConfigParams } from 'express-openid-connect';
import * as jose from 'jose'

export const getOidcConfig = (): ConfigParams => {
    const provider = process.env.OIDC_PROVIDER;

    let options: ConfigParams = {
        authRequired: false,
    }
    switch (provider) {
        case 'auth0':
            options = {
                ...options,
                auth0Logout: true,
                idpLogout: true,
                clientID: process.env.AUTH0_CLIENT_ID!,
                issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
                clientSecret: process.env.AUTH0_CLIENT_SECRET!,
            };
            break;
        case 'google':
            options = {
                ...options,
                authRequired: false,
                idpLogout: false, // raises an error (end_session_endpoint must be configured on the issuer) - need to check
                clientID: process.env.GOOGLE_CLIENT_ID!,
                issuerBaseURL: process.env.GOOGLE_ISSUER!,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
                logoutParams: {
                    post_logout_redirect_uri: process.env.APP_BASE_URL!,
                },
            };
            break;
        case 'msal':
            options = {
                ...options,
                authRequired: false,
                idpLogout: true, // raises an error (end_session_endpoint must be configured on the issuer) - need to check
                clientID: process.env.MSAL_CLIENT_ID!,
                issuerBaseURL: process.env.MSAL_ISSUER!,
                clientSecret: process.env.MSAL_CLIENT_SECRET!,
                logoutParams: {
                    post_logout_redirect_uri: process.env.APP_BASE_URL!,
                },
                routes: {
                    callback: process.env.MSAL_CALLBACK_PATH!,
                    logout: '/logout'
                }
            };
            break;
        case 'github':
            options = {
                ...options,
                authRequired: false,
                idpLogout: true,
                clientID: process.env.GITHUB_CLIENT_ID!,
                issuerBaseURL: process.env.GITHUB_ISSUER!,
                clientSecret: process.env.GITHUB_CLIENT_SECRET!,

                authorizationParams: {
                    response_type: 'code',
                    scope: 'read:user user:email', // GitHub scopes you need for your application
                },
                routes: {
                    callback: '/callback', // The callback route to handle GitHub's response
                },
            };
            break;

        default:
            throw new Error('Unsupported OIDC provider');
    }
    return {
        ...options,
        secret: process.env.APP_SECRET!,
        baseURL: process.env.APP_BASE_URL!,
        authorizationParams: {
            response_type: 'code',
            scope: 'openid profile email',
        },
        afterCallback: (req, res, session) => {
            const claims = jose.decodeJwt(session.id_token);
            console.log('token :: ');
            console.log(claims);
            return session;
        }
    }
};
