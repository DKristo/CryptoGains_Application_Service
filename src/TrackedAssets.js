class TrackedAssets {
    constructor() {
        this._trackedAssets = {};
    }

    track(name, options) {
        if (this._trackedAssets.hasOwnProperty(name)) {
            return false; //An asset with this name already exists
        }

        options = options || {};

        this._trackedAssets[name] = {
            adjustedCostBase: (typeof options.openingAdjustedCostBase !== 'undefined') ? options.openingAdjustedCostBase : 0,
            numberOfShares: (typeof options.openingNumberOfShares !== 'undefined') ? options.openingNumberOfShares : 0
        };

        return true;
    }

    ensureTracked(name) {
        this.track(name);

        return this._trackedAssets[name];
    }

    trackedAsset(name) {
        if (this._trackedAssets.hasOwnProperty(name)) {
            return this._trackedAssets[name];
        }

        return null;
    }

    toArray() {
        const result = [];

        for (var name in this._trackedAssets) {
            result.push({
                name: name,
                numberOfShares: this._trackedAssets[name].numberOfShares,
                adjustedCostBase: this._trackedAssets[name].adjustedCostBase
            });
        }

        return result;
    }
}

module.exports = TrackedAssets;