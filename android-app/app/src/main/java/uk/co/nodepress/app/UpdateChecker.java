package uk.co.nodepress.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.core.content.FileProvider;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class UpdateChecker {
    private static final String TAG = "UpdateChecker";
    private static final String VERSION_URL = "https://nodepress.co.uk/downloads/version.json";
    
    private final Activity activity;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private long downloadId = -1;

    public UpdateChecker(Activity activity) {
        this.activity = activity;
    }

    public void checkForUpdates() {
        executor.execute(() -> {
            try {
                URL url = new URL(VERSION_URL);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);

                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                reader.close();

                JSONObject json = new JSONObject(response.toString());
                int serverVersionCode = json.getInt("versionCode");
                String serverVersion = json.getString("version");
                String apkUrl = json.getString("apkUrl");
                String releaseNotes = json.optString("releaseNotes", "Bug fixes and improvements");
                boolean forceUpdate = json.optBoolean("forceUpdate", false);

                int currentVersionCode = getCurrentVersionCode();
                
                if (serverVersionCode > currentVersionCode) {
                    mainHandler.post(() -> showUpdateDialog(serverVersion, apkUrl, releaseNotes, forceUpdate));
                }
            } catch (Exception e) {
                Log.e(TAG, "Error checking for updates", e);
            }
        });
    }

    private int getCurrentVersionCode() {
        try {
            PackageInfo pInfo = activity.getPackageManager().getPackageInfo(activity.getPackageName(), 0);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                return (int) pInfo.getLongVersionCode();
            } else {
                return pInfo.versionCode;
            }
        } catch (PackageManager.NameNotFoundException e) {
            return 0;
        }
    }

    private void showUpdateDialog(String version, String apkUrl, String releaseNotes, boolean forceUpdate) {
        AlertDialog.Builder builder = new AlertDialog.Builder(activity)
            .setTitle("Update Available")
            .setMessage("Version " + version + " is available!\n\n" + releaseNotes)
            .setPositiveButton("Update Now", (dialog, which) -> downloadAndInstall(apkUrl))
            .setCancelable(!forceUpdate);

        if (!forceUpdate) {
            builder.setNegativeButton("Later", null);
        }

        builder.show();
    }

    private void downloadAndInstall(String apkUrl) {
        try {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(apkUrl));
            request.setTitle("NodePress Update");
            request.setDescription("Downloading update...");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "nodepress-update.apk");

            DownloadManager dm = (DownloadManager) activity.getSystemService(Context.DOWNLOAD_SERVICE);
            downloadId = dm.enqueue(request);

            activity.registerReceiver(new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                    if (id == downloadId) {
                        activity.unregisterReceiver(this);
                        installApk();
                    }
                }
            }, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), Context.RECEIVER_NOT_EXPORTED);
        } catch (Exception e) {
            Log.e(TAG, "Download failed", e);
        }
    }

    private void installApk() {
        File apkFile = new File(Environment.getExternalStoragePublicDirectory(
            Environment.DIRECTORY_DOWNLOADS), "nodepress-update.apk");
        
        Intent intent = new Intent(Intent.ACTION_VIEW);
        Uri apkUri;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            apkUri = FileProvider.getUriForFile(activity, 
                activity.getPackageName() + ".fileprovider", apkFile);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } else {
            apkUri = Uri.fromFile(apkFile);
        }
        
        intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        activity.startActivity(intent);
    }
}

