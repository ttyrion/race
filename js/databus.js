import Pool from './base/pool'

let instance

/**
 * 全局状态管理器
 */
export default class DataBus {
    constructor() {
        /*
         * DataBus 单例
         */
        if (instance)
            return instance

        instance = this

        this.pool = new Pool()

        this.reset()
    }

    reset() {
        this.frame = 0
        this.score = 0
        this.animations = []
        this.obstacles = [];
        this.gameOver = false;
        this.minPlayerX = 0;
        this.maxPlayerX = 0;
    }
}