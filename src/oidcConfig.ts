import { ConfigParams } from 'express-openid-connect';
import * as jose from 'jose'

export const initializeOpenID = (): ConfigParams => {
    const authProvider = process.env.AUTHENTICATION_PROVIDER;
    console.log('authProvider :: ', authProvider)
    const oidcProvider = authProvider?.split(':')[1]
    console.log('oidcProvider :: ', oidcProvider)
    let options: ConfigParams = {
        authRequired: false,
        secret: process.env.APP_SECRET!,
        baseURL: process.env.APP_BASE_URL!,
        clientID: process.env.CLIENT_ID!,
        issuerBaseURL: process.env.ISSUER_BASE_URL!,
        clientSecret: process.env.CLIENT_SECRET!,
        idpLogout: process.env.IDP_LOGOUT === 'true',
        authorizationParams: {
            response_type: process.env.OPENID_RESPONSE_TYPE,
            scope: process.env.OPENID_SCOPE!,
        },
        routes: {
            login: '/oidc/login',
            logout: '/oidc/logout',
            postLogoutRedirect: process.env.APP_BASE_URL!,
        }
    }
    switch (oidcProvider) {
        case 'auth0':
            options.auth0Logout = true
            break;
        case 'google':
            options.logoutParams = {
                post_logout_redirect_uri: process.env.APP_BASE_URL!,
            }
            break;
        case 'msal':
            options.logoutParams = {
                post_logout_redirect_uri: process.env.APP_BASE_URL!,
            }
            options.routes = {
                callback: process.env.MSAL_CALLBACK_PATH!,
                logout: '/logout'
            }
            break;

        default:
            throw new Error('Unsupported OIDC provider');
    }
    return {
        ...options,
        afterCallback: (req, res, session) => {
            const claims = jose.decodeJwt(session.id_token);
            console.log('token :: ');
            console.log(claims);
            return session;
        }
    }
};
