const _ = require('lodash');
const Owner = require('./flows/owner');

class OAuth {

	constructor({ baseUrl, tokenPath, client_id, keyfile, key, defaultHeaders } = {}) {
		logger.track('🔒  you are here →  OAuth.constructor()');

		if (keyfile) {
			key = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, keyfile).read().text;
		}

		_.assign(this, { baseUrl, tokenPath, client_id, keyfile, key, defaultHeaders });
		this.default_headers = Object.assign({
			'Accept':       'application/json',
			'Content-Type': 'application/x-www-form-urlencoded',
		  }, defaultHeaders);

		this.owner = new Owner(this);

	}

}

module.exports = OAuth;
