const {ccclass, property} = cc._decorator;

@ccclass
export default class UIManager extends cc.Component {

    public static instance: UIManager | null = null;

    @property(cc.Label)
    scoreLabel: cc.Label | null = null;

    @property(cc.Label)
    lifeLabel: cc.Label | null = null;

    @property(cc.Label)
    timeLabel: cc.Label | null = null;

    // 將倒數時間開放給編輯器，預設 300
    @property
    timeRemaining: number = 300; 
    
    private score: number = 0;
    private life: number = 3;
    private timer: number = 0;

    // 在 UIManager.ts 的屬性區新增
    @property(cc.Node)
    winPanel: cc.Node | null = null;

    // 新增公開函數供 GoalFlag 呼叫
    public showLevelClear() {
        if (this.winPanel) {
            this.winPanel.active = true; // 顯示通關畫面
        }
    }
    onLoad () {
        UIManager.instance = this;
        // 初始化
        this.updateScore(this.score);
        this.updateLife(this.life);
    }

    public addScore(points: number) {
        this.score += points;
        this.updateScore(this.score);
    }

    public updateLife(currentLife: number) {
        this.life = currentLife;
        if (this.lifeLabel) {
            // 【修復 1】將前面的 L 拿掉，改成你想要的 * 符號
            this.lifeLabel.string = "* " + this.life;
        }
    }

    private updateScore(currentScore: number) {
        if (this.scoreLabel) {
            // 【修復 2】把前面的 S 拿掉，讓它只顯示純數字 (例如：0)
            // 由於 .string 必須吃字串，所以用 .toString() 轉換
            this.scoreLabel.string = currentScore.toString(); 
        }
    }

    update (dt: number) {
        if (!this.timeLabel || this.timeRemaining <= 0) return;

        this.timer += dt;

        if (this.timer >= 1) {
            this.timeRemaining -= 1;
            
            // 【修復】把前面的 T 拿掉，只顯示純數字
            this.timeLabel.string = this.timeRemaining.toString(); 
            
            this.timer = 0; 
        }
    }
}