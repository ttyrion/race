import Sprite from '../base/sprite'
import Road from 'road.js'

const screenWidth = window.innerWidth
const screenHeight = window.innerHeight

const BG_IMG_SKY = 'images/background/sky.png'
const BG_IMG_HILL = 'images/background/hills.png'
const BG_IMG_TREE = 'images/background/trees.png'


/**
 * 游戏背景类
 * 提供update和render函数实现无限滚动的背景功能
 */
export default class BackGround {
    constructor(ctx) {
        this.ctx = ctx;
        this.sprites = [new Sprite(BG_IMG_SKY, screenWidth, screenHeight / 3),
            new Sprite(BG_IMG_HILL, screenWidth, screenHeight / 3),
            new Sprite(BG_IMG_TREE, screenWidth, screenHeight / 3)];
        // const sky = 0;
        // const hill = 1;
        // const tree = 1;
        this.road = new Road(ctx, 0, screenHeight / 3, screenWidth, screenHeight * 2 / 3);
        this.top = 0
        this.road.reset()
    }

    update() {
        //this.top += 2

        if (this.top >= screenHeight)
            this.top = 0

        this.road.update();
    }

    render(playerCoordinates) {
        /**
         * 天空、山、树等远处背景
         */
        this.sprites.forEach((sprite) => {
            sprite.drawToCanvas(this.ctx);
        });

        this.road.render(playerCoordinates);
    }
}