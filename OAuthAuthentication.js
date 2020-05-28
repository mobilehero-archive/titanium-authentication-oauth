const OAuth = require('./oauth');

export class OAuthAuthentication {
	constructor(options) {
		console.debug('🔒  you are here →   OAuthAuthentication.constructor');
		this.oauth = new OAuth(options);

	 }

	async authenticate({ username, password, options = {} }) {
		console.debug('🔒  you are here →   OAuthAuthentication.authenticate');
		return this.oauth.owner.getToken({ username, password })
			.then(token => {
				return token;
			});

	}

}

module.exports = OAuthAuthentication;
