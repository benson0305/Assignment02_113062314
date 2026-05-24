const {ccclass, property} = cc._decorator;

@ccclass
export default class TurtleController extends cc.Component {

    private rb: cc.RigidBody | null = null;
    private anim: cc.Animation | null = null;
    
    public isShell: boolean = false;   
    public isRolling: boolean = false; 

    private moveDir: number = -1; 
    private lastX: number = 0;
    private stuckTime: number = 0;

    @property
    walkSpeed: number = 50;   

    @property
    rollSpeed: number = 150;  

    // 【新增】龜殼撞擊敵人的音效
    @property(cc.AudioClip)
    hitAudio: cc.AudioClip | null = null; 

    onLoad () {
        this.rb = this.getComponent(cc.RigidBody);
        this.anim = this.getComponent(cc.Animation);
        this.lastX = this.node.x;
        
        if (this.anim) this.anim.play('turtle walk');
    }

    public squash() {
        if (!this.isShell) {
            this.isShell = true;
            this.isRolling = false;
            if (this.rb) this.rb.linearVelocity = cc.v2(0, 0); 
            if (this.anim) this.anim.play('shell'); 
        } else if (this.isRolling) {
            this.isRolling = false;
            if (this.rb) this.rb.linearVelocity = cc.v2(0, 0);
        }
    }

    public kick(marioX: number) {
        // 【修改】拿掉 !this.isRolling 的限制
        // 只要目前是龜殼狀態 (isShell === true)，不管是靜止還是滾動中，都可以被踢飛或反彈！
        if (this.isShell) {
            this.isRolling = true;
            
            // 依然根據馬力歐的相對 X 軸位置，決定向左還是向右噴射
            this.moveDir = (this.node.x > marioX) ? 1 : -1;
            console.log("-> 龜殼被踢飛/改變方向！新方向：", this.moveDir);
        }
    }

    // 【新增】龜殼主動攻擊的碰撞判定
    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        // 如果龜殼正在極速滾動，且撞到的對象是香菇敵人
        if (this.isRolling && otherCollider.node.name === "Enemy") {
            
            // 取得香菇的腳本
            let enemyCtrl = otherCollider.node.getComponent("EnemyController");
            
            if (enemyCtrl) {
                // 1. 播放撞擊音效
                if (this.hitAudio) {
                    cc.audioEngine.playEffect(this.hitAudio, false);
                }
                
                // 2. 延遲呼叫香菇的死亡函數 (避免物理運算衝突)
                setTimeout(() => {
                    enemyCtrl.squash();
                }, 0);
            }
        }
    }

    update (dt: number) {
        if (!this.rb) return;
        if (this.isShell && !this.isRolling) return;

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

        let currentSpeed = this.isRolling ? this.rollSpeed : this.walkSpeed;
        let velocity = this.rb.linearVelocity;
        velocity.x = this.moveDir * currentSpeed;
        this.rb.linearVelocity = velocity;

        if (!this.isShell && this.moveDir !== 0) {
            let currentScale = Math.abs(this.node.scaleX);
            this.node.scaleX = this.moveDir > 0 ? -currentScale : currentScale;
        }
    }
}