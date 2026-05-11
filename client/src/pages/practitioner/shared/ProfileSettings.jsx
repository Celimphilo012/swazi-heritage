import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../api/axiosInstance";

const Input = (props) => (
  <input
    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
               focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 disabled:bg-gray-50"
    {...props}
  />
);
const Label = ({ children, required }) => (
  <label className="block text-sm font-medium text-gray-700 mb-1">
    {children}{required && <span className="text-red-600 ml-0.5">*</span>}
  </label>
);

const ProfileSettings = () => {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    avatar_url: user?.avatar_url || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");

  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdError, setPwdError] = useState("");

  const setProf = (f) => (e) => setProfile((d) => ({ ...d, [f]: e.target.value }));
  const setPwd = (f) => (e) => setPasswords((d) => ({ ...d, [f]: e.target.value }));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) return;
    setSavingProfile(true);
    setProfileError("");
    setProfileMsg("");
    try {
      await api.patch("/auth/profile", profile);
      setProfileMsg("Profile updated.");
      setTimeout(() => setProfileMsg(""), 2500);
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) {
      setPwdError("New passwords do not match.");
      return;
    }
    if (passwords.newPassword.length < 8) {
      setPwdError("New password must be at least 8 characters.");
      return;
    }
    setSavingPwd(true);
    setPwdError("");
    setPwdMsg("");
    try {
      await api.patch("/auth/password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPwdMsg("Password updated.");
      setPasswords({ currentPassword: "", newPassword: "", confirm: "" });
      setTimeout(() => setPwdMsg(""), 2500);
    } catch (err) {
      setPwdError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Profile Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Update your profile and password</p>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSaveProfile} className="card mb-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800">Profile Information</h2>

        {profileError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{profileError}</div>
        )}

        {/* Avatar preview */}
        {profile.avatar_url && (
          <div className="flex items-center gap-3">
            <img src={profile.avatar_url} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-gray-200"
              onError={(e) => { e.target.style.display = "none"; }} />
          </div>
        )}

        <div>
          <Label required>Full name</Label>
          <Input value={profile.name} onChange={setProf("name")} placeholder="Your name" required />
        </div>
        <div>
          <Label>Avatar URL</Label>
          <Input type="url" value={profile.avatar_url} onChange={setProf("avatar_url")} placeholder="https://..." />
        </div>
        <div>
          <Label>Bio</Label>
          <textarea
            rows={3}
            value={profile.bio}
            onChange={setProf("bio")}
            placeholder="A short bio about yourself and your role in preserving Swazi culture..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none
                       focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={savingProfile} className="btn-primary flex items-center gap-2">
            {savingProfile && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {savingProfile ? "Saving..." : "Save Profile"}
          </button>
          {profileMsg && <span className="text-xs text-green-600">{profileMsg}</span>}
        </div>
      </form>

      {/* Password form */}
      <form onSubmit={handleChangePassword} className="card space-y-4">
        <h2 className="text-sm font-semibold text-gray-800">Change Password</h2>

        {pwdError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{pwdError}</div>
        )}

        <div>
          <Label required>Current password</Label>
          <Input type="password" value={passwords.currentPassword} onChange={setPwd("currentPassword")} required />
        </div>
        <div>
          <Label required>New password</Label>
          <Input type="password" value={passwords.newPassword} onChange={setPwd("newPassword")} placeholder="At least 8 characters" required />
        </div>
        <div>
          <Label required>Confirm new password</Label>
          <Input type="password" value={passwords.confirm} onChange={setPwd("confirm")} required />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={savingPwd} className="btn-primary flex items-center gap-2">
            {savingPwd && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {savingPwd ? "Updating..." : "Change Password"}
          </button>
          {pwdMsg && <span className="text-xs text-green-600">{pwdMsg}</span>}
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
