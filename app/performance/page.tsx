"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { Activity, ArrowLeft, Check, ChevronRight, LoaderCircle, Medal, Save, Trash2, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { competitionDetailMode, eventNamesByKind, isWindAffectedEvent, type PerformanceKind, unitMap } from "@/lib/performance-events";
import { bestCompetitionDetail, type CompetitionDetailInput } from "@/lib/competition-details";
import { createVideoPath, formatVideoSize, PERFORMANCE_VIDEO_BUCKET, uploadVideoWithProgress, validateVideo } from "@/lib/performance-awareness";
import AwarenessTagSelector from "@/app/components/AwarenessTagSelector";
import CompetitionDetailEditor from "@/app/components/CompetitionDetailEditor";
import { mergePerformanceFields } from "@/lib/performance-record-merge";

function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
}

function PerformanceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedKind = searchParams.get("kind");
  const requestedDate = searchParams.get("date");
  const initialDate = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : today();
  const fromCalendar = searchParams.get("from") === "calendar";
  const hasSelectedKind = requestedKind === "athletics" || requestedKind === "unofficial-athletics" || requestedKind === "control-test";
  const kind: PerformanceKind = hasSelectedKind ? requestedKind : "control-test";
  const eventOptions = eventNamesByKind(kind);
  const [category, setCategory] = useState(eventOptions[0]);
  const [value, setValue] = useState("");
  const [windSpeed, setWindSpeed] = useState("");
  const [date, setDate] = useState(initialDate);
  const [awarenessTags, setAwarenessTags] = useState<string[]>([]);
  const [awarenessNote, setAwarenessNote] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [videoInputKey, setVideoInputKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [detailEnabled, setDetailEnabled] = useState(false);
  const [competitionDetails, setCompetitionDetails] = useState<CompetitionDetailInput[]>([]);
  const defaultsLoaded = useRef(false);

  const unit = unitMap[category] ?? "";
  const needsWind = isWindAffectedEvent(category);
  const detailMode = kind === "athletics" ? competitionDetailMode(category) : null;

  function enableDetails() {
    if (!detailMode) return;
    setDetailEnabled(true);
    setCompetitionDetails(detailMode === "attempt"
      ? Array.from({ length: 6 }, (_, index) => ({ sequenceNumber: index + 1, value: "", windSpeed: "", status: "valid" as const }))
      : [{ sequenceNumber: 1, roundName: "予選", value: "", windSpeed: "", place: "", status: "valid" }]);
  }

  useEffect(() => {
    if (!hasSelectedKind) return;
    defaultsLoaded.current = false;
    let savedCategory: string | undefined;
    let savedTags: string[] = [];
    try {
      const saved = window.localStorage.getItem(`vaultex-record-defaults:${kind}`);
      if (saved) {
        const parsed = JSON.parse(saved) as { category?: string; awarenessTags?: string[] };
        if (parsed.category && eventNamesByKind(kind).includes(parsed.category)) savedCategory = parsed.category;
        if (Array.isArray(parsed.awarenessTags)) savedTags = parsed.awarenessTags.slice(0, 7);
      }
    } catch {
      // 入力候補を復元できなくても、記録追加自体は通常どおり利用できます。
    }
    const frame = window.requestAnimationFrame(() => {
      if (savedCategory) setCategory(savedCategory);
      if (savedTags.length) setAwarenessTags(savedTags);
      defaultsLoaded.current = true;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hasSelectedKind, kind]);

  useEffect(() => {
    if (!hasSelectedKind || !defaultsLoaded.current) return;
    try {
      window.localStorage.setItem(`vaultex-record-defaults:${kind}`, JSON.stringify({ category, awarenessTags }));
    } catch {
      // 保存容量やプライベートブラウズの制限時は、自動入力だけ無効にします。
    }
  }, [awarenessTags, category, hasSelectedKind, kind]);

  if (!hasSelectedKind) {
    const choices = [
      {
        kind: "unofficial-athletics",
        title: "練習記録",
        description: "練習跳躍・練習投てき・実践練習",
        icon: Medal,
      },
      {
        kind: "athletics",
        title: "本番記録",
        description: "大会・記録会・公認記録",
        icon: Trophy,
      },
      {
        kind: "control-test",
        title: "コントロールテスト",
        description: "スプリント・ジャンプ・筋力測定",
        icon: Activity,
      },
    ] as const;

    return (
      <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 text-white sm:px-8">
        <div className="mx-auto max-w-xl">
          <Link href="/mypage" className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-white/60 transition hover:text-orange-400">
            <ArrowLeft size={16} aria-hidden="true" />
            MY PAGE
          </Link>

          <div className="mt-10 border-l-2 border-orange-500 pl-5">
            <p className="text-xs font-black tracking-[0.22em] text-orange-400">QUICK RECORD</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">何を記録しますか？</h1>
            <p className="mt-3 leading-7 text-white/60">追加する記録の種類を選んでください。</p>
          </div>

          <div className="mt-10 grid gap-3">
            {choices.map(({ kind: choiceKind, title, description, icon: Icon }) => (
              <Link
                key={choiceKind}
                href={choiceKind === "control-test" ? "/mypage/control-tests/new" : `/performance?kind=${choiceKind}`}
                className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#111] p-5 transition hover:border-orange-500/70 hover:bg-orange-500/[0.06]"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-500/15 text-orange-400">
                  <Icon size={23} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-lg">{title}</strong>
                  <span className="mt-1 block text-sm leading-6 text-white/45">{description}</span>
                </span>
                <ChevronRight className="shrink-0 text-orange-400 transition group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </main>
    );
  }

  async function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const bestDetail = detailEnabled && detailMode ? bestCompetitionDetail(competitionDetails, detailMode === "round") : null;
    const numericValue = bestDetail?.numericValue ?? Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      setErrorMessage("記録には0より大きい数値を入力してください。");
      return;
    }
    const selectedWind = bestDetail?.windSpeed ?? windSpeed;
    const numericWind = selectedWind?.trim() === "" || selectedWind === undefined ? null : Number(selectedWind);
    if (needsWind && kind === "athletics" && (numericWind === null || !Number.isFinite(numericWind))) {
      setErrorMessage("この種目の本番記録には風速を入力してください。");
      return;
    }
    if (awarenessNote.length > 200) {
      setErrorMessage("意識メモは200文字以内にしてください。");
      return;
    }
    const videoError = video ? validateVideo(video) : null;
    if (videoError) {
      setErrorMessage(videoError);
      return;
    }

    const supabase = createClient();
    setIsSaving(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setErrorMessage("記録を保存するにはログインが必要です。");
        return;
      }

      let videoPath: string | null = null;
      if (video) {
        setUploadProgress(0);
        videoPath = createVideoPath(user.id, video);
        try {
          await uploadVideoWithProgress(supabase, videoPath, video, setUploadProgress);
        } catch (uploadError) {
          setErrorMessage(`動画をアップロードできませんでした：${uploadError instanceof Error ? uploadError.message : "不明なエラー"}`);
          return;
        }
      }

      const incomingRecord = {
        user_id: user.id,
        category,
        value: numericValue,
        wind_speed: needsWind ? numericWind : null,
        date,
        record_kind: kind,
        awareness_category: awarenessTags[0] || null,
        awareness_categories: awarenessTags.length ? awarenessTags : null,
        awareness_note: awarenessNote.trim() || null,
        video_path: videoPath,
      };
      const { data: existingRecord, error: lookupError } = kind === "control-test"
        ? { data: null, error: null }
        : await supabase.from("performance_records")
          .select("id, awareness_category, awareness_categories, awareness_note, video_path, wind_speed")
          .eq("user_id", user.id).eq("category", category).eq("record_kind", kind).eq("date", date).eq("value", numericValue).maybeSingle();
      if (lookupError) throw lookupError;
      const saveQuery = existingRecord
        ? supabase.from("performance_records").update({ ...incomingRecord, ...mergePerformanceFields(existingRecord, incomingRecord) }).eq("id", existingRecord.id)
        : supabase.from("performance_records").insert(incomingRecord);
      const { data: savedRecord, error } = await saveQuery.select("id").single();

      if (error) {
        if (videoPath) await supabase.storage.from(PERFORMANCE_VIDEO_BUCKET).remove([videoPath]);
        setErrorMessage(error.message);
        return;
      }

      if (detailEnabled && detailMode && savedRecord) {
        const detailRows = competitionDetails.flatMap((detail) => {
          const detailValue = Number(detail.value);
          const valid = detail.status === "valid" && Number.isFinite(detailValue) && detailValue > 0;
          if (detail.status === "valid" && !valid) return [];
          const detailWind = detail.windSpeed?.trim() ? Number(detail.windSpeed) : null;
          const place = detail.place?.trim() ? Number(detail.place) : null;
          return [{ performance_record_id: savedRecord.id, detail_type: detailMode, sequence_number: detail.sequenceNumber, round_name: detailMode === "round" ? detail.roundName : null, value: valid ? detailValue : null, wind_speed: valid && Number.isFinite(detailWind) ? detailWind : null, place: Number.isInteger(place) && Number(place) > 0 ? place : null, status: detail.status }];
        });
        const { error: detailsError } = await supabase.from("performance_record_details").upsert(detailRows, { onConflict: "performance_record_id,detail_type,sequence_number" });
        if (detailsError) {
          if (!existingRecord) await supabase.from("performance_records").delete().eq("id", savedRecord.id);
          if (videoPath) await supabase.storage.from(PERFORMANCE_VIDEO_BUCKET).remove([videoPath]);
          setErrorMessage(`大会詳細を保存できませんでした：${detailsError.message}`);
          return;
        }
      }

      if (existingRecord?.video_path && videoPath && existingRecord.video_path !== videoPath) {
        await supabase.storage.from(PERFORMANCE_VIDEO_BUCKET).remove([existingRecord.video_path]);
      }

      router.push(fromCalendar ? `/mypage/my-calendar?date=${date}` : kind === "athletics" ? "/mypage/athletics" : kind === "unofficial-athletics" ? "/mypage/unofficial-athletics" : "/mypage/control-tests");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 sm:px-8">
      <div className="mx-auto max-w-xl">
        <Link
          href={fromCalendar ? `/mypage/my-calendar?date=${date}` : kind === "athletics" ? "/mypage/athletics" : kind === "unofficial-athletics" ? "/mypage/unofficial-athletics" : "/mypage/control-tests"}
          className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-white/60 transition hover:text-orange-400"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          MY PAGE
        </Link>

        <div className="mt-10 border-l-2 border-orange-500 pl-5">
          <p className="text-xs font-black tracking-[0.22em] text-orange-400">TRAINING LOG</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">
            {kind === "athletics" ? "本番記録を追加" : kind === "unofficial-athletics" ? "練習記録を追加" : "コントロールテストを追加"}
          </h1>
          <p className="mt-3 leading-7 text-white/60">
            今日の挑戦を残そう。積み重ねた記録が、次の自信になる。
          </p>
        </div>

        <form
          onSubmit={saveRecord}
          className="mt-10 rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/30 sm:p-8"
        >
          <ol aria-label="入力手順" className="mb-8 grid grid-cols-3 gap-2 border-b border-white/10 pb-6">
            {["記録", "振り返り", "動画"].map((label, index) => (
              <li key={label} className="flex items-center gap-2 text-[11px] font-black tracking-[0.08em] text-white/55 sm:text-xs">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange-500/15 text-orange-300">{index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
          <div className="space-y-6">
            <div>
              <p className="text-xs font-black tracking-[0.18em] text-orange-400">STEP 1</p>
              <h2 className="mt-1 text-xl font-black text-white">記録を入力</h2>
              <p className="mt-1 text-xs leading-5 text-white/40">前回選んだ種目は次回の入力候補として自動表示されます。</p>
            </div>
            <label className="block">
              <span className="text-sm font-bold text-white">種目</span>
              <select
                value={category}
                onChange={(event) => { setCategory(event.target.value); setDetailEnabled(false); setCompetitionDetails([]); if (!isWindAffectedEvent(event.target.value)) setWindSpeed(""); }}
                className="mt-3 w-full rounded-xl border border-white/15 bg-[#101216] px-4 py-4 text-white outline-none transition focus:border-orange-500"
              >
                {eventOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            {detailMode ? <div>{!detailEnabled ? <button type="button" onClick={enableDetails} className="w-full rounded-xl border border-orange-500/35 bg-orange-500/[0.06] px-4 py-4 text-sm font-black text-orange-300">{detailMode === "attempt" ? "1〜6回目も記録する" : "予選・準決勝・決勝も記録する"}</button> : <><CompetitionDetailEditor mode={detailMode} details={competitionDetails} onChange={setCompetitionDetails} unit={unit} needsWind={needsWind}/><button type="button" onClick={() => { setDetailEnabled(false); setCompetitionDetails([]); }} className="mt-2 text-xs font-bold text-white/40">詳細入力をやめる</button></>}</div> : null}

            {needsWind && !detailEnabled ? <label className="block">
              <span className="text-sm font-bold text-white">風速 {kind === "athletics" ? <span className="text-orange-400">（必須）</span> : <span className="text-white/40">（任意）</span>}</span>
              <div className="relative mt-3">
                <input type="number" inputMode="decimal" step="0.1" value={windSpeed} onChange={(event) => setWindSpeed(event.target.value)} placeholder="例：+1.2 / -0.4" className="w-full rounded-xl border border-white/15 bg-[#101216] px-4 py-4 pr-20 text-lg font-bold text-white outline-none transition placeholder:text-white/25 focus:border-orange-500" />
                <span className="pointer-events-none absolute inset-y-0 right-5 grid place-items-center text-sm font-bold text-white/40">m/s</span>
              </div>
              {windSpeed !== "" && Number(windSpeed) > 2 ? <p className="mt-2 text-sm font-bold text-amber-300">追い風参考記録（ランキング対象外）</p> : <p className="mt-2 text-xs text-white/40">追い風は「+」、向かい風は「-」で入力。+2.0m/sまでランキング対象です。</p>}
            </label> : null}

            {!detailEnabled ? <label className="block">
              <span className="text-sm font-bold text-white">記録</span>
              <div className="relative mt-3">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  required
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder="例：16.30"
                  className="w-full rounded-xl border border-white/15 bg-[#101216] px-4 py-4 pr-16 text-lg font-bold text-white outline-none transition placeholder:text-white/25 focus:border-orange-500"
                />
                <span className="pointer-events-none absolute inset-y-0 right-5 grid place-items-center text-sm font-bold text-white/40">
                  {unit}
                </span>
              </div>
            </label> : <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] px-4 py-3 text-sm text-emerald-300">代表記録は入力した中の最高記録（トラック種目は最速記録）から自動で保存されます。</p>}

            <label className="block">
              <span className="text-sm font-bold text-white">測定日</span>
              <input
                type="date"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-3 w-full rounded-xl border border-white/15 bg-[#101216] px-4 py-4 text-white outline-none transition focus:border-orange-500"
              />
            </label>

            <div className="border-t border-white/10 pt-6">
              <p className="text-xs font-black tracking-[0.18em] text-orange-400">STEP 2</p>
              <h2 className="mt-1 text-xl font-black text-white">振り返りを残す <span className="text-sm font-normal text-white/35">（任意）</span></h2>
              <p className="mt-1 text-xs leading-5 text-white/40">意識タグは前回の選択を引き継ぐので、変わった時だけ選び直せます。</p>
            </div>

            <div><span className="text-sm font-bold text-white">意識したこと <span className="font-normal text-white/40">（複数選択可）</span></span><AwarenessTagSelector value={awarenessTags} onChange={setAwarenessTags} /></div>

            <label className="block">
              <span className="text-sm font-bold text-white">何をどう意識しましたか？ <span className="font-normal text-white/40">（任意）</span></span>
              <textarea value={awarenessNote} onChange={(event) => setAwarenessNote(event.target.value)} maxLength={200} rows={3} placeholder="例：最後までリズムを変えずに走った" className="mt-3 w-full resize-none rounded-xl border border-white/15 bg-[#101216] px-4 py-4 text-white outline-none transition placeholder:text-white/25 focus:border-orange-500" />
              <span className="mt-1 block text-right text-xs text-white/35">{awarenessNote.length}/200</span>
            </label>

            <div className="border-t border-white/10 pt-6">
              <p className="text-xs font-black tracking-[0.18em] text-orange-400">STEP 3</p>
              <h2 className="mt-1 text-xl font-black text-white">動画を残す <span className="text-sm font-normal text-white/35">（任意）</span></h2>
              <p className="mt-1 text-xs leading-5 text-white/40">動画がない日は、そのまま保存して完了できます。</p>
            </div>

            <label className="block">
              <span className="text-sm font-bold text-white">動画を追加 <span className="font-normal text-white/40">（任意・100MBまで）</span></span>
              <input key={videoInputKey} type="file" accept="video/mp4,video/quicktime,video/webm,video/x-m4v" disabled={isSaving} onChange={(event) => { const selected = event.target.files?.[0] ?? null; const validationError = selected ? validateVideo(selected) : null; setUploadProgress(0); if (validationError) { setVideo(null); setErrorMessage(validationError); event.target.value = ""; return; } setErrorMessage(""); setVideo(selected); }} className="mt-3 block w-full rounded-xl border border-dashed border-white/20 bg-[#101216] px-4 py-4 text-sm text-white/65 file:mr-4 file:rounded-lg file:border-0 file:bg-orange-500 file:px-3 file:py-2 file:font-bold file:text-white disabled:opacity-50" />
              {video && <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"><div className="flex items-center justify-between gap-3 text-xs"><span className="min-w-0 truncate text-white/65">{video.name}</span><div className="flex shrink-0 items-center gap-3"><strong className="text-orange-300">{formatVideoSize(video.size)} / 100MB</strong><button type="button" disabled={isSaving} onClick={() => { setVideo(null); setUploadProgress(0); setVideoInputKey((value) => value + 1); setErrorMessage(""); }} className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-2.5 py-1.5 font-bold text-red-300 disabled:opacity-40"><Trash2 size={13} />動画を削除</button></div></div>{isSaving && <div className="mt-3"><div className="mb-1 flex justify-between text-xs text-white/50"><span>{uploadProgress < 100 ? "動画をアップロード中" : "動画の処理完了"}</span><span>{uploadProgress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-orange-500 transition-[width]" style={{ width: `${uploadProgress}%` }} /></div><p className="mt-2 text-xs text-white/35">完了するまでこの画面を閉じないでください。</p></div>}</div>}
            </label>
          </div>

          {errorMessage && (
            <p role="alert" className="mt-6 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-4 text-sm font-black tracking-[0.14em] text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}
            {isSaving ? (video && uploadProgress < 100 ? `動画アップロード中 ${uploadProgress}%` : "保存中...") : "記録を保存"}
          </button>

          <p className="mt-5 flex items-center gap-2 text-xs text-white/45">
            <Check size={15} className="text-orange-400" aria-hidden="true" />
            保存後はマイページの記録一覧に反映されます。
          </p>
        </form>
      </div>
    </main>
  );
}

export default function PerformancePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#090a0c]" />}>
      <PerformanceForm />
    </Suspense>
  );
}
