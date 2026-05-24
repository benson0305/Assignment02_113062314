const {ccclass, property} = cc._decorator;

@ccclass
export default class CameraFollow extends cc.Component {

    // 綁定馬力歐節點
    @property(cc.Node)
    playerNode: cc.Node | null = null;

    // 鏡頭跟隨的平滑係數（數值越小越平滑，範圍 0 ~ 1，建議 0.1 前後）
    @property
    smoothSpeed: number = 0.1;

    // ===== 鏡頭活動邊界限制 (防止穿幫) =====
    @property({ tooltip: "鏡頭水平左邊界" })
    minX: number = 0;

    @property({ tooltip: "鏡頭水平右邊界（根據地圖長度調整）" })
    maxX: number = 3000;

    @property({ tooltip: "鏡頭垂直下邊界（防止摔落時鏡頭一直往下掉）" })
    minY: number = 0;

    @property({ tooltip: "鏡頭垂直上邊界（跑酷關卡需要拉大這個值！）" })
    maxY: number = 800; // 👈 調整這個值來允許鏡頭往上爬

    update (dt: number) {
        if (!this.playerNode) return;

        // 1. 取得玩家當前的坐標作為鏡頭的「理想目標」
        let targetX = this.playerNode.x;
        let targetY = this.playerNode.y;

        // 2. 使用數學公式 clampf 將目標坐標嚴格限制在我們設定的矩形邊界內
        // 這樣可以防止鏡頭看到地圖外面的黑邊，也能防止掉落時鏡頭跟著摔下去
        targetX = cc.misc.clampf(targetX, this.minX, this.maxX);
        targetY = cc.misc.clampf(targetY, this.minY, this.maxY);

        // 3. 運用線性插值 (Lerp) 讓鏡頭平滑地朝目標滑行，減少畫面突兀的抖動
        let currentPos = this.node.position;
        let nextX = cc.misc.lerp(currentPos.x, targetX, this.smoothSpeed);
        let nextY = cc.misc.lerp(currentPos.y, targetY, this.smoothSpeed);

        // 4. 更新攝影機位置
        this.node.setPosition(nextX, nextY);
    }
}