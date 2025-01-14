package com.jiwuchat.app

import android.Manifest
import android.os.Bundle
import androidx.activity.result.contract.ActivityResultContracts

class MainActivity : TauriActivity() {

    private val requestPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { permissions ->
            permissions.entries.forEach { entry ->
                val permissionName = entry.key
                val isGranted = entry.value
                // 处理权限请求结果
                // if (isGranted) {
                // } else {
                // }
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // 请求权限
        requestPermissions()
    }

    private fun requestPermissions() {
        requestPermissionLauncher.launch(arrayOf(
          Manifest.permission.RECORD_AUDIO,
          Manifest.permission.CAMERA,
          Manifest.permission.WRITE_EXTERNAL_STORAGE,
          Manifest.permission.READ_EXTERNAL_STORAGE,
          Manifest.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
          Manifest.permission.FOREGROUND_SERVICE
        ))
    }
}
