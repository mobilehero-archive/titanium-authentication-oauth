const _ = require('lodash');
const Owner = require('./flows/owner');

export class OAuth {

	constructor(params = {}) {
		console.debug('🔒  you are here →   oauth.constructor');

		if (params.keyfile) {
			params.key = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, params.keyfile).read().text;
		}

		_.assign(this, params);
		this.default_headers = Object.assign({
			'Accept':       'application/json',
			'Content-Type': 'application/x-www-form-urlencoded',
		  }, params.defaultHeaders);

		this.owner = new Owner(this);

	}

}

module.exports = OAuth;
