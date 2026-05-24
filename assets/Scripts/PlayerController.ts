import UIManager from "./UIManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class PlayerController extends cc.Component {

    private rb: cc.RigidBody | null = null;
    private anim: cc.Animation | null = null; 
    private moveDir: number = 0; 
    private isGrounded: boolean = false;
    private isWalking: boolean = false; 
    private initialPosition: cc.Vec3 = cc.v3(0, 0, 0); 

    // 【新增狀態變數】用來控制角色型態與傷害護甲
    private baseScale: number = 1.0; 
    private isDying: boolean = false; // 【新增】追蹤是否正在播放死亡演出
    private isInvincible: boolean = false; // 追蹤是否處於受傷後的無敵狀態

    @property
    moveSpeed: number = 200; 
    @property
    jumpSpeed: number = 500; 
    @property
    life: number = 3; 
    @property
    deathYThreshold: number = -500; 

    // ===== 音效資源綁定欄位 =====
    @property(cc.AudioClip)
    bgmAudio: cc.AudioClip | null = null;

    @property(cc.AudioClip)
    jumpAudio: cc.AudioClip | null = null;

    @property(cc.AudioClip)
    stompAudio: cc.AudioClip | null = null; 

    @property(cc.AudioClip)
    kickAudio: cc.AudioClip | null = null;  

    @property(cc.AudioClip)
    mushroomAudio: cc.AudioClip | null = null; // 【新增】吃到超級香菇音效

    @property(cc.AudioClip)
    shrinkAudio: cc.AudioClip | null = null;   // 【新增】巨大化解除/變小音效

    @property(cc.AudioClip)
    deathAudio: cc.AudioClip | null = null;    // 【新增】真正死亡時的悲壯音效

    onLoad () {
        this.rb = this.getComponent(cc.RigidBody);
        this.anim = this.getComponent(cc.Animation);
        this.initialPosition = this.node.position.clone();
        
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        if (this.bgmAudio) {
            cc.audioEngine.playMusic(this.bgmAudio, true);
        }
    }

    onDestroy () {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onKeyDown (event: cc.Event.EventKeyboard) {
        switch(event.keyCode) {
            case cc.macro.KEY.a:
            case cc.macro.KEY.left:
                this.moveDir = -1;
                break;
            case cc.macro.KEY.d:
            case cc.macro.KEY.right:
                this.moveDir = 1;
                break;
            case cc.macro.KEY.w:
                if (this.isGrounded && this.rb) {
                    this.jump();
                }
                break;
        }
    }

    onKeyUp (event: cc.Event.EventKeyboard) {
        switch(event.keyCode) {
            case cc.macro.KEY.a:
            case cc.macro.KEY.left:
                if (this.moveDir === -1) this.moveDir = 0;
                break;
            case cc.macro.KEY.d:
            case cc.macro.KEY.right:
                if (this.moveDir === 1) this.moveDir = 0;
                break;
        }
    }

    jump () {
        if (!this.rb) return;
        let velocity = this.rb.linearVelocity;
        velocity.y = this.jumpSpeed;
        this.rb.linearVelocity = velocity;
        
        this.isGrounded = false;
        this.isWalking = false; 

        if (this.anim) this.anim.play('jump');
        if (this.jumpAudio) cc.audioEngine.playEffect(this.jumpAudio, false);
    }

    public takeDamage () {
        // 【新增攔截】如果已經死透、正在播放死亡動畫，或者「處於無敵狀態」，就直接免疫傷害
        if (this.life <= 0 || this.isDying || this.isInvincible) return;

        if (this.baseScale > 1.0) {
            // 【機制一：巨大化護甲破裂】
            this.baseScale = 1.0;
            this.node.scaleY = 1.0; 
            // 為了防止原地不動時沒有更新到寬度，強制更新一次 X 軸比例
            let currentScale = Math.abs(this.node.scaleX);
            this.node.scaleX = this.node.scaleX > 0 ? 1.0 : -1.0; 
            
            if (this.shrinkAudio) cc.audioEngine.playEffect(this.shrinkAudio, false);

            // 🌟 開啟無敵狀態
            this.isInvincible = true;
            this.node.opacity = 150; // 讓馬力歐變成半透明，提示玩家現在是無敵的

            // 1.5 秒後解除無敵狀態
            setTimeout(() => {
                this.isInvincible = false;
                if (this.node) {
                    this.node.opacity = 255; // 恢復完全不透明
                }
            }, 1500); 

            console.log("-> 護甲破裂！進入 1.5 秒無敵狀態。");

        } else {
            // 【機制二：觸發經典死亡動畫】
            this.isDying = true; 
            this.life -= 1;
            
            if (UIManager && UIManager.instance) UIManager.instance.updateLife(this.life);

            cc.audioEngine.stopMusic();
            if (this.deathAudio) cc.audioEngine.playEffect(this.deathAudio, false);

            let colliders = this.getComponents(cc.PhysicsCollider);
            colliders.forEach(c => c.enabled = false);

            if (this.rb) {
                this.rb.linearVelocity = cc.v2(0, 400); 
            }

            setTimeout(() => {
                if (this.life > 0) {
                    this.respawn();
                } else {
                    cc.director.loadScene("GameOver");
                }
            }, 2000);
        }
    }

    respawn () {
        this.isDying = false; 
        
        // 【新增】確保重生時解除無敵狀態並恢復不透明
        this.isInvincible = false;
        this.node.opacity = 255;

        // ... (下方原本的重置物理框和坐標邏輯保持不變)
        let colliders = this.getComponents(cc.PhysicsCollider);
        colliders.forEach(c => c.enabled = true);

        this.node.setPosition(this.initialPosition);
        if (this.rb) this.rb.linearVelocity = cc.v2(0, 0);
        
        if (this.bgmAudio) cc.audioEngine.playMusic(this.bgmAudio, true);
    }

    onBeginContact (contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        let normal = contact.getWorldManifold().normal;
        if (Math.abs(normal.y) > 0.5) {
            this.isGrounded = true;
            this.isWalking = false; 
        }

        // --- 處理香菇敵人 ---
        if (otherCollider.node.name === "Enemy") {
            if (this.node.y > otherCollider.node.y + 25) {
                if (this.stompAudio) cc.audioEngine.playEffect(this.stompAudio, false);
                if (UIManager && UIManager.instance) UIManager.instance.addScore(100);
                
                let enemyCtrl = otherCollider.node.getComponent("EnemyController");
                setTimeout(() => {
                    if (enemyCtrl) enemyCtrl.squash();
                    this.jump(); 
                }, 0);
            } else {
                // 側面碰撞，改為呼叫受傷判定
                setTimeout(() => { this.takeDamage(); }, 0);
            }
        }

        // --- 處理烏龜敵人 ---
        if (otherCollider.node.name === "Turtle") {
            let turtleCtrl = otherCollider.node.getComponent("TurtleController");
            
            // 【由上往下踩踏】
            if (this.node.y > otherCollider.node.y + 25) {
                
                setTimeout(() => {
                    if (turtleCtrl) {
                        // 經典狀態機的三重分流：
                        if (!turtleCtrl.isShell) {
                            // 狀態 A：正常走路的烏龜 ➡️ 踩扁變成靜止龜殼
                            if (this.stompAudio) cc.audioEngine.playEffect(this.stompAudio, false);
                            turtleCtrl.squash();
                            
                        } else if (!turtleCtrl.isRolling) {
                            // 狀態 B：已經是靜止龜殼 ➡️ 踩下去變成無敵風火輪 (踢飛)
                            if (this.kickAudio) cc.audioEngine.playEffect(this.kickAudio, false);
                            turtleCtrl.kick(this.node.x); 
                            
                        } else {
                            // 狀態 C：正在高速滾動的龜殼 ➡️ 踩下去強制煞車 (變回靜止龜殼)
                            if (this.stompAudio) cc.audioEngine.playEffect(this.stompAudio, false);
                            turtleCtrl.squash(); // 呼叫 squash() 觸發裡面的煞車邏輯
                        }
                    }
                    this.jump(); // 馬力歐依然會獲得帥氣的彈跳滯空
                }, 0);

            } else {
                // 【從側面碰撞】
                if (turtleCtrl && turtleCtrl.isShell && !turtleCtrl.isRolling) {
                    // 只有靜止龜殼才可以從側面踢
                    if (this.kickAudio) cc.audioEngine.playEffect(this.kickAudio, false);
                    setTimeout(() => {
                        turtleCtrl.kick(this.node.x);
                    }, 0);
                } else {
                    // 走路中或高速滾動中，側面撞到人都算受傷
                    setTimeout(() => { this.takeDamage(); }, 0);
                }
            }
        }

        // --- 處理超級香菇 ---
        if (otherCollider.node.name === "Mushroom") {
            if (UIManager && UIManager.instance) UIManager.instance.addScore(1000);
            
            // 播放吃到香菇音效
            if (this.mushroomAudio) {
                cc.audioEngine.playEffect(this.mushroomAudio, false);
            }

            setTimeout(() => {
                if (otherCollider.node) otherCollider.node.destroy();
                
                // 狀態轉移：將基礎比例設為 1.5，並同步拉高 Y 軸
                this.baseScale = 1.5; 
                this.node.scaleY = 1.5; 
            }, 0);
        }
    }

    update (dt: number) {
        if (!this.rb) return;
        // 【新增攔截】如果正在播放死亡演出（往上彈並掉落中），直接結束這幀，不再接收鍵盤移動
        if (this.isDying) return;

        if (this.life <= 0) {
            this.rb.linearVelocity = cc.v2(0, 0); 
            return; 
        }

        let velocity = this.rb.linearVelocity;
        velocity.x = this.moveDir * this.moveSpeed;
        this.rb.linearVelocity = velocity;

        // 翻轉與狀態縮放同步優化
        if (this.moveDir !== 0) {
            // 水平翻轉時，直接乘上當前的 baseScale (可能是 1.0 或 1.5)
            this.node.scaleX = this.moveDir > 0 ? this.baseScale : -this.baseScale;
        }

        // 地面與空中動畫切換
        if (this.isGrounded) {
            if (this.moveDir !== 0) {
                if (!this.isWalking) {
                    if (this.anim) this.anim.play('walk');
                    this.isWalking = true;
                }
            } else {
                if (this.isWalking) {
                    if (this.anim) this.anim.stop();
                    this.isWalking = false;
                }
            }
        } else {
            if (this.anim && !this.anim.getAnimationState('jump').isPlaying) {
                this.anim.play('jump');
            }
        }

        // 掉落邊界檢測
        if (this.node.y < this.deathYThreshold) {
            // 如果是自己摔下懸崖，不觸發向上彈的動畫，直接走原本的扣血重生邏輯
            this.baseScale = 1.0; 
            this.node.scale = 1.0;
            this.life -= 1; 
            
            if (UIManager && UIManager.instance) UIManager.instance.updateLife(this.life);
            cc.audioEngine.stopMusic();
            if (this.deathAudio) cc.audioEngine.playEffect(this.deathAudio, false);

            if (this.life > 0) {
                this.respawn();
            } else {
                cc.director.loadScene("GameOver");
            }
        }
    }
}