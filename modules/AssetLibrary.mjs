class Asset {
    constructor(id, type, img) {
        this.id = id;
        this.type = type;
        this.img = img;
    }
}

class AssetInstance {
    constructor(asset) {
        this.asset = asset;
        this.x = 0;
        this.y = 0;
        this.data;
    }
}

class AssetLibrary {
    constructor() {
        this.manifest = null;
        this.library = [];
    }

    setManifest(manifest) {
        this.manifest = manifest;
    }

    addAsset(event) {
        let img = event.result;
        let path = event.item.id;
        let assetData = this.manifest.find(item => item.path == path);
        this.library.push(new Asset(assetData.id, assetData.type, img));
    }

    getImg(id) {
        let asset = this.library.find(item => item.id == id);
        return asset.img;
    }

    getRandomImg(partialId) {
        let matches = this.library.filter(item => item.id.includes(partialId));
        if (matches && matches.length) {
            return matches[Math.floor(Math.random() * matches.length)].img;
        }
        
        return null;
    }

    createInstance(id) {
        let asset = this.library.find(item => item.id == id);
        if (!asset) {
            console.log("ERROR: failed to find asset with id ", id);
            return null;
        }

        let instance = new AssetInstance(asset);
        return instance;
    }
}

export { AssetLibrary, AssetInstance };