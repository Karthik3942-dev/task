import React, { useState, useEffect } from "react";
import { useThemeStore } from "../store/themeStore";
import { useAuthStore } from "../store/authStore";
import {
  Sun,
  Moon,
  Palette,
  User,
  Save,
  Mail,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface UserSettings {
  appearance: {
    theme: "light" | "dark";
    language: string;
  };
}

const defaultSettings: UserSettings = {
  appearance: {
    theme: "light",
    language: "en",
  },
};

export default function Settings() {
  const { theme, setTheme } = useThemeStore();
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);

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

  const SettingCard = ({ children, title, description }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
          {description}
        </p>
      )}
      {children}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Settings
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Customize your TAS Elite experience
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Appearance Settings */}
          <SettingCard
            title="Appearance"
            description="Customize the visual appearance of your workspace"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      setTheme("light");
                      updateSetting("appearance", "theme", "light");
                    }}
                    className={`flex items-center px-3 py-2 rounded-md border transition-all text-xs ${
                      theme === "light"
                        ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    <Sun className="h-3 w-3 mr-2" />
                    Light Mode
                  </button>
                  <button
                    onClick={() => {
                      setTheme("dark");
                      updateSetting("appearance", "theme", "dark");
                    }}
                    className={`flex items-center px-3 py-2 rounded-md border transition-all text-xs ${
                      theme === "dark"
                        ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    <Moon className="h-3 w-3 mr-2" />
                    Dark Mode
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Language
                </label>
                <select
                  value={settings.appearance.language}
                  onChange={(e) =>
                    updateSetting("appearance", "language", e.target.value)
                  }
                  className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </SettingCard>

          {/* Account Information */}
          <SettingCard
            title="Account Information"
            description="Your account details"
          >
            <div className="flex items-center p-3 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              <Mail className="h-4 w-4 mr-3 text-cyan-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Account Email
                </p>
              </div>
            </div>
          </SettingCard>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end"
          >
            <button
              onClick={saveSettings}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-700 dark:hover:bg-cyan-800 text-white rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
            >
              {loading ? (
                <div className="h-3 w-3 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-3 w-3 mr-2" />
              )}
              {loading ? "Saving..." : "Save Settings"}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
