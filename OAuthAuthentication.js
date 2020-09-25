// const OAuth = require('./oauth');
const moment = require('moment');
const logger = require('@geek/logger').createLogger('@titanium/authentication-oauth', { meta: { filename: __filename } });

const TOKEN = Symbol('token');

class OAuthAuthentication {
	constructor(flowName, options = {}) {
		logger.track('🔒  you are here →   OAuthAuthentication.constructor');

		let Flow;
		switch (flowName) {
			case 'code':
				// TIBUG:  https://jira.appcelerator.org/browse/TIMOB-28037
				// Flow = require('./flows/CodeFlow');
				Flow = require('./flows/Code');
				break;

			case 'password':
				// TIBUG:  https://jira.appcelerator.org/browse/TIMOB-28037
				// Flow = require('./flows/OwnerResourceFlow');
				Flow = require('./flows/Password');
				break;

			default:

		}

		if( options.token ) {
			if( ! options.token instanceof OAuthAuthentication.AuthToken ){
				logger.warn('Token is not an instance of AuthToken.');
				options.token = new OAuthAuthentication.AuthToken(options.token);

			}
			this[TOKEN] = options.token;
		}

		this.flow = new Flow(options);

		Object.defineProperty(this, 'token', {
			enumerable: true,
			get () {
				return this[TOKEN];
			},
		});

		// if (options) {
		// 	this.oauth = new OAuth(options);
		// }
	 }

	// async authenticate({ username, password }) {
	// 	logger.track('🔒  you are here →   OAuthAuthentication.authenticate');
	// 	try {
	// 		const token = await this.oauth.owner.getToken({ username, password });
	// 		logger.debug(`🦠  token: ${JSON.stringify(token, null, 2)}`);

	// 		// response.user = {
	// 		// 	username:       token.username,
	// 		// 	first_name:     token.given_name,
	// 		// 	last_name:      token.family_name,
	// 		// 	formatted_name: token.name,
	// 		// 	email:          token.email,
	// 		// };
	// 		// response.token = token;
	// 		// return response;

	// 		return token;

	// 	} catch (error) {

	// 		console.error(`🛑  error: ${JSON.stringify(error, null, 2)}`);
	// 		console.error(error);
	// 		return {
	// 			authenticated: false,
	// 			scopes:        [],
	// 		};
	// 	}
	// }

	async logout(...args) {
		logger.track('🔒  You are here → OAuthAuthentication.logout()');
		this[TOKEN] = null;
		await this.flow.logout(...args);
	}

	async renew(...args) {
		logger.track('🔒  you are here → OAuthAuthentication.renew()');
		this[TOKEN] = await this.flow.renewAccessToken(...args);
		return this[TOKEN];
	}

	async authenticate(...args) {
		logger.track('🔒  you are here → OAuthAuthentication.authenticate()');
		this[TOKEN] = await this.flow.authenticate(...args);
		return this[TOKEN];
	}

	// async getAuthToken() {

	// 	// if( ! this.token instanceof OAuthAuthentication.AuthToken ){
	// 	// 	logger.warn('Token is not an instance of AuthToken.');
	// 	// 	token = new OAuthAuthentication.AuthToken(token);
	// 	// }

		

	// }

	async isAuthenticated(token) {

		logger.track('🔒  You are here → OAuthAuthentication.isAuthenticated()');

		if (_.isNil(token)) {

			if (_.isNil(this.token)) {
				return false;
			}

			token = this.token;
		}


		if( ! token instanceof OAuthAuthentication.AuthToken ){
			logger.warn('Token is not an instance of AuthToken.');
			// token = new OAuthAuthentication.AuthToken(token);
			return false;
		}

		return token.isAccessTokenExpired();
	}

		// this.token = token;
		// if (_.isNil(_.get(turbo, 'app.data.current_auth'))) {
		// 	return false;
		// }
		// if (_.isNil(token)) {
		// 	return false;
		// }

		// // DEBUG: access_token_expires_at
		// logger.debug(`🔑 \x1b[43m access_token_expires_at:\x1b[0m  ${JSON.stringify(this.access_token_expires_at, null, 2)}`);

		// // DEBUG: access_token_expires_in
		// logger.debug(`🔑 \x1b[43m access_token_expires_in:\x1b[0m  ${JSON.stringify(this.access_token_expires_in, null, 2)}`);

		// // DEBUG: this.access_token_expires_at.fromNow()
		// logger.debug(`🔑 \x1b[43m this.access_token_expires_at.fromNow():\x1b[0m  ${JSON.stringify(this.access_token_expires_at.fromNow(), null, 2)}`);

		// // DEBUG: refresh_token_expires_at
		// logger.debug(`🔑 \x1b[43m refresh_token_expires_at:\x1b[0m  ${JSON.stringify(this.refresh_token_expires_at, null, 2)}`);

		// // DEBUG: refresh_token_expires_in
		// logger.debug(`🔑 \x1b[43m refresh_token_expires_in:\x1b[0m  ${JSON.stringify(this.refresh_token_expires_in, null, 2)}`);

		// // DEBUG: this.refresh_token_expires_at.fromNow()
		// logger.debug(`🔑 \x1b[43m this.refresh_token_expires_at.fromNow():\x1b[0m  ${JSON.stringify(this.refresh_token_expires_at.fromNow(), null, 2)}`);


		// let isAccessTokenExpired = moment().isSameOrAfter(this.access_token_expires_at.subtract(1, 'minutes'));

		// let isAccessTokenExpired = token.isAccessTokenExpired();

		// if (isAccessTokenExpired) {

		// 	// const isRefreshTokenExpired = moment().isSameOrAfter(this.refresh_token_expires_at.subtract(1, 'minutes'));
		// 	const isRefreshTokenExpired = token.isRefreshTokenExpired();


		// 	logger.debug(`🦠  isRefreshTokenExpired: ${JSON.stringify(isRefreshTokenExpired, null, 2)}`);

		// 	if (isRefreshTokenExpired) {
		// 		return false;
		// 	}
		// 	await this.renewAccessToken();
		// 	isAccessTokenExpired = moment().isSameOrAfter(this.access_token_expires_at.subtract(1, 'minutes'));
		// 	logger.debug(`🦠  isAccessTokenExpired: ${JSON.stringify(isAccessTokenExpired, null, 2)}`);
		// 	return !isAccessTokenExpired;
		// } else {
		// 	return true;
		// }
		// }


	// get access_token_issued_at() {
	// 	// const issued_at = _.get(turbo, 'app.data.current_auth.access_token_jwt.iat', 0);
	// 	const issued_at = _.get(this.token, 'access_token_jwt.iat', 0);

	// 	return  moment.unix(issued_at);
	// }

	// get access_token_expires_at() {
	// 	// const expires_at = _.get(turbo, 'app.data.current_auth.access_token_jwt.exp', moment().subtract(1, 'days').unix());
	// 	const expires_at = _.get(this.token, 'access_token_jwt.exp', moment().subtract(1, 'days').unix());

	// 	return moment.unix(expires_at);
	// }

	// get access_token_expires_in() {
	// 	return this.access_token_expires_at.fromNow();
	// }

	// get refresh_token_issued_at() {
	// 	// const issued_at = _.get(turbo, 'app.data.current_auth.refresh_token_jwt.iat', 0);
	// 	const issued_at = _.get(this.token, 'refresh_token_jwt.iat', 0);

	// 	return  moment.unix(issued_at);
	// }

	// get refresh_token_expires_at() {
	// 	// const expires_at = _.get(turbo, 'app.data.current_auth.refresh_token_jwt.exp', moment().subtract(1, 'days').unix());
	// 	const expires_at = _.get(this.token, 'refresh_token_jwt.exp', moment().subtract(1, 'days').unix());

	// 	return moment.unix(expires_at);
	// }

	// get refresh_token_expires_in() {
	// 	return this.refresh_token_expires_at.fromNow();
	// }


	renewAccessToken(...args) {
		return this.flow.renewAccessToken(...args);
	}

}

OAuthAuthentication.AuthToken = require('./AuthToken');

module.exports = OAuthAuthentication;
