import UIManager from "./UIManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GoalFlag extends cc.Component {

    @property(cc.AudioClip)
    winAudio: cc.AudioClip | null = null; // 通關音效

    private hasWon: boolean = false;

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        if (this.hasWon || otherCollider.node.name !== "Player") return;

        this.hasWon = true;
        console.log("-> 抵達終點！");

        // 1. 取得玩家腳本並鎖住控制
        let player = otherCollider.node.getComponent("PlayerController");
        if (player) {
            // 我們可以利用之前寫的 isDying 邏輯，或者在 PlayerController 新增 isWon 狀態
            // 這裡簡單處理：直接讓玩家靜止
            player.isDying = true; 
            let rb = otherCollider.node.getComponent(cc.RigidBody);
            if (rb) rb.linearVelocity = cc.v2(0, 0);
        }

        // 2. 停止背景音樂，播放通關音效
        cc.audioEngine.stopMusic();
        if (this.winAudio) {
            cc.audioEngine.playEffect(this.winAudio, false);
        }

        // 3. 通知 UIManager 顯示通關面板
        if (UIManager.instance) {
            UIManager.instance.showLevelClear();
            
            // 【新增】通關時，延遲 0.5 秒跳出輸入框 (讓玩家先看到通關畫面再輸入)
            setTimeout(() => {
                UIManager.instance?.submitScore();
            }, 500);
        }
    }
}