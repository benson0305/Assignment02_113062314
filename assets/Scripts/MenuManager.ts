const {ccclass, property} = cc._decorator;

@ccclass
export default class MenuManager extends cc.Component {

    @property(cc.AudioClip)
    bgmAudio: cc.AudioClip | null = null;

    @property(cc.AudioClip)
    clickAudio: cc.AudioClip | null = null;

    // 【新增】綁定關卡選擇面板
    @property(cc.Node)
    stageSelectPanel: cc.Node | null = null;

    onLoad() {
        if (this.bgmAudio) {
            cc.audioEngine.playMusic(this.bgmAudio, true);
        }
        
        // 確保一開始選關面板是隱藏的
        if (this.stageSelectPanel) {
            this.stageSelectPanel.active = false;
        }
    }

    // --- 【新增】面板開關邏輯 ---
    public openStageSelect() {
        if (this.clickAudio) cc.audioEngine.playEffect(this.clickAudio, false);
        if (this.stageSelectPanel) this.stageSelectPanel.active = true;
    }

    public closeStageSelect() {
        if (this.clickAudio) cc.audioEngine.playEffect(this.clickAudio, false);
        if (this.stageSelectPanel) this.stageSelectPanel.active = false;
    }

    // --- 【升級】通用的關卡載入函數 ---
    // event 參數是引擎自動傳入的，customData 就是我們在編輯器填寫的關卡名稱
    public loadLevel(event: cc.Event, customData: string) {
        if (this.clickAudio) cc.audioEngine.playEffect(this.clickAudio, false);
        
        // 防呆：如果你先做好了 Level 2 的按鈕，但場景還沒建，可以在這攔截
        if (customData === "Level2") {
            console.log("-> 關卡 2 尚在施工中！");
            // 你也可以在這裡接一個 UI 提示，例如 alert("Coming Soon!");
            return;
        }

        console.log("-> 準備切換至關卡: " + customData);
        setTimeout(() => {
            cc.director.loadScene(customData);
        }, 100);
    }

    // ... (原本的 loadStartScene 保持不變) ...
    public loadStartScene() {
        if (this.clickAudio) cc.audioEngine.playEffect(this.clickAudio, false);
        setTimeout(() => {
            cc.director.loadScene("Start");
        }, 100);
    }
}