const {ccclass, property} = cc._decorator;

@ccclass
export default class BlockController extends cc.Component {

    // 讓你在屬性面板可以把剛剛做好的蘑菇 Prefab 拖進來
    @property(cc.Prefab)
    mushroomPrefab: cc.Prefab | null = null;

    // 狀態鎖：確保磚塊只能被頂一次
    private isHit: boolean = false; 

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        // 如果已經被頂過了，就不再觸發
        if (this.isHit) return;
        
        // 確認撞到的是馬力歐
        if (otherCollider.node.name !== "Player" && otherCollider.node.name !== "Mario") return;

        // 【判斷是否從下方頂】
        // 假設磚塊高度是 40，如果馬力歐的中心點 Y 坐標低於磚塊中心點約半個身位，就視為從下方頂撞
        if (otherCollider.node.y < this.node.y - 15) {
            console.log("-> 玩家從下方頂了問號磚塊！");
            this.isHit = true;

            // 延遲呼叫避免物理引擎鎖定
            setTimeout(() => {
                this.spawnMushroom();
                
                // 改變磚塊外觀，代表已經空了
                // 如果你有空磚塊的圖片素材，可以在這裡替換 SpriteFrame；
                // 這裡我們暫時把它變暗作為視覺提示
                this.node.color = cc.Color.GRAY; 
            }, 0);
        }
    }

    spawnMushroom() {
        if (!this.mushroomPrefab) {
            console.warn("忘記綁定蘑菇 Prefab 啦！");
            return;
        }
        
        // 1. 生成蘑菇的實體
        let mushroom = cc.instantiate(this.mushroomPrefab);
        
        // 2. 設定初始位置在磚塊的正上方
        mushroom.setPosition(this.node.x, this.node.y + 40);
        
        // 3. 將蘑菇加入到跟磚塊同一個父節點 (Environment) 底下，讓它出現在畫面上
        this.node.parent.addChild(mushroom);
    }
}