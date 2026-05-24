import UIManager from "./UIManager";

const {ccclass, property} = cc._decorator;

// 【C++ OOP 概念：列舉 Enum】定義磚塊能裝什麼內容物
export enum BlockContent {
    COIN = 0,
    MUSHROOM = 1,
    ENEMY = 2
}

@ccclass
export default class QuestionBlock extends cc.Component {

    // 讓 Cocos 編輯器產生下拉式選單，預設裝金幣
    @property({ type: cc.Enum(BlockContent), tooltip: "磚塊裡裝什麼？" })
    contentType: BlockContent = BlockContent.COIN;

    // ----- 預製體 (Prefabs) 綁定區 -----
    @property(cc.Prefab)
    coinPrefab: cc.Prefab | null = null;

    @property(cc.Prefab)
    mushroomPrefab: cc.Prefab | null = null;

    @property(cc.Prefab)
    enemyPrefab: cc.Prefab | null = null;

    // ----- 視覺與音效綁定區 -----
    @property(cc.SpriteFrame)
    emptyBlockFrame: cc.SpriteFrame | null = null; // 敲完後變成鐵灰色/棕色的空磚塊圖片

    @property(cc.AudioClip)
    hitAudio: cc.AudioClip | null = null; // 敲擊磚塊的聲音

    @property(cc.AudioClip)
    spawnAudio: cc.AudioClip | null = null; // 蘑菇/敵人冒出來的專屬聲音 (金幣通常直接用 hitAudio 即可)

    // ----- 內部狀態 -----
    private isHit: boolean = false; // 狀態鎖：是否已經被敲過了？
    private originalY: number = 0;  // 記錄磚塊原本的高低，用來做彈跳動畫

    onLoad() {
        this.originalY = this.node.y;
    }

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        // 1. 只有馬力歐能敲磚塊
        if (otherCollider.node.name !== "Player") return;

        // 2. 已經敲過就沒反應了
        if (this.isHit) return;

        let playerRb = otherCollider.node.getComponent(cc.RigidBody);
        if (!playerRb) return;

        // 3. 【核心判定】判斷馬力歐是否是「從下往上」撞擊
        // 條件 A：馬力歐有向上的速度 (linearVelocity.y > 0)
        // 條件 B：馬力歐的頭頂，低於磚塊的中心點 (稍微給 10 像素的容錯空間)
        let playerTop = otherCollider.node.y + (otherCollider.node.height / 2);
        if (playerRb.linearVelocity.y > 0 && playerTop < this.node.y + 10) {
            
            this.triggerBlock();
            
            // 💡 【物理模擬細節】：馬力歐撞到頭後，應該要失去向上的動力直接掉下去
            setTimeout(() => {
                if (playerRb) playerRb.linearVelocity = cc.v2(playerRb.linearVelocity.x, 0);
            }, 0);
        }
    }

    private triggerBlock() {
        this.isHit = true;

        if (this.hitAudio) cc.audioEngine.playEffect(this.hitAudio, false);

        // 【Tween 動畫】讓磚塊往上彈 15 像素，再縮回原位，花費 0.1 秒
        cc.tween(this.node)
            .to(0.1, { y: this.originalY + 15 }) 
            .to(0.1, { y: this.originalY })      
            .call(() => {
                // 彈完之後，把圖片換成「空磚塊」
                let sprite = this.getComponent(cc.Sprite);
                if (sprite && this.emptyBlockFrame) {
                    sprite.spriteFrame = this.emptyBlockFrame;
                }
                // 呼叫內容物生成器
                this.spawnItem();
            })
            .start();
    }

    private spawnItem() {
        let item: cc.Node | null = null;

        // 【工廠模式 (Factory)】根據下拉選單的設定，實例化對應的預製體
        switch (this.contentType) {
            case BlockContent.COIN:
                if (this.coinPrefab) item = cc.instantiate(this.coinPrefab);
                break;
            case BlockContent.MUSHROOM:
                if (this.mushroomPrefab) item = cc.instantiate(this.mushroomPrefab);
                break;
            case BlockContent.ENEMY:
                if (this.enemyPrefab) item = cc.instantiate(this.enemyPrefab);
                break;
        }

        if (!item) return;

        // 如果生成的是實體物件 (蘑菇/敵人)，播放冒出的音效
        if (this.contentType !== BlockContent.COIN && this.spawnAudio) {
            cc.audioEngine.playEffect(this.spawnAudio, false);
        }

        // 把生成的物品放在場景中 (與磚塊同一個父節點)
        this.node.parent.addChild(item);
        
        // 初始位置設定在磚塊的正中心
        item.setPosition(this.node.x, this.node.y);
        item.zIndex = this.node.zIndex - 1; // Z軸往後調，讓它看起來是藏在磚塊「裡面」

        // 【暫時關閉物理】在冒出來的過程中，不能讓它受到重力影響掉下去
        let rb = item.getComponent(cc.RigidBody);
        let colliders = item.getComponents(cc.PhysicsCollider);
        if (rb) rb.active = false;
        colliders.forEach(c => c.enabled = false);

        // 【冒出動畫】花 0.4 秒從磚塊裡慢慢浮到上方
        cc.tween(item)
            .to(0.4, { y: this.node.y + this.node.height }) 
            .call(() => {
                // 冒出完成後的處理
                if (this.contentType === BlockContent.COIN) {
                    // 如果是金幣，直接幫玩家加 100 分，然後銷毀金幣 (不留實體)
                    if (UIManager && UIManager.instance) UIManager.instance.addScore(100);
                    item.destroy();
                } else {
                    // 如果是蘑菇或敵人，恢復它的物理剛體與碰撞，讓它開始掉落與走動
                    if (rb) rb.active = true;
                    colliders.forEach(c => c.enabled = true);
                    item.zIndex = this.node.zIndex + 1; // 把圖層拉回最前面
                }
            })
            .start();
    }
}