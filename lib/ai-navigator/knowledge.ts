export type NavigatorAction = { label: string; href?: string; prompt?: string; tone?: "orange" | "sky" };
export type NavigatorAnswer = { title: string; body: string; actions: NavigatorAction[]; note?: string };

type KnowledgeEntry = {
  id: string;
  keywords: string[];
  answer: NavigatorAnswer;
};

export const navigatorPrinciples = [
  "選手の感覚と意思を尊重する",
  "記録・動画・データを振り返りの材料にする",
  "技術・適性・身体状態を断定しない",
  "必要な場面ではコーチや医療専門職へつなぐ",
] as const;

export const navigatorKnowledge: KnowledgeEntry[] = [
  {
    id: "video",
    keywords: ["動画", "ビデオ", "映像", "フォーム", "撮影"],
    answer: {
      title: "動画の使い方を選びましょう",
      body: "動画は「記録と一緒に振り返る方法」と「動画だけコーチへ相談する方法」があります。どちらが今の目的に近いですか？",
      actions: [
        { label: "記録に動画を追加する", href: "/performance" },
        { label: "動画だけ相談する", href: "/mypage/video-feedback", tone: "sky" },
        { label: "マニュアルを見る", href: "/member-manual.pdf" },
      ],
      note: "フォームの細かな判断は、動画を添えてコーチへ相談してください。",
    },
  },
  {
    id: "slump",
    keywords: ["調子悪", "伸びない", "記録が落", "不調", "うまくいか", "原因"],
    answer: {
      title: "まず、どこから振り返りますか？",
      body: "すぐに改善方法を決めず、感覚と客観情報を一緒に整理してみましょう。気になる入口を選んでください。",
      actions: [
        { label: "最近の記録推移を見る", href: "/mypage/athletics" },
        { label: "練習記録を見る", href: "/mypage/unofficial-athletics" },
        { label: "良かった日の動画を見る", prompt: "調子が良かった時を振り返りたい" },
        { label: "ATHLETE SCANを見る", href: "/mypage/control-tests" },
        { label: "コーチへ相談する", href: "/mypage/video-feedback", tone: "sky" },
      ],
    },
  },
  {
    id: "peak",
    keywords: ["調子良", "好調", "良かった時", "PB", "ベスト", "何してた", "うまくいった"],
    answer: {
      title: "好調時の手がかりを探しましょう",
      body: "高記録だけでなく、その日に選んだ意識タグ・メモ・動画を一緒に見ると、自分なりの再現条件を考えやすくなります。",
      actions: [
        { label: "本番・PB記録を見る", href: "/mypage/athletics" },
        { label: "練習記録と意識を見る", href: "/mypage/unofficial-athletics" },
        { label: "動画だけの相談履歴を見る", href: "/mypage/video-feedback" },
      ],
      note: "過去と同じことを正解と決めつけず、今回試したいことを一つ選んで記録してみましょう。",
    },
  },
  {
    id: "scan",
    keywords: ["SCAN", "scan", "スキャン", "タイプ", "TYPE", "身体能力", "コントロールテスト", "反発", "パワー型", "スピード型"],
    answer: {
      title: "ATHLETE SCANを確認しましょう",
      body: "ATHLETE TYPEは、CONTROL TESTから見た現在の身体能力構成です。固定された才能・適性の診断ではなく、再測定で変化していくプロフィールです。",
      actions: [
        { label: "最新のATHLETE SCANを見る", href: "/mypage/control-tests" },
        { label: "CONTROL TESTを記録する", href: "/mypage/control-tests/new" },
        { label: "測定結果をコーチに相談する", href: "/mypage/video-feedback", tone: "sky" },
      ],
    },
  },
  {
    id: "coach",
    keywords: ["コーチ", "相談", "アドバイス", "技術", "大会前", "メニュー", "トレーニング"],
    answer: {
      title: "コーチへ伝える材料を選びましょう",
      body: "技術的な修正、大会前の判断、個別メニューはコーチと一緒に決める領域です。動画や記録、今の感覚を添えると相談しやすくなります。",
      actions: [
        { label: "動画を添えて相談する", href: "/mypage/video-feedback", tone: "sky" },
        { label: "相談する記録を選ぶ", href: "/mypage/athletics" },
        { label: "練習記録から相談する", href: "/mypage/unofficial-athletics" },
      ],
    },
  },
  {
    id: "record",
    keywords: ["記録", "入力", "追加", "意識", "メモ", "練習跳躍", "練習投擲", "大会"],
    answer: {
      title: "追加する記録を選んでください",
      body: "本番記録・練習記録・CONTROL TESTで入口が分かれています。記録には意識タグ、メモ、動画も残せます。",
      actions: [
        { label: "記録を追加する", href: "/performance" },
        { label: "本番記録を見る", href: "/mypage/athletics" },
        { label: "練習記録を見る", href: "/mypage/unofficial-athletics" },
        { label: "CONTROL TESTを見る", href: "/mypage/control-tests" },
      ],
    },
  },
  {
    id: "schedule",
    keywords: ["予定", "スケジュール", "練習日", "時間", "場所", "出欠"],
    answer: { title: "練習予定を確認できます", body: "月間カレンダーから日時・場所・対象クラスを確認し、必要な予定では出欠を回答できます。", actions: [{ label: "スケジュールを見る", href: "/mypage/schedules" }] },
  },
  {
    id: "account",
    keywords: ["ログイン", "パスワード", "通知", "設定", "プロフィール", "メール"],
    answer: {
      title: "アカウント・設定の案内です",
      body: "目的に合う入口を選んでください。パスワードを忘れた場合は再設定画面から手続きできます。",
      actions: [
        { label: "プロフィールを編集する", href: "/edit" },
        { label: "パスワードを再設定する", href: "/forgot-password" },
        { label: "使用マニュアルを見る", href: "/member-manual.pdf" },
      ],
    },
  },
  {
    id: "body",
    keywords: ["痛い", "痛み", "怪我", "けが", "違和感", "病気", "診断"],
    answer: {
      title: "身体状態の診断はできません",
      body: "無理に原因を決めず、まず練習を続けてよい状態かをコーチや医療専門職へ相談してください。強い痛みや急な症状がある場合は、練習を中断して適切な医療機関へつながってください。",
      actions: [{ label: "コーチへ状況を相談する", href: "/mypage/video-feedback", tone: "sky" }],
    },
  },
];

export const initialNavigatorAnswer: NavigatorAnswer = {
  title: "今日は何を整理したいですか？",
  body: "答えを決める前に、今の感覚やVAULTEXに残した情報から振り返る入口を一緒に選びます。",
  actions: [
    { label: "記録が伸びない", prompt: "最近記録が伸びない" },
    { label: "好調時を振り返る", prompt: "調子が良かった時って何してた？" },
    { label: "動画の送り方", prompt: "動画を送る方法が分からない" },
    { label: "ATHLETE TYPEについて", prompt: "このATHLETE TYPEって何？" },
  ],
};

export function answerNavigator(input: string): NavigatorAnswer {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return initialNavigatorAnswer;
  const ranked = navigatorKnowledge.map((entry) => ({ entry, score: entry.keywords.reduce((score, keyword) => score + (normalized.includes(keyword.toLowerCase()) ? Math.max(1, keyword.length) : 0), 0) })).sort((a, b) => b.score - a.score);
  if (ranked[0]?.score > 0) return ranked[0].entry.answer;
  return {
    title: "もう少し入口を選んでみましょう",
    body: "今の内容だけで技術的な答えを断定せず、VAULTEXにある情報から整理します。近いものを選んでください。",
    actions: [
      { label: "記録・意識を振り返る", href: "/mypage/athletics" },
      { label: "動画を振り返る", href: "/mypage/video-feedback" },
      { label: "ATHLETE SCANを見る", href: "/mypage/control-tests" },
      { label: "コーチへ相談する", href: "/mypage/video-feedback", tone: "sky" },
      { label: "マニュアルを見る", href: "/member-manual.pdf" },
    ],
  };
}
