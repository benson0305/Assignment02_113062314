const {ccclass, property} = cc._decorator;

@ccclass
export default class GameManager extends cc.Component {

    onLoad () {
        // 開啟 Cocos 2.x 的 2D 物理引擎
        cc.director.getPhysicsManager().enabled = true;

        // 只保留最基本的碰撞框顯示，避免 TS 找不到型別報錯
        cc.director.getPhysicsManager().debugDrawFlags = 
            cc.PhysicsManager.DrawBits.e_aabbBit |
            cc.PhysicsManager.DrawBits.e_jointBit |
            cc.PhysicsManager.DrawBits.e_shapeBit;

            // 或是直接設為 0
         cc.director.getPhysicsManager().debugDrawFlags = 0;
    }
}