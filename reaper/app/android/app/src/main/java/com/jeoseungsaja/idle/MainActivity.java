package com.jeoseungsaja.idle;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DiagPlugin.class); // 알림 진단 (앱 안의 우리 코드)
        super.onCreate(savedInstanceState);
    }
}
