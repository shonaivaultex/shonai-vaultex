export type BetterDirection = "higher" | "lower";

export type ControlTestProtocol = {
  startMethod: string; attempts: string; rest: string; measurementMethod: string;
  foulConditions: string; adoptedRecord: string; equipment: string; notes: string;
};

export type ControlTestDefinition = {
  code: string; category: string; abilityJa: string; abilityEn: string; description: string;
  measurement: string; relation: string; primaryMetric: string; unit: string;
  betterDirection: BetterDirection; sortOrder: number; protocol: ControlTestProtocol;
};

const stationRest = "正式な休息時間は要設定。各測定間で疲労が結果へ大きく影響しないよう、十分な休息を取る。";

export const controlTestDefinitions: ControlTestDefinition[] = [
  {
    code: "acceleration_30m", category: "Flying 30m", abilityJa: "最大疾走速度", abilityEn: "MAX SPEED",
    description: "30mの助走で加速した後、次の30m区間をどれだけ速く走れるかを測定し、高い走速度を発揮する能力を見る。",
    measurement: "Flying 30m（30m助走＋30〜60m区間を計測）", relation: "十分に加速した後の高い走速度を実測値で確認するための測定です。",
    primaryMetric: "flying_30m_time", unit: "秒", betterDirection: "lower", sortOrder: 1,
    protocol: { startMethod: "計測開始地点の30m手前からスタートする。", attempts: "最大2本。", rest: stationRest, measurementMethod: "光電管を30m地点と60m地点に設置し、30〜60m区間を計測する。全体では60m走る。", foulConditions: "要設定", adoptedRecord: "2本実施した場合は速い方を採用。", equipment: "光電管", notes: "0〜30mの加速区間データも任意で保存できる。" },
  },
  {
    code: "standing_long_jump", category: "立幅跳", abilityJa: "水平瞬発力", abilityEn: "HORIZONTAL EXPLOSIVE POWER",
    description: "一度の動作で前方向へ大きな力を発揮する能力を見る。", measurement: "立幅跳", relation: "静止状態から前方向へ発揮した力を跳躍距離として確認する測定です。",
    primaryMetric: "distance", unit: "m", betterDirection: "higher", sortOrder: 2,
    protocol: { startMethod: "静止状態から両足踏切。腕振り自由。", attempts: "最大2本。", rest: stationRest, measurementMethod: "踏切線から、着地時に身体が最も後方に触れた地点まで測定する。", foulConditions: "踏切線を越えて開始した場合。", adoptedRecord: "ベスト記録。", equipment: "巻尺または距離測定器具", notes: "ステーション方式で実施可能。" },
  },
  {
    code: "standing_five_bound", category: "立五段跳", abilityJa: "連続水平跳躍力", abilityEn: "BOUNCE POWER",
    description: "前方向への大きな力発揮を、連続した跳躍へつなげる能力を見る。", measurement: "立五段跳", relation: "連続した5回の跳躍で前方向へ進む力を確認する測定です。",
    primaryMetric: "distance", unit: "m", betterDirection: "higher", sortOrder: 3,
    protocol: { startMethod: "静止状態から両足で開始。その後の脚順と腕振りは自由。", attempts: "最大2本。", rest: stationRest, measurementMethod: "連続5回跳躍し、踏切線から最終着地で身体が最も後方に触れた地点まで測定する。", foulConditions: "踏切線を越えて開始した場合。", adoptedRecord: "ベスト記録。", equipment: "巻尺または距離測定器具", notes: "立三段跳・助走付き三段跳は将来候補で、Ver.1の必須種目には含めない。" },
  },
  {
    code: "shot_front_throw", category: "砲丸フロント投げ", abilityJa: "全身爆発力", abilityEn: "TOTAL BODY POWER",
    description: "下肢・体幹・上半身を連動させ、全身で大きな力を発揮する能力を見る。", measurement: "砲丸フロント投げ", relation: "投てき方向へ全身を連動させた力発揮を距離として確認する測定です。",
    primaryMetric: "distance", unit: "m", betterDirection: "higher", sortOrder: 4,
    protocol: { startMethod: "砲丸投ピット／サークルから投てき方向を向いて実施。", attempts: "最大2本。", rest: stationRest, measurementMethod: "投てき距離と使用した砲丸重量を記録する。", foulConditions: "サークル／投てきエリアの規定位置を越えた場合。", adoptedRecord: "ベスト記録。", equipment: "砲丸（男子4kg・女子3kg。JUNIORは要設定）", notes: "より詳細なフォーム規定は要設定。" },
  },
  {
    code: "shot_back_throw", category: "砲丸バック投げ", abilityJa: "全身爆発力", abilityEn: "TOTAL BODY POWER",
    description: "下肢・体幹・上半身を連動させ、全身で大きな力を発揮する能力を見る。", measurement: "砲丸バック投げ", relation: "投てき方向へ全身を連動させた力発揮を距離として確認する測定です。",
    primaryMetric: "distance", unit: "m", betterDirection: "higher", sortOrder: 5,
    protocol: { startMethod: "砲丸投ピット／サークルから投てき方向に背を向けて実施。", attempts: "最大2本。", rest: stationRest, measurementMethod: "投てき距離と使用した砲丸重量を記録する。", foulConditions: "サークル／投てきエリアの規定位置を越えた場合。", adoptedRecord: "ベスト記録。", equipment: "砲丸（男子4kg・女子3kg。JUNIORは要設定）", notes: "より詳細なフォーム規定は要設定。" },
  },
  {
    code: "rebound_jump", category: "リバウンドジャンプ", abilityJa: "反発パフォーマンス", abilityEn: "REACTIVE PERFORMANCE",
    description: "短い接地で地面からの反発を利用し、腕振りを含めて素早く大きな跳躍につなげる能力を見る。", measurement: "リバウンドジャンプ", relation: "腕振りを含む連続跳躍の反発パフォーマンスを実測値で確認する測定です。",
    primaryMetric: "rj_index", unit: "RJ-index", betterDirection: "higher", sortOrder: 6,
    protocol: { startMethod: "腕振り自由。", attempts: "連続5回。", rest: stationRest, measurementMethod: "できるだけ接地時間を短くしながら高く跳び、5回すべての跳躍高・接地時間・RJ-indexを保存する。", foulConditions: "再試技条件を含め要設定。", adoptedRecord: "5回の中で最も高いRJ-indexを代表値として採用。", equipment: "ジャンプマット", notes: "腕振りを使用するため、純粋な下肢Reactive Strengthのみを測るとは断定しない。" },
  },
  {
    code: "speed_endurance_300m", category: "SPEED ENDURANCE", abilityJa: "スピード持久力", abilityEn: "SPEED ENDURANCE",
    description: "高い走速度をできるだけ維持し、速度低下を抑える能力を見る。", measurement: "YOUTH／ELITE：300m、JUNIOR／MASTERS：150m", relation: "高い走速度を維持する局面を走タイムとして確認する測定です。",
    primaryMetric: "time", unit: "秒", betterDirection: "lower", sortOrder: 7,
    protocol: { startMethod: "全力で実施。", attempts: "1本のみ。", rest: "この種目をCONTROL TESTの最後に実施する。", measurementMethod: "クラス設定に従い、YOUTH／ELITEは300m、JUNIOR／MASTERSは150mのタイムを測定する。", foulConditions: "要設定", adoptedRecord: "1本の測定タイム。", equipment: "タイム測定器具", notes: "必ず全測定の最後に実施する。" },
  },
];

export const controlTestByCode = Object.fromEntries(controlTestDefinitions.map((item) => [item.code, item]));

export type MeasurementConditions = { distanceM?: number | null; jumpCount?: number | null; equipment?: string | null };

export const performanceCategoryForMeasurement = (testCode: string, conditions: MeasurementConditions = {}) => {
  if (testCode === "standing_five_bound") return Number(conditions.jumpCount) === 3 ? "立三段跳" : "立五段跳";
  if (testCode === "shot_front_throw" && conditions.equipment?.includes("メディシンボール")) return "メディシンボールフロント投げ";
  if (testCode === "shot_back_throw" && conditions.equipment?.includes("メディシンボール")) return "メディシンボールバック投げ";
  if (testCode === "rebound_jump" && [3,4,5].includes(Number(conditions.jumpCount))) return `リバウンドジャンプ（${conditions.jumpCount}回）`;
  if (testCode === "speed_endurance_300m") return Number(conditions.distanceM) === 150 ? "150m走" : "300m走";
  return controlTestByCode[testCode]?.category ?? testCode;
};
