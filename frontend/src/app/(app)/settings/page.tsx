"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useFinancial } from "@/contexts/FinancialContext";
import { supabase } from "@/lib/supabase";
import {
  User,
  Mail,
  Lock,
  Trash2,
  LogOut,
  Loader2,
  Check,
  AlertTriangle,
  Pencil,
  X,
  Eye,
  EyeOff,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { profile, setUserName } = useFinancial();

  // Name editing state
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Sign out state
  const [signOutLoading, setSignOutLoading] = useState(false);

  // Get the display name from profile or user metadata
  const displayName = profile.name || user?.user_metadata?.full_name || "User";

  const handleStartEditName = () => {
    setNewName(displayName);
    setEditingName(true);
  };

  const handleSaveName = async () => {
    const trimmedName = newName.trim();
    if (!trimmedName || !user?.id) {
      setEditingName(false);
      return;
    }

    // Update local state
    setUserName(trimmedName);
    setEditingName(false);

    // Save directly to Supabase to avoid race condition with debounced save
    try {
      await supabase
        .from("profiles")
        .update({ name: trimmedName, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
    } catch (error) {
      console.error("Failed to save name:", error);
    }
  };

  const handleCancelEditName = () => {
    setEditingName(false);
    setNewName("");
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError("Please enter your current password");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    if (!user?.email) {
      setPasswordError("User not found");
      return;
    }

    setPasswordLoading(true);

    try {
      // Verify current password by re-authenticating
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (authError) {
        setPasswordError("Current password is incorrect");
        setPasswordLoading(false);
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setPasswordError(updateError.message);
      } else {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordError("An unexpected error occurred");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setDeleteError("Please type DELETE to confirm");
      return;
    }

    if (!user?.id) {
      setDeleteError("User not found");
      return;
    }

    setDeleteLoading(true);
    setDeleteError("");

    try {
      // Get the profile ID first
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        // Delete user's data from all tables
        await supabase
          .from("spending_entries")
          .delete()
          .eq("profile_id", profileData.id);

        await supabase
          .from("spending_summaries")
          .delete()
          .eq("profile_id", profileData.id);

        await supabase
          .from("savings_goals")
          .delete()
          .eq("profile_id", profileData.id);

        await supabase.from("profiles").delete().eq("id", profileData.id);
      }

      // Clear local storage
      localStorage.clear();

      // Sign out and redirect
      await signOut();
      router.push("/login");
    } catch {
      setDeleteError("Failed to delete account data. Please try again.");
      setDeleteLoading(false);
    }
  };

  const handleSignOut = async () => {
    setSignOutLoading(true);
    await signOut();
    router.push("/login");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your account and preferences</p>
      </header>

      {/* Profile Section */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Profile
        </h2>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-semibold text-primary">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    placeholder="Enter your name"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") handleCancelEditName();
                    }}
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Save"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelEditName}
                    className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-800">{displayName}</p>
                  <button
                    onClick={handleStartEditName}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit name"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-sm text-slate-500">
                Member since{" "}
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <Mail className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="font-medium text-slate-800">
                {user?.email || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Password Section */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" />
          Change Password
        </h2>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {passwordError && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              {passwordError}
            </p>
          )}

          {passwordSuccess && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <Check className="w-4 h-4" />
              Password updated successfully
            </p>
          )}

          <button
            type="submit"
            disabled={passwordLoading || !newPassword || !confirmPassword}
            className="px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {passwordLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Update Password
          </button>
        </form>
      </section>

      {/* Sign Out Section */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <LogOut className="w-5 h-5 text-primary" />
          Sign Out
        </h2>

        <p className="text-slate-600 mb-4">
          Sign out of your account on this device.
        </p>

        <button
          onClick={handleSignOut}
          disabled={signOutLoading}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {signOutLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </section>

      {/* Danger Zone */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-red-100">
        <h2 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Danger Zone
        </h2>

        <p className="text-slate-600 mb-4">
          Delete your account data and sign out. This will remove all your
          financial data, goals, and profile information.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        ) : (
          <div className="space-y-4 p-4 bg-red-50 rounded-xl">
            <p className="text-sm text-red-700">
              Type <strong>DELETE</strong> to confirm account deletion:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-4 py-2 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
              placeholder="Type DELETE"
            />

            {deleteError && (
              <p className="text-sm text-red-600">{deleteError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                  setDeleteError("");
                }}
                className="px-4 py-2 bg-white text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors border border-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
