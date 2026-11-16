#!/bin/bash
# 알림 실험: 3분 뒤 알림 하나를 만들어 두고 ① 홈으로만 나가기 ② 홈 → 바로 프로세스 종료(최근 앱에서 밀기)  → 5분 뒤 실제로 알림이 왔는지
set +e
PKG=com.jeoseungsaja.idle
adb install -r app.apk >/dev/null && echo "설치 OK"
adb shell pm grant $PKG android.permission.POST_NOTIFICATIONS
adb shell appops set $PKG SCHEDULE_EXACT_ALARM allow
# 한국 시간으로 (밤 11시~아침 8시는 알림을 아침으로 미루는 규칙이 있어서, UTC 새벽이면 실험 알림이 아침으로 밀림)
adb shell cmd alarm set-timezone Asia/Seoul 2>/dev/null || adb shell setprop persist.sys.timezone Asia/Seoul
echo "에뮬레이터 시각: $(adb shell date)"
SETUP='(async()=>{localStorage.setItem("reaper_lang","ko");const S=Game.S;S.kind="m";S.name="시험";S.tut="done";S.otut="done";S.story={ch:3,q:0,intro:true};S.pushAsked=true;S.push=true;S.sealUntil=Date.now()+86400e3+180e3;Game.apply();Game.save();await Push.back();await new Promise(r=>setTimeout(r,1500));const p=await Capacitor.Plugins.LocalNotifications.getPending();return "예약 "+p.notifications.length+"개: "+p.notifications.map(n=>n.id+"@"+new Date(n.schedule.at).toTimeString().slice(0,8)).join(" ");})().catch(e=>"오류 "+e.message)'
connect() {
  for i in $(seq 1 30); do PID=$(adb shell pidof $PKG | tr -d '\r'); SOCK=$(adb shell cat /proc/net/unix | grep -o "webview_devtools_remote_$PID" | head -1); [ -n "$SOCK" ] && break; sleep 2; done
  adb forward --remove-all; adb forward tcp:9222 localabstract:$SOCK >/dev/null; echo "웹뷰 연결: $SOCK"
}
run() { # $1 = 이름, $2 = 나가는 방법
  echo "=================== $1"
  adb shell am force-stop $PKG
  adb shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 >/dev/null; sleep 25; connect
  echo "페이지: $(curl -s 127.0.0.1:9222/json | grep -o '"url": *"[^"]*"' | head -3 | tr '\n' ' ')"
  echo "게임 상태: $(node notif-test.js 'JSON.stringify({game:typeof Game,push:typeof Push,app:typeof Capacitor!=="undefined"&&Capacitor.isNativePlatform(),kind:typeof Game!=="undefined"&&Game.S&&Game.S.kind})')"
  echo "게임 안 예약 (3분 뒤 = 36번): $(node notif-test.js "$SETUP")"
  echo "지금 $(date -u +%H:%M:%S) UTC"
  adb shell input keyevent KEYCODE_HOME
  if [ "$2" = "kill" ]; then sleep 0.3; adb shell run-as $PKG kill -9 $PID; sleep 1; echo "홈 0.3초 뒤 프로세스 종료 (최근 앱에서 밀기와 같음) → 남은 프로세스: [$(adb shell pidof $PKG | tr -d "\r")]"; fi
  sleep 15; echo "나간 뒤 알람 (AlarmManager):"; adb shell dumpsys alarm | grep -c "$PKG" ; adb shell dumpsys alarm | grep -B1 -A2 "TimedNotificationPublisher\|$PKG" | grep -E "when|origWhen|tag" | head -12
  sleep 270
  echo "5분 뒤 휴대폰 알림창에 온 알림:"; adb shell dumpsys notification --noredact | grep -E "NotificationRecord.*$PKG" | head -10
  N=$(adb shell dumpsys notification --noredact | grep -cE "NotificationRecord.*pkg=$PKG.*id=36 ")
  [ "$N" -gt 0 ] && echo "결과[$1]: ✅ 36번 알림 도착" || echo "결과[$1]: ❌ 36번 알림 안 옴"
}
run "홈으로만 나가기" home
run "홈 → 바로 종료" kill
adb exec-out screencap -p > out_last.png
