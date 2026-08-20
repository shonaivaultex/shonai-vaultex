export type Program = {
  slug: "junior" | "youth" | "elite" | "masters";
  number: string;
  name: string;
  englishTitle: string;
  audience: string;
  heroTitle: string;
  lead: string;
  description: string;
  highlights: { title: string; description: string }[];
  flow: { time: string; title: string; description: string }[];
  faq: { question: string; answer: string }[];
  
  tags: string[];
  image: string;
};
export const programs: Program[] = [
  {
    slug: "junior", number: "01", name: "JUNIOR", englishTitle: "Junior Athlete", audience: "小学4〜6年生対象",
    heroTitle: "走ることが、\n好きになる。", lead: "からだを動かす楽しさから、\n自分を信じる力へ。",
    description: "基礎的な走・跳・投の動きを、遊びや仲間との挑戦を通して身につける年代カテゴリーです。所属先を分けるためではなく、安全に楽しみながら挑戦するための目安として使用します。",
    highlights: [
      { title: "FUNDAMENTALS", description: "走る・跳ぶ・投げる。すべてのスポーツにつながる基礎運動能力を、楽しく伸ばします。" },
      { title: "CONFIDENCE", description: "できなかったことができるようになる体験を重ね、自分で一歩を踏み出す力を育てます。" },
      { title: "TEAM SPIRIT", description: "仲間と励まし合い、互いの挑戦を喜べる関係をつくります。" },
    ],
    flow: [
      { time: "01", title: "WARM UP", description: "遊びを取り入れたウォームアップで、心とからだをほぐします。" },
      { time: "02", title: "SKILL", description: "走・跳・投を軸に、その日のテーマに合わせて基礎を練習します。" },
      { time: "03", title: "CHALLENGE", description: "ゲームやミニ記録会で、できるようになったことを試します。" },
      { time: "04", title: "REFLECT", description: "今日の挑戦を振り返り、次にやってみたいことを見つけます。" },
    ],
    faq: [
      { question: "陸上経験がなくても参加できますか？", answer: "もちろんです。運動が得意かどうかに関わらず、一人ひとりのペースに合わせて進めます。" },
      { question: "どんな服装が必要ですか？", answer: "動きやすい運動着と運動靴があれば参加できます。飲み物とタオルもご用意ください。" },
      { question: "体験参加はできますか？", answer: "できます。まずは実際の雰囲気を体験してから、ご入会をご検討いただけます。" },
    ],
    image: "/junior.jpg",
    tags: [
  "初心者歓迎",
  "走・跳・投",
  "楽しむ",
],

  },
  {
    slug: "youth", number: "02", name: "YOUTH", englishTitle: "Performance", audience: "中学生〜高校生対象",
    heroTitle: "伸びる瞬間を、\nつかみにいく。", lead: "自分の可能性に向き合い、\n次のステージへ。",
    description: "成長期のからだと向き合いながら、競技に必要な技術・体力・考え方を磨く年代カテゴリーです。カウンセリングをもとに、コーチと一緒に自分に合った練習方針を考えます。",
    highlights: [
      { title: "TECHNIQUE", description: "専門性を意識したドリルと反復で、競技につながる技術の土台をつくります。" },
      { title: "CONDITIONING", description: "成長段階に合わせて、けがを防ぎながら動けるからだを育てます。" },
      { title: "CO-CREATION", description: "目標や課題をコーチと共有し、練習の目的と進め方を一緒に考えます。" },
    ],
    flow: [
      { time: "01", title: "PREPARE", description: "状態を確認し、競技動作につながるウォームアップを行います。" },
      { time: "02", title: "PLAN", description: "その日の目的を確認し、複数の選択肢から自分に必要な練習を考えます。" },
      { time: "03", title: "PERFORM", description: "個人・種目別の課題に取り組み、コーチの助言を受けながら実戦力を磨きます。" },
      { time: "04", title: "REVIEW", description: "コーチと振り返り、次回までの課題と目標を明確にします。" },
    ],
    faq: [
      { question: "学校の部活動と両立できますか？", answer: "できます。学校での活動状況も考慮しながら、無理のない練習計画を一緒に考えます。" },
      { question: "専門種目が決まっていなくても大丈夫ですか？", answer: "大丈夫です。さまざまな動きを経験しながら、自分に合う種目を見つけていけます。" },
      { question: "大会への参加はできますか？", answer: "目標や所属状況に合わせて、競技会への挑戦をサポートします。" },
    ],
    image: "/youth.jpg",
    tags: [
  "競技力向上",
  "専門指導",
  "大会出場",
],

  },
  {
    slug: "elite", number: "03", name: "ELITE", englishTitle: "Elite Performance", audience: "大学生・一般競技者対象",
    heroTitle: "記録の先へ、\n限界の先へ。", lead: "競技人生を、自分の力で\n切り拓く。",
    description: "大学生・一般競技者の測定や安全管理に用いる年代カテゴリーです。選手自身の考えを軸に、カウンセリングとデータを用いてコーチと個別方針を設計します。名称は競技レベルの上下や昇格を意味しません。",
    highlights: [
      { title: "INDIVIDUAL PLAN", description: "選手が考える目標と課題をもとに、コーチとトレーニングの道筋を設計します。" },
      { title: "HIGH PERFORMANCE", description: "技術とフィジカルをつなげ、試合で発揮できるパフォーマンスを追求します。" },
      { title: "SUSTAINABILITY", description: "長く挑戦を続けるために、回復・栄養・セルフケアの力も磨きます。" },
    ],
    flow: [
      { time: "01", title: "ASSESS", description: "選手がその日の状態と狙いを伝え、コーチと内容を最適化します。" },
      { time: "02", title: "ACTIVATE", description: "可動性・安定性・出力を整え、競技に向けて準備します。" },
      { time: "03", title: "EXECUTE", description: "専門練習と高強度のトレーニングで、競技力を引き上げます。" },
      { time: "04", title: "ANALYZE", description: "結果を分析し、次のサイクルへつながる改善点を共有します。" },
    ],
    faq: [
      { question: "所属チームがあっても参加できますか？", answer: "はい。所属先での活動を尊重しながら、個人の課題に合わせてサポートします。" },
      { question: "専門種目に特化した指導は受けられますか？", answer: "種目・目標に応じて内容を組み立てます。まずは体験時にご相談ください。" },
      { question: "単発での参加は可能ですか？", answer: "参加形態はご相談いただけます。目標とスケジュールに合う方法をご提案します。" },
    ],
    image: "/elite.jpg",
    tags: [
  "個別指導",
  "ハイパフォーマンス",
  "全国レベル",
],

  },
  {
    slug: "masters", number: "04", name: "MASTERS", englishTitle: "Masters Athlete", audience: "一般・マスターズ対象",
    heroTitle: "何歳からでも、\n自己ベストへ。", lead: "挑戦を続けるから、\n毎日はもっと面白い。",
    description: "健康づくりから競技復帰、マスターズ大会への挑戦までを支える年代カテゴリーです。生活リズムや体調、目標を共有し、無理なく続けられる練習方針をコーチと一緒につくります。",
    highlights: [
      { title: "MOVE WELL", description: "日常を軽やかに過ごすための、動きやすいからだづくりを大切にします。" },
      { title: "PERSONAL GOALS", description: "健康、仲間づくり、記録更新。それぞれの目標に合わせて取り組めます。" },
      { title: "KEEP CHALLENGING", description: "年齢を理由に諦めない。挑戦を楽しみ続ける仲間が待っています。" },
    ],
    flow: [
      { time: "01", title: "CHECK IN", description: "体調を確認し、その日に合った無理のないスタートを切ります。" },
      { time: "02", title: "MOBILITY", description: "柔軟性と安定性を高め、気持ちよく動けるからだを整えます。" },
      { time: "03", title: "TRAIN", description: "走・跳・投を楽しみながら、それぞれの目標に向けて練習します。" },
      { time: "04", title: "CONNECT", description: "仲間と交流し、次の挑戦が楽しみになる時間をつくります。" },
    ],
    faq: [
      { question: "運動から長く離れています。大丈夫ですか？", answer: "大丈夫です。現在の体力や経験に合わせて、少しずつ始められます。" },
      { question: "大会を目指さなくても参加できますか？", answer: "もちろんです。健康づくりや仲間との運動を目的とした参加も歓迎しています。" },
      { question: "どのくらいの頻度で参加できますか？", answer: "ご自身の生活リズムに合わせてご相談ください。継続できるペースを大切にします。" },
    ],
    image: "/masters.jpg",
    tags: [
  "健康づくり",
  "マスターズ",
  "生涯スポーツ",
],

  },
];
export const programBySlug = Object.fromEntries(programs.map((program) => [program.slug, program])) as Record<Program["slug"], Program>;
