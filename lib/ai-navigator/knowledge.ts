export type KnowledgeCategory = "philosophy" | "coaching" | "manual" | "control-test" | "athlete-scan" | "sprint" | "jump" | "throw" | "training" | "faq";
export type CompanionAction = { label: string; href?: string; prompt?: string; tone?: "orange" | "sky" | "neutral"; handoff?: boolean };
export type CompanionAnswer = { title: string; body: string; question?: string; actions: CompanionAction[]; note?: string; category: KnowledgeCategory; requiresCoach?: boolean };
export type AthleteContext = {
  name: string | null; programClass: string | null; event: string | null; recordCount: number; recentRecordCount: number; videoCount: number;
  goals: Array<{ category: string; target: number }>;
  recentRecords: Array<{ category: string; value: number; date: string; kind: string | null }>;
  personalBests: Array<{ category: string; value: number; date: string }>;
  awarenessCounts: Array<{ label: string; count: number }>;
  highPerformanceAwareness: Array<{ label: string; count: number; total: number }>;
  latestScan: null | { scanNumber: number; measuredOn: string; typeName: string | null; scores: Array<{ label: string; score: number }>; evolution: Array<{ label: string; change: number }> };
};
export type CompanionHistoryItem = { role: "user" | "companion"; content: string };

export const navigatorPrinciples = ["選手の感覚と意思を尊重する", "感覚と記録・動画・データを両方見る", "積み上げてきた良い部分を残す", "技術・適性・身体状態を断定しない"] as const;

export const knowledgeBase = [
  { category: "philosophy", title: "VAULTEX理念", keywords: ["理念", "考え方"], summary: "選手自身が考え、挑戦し、記録し、振り返る循環を支える。" },
  { category: "coaching", title: "指導方針", keywords: ["指導", "アドバイス", "コーチ"], summary: "選手主体。感覚と客観情報を両立し、答えを押し付けない。" },
  { category: "manual", title: "システムマニュアル", keywords: ["ログイン", "プロフィール", "記録", "動画", "意識", "予定", "ランキング"], summary: "マイページの各機能と操作導線。" },
  { category: "control-test", title: "CONTROL TEST", keywords: ["コントロールテスト", "測定", "scan"], summary: "同じ条件で身体能力の変化を継続測定する。" },
  { category: "athlete-scan", title: "ATHLETE SCAN", keywords: ["タイプ", "score", "スコア", "profile evolution"], summary: "現在の身体能力構成。才能や適性を固定する診断ではない。" },
  { category: "sprint", title: "Sprint", keywords: ["走", "スタート", "加速", "疾走", "リズム"], summary: "一般的な用語と振り返り観点。個別フォームは断定しない。" },
  { category: "jump", title: "Jump", keywords: ["跳", "踏切", "助走", "空中動作"], summary: "助走・踏切・空中動作を切り分けて振り返る。" },
  { category: "throw", title: "Throw", keywords: ["投", "投てき", "投擲"], summary: "準備・リズム・力の伝達を切り分けて振り返る。" },
  { category: "training", title: "Training", keywords: ["練習", "メニュー", "トレーニング"], summary: "試すことを一つ選び、記録して次に振り返る。" },
  { category: "faq", title: "FAQ", keywords: ["方法", "分からない", "どこ"], summary: "よくある操作質問から該当機能へ案内する。" },
] as const;

const links = { official: "/mypage/athletics", practice: "/mypage/unofficial-athletics", addRecord: "/performance", scan: "/mypage/control-tests", newScan: "/mypage/control-tests/new", coach: "/mypage/video-feedback", schedule: "/mypage/schedules", profile: "/edit", resetPassword: "/forgot-password", manual: "/member-manual.pdf" };
const includesAny = (value: string, words: string[]) => words.some((word) => value.includes(word));

function dataSummary(context: AthleteContext) {
  const parts: string[] = [];
  if (context.recentRecordCount) parts.push(`直近30日には${context.recentRecordCount}件の記録があります`);
  if (context.highPerformanceAwareness[0]) { const item = context.highPerformanceAwareness[0]; parts.push(`高記録側の記録${item.total}件では「${item.label}」が${item.count}件含まれています`); }
  else if (context.awarenessCounts[0]) parts.push(`記録で多い意識は「${context.awarenessCounts.slice(0, 2).map((item) => item.label).join("」「")}」です`);
  if (context.latestScan?.typeName) parts.push(`最新SCANは「${context.latestScan.typeName}」と表示されています`);
  return parts.length ? `${parts.join("。")}。` : "まだ比較材料が少ないので、今の感覚を言葉にするところから始められます。";
}

function systemAnswer(input: string): CompanionAnswer | null {
  if (includesAny(input, ["動画", "ビデオ", "映像"])) return { title: "動画の使い方を選ぼう", body: "動画は、記録と一緒に残す方法と、動画だけコーチへ相談する方法があります。", question: "今の目的に近いのはどちら？", category: "manual", actions: [{ label: "記録に動画を追加", href: links.addRecord }, { label: "動画だけ相談", href: links.coach, tone: "sky" }, { label: "マニュアルを見る", href: links.manual }] };
  if (includesAny(input, ["ログイン", "パスワード", "プロフィール", "設定"])) return { title: "アカウント設定を案内するね", body: "プロフィール変更とパスワード再設定は入口が分かれています。", question: "どちらを確認したい？", category: "manual", actions: [{ label: "プロフィール設定", href: links.profile }, { label: "パスワード再設定", href: links.resetPassword }, { label: "マニュアルを見る", href: links.manual }] };
  if (includesAny(input, ["予定", "スケジュール", "出欠", "練習日", "場所"])) return { title: "予定を確認しよう", body: "月間予定から日時・場所・対象クラスを確認できます。必要な予定では出欠も回答できます。", category: "manual", actions: [{ label: "スケジュールを見る", href: links.schedule }] };
  if (includesAny(input, ["ランキング", "順位", "上位何"])) return { title: "現在地を確認してみよう", body: "本番記録の種目カードから、男女別の全体・クラス別ランキングを確認できます。順位は評価ではなく、今の位置を知る一つの材料として見てみよう。", category: "manual", actions: [{ label: "本番記録とランキングを見る", href: links.official }] };
  if (includesAny(input, ["記録を追加", "記録登録", "意識入力", "意識を入力"])) return { title: "残したい記録を選ぼう", body: "本番記録・練習記録・CONTROL TESTで入口が分かれています。記録には意識タグ、メモ、動画も追加できます。", category: "manual", actions: [{ label: "記録を追加", href: links.addRecord }, { label: "CONTROL TESTを記録", href: links.newScan }, { label: "マニュアルを見る", href: links.manual }] };
  return null;
}

export const initialCompanionAnswer: CompanionAnswer = { title: "今日はどんなことを一緒に整理しようか？", body: "競技の悩み、記録の振り返り、VAULTEXの使い方を話してください。すぐに答えを決めず、今の状態に合う入口を一緒に探します。", question: "今の気持ちに近いものを選んでも大丈夫です。", category: "philosophy", actions: [{ label: "最近記録が出ない", prompt: "最近記録が出ない" }, { label: "好調時を振り返りたい", prompt: "調子が良かった時を振り返りたい" }, { label: "技術の相談をしたい", prompt: "技術の相談をしたい" }, { label: "VAULTEXの使い方", prompt: "VAULTEXの使い方を知りたい" }] };

export function answerCompanion(inputRaw: string, history: CompanionHistoryItem[], context: AthleteContext): CompanionAnswer {
  const input = inputRaw.trim().toLowerCase();
  const previousUser = [...history].reverse().find((item) => item.role === "user")?.content.toLowerCase() ?? "";
  if (includesAny(input, ["痛い", "痛み", "怪我", "けが", "違和感", "診断"])) return { title: "その状態は無理に決めつけないでおこう", body: "身体の状態や怪我の診断はVAULTEX AIではできません。強い痛みや急な症状がある場合は練習を中断し、コーチや医療専門職へ相談してください。", question: "コーチへ今の状況を伝える？", category: "coaching", requiresCoach: true, actions: [{ label: "コーチへ相談する", href: links.coach, tone: "sky" }] };
  if (includesAny(input, ["最近記録が出ない", "記録が出ない", "伸びない", "調子悪", "不調"])) return { title: "伸び悩んでいると感じているんだね", body: `まず原因を決めつけず、今の状態を整理してみよう。${dataSummary(context)}`, question: "今の状態に一番近いものはどれ？", category: "coaching", actions: [{ label: "練習では良いが試合で出ない", prompt: "練習では良いが試合で出ない" }, { label: "練習から記録が落ちている", prompt: "練習から記録が落ちている" }, { label: "感覚が分からない", prompt: "感覚が分からない" }, { label: "気持ちが乗らない", prompt: "気持ちが乗らない" }, { label: "原因が分からない", prompt: "原因が分からない" }] };
  const situationChoices = ["練習では良いが試合で出ない", "練習から記録が落ちている", "感覚が分からない", "気持ちが乗らない", "原因が分からない"];
  if (includesAny(input, situationChoices)) return { title: "今の状況が少し見えてきたね", body: "次は、今感じていることを一つ選んでみよう。正解を決めるためではなく、相談の焦点を言葉にするためです。", question: "今の感覚に近いものは？", category: "coaching", actions: ["リズム", "力感", "動作", "スタート", "感覚", "気持ち", "その他"].map((label) => ({ label, prompt: `今の感覚：${label}` })) };
  if (input.startsWith("今の感覚：")) return { title: "感覚も整理できたね", body: `「${inputRaw.replace("今の感覚：", "")}」を手がかりに、次にしたいことを選ぼう。`, question: "今一番したいことは？", category: "coaching", actions: [
    { label: "原因を整理したい", prompt: "原因を整理したい" }, { label: "過去の良い記録を見たい", href: links.official }, { label: "動画を見たい", href: links.official }, { label: "練習方法を考えたい", prompt: "練習方法を考えたい" }, { label: "コーチに相談したい", handoff: true, tone: "sky" }
  ] };
  if (includesAny(input, ["原因を整理したい", "練習方法を考えたい"])) return { title: "次に試すことを一緒に絞ろう", body: `${dataSummary(context)} これは原因の断定ではなく、振り返りの手がかりです。良かった部分を残しながら、確認することを一つ選ぼう。`, question: "データをもう少し見る？ それとも整理した内容をコーチへ送る？", category: "training", actions: [{ label: "記録推移を見る", href: links.official }, { label: "PB時の意識を見る", href: links.official }, { label: "ATHLETE SCANを見る", href: links.scan }, { label: "コーチ相談をまとめる", handoff: true, tone: "sky" }] };
  if (includesAny(input, ["練習では良いが試合で出ない", "試合で出ない"])) return { title: "練習でできている部分は残せそうだね", body: "練習と試合で何が変わったか、記録・意識・気持ちを並べると整理しやすくなります。", question: "まずどの違いから見てみる？", category: "coaching", actions: [{ label: "本番記録と意識を見る", href: links.official }, { label: "練習記録と意識を見る", href: links.practice }, { label: "試合時の動画を相談", href: links.coach, tone: "sky" }] };
  if (includesAny(input, ["練習から記録が落ちている", "練習から落ち"])) return { title: "練習から変化を感じているんだね", body: "一度の結果だけで判断せず、最近の推移と身体能力の測定、今の感覚を並べてみよう。", question: "どこから確認すると整理しやすそう？", category: "training", actions: [{ label: "最近の練習記録", href: links.practice }, { label: "ATHLETE SCANの変化", href: links.scan }, { label: "コーチへ状況を相談", href: links.coach, tone: "sky" }] };
  if (includesAny(input, ["感覚が分からなく", "感覚がわからなく"])) return { title: "感覚を探し直しているところなんだね", body: "今まで積み上げたものを全部変える必要はありません。良かった日の意識や動画から、残したい感覚を一つ探してみよう。", question: "何から思い出してみる？", category: "coaching", actions: [{ label: "PB時の意識・メモ", href: links.official }, { label: "良かった日の動画", href: links.official }, { label: "動きをコーチと確認", href: links.coach, tone: "sky" }] };
  if (includesAny(input, ["気持ちが乗らない", "やる気", "モチベーション"])) return { title: "気持ちが乗らない時もあるよね", body: "無理に前向きな答えを作らなくても大丈夫。今できていることと、負担になっていることを分けてみよう。", question: "今日は小さく振り返る？ それとも誰かに話す？", category: "coaching", actions: [{ label: "最近できたことを見る", href: links.practice }, { label: "目標を確認する", href: links.official }, { label: "コーチへ話す", href: links.coach, tone: "sky" }] };
  if (includesAny(input, ["調子が良かった", "好調", "pb時", "何を意識した時", "俺の場合"])) return { title: "自分の良かった時を一緒に探そう", body: `${dataSummary(context)} これは答えではなく、振り返るための手がかりです。高記録の日のメモや動画と今の感覚を比べてみよう。`, question: "どの材料から確認したい？", category: "coaching", actions: [{ label: "PB時の記録・意識", href: links.official }, { label: "練習時の意識傾向", href: links.practice }, { label: "動画をコーチと確認", href: links.coach, tone: "sky" }] };
  if (includesAny(input, ["踏切", "助走", "最後の3歩", "空中動作"])) return { title: "動きを一つに決めつけず整理してみよう", body: "現在できている部分を残しながら、変化を確認したい部分を切り分けると振り返りやすくなります。動画なしで個別フォームは断定しません。", question: "今、一番気になっているのはどこ？", category: "jump", actions: [{ label: "助走リズム", prompt: "助走リズムが気になる" }, { label: "最後の3歩", prompt: "最後の3歩が気になる" }, { label: "踏切", prompt: "踏切の動きを見てほしい" }, { label: "空中動作", prompt: "空中動作を見てほしい" }, { label: "動画でコーチに相談", href: links.coach, tone: "sky" }] };
  if (includesAny(input, ["見てほしい", "フォーム", "技術の相談", "大会前", "メニューを組"]) || includesAny(previousUser, ["踏切", "技術"])) return { title: "実際の動きも確認した方が良さそうです", body: "ここで技術変更を断定せず、今の感覚・試したこと・動画候補をそろえてコーチと確認しよう。", question: "ここまでの相談をコーチ向けにまとめる？", category: "coaching", requiresCoach: true, actions: [{ label: "コーチ相談をまとめる", handoff: true, tone: "sky" }, { label: "過去の意識を確認", href: links.practice }] };
  if (includesAny(input, ["scan", "スキャン", "type", "タイプ", "score", "スコア", "profile evolution", "身体能力"])) return { title: "ATHLETE SCANは現在地を見る材料です", body: context.latestScan ? `最新はSCAN #${String(context.latestScan.scanNumber).padStart(2, "0")}（${context.latestScan.measuredOn}）です。${context.latestScan.typeName ? `表示は「${context.latestScan.typeName}」ですが、` : ""}固定された才能や適性の診断ではありません。` : "ATHLETE SCANはCONTROL TESTから現在の身体能力構成を見るもので、固定された才能や適性の診断ではありません。", question: "結果と変化を確認してみる？", category: "athlete-scan", actions: [{ label: "ATHLETE SCANを見る", href: links.scan }, { label: "CONTROL TESTを記録", href: links.newScan }, { label: "コーチへ相談", href: links.coach, tone: "sky" }] };
  const system = systemAnswer(input);
  if (system) return system;
  if (includesAny(input, ["使い方", "分からない", "どこ", "方法"])) return { title: "使いたい機能を一緒に探そう", body: "VAULTEX内の操作を会話で案内できます。", question: "何をしたい？", category: "manual", actions: [{ label: "記録・意識を追加", prompt: "記録を追加したい" }, { label: "動画を送る", prompt: "動画を送る方法" }, { label: "予定を見る", prompt: "予定を確認したい" }, { label: "ランキングを見る", prompt: "ランキングはどこ？" }, { label: "マニュアルを見る", href: links.manual }] };
  return { title: "話してくれてありがとう", body: "今の内容だけで答えを決めつけず、感覚とVAULTEXに残した情報を一緒に整理してみよう。", question: "今はどこから振り返ると良さそう？", category: "philosophy", actions: [{ label: "最近の記録", href: links.practice }, { label: "PB・意識", href: links.official }, { label: "ATHLETE SCAN", href: links.scan }, { label: "動画でコーチに相談", href: links.coach, tone: "sky" }] };
}
