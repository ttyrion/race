import Sprite from '../base/sprite'
import DataBus from '../databus'

const screenWidth = window.innerWidth
const screenHeight = window.innerHeight

const _margin = 90;

// 玩家相关常量设置
const PLAYER_IMG_SRC = 'images/hero.png'
const PLAYER_WIDTH = 100
const PLAYER_HEIGHT = 70

let databus = new DataBus()

export default class Player extends Sprite {
    constructor(ctx) {
        super(PLAYER_IMG_SRC, PLAYER_WIDTH, PLAYER_HEIGHT)
        this.ctx = ctx;
        // 玩家默认处于屏幕底部居中位置
        this.x = screenWidth / 2 - this.width / 2 + 50
        this.y = screenHeight - this.height - 100
        this.z = 0;

        // 用于在手指移动的时候标识手指是否已经在飞机上了
        this.touched = false
        // 初始化事件监听
        this.initEvent()
    }

    /**
     * 当手指触摸屏幕的时候
     * 判断手指是否在飞机上
     * @param {Number} x: 手指的X轴坐标
     * @param {Number} y: 手指的Y轴坐标
     * @return {Boolean}: 用于标识手指是否在飞机上的布尔值
     */
    checkIsFingerOnAir(x, y) {
        const deviation = 30

        return !!(x >= this.x - deviation &&
            y >= this.y - deviation &&
            x <= this.x + this.width + deviation &&
            y <= this.y + this.height + deviation)
    }

    /**
     * 根据手指的位置设置飞机的位置
     * 保证手指处于飞机中间
     * 同时限定飞机的活动范围限制在屏幕中
     */
    setAirPosAcrossFingerPosZ(x) {
        let disX = x - this.width / 2
        // let disY = y - this.height / 2

        if (disX < 0)
            disX = 0
        else if (disX > screenWidth - this.width)
            disX = screenWidth - this.width

        // if (disY <= 0)
        //     disY = 0
        // else if (disY > screenHeight - this.height)
        //     disY = screenHeight - this.height

        this.x = disX
        // this.y = disY
    }

    /**
     * 玩家响应手指的触摸事件
     * 改变战机的位置
     */
    initEvent() {
        canvas.addEventListener('touchstart', ((e) => {
            e.preventDefault()

            let x = e.touches[0].clientX
            let y = e.touches[0].clientY

            if (this.checkIsFingerOnAir(x, y)) {
                this.touched = true
                //this.setAirPosAcrossFingerPosZ(x, y)
            }

        }).bind(this))

        canvas.addEventListener('touchmove', ((e) => {
            e.preventDefault()
            if (databus.gameOver) { 
                return;
            }
            let x = e.touches[0].clientX;
            if (x < _margin || x > screenWidth - _margin) {
                return;
            }
            let y = e.touches[0].clientY
            this.setAirPosAcrossFingerPosZ(x, y)
        }).bind(this))

        canvas.addEventListener('touchend', ((e) => {
            e.preventDefault()
            
            this.touched = false
        }).bind(this))
    }

    render() {
        this.drawToCanvas(this.ctx);
    }
}