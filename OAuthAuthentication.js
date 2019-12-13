const _ = require('lodash');
const OAuth = require('./oauth');

export class OAuthAuthentication {
	constructor(options) {
		console.debug('🦖  you are here →   OAuthAuthentication.constructor');
		this.oauth = new OAuth(options);

	 }


	async authenticate({ username, password }) {
		console.debug('🦖  you are here →   OAuthAuthentication.authenticate');
		// console.error(typeof this.oauth.owner.getToken);
		return this.oauth.owner.getToken({ username, password })
			.then(token => {
				// this.token = token;
				return token;
			});

	}


}

module.exports = OAuthAuthentication;
