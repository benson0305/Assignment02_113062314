const {ccclass, property} = cc._decorator;

@ccclass
export default class MushroomController extends cc.Component {

    private rb: cc.RigidBody | null = null;
    
    // 蘑菇預設往右走 (1)
    private moveDir: number = 1; 
    
    // 坐標防卡牆變數
    private lastX: number = 0;
    private stuckTime: number = 0;

    // 蘑菇的移動速度通常比敵人快一點點
    @property
    moveSpeed: number = 80; 

    onLoad () {
        this.rb = this.getComponent(cc.RigidBody);
        this.lastX = this.node.x;
    }

    start () {
        if (this.rb) {
            // 【視覺小魔法】在出生的瞬間，給蘑菇一個微小的向上力道
            // 讓它有一種從磚塊裡「彈出來」的生動感
            this.rb.linearVelocity = cc.v2(0, 150);
        }
    }

    update (dt: number) {
        if (!this.rb) return;

        // 1. 【坐標停滯檢測機制】(傳承自我們寫好的敵人邏輯)
        let deltaX = Math.abs(this.node.x - this.lastX);
        
        if (deltaX < 0.5) {
            this.stuckTime += dt;
            if (this.stuckTime > 0.05) {
                this.moveDir *= -1; // 撞牆轉向
                this.stuckTime = 0; 
                console.log("-> 蘑菇撞牆反彈！目前方向：", this.moveDir);
            }
        } else {
            this.stuckTime = 0;
        }
        this.lastX = this.node.x;

        // 2. 套用水平移動速度 (保留原本的 Y 軸掉落速度)
        let velocity = this.rb.linearVelocity;
        velocity.x = this.moveDir * this.moveSpeed;
        this.rb.linearVelocity = velocity;
    }
}