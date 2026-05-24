const {ccclass, property} = cc._decorator;

@ccclass
export default class EnemyController extends cc.Component {

    private rb: cc.RigidBody | null = null;
    private moveDir: number = -1; 
    
    // 紀錄上一幀的 X 坐標
    private lastX: number = 0;
    
    // 紀錄卡住的時間
    private stuckTime: number = 0;

    // 【新增】死亡狀態鎖，防止被重複踩踏或繼續移動
    private isDead: boolean = false;

    @property
    moveSpeed: number = 50; 

    onLoad () {
        this.rb = this.getComponent(cc.RigidBody);
        
        // 遊戲開始時，先記錄初始的 X 坐標
        this.lastX = this.node.x;
    }

    // 【新增】被玩家踩扁時呼叫的專屬函數
    public squash() {
        if (this.isDead) return;
        this.isDead = true;

        // 1. 停止移動與剛體運算
        if (this.rb) {
            this.rb.linearVelocity = cc.v2(0, 0);
            this.rb.active = false; 
        }

        // 2. 關閉身上所有的物理碰撞框 (讓馬力歐可以直接穿過去，不會被擋住)
        let colliders = this.getComponents(cc.PhysicsCollider);
        colliders.forEach(c => c.enabled = false);

        // 3. 播放扁掉的動畫
        let anim = this.getComponent(cc.Animation);
        if (anim) {
            anim.play('squash');
        } else {
            // 防呆備案：如果沒掛載動畫，直接用程式壓扁
            this.node.scaleY = 0.3;
        }

        // 4. 留下 0.5 秒的屍體展示時間，然後徹底銷毀
        setTimeout(() => {
            if (this.node) {
                this.node.destroy();
            }
        }, 500);
    }
    update (dt: number) {
        // 【新增】如果已經死了，立刻攔截，不要再執行任何移動邏輯
        if (this.isDead || !this.rb) return;

        let deltaX = Math.abs(this.node.x - this.lastX);
        
        if (deltaX < 0.5) {
            this.stuckTime += dt;
            if (this.stuckTime > 0.05) {
                this.moveDir *= -1; 
                this.stuckTime = 0; 
            }
        } else {
            this.stuckTime = 0;
        }
        
        this.lastX = this.node.x;

        let velocity = this.rb.linearVelocity;
        velocity.x = this.moveDir * this.moveSpeed;
        this.rb.linearVelocity = velocity;
    }
}