import Sprite from '../base/sprite'
import Util from '../libs/utils'
import DataBus from '../databus'
let databus = new DataBus()
/**
 * 一条路边指示带在Z方向的宽度
 */
const _segmentLength = 200;
/**
 * 要画多少条segment
 */
const _segmentsToDraw = 300;
/**
 * 车道数
 */
const _lanesOfRoad = 2;
/**
 * 道路两边轱辘线对齐多少个segment
 */
const _segmentsPerRumble = 2;

/**
 * 雾的浓度
 */
const _densityOfFog = 5;
const _roadWidth = 600;
const _fieldOfView = 100;
let _cameraHeight = 200;
const _cameraDepth = 1 / Math.tan((_fieldOfView / 2) * Math.PI / 180);

const _COLORS = {
    SKY: '#72D7EE',
    TREE: '#005108',
    FOG: '#005108',
    LIGHT: { road: '#6B6B6B', grass: '#10AA10', rumble: '#555555', lane: '#CCCCCC' },
    DARK: { road: '#696969', grass: '#009A00', rumble: '#BBBBBB' },
    START: { road: 'white', grass: 'white', rumble: 'white' },
    FINISH: { road: 'black', grass: 'black', rumble: 'black' }
};

const _Trees = 5;

export default class Road extends Sprite {
    constructor(ctx, x, y, width, height) {
        super(null, width, height);
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        _cameraHeight = this.height;
        /**
         * 运动路程
         */
        this.distance = 0;
        this.speed = 0;
        this.maxSpeed = 40000;
        this.acceleration = 80;
        this.timestamp = new Date().valueOf();

        this.segments = [];
        /**
         * 赛道长度
         */
        this.trackLength = 0;
    }

    update() {
        let timestamp = new Date().valueOf()
        let time = (timestamp - this.timestamp) / 1000
        this.timestamp = timestamp
        this.distance += this.speed * time
        this.speed += time * this.acceleration
        if (this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed
        }
        databus.score = parseInt(this.distance / 100);
    }

    render() {
        /**
         * 清楚起点线标记，以免赛道重复的同时，重复渲染出起点线
         */
        if (this.startFlagSet && this.distance > 4 * _segmentLength && this.segments.length > 4) {
            this.segments[4].color = _COLORS.DARK;
            this.startFlagSet = false;
        }

        /**
         * 赛道是重复的
         */
        let distance = this.distance;
        while (distance >= this.trackLength)
            distance -= this.trackLength;
        while (distance < 0)
            distance += this.trackLength;
        
        this.ctx.clearRect(this.x, this.y, this.width, this.height);
        this.renderFog(0.2);
        let baseSegment = this.findSegment(distance);
        let maxy = this.height + this.y;
        let firstRenderedSegment = null;
        for (let n = 0; n < _segmentsToDraw; n++) {
            let segment = this.segments[(baseSegment.index + n) % this.segments.length];
            segment.looped = segment.index < baseSegment.index;
            segment.fog = Util.exponentialFog(n / _segmentsToDraw, _densityOfFog);

            Util.project(segment.p1, 0, _cameraHeight, distance - (segment.looped ? this.trackLength : 0), _cameraDepth, this.width, this.height + this.y, _roadWidth);
            Util.project(segment.p2, 0, _cameraHeight, distance - (segment.looped ? this.trackLength : 0), _cameraDepth, this.width, this.height + this.y, _roadWidth);
            if (segment.leftTree) {
                Util.project(segment.pLeftTreeLT, 0, _cameraHeight, distance - (segment.looped ? this.trackLength : 0), _cameraDepth, this.width, this.height + this.y, _roadWidth);
                Util.project(segment.pLeftTreeRB, 0, _cameraHeight, distance - (segment.looped ? this.trackLength : 0), _cameraDepth, this.width, this.height + this.y, _roadWidth);
            }
            if (segment.rightTree) {
                Util.project(segment.pRightTreeLT, 0, _cameraHeight, distance - (segment.looped ? this.trackLength : 0), _cameraDepth, this.width, this.height + this.y, _roadWidth);
                Util.project(segment.pRightTreeRB, 0, _cameraHeight, distance - (segment.looped ? this.trackLength : 0), _cameraDepth, this.width, this.height + this.y, _roadWidth);
            }

            if (segment.p1.camera.z <= _cameraDepth || segment.p2.screen.y >= maxy) {// behind us or clip by (already rendered) segment
                continue;
            }
            this.renderSegment(segment);
            maxy = segment.p2.screen.y;
        }
    }

    renderSegment(segment) {
        if (segment.p2.screen.y > this.height + this.y) {
           return;
        }

        let r1 = this.getRumbleWidth(segment.p1.screen.w, _lanesOfRoad);
        let r2 = this.getRumbleWidth(segment.p2.screen.w, _lanesOfRoad);
        let l1 = this.getLaneMarkerWidth(segment.p1.screen.w, _lanesOfRoad);
        let l2 = this.getLaneMarkerWidth(segment.p2.screen.w, _lanesOfRoad);

        this.ctx.fillStyle = segment.color.grass;
        this.ctx.fillRect(0, segment.p1.screen.y2, this.width, segment.p1.screen.y1 - segment.p1.screen.y2);
        // segment.p1.screen.y += this.y;
        // segment.p2.screen.y += this.y;
        this.renderPolygon({ x: segment.p1.screen.x - segment.p1.screen.w - r1, y: segment.p1.screen.y }, 
                        { x: segment.p1.screen.x - segment.p1.screen.w, y: segment.p1.screen.y },
                        { x: segment.p2.screen.x - segment.p2.screen.w, y: segment.p2.screen.y },
                        { x: segment.p2.screen.x - segment.p2.screen.w - r2, y: segment.p2.screen.y }, 
                        segment.color.rumble);
        
        this.renderPolygon({ x: segment.p1.screen.x + segment.p1.screen.w + r1, y: segment.p1.screen.y },
                        { x: segment.p1.screen.x + segment.p1.screen.w, y: segment.p1.screen.y },
                        { x: segment.p2.screen.x + segment.p2.screen.w, y: segment.p2.screen.y },
                        { x: segment.p2.screen.x + segment.p2.screen.w + r2, y: segment.p2.screen.y }, 
                        segment.color.rumble);
        
        //赛道
        this.renderPolygon({ x: segment.p1.screen.x - segment.p1.screen.w, y: segment.p1.screen.y },
                        { x: segment.p1.screen.x + segment.p1.screen.w, y: segment.p1.screen.y },
                        { x: segment.p2.screen.x + segment.p2.screen.w, y: segment.p2.screen.y },
                        { x: segment.p2.screen.x - segment.p2.screen.w, y: segment.p2.screen.y }, 
                        segment.color.road);

        if (segment.leftTree) {
            let treeWidth = segment.pLeftTreeRB.screen.x - segment.pLeftTreeLT.screen.x;
            let treeHeight = segment.pLeftTreeLT.screen.y - segment.pLeftTreeRB.screen.y;
            let treeX = segment.pLeftTreeLT.screen.x;
            let treeY = segment.pLeftTreeLT.screen.y;
            let tree = new Sprite(segment.leftTree, treeWidth, treeHeight, treeX, treeY);
            tree.drawToCanvas(this.ctx);
        }

        if (segment.rightTree) {
            let treeWidth = segment.pRightTreeRB.screen.x - segment.pRightTreeLT.screen.x;
            let treeHeight = segment.pRightTreeLT.screen.y - segment.pRightTreeRB.screen.y;
            let treeX = segment.pRightTreeLT.screen.x;
            let treeY = segment.pRightTreeLT.screen.y;
            let tree = new Sprite(segment.leftTree, treeWidth, treeHeight, treeX, treeY);
            tree.drawToCanvas(this.ctx);
        }

        if (segment.color.lane) {
            let lanew1 = segment.p1.screen.w * 2 / _lanesOfRoad;
            let lanew2 = segment.p2.screen.w * 2 / _lanesOfRoad;
            let lanex1 = segment.p1.screen.x - segment.p1.screen.w + lanew1;
            let lanex2 = segment.p2.screen.x - segment.p2.screen.w + lanew2;
            for (let lane = 1; lane < _lanesOfRoad; lanex1 += lanew1, lanex2 += lanew2, lane++) {
                this.renderPolygon({ x: lanex1 - l1 / 2, y: segment.p1.screen.y },
                        { x: lanex1 + l1 / 2, y: segment.p1.screen.y },
                        { x: lanex2 + l2 / 2, y: segment.p2.screen.y },
                        { x: lanex2 - l2 / 2, y: segment.p2.screen.y },
                        segment.color.lane);
            }
        }
    }

    renderPolygon(p1, p2, p3, p4, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.lineTo(p3.x, p3.y);
        this.ctx.lineTo(p4.x, p4.y);
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * 赛道上的雾的效果
     */
    renderFog(fog) {
        if (fog < 1) {
            this.ctx.globalAlpha = (1 - fog);
            this.ctx.fillStyle = _COLORS.FOG;
            this.ctx.fillRect(this.x, this.y, this.width, this.height);
            this.ctx.globalAlpha = 1;
        }
    }

    renderSprite(sprite, x, y, width, height) {

    }

    reset() {
        this.segments.length = 0;
        for (var n = 0; n < _segmentsToDraw; ++n) {
            let leftTreeIndex = parseInt(Math.random() * _Trees);
            let rightTreeIndex = parseInt(Math.random() * _Trees);
            let segment = {
                index: n,
                p1: { world: { z: (n - 1) * _segmentLength }, camera: {}, screen: {} },
                p2: { world: { z: (n) * _segmentLength }, camera: {}, screen: {} },
                color: n % 2 ? _COLORS.DARK : _COLORS.LIGHT,
            };
            if (!(n % 4)) {
                segment.leftTree = "images/background/tree" + leftTreeIndex + ".png";
                segment.pLeftTreeLT = { world: { x: -_roadWidth / 2 - 300, y: _cameraHeight / 2, z: (n) * _segmentLength }, camera: { }, screen: { } };
                segment.pLeftTreeRB = { world: { x: -_roadWidth / 2 - 100, z: (n) * _segmentLength }, camera: { }, screen: { } };
            }
            if (!(n % 3)) {
                segment.rightTree = "images/background/tree" + rightTreeIndex + ".png";
                segment.pRightTreeLT = { world: { x: _roadWidth / 2 + 100, y: _cameraHeight / 2, z: (n) * _segmentLength }, camera: {}, screen: {} };
                segment.pRightTreeRB = { world: { x: _roadWidth / 2 + 300, z: (n) * _segmentLength }, camera: {}, screen: {} };
            }
            this.segments.push(segment);
        }

        /**
         * 起点标线
         */
        this.segments[4].color = _COLORS.START;
        this.startFlagSet = true;

        /**
         * 实际赛道长度，赛道被首尾相接
        */
        this.trackLength = this.segments.length * _segmentLength;        
    }

    findSegment(z) {
        return this.segments[Math.floor(z / _segmentLength) % this.segments.length];
    }

    getRumbleWidth(projectedRoadWidth, lanes) {
        return projectedRoadWidth / Math.max(2, 2 * lanes);
    }

    getLaneMarkerWidth(projectedRoadWidth, lanes) {
        return projectedRoadWidth / Math.max(32, 8 * lanes);
    }
}