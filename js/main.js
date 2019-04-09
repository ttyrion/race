import Player from './player/index'
import BackGround from './runtime/background'
import GameInfo from './runtime/gameinfo'
import Music from './runtime/music'
import DataBus from './databus'
import Exception from './base/exception.js'
/**
 *
 */
let ctx = canvas.getContext('2d')
let databus = new DataBus()

/**
 * 游戏主函数
 */
export default class Main {
    constructor() {
        // 维护当前requestAnimationFrame的id
        this.aniId = 0

        this.restart()

        this.cameraCoordinates = {
            z: 0
        }
    }

    restart() {
        databus.reset()

        canvas.removeEventListener(
            'touchstart',
            this.touchHandler
        )

        this.bg = new BackGround(ctx)
        this.player = new Player(ctx)
        this.gameinfo = new GameInfo()
        this.music = new Music()

        /**
         * bind this以后，不论在上面环境下调用bindLoop，其this引用的都是当前对象Main
         */
        this.bindLoop = this.loop.bind(this)
        this.hasEventBind = false

        // 清除上一局的动画
        window.cancelAnimationFrame(this.aniId);

        this.aniId = window.requestAnimationFrame(
            this.bindLoop,
            canvas
        )
    }

    // 全局碰撞检测
    collisionDetection() {
        for (let i = 0, il = databus.obstacles.length; i < il; i++) {
            // let enemy = databus.enemys[i]

            
        }
        try {
            databus.obstacles.forEach((obstacle) => {
                if (this.player.isCollideWith(obstacle)) {
                    databus.gameOver = true
                    throw new Exception("The player is collide with obstacle.");
                }
            });
        }
        catch (exp) {
            console.log(exp);
        }
    }

    // 游戏结束后的触摸事件处理逻辑
    touchEventHandler(e) {
        e.preventDefault()

        let x = e.touches[0].clientX
        let y = e.touches[0].clientY

        let area = this.gameinfo.btnArea

        if (x >= area.startX &&
            x <= area.endX &&
            y >= area.startY &&
            y <= area.endY)
            this.restart()
    }

    // 游戏逻辑更新主函数
    update() {
        if (databus.gameOver)
            return;

        this.bg.update()

        this.collisionDetection()
    }

    /**
     * canvas重绘函数
     * 每一帧重新绘制所有的需要展示的元素
     */
    render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        this.bg.render({
            x: this.player.x,
            y: this.player.y,
            z: 0
        })

        this.player.render()

        databus.animations.forEach((ani) => {
            if (ani.isPlaying) {
                ani.aniRender(ctx)
            }
        })

        this.gameinfo.renderGameScore(ctx, databus.score)

        // 游戏结束停止帧循环
        if (databus.gameOver) {
            this.gameinfo.renderGameOver(ctx, databus.score)

            if (!this.hasEventBind) {
                this.hasEventBind = true
                this.touchHandler = this.touchEventHandler.bind(this)
                canvas.addEventListener('touchstart', this.touchHandler)
            }
        }
    }
    // 实现游戏帧循环
    /**
     * 每一帧绘制前会先回调loop，这里可以更新数据
     */
    loop() {
        databus.frame++

        this.update()
        this.render()

        /**
         * 回调函数再次调用window.requestAnimationFrame(),
         * 目的是在浏览器下次重绘之前继续更新下一帧动画
         */
        this.aniId = window.requestAnimationFrame(
            this.bindLoop,
            canvas
        )
    }
}