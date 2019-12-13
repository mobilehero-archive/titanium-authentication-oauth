const jwt = require('@titanium/jwt');
const _ = require('lodash');
const moment = require('moment');

export class Token {
	constructor(data, params = {}) {
		console.debug('🦖  you are here →   token.constructor');
		this.token_type = data.token_type && data.token_type.toLowerCase();
		this.access_token = data.access_token;
		this.refresh_token = data.refresh_token;
		this.parseExpiresIn(Number(data.expires_in));
		this.data = _.omit(data, [ 'token_type', 'access_token', 'refresh_token', 'expires_in' ]);


		this.jwt = jwt.decode(this.access_token, params.key);
		// console.debug(`this.jwt: ${JSON.stringify(this.jwt, null, 2)}`);

		if (jwt) {

			this.name = this.jwt.name;
			this.issuer = this.jwt.iss;
			this.audience = this.jwt.aud;
			this.subject = this.jwt.sub;

			this.issued_at = moment.unix(this.jwt.iat);
			this.expires_at = moment.unix(this.jwt.exp);

		}

		this.expiresIn = () => this.expires_at.fromNow();

	}

	parseExpiresIn(duration) {
		console.debug('🦖  you are here →   token.parseExpiresIn');
		if (typeof duration === 'number') {
		  this.expires_at = new Date();
		  this.expires_at.setSeconds(this.expires_at.getSeconds() + duration);
		} else if (duration instanceof Date) {
		  this.expires_at = new Date(duration.getTime());
		} else {
		  throw new TypeError(`Unknown duration: ${duration}`);
		}

		return moment(this.expires_at);
	  }


	  isExpired() {
		return Date.now() > this.expires.getTime();
	  }


}

module.exports = Token;
