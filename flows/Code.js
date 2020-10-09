/* eslint-disable func-style */
/* eslint-disable promise/avoid-new */
// RFC for OAuth2: https://tools.ietf.org/html/rfc6749

const Please = require('@titanium/please');
const fs = require('fs');
const path = require('path');
const logger = require('@geek/logger').createLogger('@titanium/authentication-oauth', { meta: { filename: __filename } });

const AuthenticationToken = require('../AuthToken');

const webdialog = require('@titanium/webdialog');
let deeply;
if (OS_ANDROID) {
	deeply = require('ti.deeply');
}

function buildURL(baseURL, params) {
	const encodedParams = [];

	for (const param in params) {
		if (! _.isNil(params[param])) {
			encodedParams.push(`${encodeURIComponent(param)}=${encodeURIComponent(params[param])}`);
		}
	}
	return `${baseURL}?${encodedParams.join('&')}`;
}

/**
 * Generate a GUID to use for state parameter used to prevent CSRF.
 * @returns {string} Generated GUID.
 */
function generateGUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
		const r = (Math.random() * 16) | 0;
		const v = c == 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/**
 * Returns an Object with the query param key/value pairs.
 * @param  {string} url - URL containing query params.
 * @param  {string} callbackUrl - The callback URL passed along.
 * @returns {object}	 Key/value pairs from query params on an URL.
 */
function parseQueryParams(url, callbackUrl) {
	const queryParams = {};
	let pairs = [];
	let keyValuePair;

	// FIXME handle when there are no query params?
	pairs = decodeURI(url)
		.slice(callbackUrl.length + 1)
		.split('&'); // cut off base callback URL and ? char

	for (let i = 0; i < pairs.length; i++) {
		keyValuePair = pairs[i].split('=');
		queryParams[keyValuePair[0]] = keyValuePair[1];
	}

	return queryParams;
}

class Code {
	constructor({
		client_id,
		callback_url,
		public_key,
		token,
		scopes = 'openid info offline_access',
		endpoints: {
			auth: auth_endpoint,
			certs: certs_endpoint,
			logout: logout_endpoint,
			token: token_endpoint,
			userinfo: userinfo_endpoint,
			wellknown: wellknown_endpoint,
		} = {},
	}) {
		this.client_id = client_id;
		this.callback_url = callback_url;
		// this.accessToken = null;
		// this.refreshToken = null;
		this.auth_token = token;
		this.auth_endpoint = auth_endpoint;
		this.certs_endpoint = certs_endpoint;
		this.logout_endpoint = logout_endpoint;
		this.token_endpoint = token_endpoint;
		this.token_endpoint = token_endpoint;
		this.userinfo_endpoint = userinfo_endpoint;
		this.wellknown_endpoint = wellknown_endpoint;
		this.scopes = scopes;
		this.please = new Please();
		this.public_key = public_key;
	}

	async authenticate() {
		logger.track('🔒  you are here → oauth.code.authenticate()');

		// logger.debug(`🔒  auth_endpoint: ${JSON.stringify(this.auth_endpoint, null, 2)}`);

		return new Promise((resolve, reject) => {
			const state = generateGUID();
			turbo.events.removeAllListeners('codeflow::open::dialog');
			const next = async (err, code) => {
				logger.track('🔒  you are here → oauth.code.authenticate().next()');
				logger.debug(`🔒  oauth code: ${JSON.stringify(code, null, 2)}`);

				turbo.openLoadingScreen();

				// webdialog.removeEventListener('close', onWebdialogClose);
				if (err) {
					if (OS_IOS) {
						webdialog.close();
						turbo.closeLoadingScreen();
						alert('Server error.  Please try again.');
					}
					return reject(err);
				}

				// On iOS we need to close the webview ourselves,
				// on Android due to the intentFlags we pass. The
				// webdialog closes automatically for us due to the
				// intent flags we pass
				if (OS_IOS) {
					webdialog.close();
				}
				try {
					const auth = await this.please
						.debug(false)
						.form({
							grant_type:   'authorization_code',
							code,
							redirect_uri: this.callback_url,
							client_id:    this.client_id,
						})
						.post(this.token_endpoint);
					// this.storeInformation(auth);

					logger.track('📌  you are here → firing event: authentication::success::code');
					turbo.events.fire('authentication::success::code');
					Alloy.close('login-required');
					this.auth_token = new AuthenticationToken(auth.json, { key: this.public_key });
					// return resolve(auth);
					return resolve(this.auth_token);
				} catch (error) {
					logger.error(error);
					return reject(error);
				}
			};

			const url = buildURL(this.auth_endpoint, {
				response_type:   'code',
				client_id:       this.client_id,
				redirect_uri:    this.callback_url,
				// scope:           this.scopes,  // this seems to be causing some issues right now...
				approval_prompt: 'force',
				btmpl:           'mobile',
				state,
			});

			logger.debug(`🔒 auth endpoint url: ${JSON.stringify(url, null, 2)}`);

			const handleUrl = async eventData => {
				let launchInformation;

				logger.debug(`🔒  eventData: ${JSON.stringify(eventData, null, 2)}`);
				logger.debug(`🔒  launchInformation: ${JSON.stringify(launchInformation, null, 2)}`);

				// Extract the URL out of the event data
				if (OS_ANDROID) {
					launchInformation = eventData.data;
				} else if (OS_IOS) {
					launchInformation = eventData.launchOptions.url;
				}

				if (launchInformation && !launchInformation.startsWith(this.callback_url)) {
					return;
				}

				// Remove the handleUrl call
				if (OS_IOS) {
					Ti.App.iOS.removeEventListener('handleurl', handleUrl);
				}

				// Parse out the data from the URL
				const queryParams = parseQueryParams(launchInformation, this.callback_url);

				if (queryParams.error) {
					return next(queryParams.error_description || queryParams.error);
				}

				if (queryParams.code) {
					// check CSRF
					if (queryParams.state !== state) {
						try {
							Alloy.Globals.ACA.logHandledException(
								`Possible Cross-site request forgery. ${state} doesn't match ${queryParams.state}`,
							);
						} catch (error) {
							// squash
						}
					}
					return next(null, queryParams.code);
				}
			};

			if (OS_ANDROID) {
				deeply.setCallback(handleUrl);
			} else if (OS_IOS) {
				Ti.App.iOS.addEventListener('handleurl', handleUrl);
			}

			const webdialogOptions = {
				url,
				title:                  'Login',
				showTitle:              true,
				barCollapsingEnabled:   false,
				enterReaderIfAvailable: false,
			 };

			if (OS_ANDROID) {
				webdialogOptions.intentFlags = Ti.Android.FLAG_ACTIVITY_NO_HISTORY | Ti.Android.FLAG_ACTIVITY_NEW_TASK;
			}

			turbo.events.on('codeflow::open::dialog', e => {
				logger.track('🔒  you are here → opening webdialog');
				logger.debug(`🔒  webdialogOptions: ${JSON.stringify(webdialogOptions, null, 2)}`);
				webdialog.open(webdialogOptions);
			});

			Alloy.open('login-required');

		});
	}

	async renewAccessToken(token) {
		logger.track('🔒  you are here → oauth.code.renewAccessToken()');

		const auth_token = token || this.auth_token;
		logger.secret(`🔒  auth_token to renew: ${JSON.stringify(auth_token, null, 2)}`);

		if (_.isNil(auth_token)) {
			//TODO: Should we throw error here?
			return false;
		}
		const { refresh_token } = auth_token;
		if (refresh_token) {

			logger.trace(`📌  you are here → calling please`);
			const auth = await this.please
				.form({
					client_id:  this.client_id,
					refresh_token,
					grant_type: 'refresh_token',
				})
				.debug(turbo.API_VERBOSE_MODE)
				.timeout(10000)
				.post(this.token_endpoint)
				.catch(error => {
					logger.error(`🛑  renewAccessToken.error: ${JSON.stringify(error, null, 2)}`);
					console.error(error);
					throw error;
				});

			if (! auth) {
				// An error occurred when refreshing the token
				return;
			}

			// logger.verbose(`🔒  auth: ${JSON.stringify(auth, null, 2)}`);
			return new AuthenticationToken(auth.json, { key: this.public_key });

		} else {
			return;
		}
	}

	async logout(token) {
		logger.track('📌  you are here → oauth.code.logout()');

		// clearInterval(turbo.refresh_token_timer);
		// turbo.refresh_token_timer = null;

		const auth_token = token || this.auth_token;

		if (_.isNil(auth_token)) {
			//TODO: Should we throw error here?
			return false;
		}

		logger.secret(`🔒  OAuth logout - auth_token.access_token: ${JSON.stringify(auth_token.access_token, null, 2)}`);
		logger.secret(`🔒  OAuth logout - auth_token.refresh_token: ${JSON.stringify(auth_token.refresh_token, null, 2)}`);

		await this.please
			.bearer(auth_token.access_token)
			.form({
				client_id:     this.client_id,
				refresh_token: auth_token.refresh_token,
			})
			.responseType('none')
			.debug(turbo.API_VERBOSE_MODE)
			.post(this.logout_endpoint)
			.catch(error => {
				console.error(`🛑 OAuth logout error: ${JSON.stringify(error, null, 2)}`);
				logger.error('OAuth logout error', error);
				// throw error;
			})
			.finally(() => {
				this.auth_token = null;
			});


	}

}

module.exports = Code;
