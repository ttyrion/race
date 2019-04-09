var Utility = {
    exponentialFog: function(distance, density) {
         return 1 / (Math.pow(Math.E, (distance * distance * density)));
    },

    project: function (p, cameraX, cameraY, cameraZ, cameraDepth, width, height, roadWidth) {
        p.camera.x = (p.world.x || 0) - cameraX;
        p.camera.y = (p.world.y || 0) - cameraY;
        p.camera.z = (p.world.z || 0) - cameraZ;
        p.screen.scale = cameraDepth / p.camera.z;
        p.screen.x = Math.round((width >> 1) + (p.screen.scale * p.camera.x * (width >> 1)));
        p.screen.y = Math.round((height >> 1) - (p.screen.scale * p.camera.y * (height >> 1)));
        p.screen.w = Math.round((p.screen.scale * roadWidth * (width >> 1)));
    }
};

export default Utility; 