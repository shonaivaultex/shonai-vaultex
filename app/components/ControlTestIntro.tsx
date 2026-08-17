import { Activity, ChevronDown } from "lucide-react";
import { controlTestDefinitions, type ControlTestProtocol } from "@/lib/control-test";

const abilityOrder = ["最大疾走速度", "水平瞬発力", "連続水平跳躍力", "全身爆発力", "反発パフォーマンス", "スピード持久力"];
const protocolFields: Array<[string, keyof ControlTestProtocol]> = [
  ["スタート方法", "startMethod"], ["試技数", "attempts"], ["休息時間", "rest"],
  ["測定方法", "measurementMethod"], ["ファウル条件", "foulConditions"],
  ["採用記録", "adoptedRecord"], ["使用器具", "equipment"], ["注意事項", "notes"],
];

export default function ControlTestIntro() {
  const abilities = abilityOrder.map((abilityJa) => {
    const tests = controlTestDefinitions.filter((item) => item.abilityJa === abilityJa);
    return { definition: tests[0], tests };
  });

  return (
    <section className="mt-8 rounded-3xl border border-orange-500/35 bg-[#111] p-5 sm:p-7">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-500/15 text-orange-400"><Activity size={24} /></span>
        <div>
          <p className="text-[10px] font-black tracking-[0.22em] text-orange-400">VAULTEX CONTROL TEST Ver.1</p>
          <h2 className="mt-1 text-2xl font-black">身体能力の特徴と変化を知る</h2>
          <p className="mt-2 text-sm leading-6 text-white/50">同じ測定方法で継続し、実測値・PB・前回／初回SCANとの差を確認するための測定です。独自スコアやATHLETE TYPEはまだ算出しません。</p>
        </div>
      </div>
      <div className="mt-5 rounded-xl border border-orange-500/20 bg-orange-500/[0.06] p-4 text-xs leading-6 text-orange-100/75">
        最初の6測定は会場・人数に応じたステーション方式で実施できます。各測定間は疲労の影響を抑えるため十分に休息し、スピード持久力のみ必ず最後に実施します。
      </div>
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {abilities.map(({ definition, tests }) => (
          <details key={definition.abilityJa} className="group rounded-2xl border border-white/10 bg-white/[0.025] p-4 open:border-orange-500/30 open:bg-orange-500/[0.04]">
            <summary className="flex cursor-pointer list-none items-start gap-3">
              <span className="min-w-0 flex-1">
                <strong className="block text-base">{definition.abilityJa}</strong>
                <span className="mt-0.5 block text-[10px] font-black tracking-[0.14em] text-orange-400">{definition.abilityEn}</span>
                <span className="mt-2 block text-sm leading-6 text-white/50">{definition.description}</span>
                <span className="mt-2 block text-xs leading-5 text-white/35">{definition.abilityJa === "連続水平跳躍力" ? <>JUNIOR：<b className="text-white/60">立三段跳</b><br/>YOUTH／ELITE／MASTERS：<b className="text-white/60">立五段跳</b></> : definition.abilityJa === "全身爆発力" ? <>JUNIOR：<b className="text-white/60">2kgメディシンボール フロント／バック</b><br/>その他：<b className="text-white/60">男子4kg・女子3kg砲丸 フロント／バック</b></> : definition.abilityJa === "スピード持久力" ? <>JUNIOR／MASTERS：<b className="text-white/60">150m</b><br/>YOUTH／ELITE：<b className="text-white/60">300m</b></> : <>測定：<b className="text-white/60">{tests.map((test) => test.measurement).join("／")}</b></>}</span>
              </span>
              <ChevronDown size={18} className="mt-1 shrink-0 text-white/35 transition group-open:rotate-180" />
            </summary>
            <div className="mt-4 border-t border-white/10 pt-4 text-sm leading-6 text-white/55">
              <strong className="text-white/80">競技動作との関係</strong>
              <p className="mt-1">{definition.relation}競技結果との因果関係を断定するものではありません。</p>
              {tests.map((test) => (
                <div key={test.code} className="mt-5">
                  <strong className="text-white/80">{test.measurement}・公式測定方法</strong>
                  <div className="mt-2 grid gap-1.5">
                    {protocolFields.map(([label, key]) => (
                      <div key={key} className="flex gap-3 rounded-lg bg-black/20 px-3 py-2 text-xs">
                        <span className="w-20 shrink-0 text-white/35">{label}</span><span className="text-white/65">{test.protocol[key]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
