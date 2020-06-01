const OAuth = require('./oauth');
const moment = require('moment');

class OAuthAuthentication {
	constructor(options) {
		turbo.trace('🔒  you are here →   OAuthAuthentication.constructor');
		this.oauth = new OAuth(options);

	 }

	async authenticate({ username, password }) {
		turbo.trace('🔒  you are here →   OAuthAuthentication.authenticate');
		try {
			const token = await this.oauth.owner.getToken({ username, password });
			turbo.debug(`🦠  token: ${JSON.stringify(token, null, 2)}`);

			// response.user = {
			// 	username:       token.username,
			// 	first_name:     token.given_name,
			// 	last_name:      token.family_name,
			// 	formatted_name: token.name,
			// 	email:          token.email,
			// };
			// response.token = token;
			// return response;

			return token;

		} catch (error) {

			console.error(`🛑  error: ${JSON.stringify(error, null, 2)}`);
			console.error(error);
			return {
				authenticated: false,
				scopes:        [],
			};
		}
	}

	async isAuthenticated() {

		turbo.trace('📌  You are here → OAuthAuthentication.isAuthenticated)');

		if (_.isNil(turbo.data.current_auth)) {
			return false;
		}

		// DEBUG: access_token_expires_at
		turbo.debug(`🦠  access_token_expires_at: ${JSON.stringify(this.access_token_expires_at, null, 2)}`);

		// DEBUG: access_token_expires_in
		turbo.debug(`🦠  access_token_expires_in: ${JSON.stringify(this.access_token_expires_in, null, 2)}`);

		// DEBUG: this.access_token_expires_at.fromNow()
		turbo.debug(`🦠  this.access_token_expires_at.fromNow(): ${JSON.stringify(this.access_token_expires_at.fromNow(), null, 2)}`);

		return moment().isSameOrBefore(this.access_token_expires_at.subtract(1, 'minutes'));
	}

	get access_token_issued_at() {
		const issued_at = _.get(turbo, 'data.current_auth.access_token_jwt.iat', 0);

		return  moment.unix(issued_at);
	}

	get access_token_expires_at() {
		const expires_at = _.get(turbo, 'data.current_auth.access_token_jwt.exp', moment().subtract(1, 'days').unix());

		return moment.unix(expires_at);
	}

	get access_token_expires_in() {
		return this.access_token_expires_at.fromNow();
	}

}

module.exports = OAuthAuthentication;
