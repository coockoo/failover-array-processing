var Promise = require('bluebird');

var failoverArrayProcessing = require('./index');

function handleArray (array) {
	if (array.length % 3 === 0) {
		return Promise.resolve('Me gusta');
	} else {
		return Promise.reject(new Error('Fuckin bad length'));
	}
}

failoverArrayProcessing({
	array: [1,2,3,4,5,6,7,8,9,0,1],
	handler: handleArray
}).then(function (res) {
	console.log(res.failed[0].error);
});

