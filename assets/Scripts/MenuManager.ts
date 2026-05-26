const {ccclass, property} = cc._decorator;

@ccclass
export default class MenuManager extends cc.Component {

    // ==========================================
    //               音效資源綁定
    // ==========================================
    @property(cc.AudioClip)
    bgmAudio: cc.AudioClip | null = null;

    @property(cc.AudioClip)
    clickAudio: cc.AudioClip | null = null;

    // ==========================================
    //           登入與註冊面板 (Auth UI)
    // ==========================================
    @property(cc.Node)
    authPanel: cc.Node | null = null;

    @property(cc.Node)
    gameUIGroup: cc.Node | null = null; // 包含「選關」與「排行榜」按鈕的父節點

    @property(cc.EditBox)
    emailBox: cc.EditBox | null = null;

    @property(cc.EditBox)
    passwordBox: cc.EditBox | null = null;

    @property(cc.EditBox)
    usernameBox: cc.EditBox | null = null;

    @property(cc.Label)
    errorLabel: cc.Label | null = null;

    // ==========================================
    //           關卡選擇面板 (Stage Select UI)
    // ==========================================
    @property(cc.Node)
    stageSelectPanel: cc.Node | null = null;

    // ==========================================
    //           排行榜面板 (Leaderboard UI)
    // ==========================================
    @property(cc.Node)
    leaderboardPanel: cc.Node | null = null;

    @property(cc.Label)
    leaderboardText: cc.Label | null = null;


    onLoad() {
        // 1. 播放背景音樂
        if (this.bgmAudio) {
            cc.audioEngine.playMusic(this.bgmAudio, true);
        }
        
        // 2. 初始化 UI 狀態：只顯示登入牆，隱藏其他所有面板與按鈕
        if (this.authPanel) this.authPanel.active = true;
        if (this.gameUIGroup) this.gameUIGroup.active = false;
        if (this.stageSelectPanel) this.stageSelectPanel.active = false;
        if (this.leaderboardPanel) this.leaderboardPanel.active = false;
        if (this.errorLabel) this.errorLabel.string = "";
    }

    // ==========================================
    //               Firebase 驗證功能
    // ==========================================

    public onLoginClicked() {
        console.log("👉 登入按鈕確實被點擊了！");
        if (this.clickAudio) cc.audioEngine.playEffect(this.clickAudio, false);
        let email = this.emailBox?.string || "";
        let pass = this.passwordBox?.string || "";

        let fb = cc.find("FirebaseManager")?.getComponent("FirebaseManager");
        if (fb) {
            fb.login(email, pass, 
                () => { this.onAuthSuccess(); }, 
                (msg: string) => { if (this.errorLabel) this.errorLabel.string = msg; }
            );
        } else {
            if (this.errorLabel) this.errorLabel.string = "系統錯誤：找不到 FirebaseManager";
        }
    }

    public onSignUpClicked() {
        console.log("【1】👉 進入註冊函數");
        
        if (this.clickAudio) cc.audioEngine.playEffect(this.clickAudio, false);
        
        let email = this.emailBox?.string || "";
        let pass = this.passwordBox?.string || "";
        let user = this.usernameBox?.string || "";

        console.log(`【2】讀取輸入框 -> Email: [${email}], Pass: [${pass}], User: [${user}]`);

        if (user.trim() === "") {
            console.warn("【3A】⛔ 阻擋：Username 是空的，提早 return");
            if (this.errorLabel) this.errorLabel.string = "請輸入 Username (註冊必填)！";
            return;
        }

        let fbNode = cc.find("FirebaseManager");
        console.log("【3B】尋找場景中的 FirebaseManager 節點 ->", fbNode !== null);

        let fb = fbNode?.getComponent("FirebaseManager");
        console.log("【4】取得 FirebaseManager 組件 ->", fb !== null);

        if (fb) {
            console.log("【5】準備發送請求給 Firebase...");
            fb.signUp(email, pass, user, 
                () => { 
                    console.log("✅ 【6】收到 Firebase 成功訊號！");
                    this.onAuthSuccess(); 
                }, 
                (msg: string) => { 
                    console.error("❌ 【6】Firebase 拒絕註冊，原因：", msg);
                    if (this.errorLabel) this.errorLabel.string = msg; 
                }
            );
        } else {
            console.error("【5】⛔ 失敗：fb 是空的，無法呼叫 signUp");
        }
    }

    // 驗證成功後，切換畫面的視覺顯示
    private onAuthSuccess() {
        if (this.errorLabel) this.errorLabel.string = "";
        if (this.authPanel) this.authPanel.active = false; // 隱藏登入牆
        if (this.gameUIGroup) this.gameUIGroup.active = true; // 顯示主選單功能按鈕
        //this.openStageSelect(); // 預設直接打開選關畫面
    }

    // ==========================================
    //               關卡選擇功能
    // ==========================================

    public openStageSelect() {
        if (this.clickAudio) cc.audioEngine.playEffect(this.clickAudio, false);
        
        // 【新增】隱藏主選單 (START 與 LEADERBOARD)
        if (this.gameUIGroup) this.gameUIGroup.active = false; 
        // 顯示選關面板
        if (this.stageSelectPanel) this.stageSelectPanel.active = true; 
    }

    public closeStageSelect() {
        if (this.clickAudio) cc.audioEngine.playEffect(this.clickAudio, false);
        
        // 隱藏選關面板
        if (this.stageSelectPanel) this.stageSelectPanel.active = false; 
        // 【新增】恢復顯示主選單 (START 與 LEADERBOARD)
        if (this.gameUIGroup) this.gameUIGroup.active = true; 
    }

    public loadLevel(event: cc.Event, customData: string) {
        if (this.clickAudio) cc.audioEngine.playEffect(this.clickAudio, false);
        
        // 防呆：如果是還沒做的關卡
        if (customData === "Level2") {
            console.log("-> 關卡 2 尚在施工中！");
            return;
        }

        console.log("-> 準備切換至關卡: " + customData);
        setTimeout(() => {
            cc.director.loadScene(customData);
        }, 100);
    }

    public loadStartScene() {
        if (this.clickAudio) cc.audioEngine.playEffect(this.clickAudio, false);
        setTimeout(() => {
            cc.director.loadScene("Start");
        }, 100);
    }

    // ==========================================
    //               排行榜功能
    // ==========================================

    public openLeaderboard() {
        if (this.clickAudio) cc.audioEngine.playEffect(this.clickAudio, false);
        if (this.leaderboardPanel) this.leaderboardPanel.active = true;

        if (this.leaderboardText) {
            this.leaderboardText.string = "連線中... 正在抓取最新排名 ⏳";
        }

        let firebaseMgr = cc.find("FirebaseManager")?.getComponent("FirebaseManager");
        if (firebaseMgr) {
            firebaseMgr.getLeaderboard((scoreList: any[]) => {
                this.updateLeaderboardUI(scoreList);
            });
        } else {
            if (this.leaderboardText) this.leaderboardText.string = "❌ 無法連線至資料庫";
        }
    }

    public closeLeaderboard() {
        if (this.clickAudio) cc.audioEngine.playEffect(this.clickAudio, false);
        if (this.leaderboardPanel) this.leaderboardPanel.active = false;
    }

    private updateLeaderboardUI(scoreList: any[]) {
        if (!this.leaderboardText) return;

        // 若資料庫尚未有任何分數記錄
        if (scoreList.length === 0) {
            this.leaderboardText.string = "目前還沒有人上榜喔！\n趕快成為第一名吧！";
            return;
        }

        // 組合字串
        let displayText = "排行榜\n\n";
        for (let i = 0; i < scoreList.length; i++) {
            let rank = i + 1;
            let name = scoreList[i].name || "Unknown";
            let score = scoreList[i].score || 0;
            
            // 加入前三名勳章特效
            let medal = "  ";
            //if (rank === 1) medal = "🥇";
            //if (rank === 2) medal = "🥈";
            //if (rank === 3) medal = "🥉";

            //displayText += `${medal} 第 ${rank} 名：${name} - ${score} 分\n`;
            displayText += `第 ${rank} 名：${name} - ${score} 分\n`;
        }

        this.leaderboardText.string = displayText;
    }
}