var Promise = require('bluebird');
var _ = require('lodash');

module.exports = failoverArrayProcessing;

/**
 *
 * @param options Input parameters of the processing
 * @param options.array Target array to be processed
 * @param options.handler Target function which processed array
 *
 */
function failoverArrayProcessing (options) {

	if ( !options.array ) {
		throw new Error('Cannot process array without array');
	}
	if ( !options.handler ) {
		throw new Error('Cannot process array without handler');
	}

	var promise = internalFailoverArrayProcessing({
		startIndex: 0,
		handler: options.handler,
		array: options.array
	});

	promise = promise.then(function (res) {
		return _.reduce(res, function (result, item, idx) {
			if ( item.success ) {
				result.succeeded.push(item.data);
			} else {
				result.failed.push(item.data);
			}
			return result;
		}, { succeeded: [], failed: [] } );
	});

	return promise;

}

function internalFailoverArrayProcessing (params) {
	var promise = Promise.resolve(params.handler(params.array));

	promise = promise.then(function (result) {
		// Everything is fine. returning result
		var indexes = _(params.array.length).range().map(function (idx) {
			return idx + params.startIndex;
		}).valueOf();
		return [{
			success: true,
			data: {
				indexes: indexes,
				items: params.array,
				result: result
			}
		}];
	});

	promise = promise.catch(function (error) {
		if (params.array.length === 0) {
			return 'blah';
		}
		if (params.array.length === 1) {
			return [{
				success: false,
				data: {
					indexes: [params.startIndex],
					items: params.array,
					error: error
				}
			}]
		}

		var middle = Math.floor( params.array.length / 2 );

		var upperHalf = params.array.slice(0, middle);
		var lowerHalf = params.array.slice(middle, params.array.length);

		var halfPromise = Promise.all([
			internalFailoverArrayProcessing({
				startIndex: params.startIndex,
				array: upperHalf,
				handler: params.handler
			}),
			internalFailoverArrayProcessing({
				startIndex: params.startIndex + middle,
				array: lowerHalf,
				handler: params.handler
			})
		]);

		halfPromise = halfPromise.spread(function (upperRes, lowerRes) {
			return upperRes.concat(lowerRes);
		});

		return halfPromise;
	});

	return promise;
}
