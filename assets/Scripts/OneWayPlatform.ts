const {ccclass, property} = cc._decorator;

@ccclass
export default class OneWayPlatform extends cc.Component {

    onPreSolve(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        // 【移除】原本限制只有 Player 才能穿透的判斷式
        
        let otherRb = otherCollider.node.getComponent(cc.RigidBody);
        if (!otherRb) return;

        // 【條件一：判斷 Y 軸速度】
        // 只要任何物件(玩家、蘑菇)正在往上飛，就允許穿透
        if (otherRb.linearVelocity.y > 0.5) {
            contact.disabled = true;
            return;
        }

        // 【條件二：判斷相對幾何位置】
        let platformTop = this.node.y + (this.node.height / 2);
        let otherBottom = otherCollider.node.y - (otherCollider.node.height / 2);

        // 只要物件的腳底比平台表面還要低 (從下方或側面撞擊)
        // 一律強制關閉碰撞，允許穿透
        if (otherBottom < platformTop - 5) {
            contact.disabled = true;
        }
    }
}