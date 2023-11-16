// @ts-ignore
// eslint-disable-next-line
import { openTokenAuthUrl } from '../authentication/actions';

// @ts-ignore
import { getTokenAuthUrl, isTokenAuthEnabled } from '../authentication/functions';
import { getJwtExpirationDate } from '../base/jwt/functions';
import { getLocationContextRoot, parseURIString } from '../base/util/uri';

import { addTrackStateToURL } from './functions.any';
import logger from './logger';
import { IStore } from './types';

/**
 * Redirects to another page generated by replacing the path in the original URL
 * with the given path.
 *
 * @param {(string)} pathname - The path to navigate to.
 * @returns {Function}
 */
export function redirectWithStoredParams(pathname: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { locationURL } = getState()['features/base/connection'];
        const newLocationURL = new URL(locationURL?.href ?? '');

        newLocationURL.pathname = pathname;
        window.location.assign(newLocationURL.toString());
    };
}

/**
 * Assigns a specific pathname to window.location.pathname taking into account
 * the context root of the Web app.
 *
 * @param {string} pathname - The pathname to assign to
 * window.location.pathname. If the specified pathname is relative, the context
 * root of the Web app will be prepended to the specified pathname before
 * assigning it to window.location.pathname.
 * @param {string} hashParam - Optional hash param to assign to
 * window.location.hash.
 * @returns {Function}
 */
export function redirectToStaticPage(pathname: string, hashParam?: string) {
    return () => {
        const windowLocation = window.location;
        let newPathname = pathname;

        if (!newPathname.startsWith('/')) {
            // A pathname equal to ./ specifies the current directory. It will be
            // fine but pointless to include it because contextRoot is the current
            // directory.
            newPathname.startsWith('./')
                && (newPathname = newPathname.substring(2));
            newPathname = getLocationContextRoot(windowLocation) + newPathname;
        }

        if (hashParam) {
            windowLocation.hash = hashParam;
        }

        windowLocation.pathname = newPathname;
    };
}

/**
 * Reloads the page by restoring the original URL.
 *
 * @returns {Function}
 */
export function reloadWithStoredParams() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const { locationURL } = state['features/base/connection'];

        // Preserve the local tracks muted states.
        // @ts-ignore
        const newURL = addTrackStateToURL(locationURL, state);
        const windowLocation = window.location;
        const oldSearchString = windowLocation.search;

        windowLocation.replace(newURL.toString());

        if (newURL.search === oldSearchString) {
            // NOTE: Assuming that only the hash or search part of the URL will
            // be changed!
            // location.replace will not trigger redirect/reload when
            // only the hash params are changed. That's why we need to call
            // reload in addition to replace.
            windowLocation.reload();
        }
    };
}

/**
 * Checks whether tokenAuthUrl is set, we have a jwt token that will expire soon
 * and redirect to the auth url to obtain new token if this is the case.
 *
 * @param {Dispatch} dispatch - The Redux dispatch function.
 * @param {Function} getState - The Redux state.
 * @param {Function} failureCallback - The callback on failure to obtain auth url.
 * @returns {boolean} Whether we will redirect or not.
 */
export function maybeRedirectToTokenAuthUrl(
        dispatch: IStore['dispatch'], getState: IStore['getState'], failureCallback: Function) {
    const state = getState();
    const config = state['features/base/config'];
    const { locationURL = { href: '' } as URL } = state['features/base/connection'];

    if (!isTokenAuthEnabled(config)) {
        return false;
    }

    // if tokenAuthUrl check jwt if is about to expire go through the url to get new token
    const jwt = state['features/base/jwt'].jwt;
    const expirationDate = getJwtExpirationDate(jwt);

    // if there is jwt and its expiration time is less than 3 minutes away
    // let's obtain new token
    if (expirationDate && expirationDate.getTime() - Date.now() < 3 * 60 * 1000) {
        const room = state['features/base/conference'].room;
        const { tenant } = parseURIString(locationURL.href) || {};

        getTokenAuthUrl(config, room, tenant, true, locationURL)
            .then((tokenAuthServiceUrl: string | undefined) => {
                if (!tokenAuthServiceUrl) {
                    logger.warn('Cannot handle login, token service URL is not set');

                    return Promise.reject();
                }

                return dispatch(openTokenAuthUrl(tokenAuthServiceUrl));
            })
            .catch(() => {
                failureCallback();
            });

        return true;
    }

    return false;
}


