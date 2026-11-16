package com.jeoseungsaja.idle;

import android.app.ActivityManager;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// 알림 진단: 휴대폰이 이 앱의 알림 · 알람을 막고 있는지 실제 상태를 읽어 옴 (설정 화면에 보여 줌)
@CapacitorPlugin(name = "ReaperDiag")
public class DiagPlugin extends Plugin {

    @PluginMethod
    public void info(PluginCall call) {
        Context c = getContext();
        String pkg = c.getPackageName();
        JSObject r = new JSObject();
        r.put("maker", Build.MANUFACTURER);
        r.put("model", Build.MODEL);
        r.put("sdk", Build.VERSION.SDK_INT);
        try {
            NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            r.put("enabled", nm.areNotificationsEnabled());
            if (Build.VERSION.SDK_INT >= 26) {
                NotificationChannel ch = nm.getNotificationChannel("reaper");
                r.put("channel", ch == null ? -1 : ch.getImportance()); // 0 = 이 채널을 꺼 둠, 4 = 높음
            }
        } catch (Exception e) { r.put("enabled", true); }
        try {
            AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
            r.put("exact", Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms());
        } catch (Exception e) { r.put("exact", false); }
        try {
            PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
            r.put("batteryFree", pm.isIgnoringBatteryOptimizations(pkg)); // 배터리 '제한 없음'
            r.put("powerSave", pm.isPowerSaveMode());                     // 절전 모드 켜짐
        } catch (Exception e) {}
        if (Build.VERSION.SDK_INT >= 28) {
            try {
                ActivityManager acm = (ActivityManager) c.getSystemService(Context.ACTIVITY_SERVICE);
                r.put("bgRestricted", acm.isBackgroundRestricted());     // 배터리 '제한' (백그라운드 막힘)
            } catch (Exception e) {}
            try {
                UsageStatsManager us = (UsageStatsManager) c.getSystemService(Context.USAGE_STATS_SERVICE);
                r.put("bucket", us.getAppStandbyBucket()); // 10 활성 · 20 자주 · 30 가끔 · 40 드물게 · 45 제한(잠자는 앱)
            } catch (Exception e) {}
        }
        call.resolve(r);
    }

    // 앱 정보 화면 (배터리 → 제한 없음 을 바로 고를 수 있게)
    @PluginMethod
    public void openApp(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        } catch (Exception e) {}
        call.resolve();
    }
}
