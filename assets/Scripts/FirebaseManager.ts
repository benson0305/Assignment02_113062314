// 告訴 TypeScript 編輯器，全域環境中會有 firebase 物件（由網頁底層引入）
declare let firebase: any;

const {ccclass, property} = cc._decorator;

@ccclass
export default class FirebaseManager extends cc.Component {

    // 靜態實例，讓其他腳本（如 UIManager）可以直接透過 FirebaseManager.instance 呼叫
    public static instance: FirebaseManager | null = null;

    private db: any = null; // 儲存 Firestore 資料庫實例

    private auth: any = null; // 【新增】儲存 Auth 實例

    onLoad() {
        // 實作 Singleton 模式
        if (FirebaseManager.instance === null) {
            FirebaseManager.instance = this;
            cc.game.addPersistRootNode(this.node); // 設定為常駐節點，切換場景時不會被銷毀
            this.initFirebase();
        } else {
            this.node.destroy();
        }
    }

    private initFirebase() {
        // 填入你在 步驟一 複製的 Firebase 專案設定資訊
        const firebaseConfig = {
            apiKey: "AIzaSyA3Yfc6E52CoGeStklBAqSdpel9Pqa-SmA",
            authDomain: "mario-game-7db4e.firebaseapp.com",
            projectId: "mario-game-7db4e",
            storageBucket: "mario-game-7db4e.firebasestorage.app",
            messagingSenderId: "240981378498",
            appId: "1:240981378498:web:babe3da8f3731a7e11825b"
        };


        // 初始化 Firebase
        if (typeof firebase !== 'undefined') {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            this.db = firebase.firestore(); 
            this.auth = firebase.auth(); // 【新增】初始化 Auth
            console.log("⚡ Firebase 初始化成功！");
        }
    }

    // --- 【新增】帳號註冊 (SignUp) ---
    public signUp(email: string, pass: string, username: string, onSuccess: () => void, onError: (msg: string) => void) {
        if (!this.auth) {
            console.error("❌ 找不到 Firebase Auth 模組！請確認是否在 Build 後的網頁測試，並檢查 index.html。");
            return;
        }
        
        this.auth.createUserWithEmailAndPassword(email, pass)
            .then((userCredential: any) => {
                // 註冊成功後，立刻將 Username 寫入使用者的 Profile 中
                return userCredential.user.updateProfile({
                    displayName: username
                });
            })
            .then(() => {
                console.log("註冊成功！使用者：", username);
                onSuccess();
            })
            .catch((error: any) => {
                onError(error.message);
            });
    }

    // --- 【新增】帳號登入 (Login) ---
    public login(email: string, pass: string, onSuccess: () => void, onError: (msg: string) => void) {
        if (!this.auth) return;

        this.auth.signInWithEmailAndPassword(email, pass)
            .then((userCredential: any) => {
                console.log("登入成功！歡迎：", userCredential.user.displayName);
                onSuccess();
            })
            .catch((error: any) => {
                onError(error.message);
            });
    }

    // --- 【新增】獲取當前玩家名稱 ---
    public getCurrentPlayerName(): string {
        if (this.auth && this.auth.currentUser) {
            return this.auth.currentUser.displayName || "Unknown";
        }
        return "Player"; // 預設防呆
    }
    /**
     * 【功能一】上傳分數到雲端排行榜
     * @param playerName 玩家名稱
     * @param score 分數
     */
    public uploadScore(playerName: string, score: number) {
        if (!this.db) return;

        this.db.collection("leaderboard").add({
            name: playerName,
            score: score,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            console.log(`🎉 分數上傳成功！ ${playerName}: ${score}`);
        })
        .catch((error: any) => { // 👈 加上 : any
            console.error("❌ 分數上傳失敗: ", error);
        });
    }

    /**
     * 【功能二】從雲端抓取前 10 名排行榜
     * @param callback 抓取成功後的回呼函數，會把排行陣列傳回去
     */
    public getLeaderboard(callback: (scores: any[]) => void) {
        if (!this.db) return;

        this.db.collection("leaderboard")
            .orderBy("score", "desc")
            .limit(10)
            .get()
            .then((querySnapshot: any) => { // 👈 加上 : any
                let scoreList: any[] = [];  // 👈 加上 : any[]
                querySnapshot.forEach((doc: any) => { // 👈 加上 : any
                    scoreList.push(doc.data());
                });
                callback(scoreList); 
            })
            .catch((error: any) => { // 👈 加上 : any
                console.error("❌ 抓取排行榜失敗: ", error);
            });
    }
}