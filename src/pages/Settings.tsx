import React, { useState, useEffect } from "react";
import { useThemeStore } from "../store/themeStore";
import { useAuthStore } from "../store/authStore";
import {
  Sun,
  Moon,
  Palette,
  Bell,
  Shield,
  User,
  Save,
  Mail,
  Smartphone,
  Globe,
  Database,
  Download,
  Upload,
  RefreshCw,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    taskReminders: boolean;
    weeklyReports: boolean;
  };
  appearance: {
    theme: "light" | "dark";
    neonEffects: boolean;
    compactMode: boolean;
    language: string;
  };
  productivity: {
    autoRefresh: boolean;
    soundEffects: boolean;
    keyboardShortcuts: boolean;
    focusMode: boolean;
  };
  privacy: {
    profileVisible: boolean;
    activityTracking: boolean;
    dataSharing: boolean;
  };
}

const defaultSettings: UserSettings = {
  notifications: {
    email: true,
    push: true,
    taskReminders: true,
    weeklyReports: false,
  },
  appearance: {
    theme: "light",
    neonEffects: true,
    compactMode: false,
    language: "en",
  },
  productivity: {
    autoRefresh: true,
    soundEffects: false,
    keyboardShortcuts: true,
    focusMode: false,
  },
  privacy: {
    profileVisible: true,
    activityTracking: true,
    dataSharing: false,
  },
};

export default function Settings() {
  const { theme, setTheme } = useThemeStore();
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("appearance");

  useEffect(() => {
    loadUserSettings();
  }, [user]);

  const loadUserSettings = async () => {
    if (!user?.uid) return;
    
    try {
      const userDoc = await getDoc(doc(db, "userSettings", user.uid));
      if (userDoc.exists()) {
        setSettings({ ...defaultSettings, ...userDoc.data() });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const saveSettings = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, "userSettings", user.uid), settings);
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (category: keyof UserSettings, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tas-elite-settings.json";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Settings exported successfully!");
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings({ ...defaultSettings, ...importedSettings });
        toast.success("Settings imported successfully!");
      } catch (error) {
        toast.error("Invalid settings file");
      }
    };
    reader.readAsText(file);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    toast.success("Settings reset to default");
  };

  const tabs = [
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "productivity", label: "Productivity", icon: Zap },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "account", label: "Account", icon: User },
  ];

  const SettingCard = ({ children, title, description }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="liquid-glass-card mb-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {description}
        </p>
      )}
      {children}
    </motion.div>
  );

  const ToggleSwitch = ({ checked, onChange, label }: any) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50/50 dark:bg-purple-800/20 border border-purple-200/30 dark:border-purple-500/20">
      <span className="font-medium text-gray-900 dark:text-white">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked
            ? "bg-purple-600 dark:bg-purple-500"
            : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 dark:bg-gradient-to-br dark:from-purple-900/20 dark:via-indigo-800/30 dark:to-purple-900/20 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-2">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize your TAS Elite experience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="liquid-glass-card p-4 sticky top-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-all ${
                        activeTab === tab.id
                          ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-l-4 border-purple-500"
                          : "text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-800/20"
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === "appearance" && (
                <div>
                  <SettingCard
                    title="Theme Preferences"
                    description="Customize the visual appearance of your workspace"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => {
                            setTheme("light");
                            updateSetting("appearance", "theme", "light");
                          }}
                          className={`flex items-center px-4 py-3 rounded-lg border-2 transition-all ${
                            theme === "light"
                              ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                              : "border-purple-300 dark:border-purple-600"
                          }`}
                        >
                          <Sun className="h-5 w-5 mr-2" />
                          Light Mode
                        </button>
                        <button
                          onClick={() => {
                            setTheme("dark");
                            updateSetting("appearance", "theme", "dark");
                          }}
                          className={`flex items-center px-4 py-3 rounded-lg border-2 transition-all ${
                            theme === "dark"
                              ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30"
                              : "border-purple-300 dark:border-purple-600"
                          }`}
                        >
                          <Moon className="h-5 w-5 mr-2" />
                          Dark Mode
                        </button>
                      </div>
                      <ToggleSwitch
                        checked={settings.appearance.neonEffects}
                        onChange={(value: boolean) =>
                          updateSetting("appearance", "neonEffects", value)
                        }
                        label="Enable Glass Effects"
                      />
                      <ToggleSwitch
                        checked={settings.appearance.compactMode}
                        onChange={(value: boolean) =>
                          updateSetting("appearance", "compactMode", value)
                        }
                        label="Compact Mode"
                      />
                      <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50/50 dark:bg-purple-800/20 border border-purple-200/30 dark:border-purple-500/20">
                        <span className="font-medium text-gray-900 dark:text-white">
                          Language
                        </span>
                        <select
                          value={settings.appearance.language}
                          onChange={(e) =>
                            updateSetting("appearance", "language", e.target.value)
                          }
                          className="px-3 py-2 rounded-lg border border-purple-300 dark:border-purple-600 bg-white dark:bg-purple-900/30 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="en">English</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                          <option value="de">Deutsch</option>
                        </select>
                      </div>
                    </div>
                  </SettingCard>
                </div>
              )}

              {activeTab === "notifications" && (
                <div>
                  <SettingCard
                    title="Notification Preferences"
                    description="Control how and when you receive notifications"
                  >
                    <div className="space-y-4">
                      <ToggleSwitch
                        checked={settings.notifications.email}
                        onChange={(value: boolean) =>
                          updateSetting("notifications", "email", value)
                        }
                        label="Email Notifications"
                      />
                      <ToggleSwitch
                        checked={settings.notifications.push}
                        onChange={(value: boolean) =>
                          updateSetting("notifications", "push", value)
                        }
                        label="Push Notifications"
                      />
                      <ToggleSwitch
                        checked={settings.notifications.taskReminders}
                        onChange={(value: boolean) =>
                          updateSetting("notifications", "taskReminders", value)
                        }
                        label="Task Reminders"
                      />
                      <ToggleSwitch
                        checked={settings.notifications.weeklyReports}
                        onChange={(value: boolean) =>
                          updateSetting("notifications", "weeklyReports", value)
                        }
                        label="Weekly Reports"
                      />
                    </div>
                  </SettingCard>
                </div>
              )}

              {activeTab === "productivity" && (
                <div>
                  <SettingCard
                    title="Productivity Features"
                    description="Enhance your workflow with productivity tools"
                  >
                    <div className="space-y-4">
                      <ToggleSwitch
                        checked={settings.productivity.autoRefresh}
                        onChange={(value: boolean) =>
                          updateSetting("productivity", "autoRefresh", value)
                        }
                        label="Auto-refresh Data"
                      />
                      <ToggleSwitch
                        checked={settings.productivity.soundEffects}
                        onChange={(value: boolean) =>
                          updateSetting("productivity", "soundEffects", value)
                        }
                        label="Sound Effects"
                      />
                      <ToggleSwitch
                        checked={settings.productivity.keyboardShortcuts}
                        onChange={(value: boolean) =>
                          updateSetting("productivity", "keyboardShortcuts", value)
                        }
                        label="Keyboard Shortcuts"
                      />
                      <ToggleSwitch
                        checked={settings.productivity.focusMode}
                        onChange={(value: boolean) =>
                          updateSetting("productivity", "focusMode", value)
                        }
                        label="Focus Mode"
                      />
                    </div>
                  </SettingCard>
                </div>
              )}

              {activeTab === "privacy" && (
                <div>
                  <SettingCard
                    title="Privacy & Security"
                    description="Manage your privacy and security preferences"
                  >
                    <div className="space-y-4">
                      <ToggleSwitch
                        checked={settings.privacy.profileVisible}
                        onChange={(value: boolean) =>
                          updateSetting("privacy", "profileVisible", value)
                        }
                        label="Public Profile"
                      />
                      <ToggleSwitch
                        checked={settings.privacy.activityTracking}
                        onChange={(value: boolean) =>
                          updateSetting("privacy", "activityTracking", value)
                        }
                        label="Activity Tracking"
                      />
                      <ToggleSwitch
                        checked={settings.privacy.dataSharing}
                        onChange={(value: boolean) =>
                          updateSetting("privacy", "dataSharing", value)
                        }
                        label="Data Sharing"
                      />
                    </div>
                  </SettingCard>
                </div>
              )}

              {activeTab === "account" && (
                <div>
                  <SettingCard
                    title="Account Management"
                    description="Manage your account settings and data"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center p-3 rounded-lg bg-purple-50/50 dark:bg-purple-800/20 border border-purple-200/30 dark:border-purple-500/20">
                        <Mail className="h-5 w-5 mr-3 text-purple-500" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {user?.email}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Account Email
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={exportSettings}
                          className="flex items-center px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all border border-purple-200 dark:border-purple-500/30"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export Settings
                        </button>
                        
                        <label className="flex items-center px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all cursor-pointer border border-indigo-200 dark:border-indigo-500/30">
                          <Upload className="h-4 w-4 mr-2" />
                          Import Settings
                          <input
                            type="file"
                            accept=".json"
                            onChange={importSettings}
                            className="hidden"
                          />
                        </label>
                        
                        <button
                          onClick={resetSettings}
                          className="flex items-center px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-all border border-amber-200 dark:border-amber-500/30"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reset to Default
                        </button>
                      </div>
                    </div>
                  </SettingCard>
                </div>
              )}

              {/* Save Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end mt-8"
              >
                <button
                  onClick={saveSettings}
                  disabled={loading}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:via-indigo-700 hover:to-purple-800 text-white rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl border border-white/20"
                >
                  {loading ? (
                    <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {loading ? "Saving..." : "Save Settings"}
                </button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
