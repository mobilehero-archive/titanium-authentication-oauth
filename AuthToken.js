const jsonwebtoken = require('@titanium/jwt');
const _ = require('lodash');
const moment = require('moment');
const logger = require('@geek/logger').createLogger('@titanium/authentication-oauth', { meta: { filename: __filename } });


class AuthToken {
	constructor(data, params = {}) {
		logger.track('🔒  you are here → AuthToken.constructor');

		// logger.verbose(`🦠  AuthToken.data: ${JSON.stringify(data, null, 2)}`);

		this.token_type = data.token_type && data.token_type.toLowerCase();

		this.access_token = data.access_token;
		this.access_token_jwt = data.access_token_jwt || jsonwebtoken.decode(this.access_token, params.key);

		this.refresh_token = data.refresh_token;
		this.refresh_token_jwt = data.refresh_token_jwt || jsonwebtoken.decode(this.refresh_token, null, true);


		this.expires_at = data.expires_at || parseExpiresIn(Number(data.expires_in));

		this.raw = data.raw || _.omit(data, [ 'token_type', 'access_token', 'refresh_token' ]);

		// console.debug(`this.jwt: ${JSON.stringify(this.jwt, null, 2)}`);

		if (this.access_token_jwt) {

			this.authenticated = true;
			this.user = {
				username:       this.access_token_jwt.username || this.access_token_jwt.preferred_username,
				first_name:     this.access_token_jwt.given_name,
				last_name:      this.access_token_jwt.family_name,
				formatted_name: this.access_token_jwt.name,
				email:          this.access_token_jwt.email,
				subject_id:     this.access_token_jwt.sub,
				scopes:         _.split(_.trim(this.access_token_jwt.scope || ''), /\s+/g).filter(o => o),
			};
			this.issuer = this.access_token_jwt.iss;
			this.audience = this.access_token_jwt.aud;
			this.subject = this.access_token_jwt.sub;

			// this.access_token_issued_at = moment.unix(this.access_token_jwt.iat);
			// this.access_token_expires_at = moment.unix(this.access_token_jwt.exp);


			// DEBUG: access_token_expires_at
			logger.debug(`🔑 \x1b[43m access_token_expires_at:\x1b[0m  ${JSON.stringify(this.access_token_expires_at, null, 2)}`);

			// DEBUG: access_token_expires_in
			logger.debug(`🔑 \x1b[43m access_token_expires_in:\x1b[0m  ${JSON.stringify(this.access_token_expires_in, null, 2)}`);

			// DEBUG: this.access_token_expires_at.fromNow()
			logger.debug(`🔑 \x1b[43m this.access_token_expires_at.fromNow():\x1b[0m  ${JSON.stringify(this.access_token_expires_at.fromNow(), null, 2)}`);

			// DEBUG: refresh_token_expires_at
			logger.debug(`🔑 \x1b[43m refresh_token_expires_at:\x1b[0m  ${JSON.stringify(this.refresh_token_expires_at, null, 2)}`);

			// DEBUG: refresh_token_expires_in
			logger.debug(`🔑 \x1b[43m refresh_token_expires_in:\x1b[0m  ${JSON.stringify(this.refresh_token_expires_in, null, 2)}`);

			// DEBUG: this.refresh_token_expires_at.fromNow()
			logger.debug(`🔑 \x1b[43m this.refresh_token_expires_at.fromNow():\x1b[0m  ${JSON.stringify(this.refresh_token_expires_at.fromNow(), null, 2)}`);


		}

		this.expiresIn = () => this.expires_at.fromNow();

	}

	// parseExpiresIn(duration) {
	// 	console.debug('🦖  you are here →   token.parseExpiresIn');

	// 	let expires_at;

	// 	if (typeof duration === 'number') {
	// 	  expires_at = new Date();
	// 	  expires_at.setSeconds(expires_at.getSeconds() + duration);
	// 	} else if (duration instanceof Date) {
	// 	  expires_at = new Date(duration.getTime());
	// 	} else {
	// 	  throw new TypeError(`Unknown duration: ${duration}`);
	// 	}

	// 	// return moment(this.expires_at);
	// 	return expires_at;
	// }


	isExpired() {
		return Date.now() > this.expires.getTime();
	}


	get access_token_issued_at() {
		// const issued_at = _.get(turbo, 'app.data.current_auth.access_token_jwt.iat', 0);
		const issued_at = _.get(this, 'access_token_jwt.iat', 0);

		return  moment.unix(issued_at);
	}

	get access_token_expires_at() {
		// const expires_at = _.get(turbo, 'app.data.current_auth.access_token_jwt.exp', moment().subtract(1, 'days').unix());
		const expires_at = _.get(this, 'access_token_jwt.exp', moment().subtract(1, 'days').unix());

		return moment.unix(expires_at);
	}

	get access_token_expires_in() {
		return this.access_token_expires_at.fromNow();
	}

	get refresh_token_issued_at() {
		// const issued_at = _.get(turbo, 'app.data.current_auth.refresh_token_jwt.iat', 0);
		const issued_at = _.get(this, 'refresh_token_jwt.iat', 0);

		return  moment.unix(issued_at);
	}

	get refresh_token_expires_at() {
		// const expires_at = _.get(turbo, 'app.data.current_auth.refresh_token_jwt.exp', moment().subtract(1, 'days').unix());
		const expires_at = _.get(this, 'refresh_token_jwt.exp', moment().subtract(1, 'days').unix());

		return moment.unix(expires_at);
	}

	get refresh_token_expires_in() {
		return this.refresh_token_expires_at.fromNow();
	}

	isAccessTokenExpired() {
		 return moment().isSameOrAfter(this.access_token_expires_at.subtract(1, 'minutes'));
	}

	isRefreshTokenExpired() {
		return moment().isSameOrAfter(this.refresh_token_expires_at.subtract(1, 'minutes'));
	}

}

const parseExpiresIn = duration => {
	logger.trace('🦖  you are here →   token.parseExpiresIn');

	let expires_at;

	if (typeof duration === 'number') {
	  expires_at = new Date();
	  expires_at.setSeconds(expires_at.getSeconds() + duration);
	} else if (duration instanceof Date) {
	  expires_at = new Date(duration.getTime());
	} else {
	  throw new TypeError(`Unknown duration: ${duration}`);
	}

	// return moment(this.expires_at);
	return expires_at;
};

module.exports = AuthToken;
