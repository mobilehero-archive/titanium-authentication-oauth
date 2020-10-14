const logger = require(`@geek/logger`).createLogger(`@titanium/authentication-oauth`, { meta: { filename: __filename } });

const TOKEN = Symbol(`token`);
const AuthToken = require(`@geek/jwt/AuthToken`);

class OAuthAuthentication {
	constructor(flowName, options = {}) {
		logger.track(`🔒  you are here →   OAuthAuthentication.constructor`);

		let Flow;
		switch (flowName) {
			case `code`:
				// TIBUG:  https://jira.appcelerator.org/browse/TIMOB-28037
				// Flow = require('./flows/CodeFlow');
				Flow = require(`./flows/Code`);
				break;

			case `password`:
				// TIBUG:  https://jira.appcelerator.org/browse/TIMOB-28037
				// Flow = require('./flows/OwnerResourceFlow');
				Flow = require(`./flows/Password`);
				break;

			default:

		}

		if (options.token) {
			if (! (options.token instanceof AuthToken)) {
				logger.warn(`Token is not an instance of AuthToken.`);
				options.token = new AuthToken(options.token);

			}
			this[TOKEN] = options.token;
		}

		this.flow = new Flow(options);

		Object.defineProperty(this, `token`, {
			enumerable: true,
			get () {
				return this[TOKEN];
			},
		});

	 }


	async logout(...args) {
		logger.track(`🔒  You are here → OAuthAuthentication.logout()`);
		this[TOKEN] = null;
		await this.flow.logout(...args);
	}

	async renew(...args) {
		logger.track(`🔒  you are here → OAuthAuthentication.renew()`);
		this[TOKEN] = await this.flow.renewAccessToken(...args);
		return this[TOKEN];
	}

	async authenticate(...args) {
		logger.track(`🔒  you are here → OAuthAuthentication.authenticate()`);
		this[TOKEN] = await this.flow.authenticate(...args);
		return this[TOKEN];
	}

	async isAuthenticated(token) {

		logger.track(`🔒  You are here → OAuthAuthentication.isAuthenticated()`);

		if (_.isNil(token)) {

			if (_.isNil(this.token)) {
				return false;
			}

			token = this.token;
		}


		if (! (token instanceof AuthToken)) {
			logger.warn(`Token is not an instance of AuthToken.`);
			// token = new OAuthAuthentication.AuthToken(token);
			return false;
		}

		return token.isAccessTokenExpired();
	}

	renewAccessToken(...args) {
		return this.flow.renewAccessToken(...args);
	}

}

OAuthAuthentication.AuthToken = AuthToken;

module.exports = OAuthAuthentication;
