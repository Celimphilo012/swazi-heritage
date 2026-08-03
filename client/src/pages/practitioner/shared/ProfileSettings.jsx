import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../api/axiosInstance";
import { getPreferences, savePreferences } from "../../../api/preferences.api";

const FInput = (props) => (
  <input
    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800
               placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200
               focus:border-slate-300 disabled:bg-slate-50 transition-all"
    {...props}
  />
);

const FLabel = ({ children, required }) => (
  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
    {children}{required && <span className="ml-0.5" style={{ color: "#CE1126" }}>*</span>}
  </label>
);

const BtnPrimary = ({ children, style, ...props }) => (
  <button
    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white
               transition-all hover:opacity-90 disabled:opacity-50"
    style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", ...style }}
    {...props}
  >
    {children}
  </button>
);

const Section = ({ title, description, children }) => (
  <div className="rounded-2xl p-6" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
    <h2 className="text-sm font-bold text-slate-800 mb-0.5">{title}</h2>
    {description && <p className="text-xs text-slate-400 mb-5">{description}</p>}
    {children}
  </div>
);

const ProfileSettings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name:               user?.name               || "",
    bio:                user?.bio                || "",
    avatar_url:         user?.avatar_url         || "",
    notification_email: user?.notification_email || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg,    setProfileMsg]    = useState("");
  const [profileError,  setProfileError]  = useState("");

  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg,    setPwdMsg]    = useState("");
  const [pwdError,  setPwdError]  = useState("");

  const [prefs, setPrefs] = useState({ interests: [], visitor_type: "local", preferred_lang: "en", imvunulo_budget_max: "" });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsMsg,    setPrefsMsg]    = useState("");
  const [prefsError,  setPrefsError]  = useState("");

  const setProf = f => e => setProfile(d => ({ ...d, [f]: e.target.value }));
  const setPwd  = f => e => setPasswords(d => ({ ...d, [f]: e.target.value }));

  useEffect(() => {
    getPreferences().then(p => {
      if (p) setPrefs({
        interests:      Array.isArray(p.interests) ? p.interests : JSON.parse(p.interests || '[]'),
        visitor_type:   p.visitor_type   || "local",
        preferred_lang: p.preferred_lang || "en",
        imvunulo_budget_max: p.imvunulo_budget_max ?? "",
      });
    }).catch(() => {});
  }, []);

  const toggleInterest = (val) => {
    setPrefs(p => ({
      ...p,
      interests: p.interests.includes(val)
        ? p.interests.filter(i => i !== val)
        : [...p.interests, val],
    }));
  };

  const handleSavePrefs = async () => {
    setSavingPrefs(true); setPrefsError(""); setPrefsMsg("");
    try {
      await savePreferences({
        ...prefs,
        imvunulo_budget_max: prefs.imvunulo_budget_max === "" ? null : Number(prefs.imvunulo_budget_max),
      });
      window.dispatchEvent(new Event("swazi:preferences-updated"));
      setPrefsMsg("Preferences saved.");
      setTimeout(() => setPrefsMsg(""), 2500);
    } catch {
      setPrefsError("Failed to save preferences.");
    } finally { setSavingPrefs(false); }
  };

  const handleSaveProfile = async e => {
    e.preventDefault();
    if (!profile.name.trim()) return;
    setSavingProfile(true);
    setProfileError(""); setProfileMsg("");
    try {
      await api.patch("/auth/profile", profile);
      setProfileMsg("Profile updated.");
      setTimeout(() => setProfileMsg(""), 2500);
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to update profile.");
    } finally { setSavingProfile(false); }
  };

  const handleChangePassword = async e => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) {
      setPwdError("New passwords do not match."); return;
    }
    if (passwords.newPassword.length < 8) {
      setPwdError("New password must be at least 8 characters."); return;
    }
    setSavingPwd(true);
    setPwdError(""); setPwdMsg("");
    try {
      await api.patch("/auth/password", {
        currentPassword: passwords.currentPassword,
        newPassword:     passwords.newPassword,
      });
      setPwdMsg("Password updated.");
      setPasswords({ currentPassword: "", newPassword: "", confirm: "" });
      setTimeout(() => setPwdMsg(""), 2500);
    } catch (err) {
      setPwdError(err.response?.data?.message || "Failed to update password.");
    } finally { setSavingPwd(false); }
  };

  const initials = user?.name ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden px-6 py-5"
        style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", boxShadow: "0 4px 20px rgba(15,23,42,0.2)" }}>
        <div className="absolute top-0 left-0 right-0 flex" style={{ height: 3 }}>
          <div className="flex-1" style={{ background: "#002395" }} />
          <div style={{ width: "5%", background: "#FFD600" }} />
          <div className="flex-1" style={{ background: "#CE1126" }} />
          <div style={{ width: "5%", background: "#FFD600" }} />
          <div className="flex-1" style={{ background: "#002395" }} />
        </div>
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar"
              className="w-12 h-12 rounded-2xl object-cover border-2 flex-shrink-0"
              style={{ borderColor: "rgba(255,214,0,0.3)" }}
              onError={e => { e.target.style.display = "none"; }} />
          ) : (
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#92400e,#d97706)" }}>
              {initials}
            </div>
          )}
          <div>
            <h1 className="text-xl font-black text-white">{user?.name}</h1>
            <p className="text-xs capitalize mt-0.5" style={{ color: "#d97706" }}>
              {user?.role?.replace(/_/g, " ")}
            </p>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <Section title="Profile Information" description="Update your display name, bio, and avatar.">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {profileError && (
            <div className="p-3 rounded-xl text-sm"
              style={{ background: "rgba(206,17,38,0.06)", border: "1px solid rgba(206,17,38,0.2)", color: "#CE1126" }}>
              {profileError}
            </div>
          )}

          <div>
            <FLabel required>Full name</FLabel>
            <FInput value={profile.name} onChange={setProf("name")} placeholder="Your name" required />
          </div>
          <div>
            <FLabel>Avatar URL</FLabel>
            <FInput type="url" value={profile.avatar_url} onChange={setProf("avatar_url")}
              placeholder="https://..." />
          </div>
          <div>
            <FLabel>Bio</FLabel>
            <textarea rows={3} value={profile.bio} onChange={setProf("bio")}
              placeholder="A short bio about yourself and your role in preserving Swazi culture…"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800
                         placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200
                         focus:border-slate-300 resize-none transition-all" />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <BtnPrimary type="submit" disabled={savingProfile}>
              {savingProfile && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {savingProfile ? "Saving…" : "Save Profile"}
            </BtnPrimary>
            {profileMsg && (
              <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "#10b981" }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {profileMsg}
              </span>
            )}
          </div>
        </form>
      </Section>

      {/* Notification Email */}
      <Section title="Email Notifications"
        description="Where to receive notifications when your content is reviewed. Defaults to your account email if left blank.">
        <div className="space-y-3">
          <div>
            <FLabel>Account email (login)</FLabel>
            <FInput value={user?.email || ""} disabled
              className="bg-slate-50 text-slate-400 cursor-not-allowed" />
            <p className="text-xs text-slate-400 mt-1">Contact an admin to change your login email.</p>
          </div>
          <div>
            <FLabel>Notification email (optional)</FLabel>
            <FInput type="email" value={profile.notification_email}
              onChange={setProf("notification_email")}
              placeholder="e.g. personal@gmail.com" />
            <p className="text-xs text-slate-400 mt-1">
              Submission updates will be sent here instead of your account email.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <BtnPrimary
              onClick={async () => {
                setSavingProfile(true); setProfileError(""); setProfileMsg("");
                try {
                  await api.patch("/auth/profile", profile);
                  setProfileMsg("Notification email saved.");
                  setTimeout(() => setProfileMsg(""), 2500);
                } catch (err) {
                  setProfileError(err.response?.data?.message || "Failed to save.");
                } finally { setSavingProfile(false); }
              }}
              disabled={savingProfile}>
              {savingProfile && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Save
            </BtnPrimary>
            {profileMsg && (
              <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "#10b981" }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {profileMsg}
              </span>
            )}
          </div>
        </div>
      </Section>

      {/* Cultural Preferences */}
      <Section title="Cultural Interests & Preferences"
        description="Tell us what aspects of Swazi culture interest you most. This powers personalised recommendations on the home page.">
        {prefsError && (
          <div className="p-3 rounded-xl text-sm mb-4"
            style={{ background: "rgba(206,17,38,0.06)", border: "1px solid rgba(206,17,38,0.2)", color: "#CE1126" }}>
            {prefsError}
          </div>
        )}
        <div className="space-y-5">
          <div>
            <FLabel>Cultural interests (select all that apply)</FLabel>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { val: "ceremonies", label: "Ceremonies" },
                { val: "lineage",    label: "Royal Lineage" },
                { val: "music",      label: "Music & Songs" },
                { val: "attire",     label: "Traditional Attire" },
                { val: "royal",      label: "Royal Culture" },
                { val: "spiritual",  label: "Spiritual Practices" },
              ].map(({ val, label }) => {
                const active = prefs.interests.includes(val);
                return (
                  <button key={val} type="button" onClick={() => toggleInterest(val)}
                    className="text-xs font-bold px-3 py-1.5 rounded-full border-2 transition-all"
                    style={active
                      ? { background: "linear-gradient(135deg,#0f172a,#1e293b)", color: "#FFD600", borderColor: "#FFD600" }
                      : { background: "#fff", color: "#6b7280", borderColor: "#e2e8f0" }}>
                    {active && "✓ "}{label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="max-w-xs">
            <FLabel>Imvunulo budget (SZL, optional)</FLabel>
            <FInput type="number" min="0" step="0.01" value={prefs.imvunulo_budget_max}
              onChange={e => setPrefs(p => ({ ...p, imvunulo_budget_max: e.target.value }))}
              placeholder="e.g. 500" />
            <p className="text-xs text-slate-400 mt-1">We'll surface imvunulo listings at or below this price on your home page.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FLabel>I am visiting as a</FLabel>
              <select value={prefs.visitor_type} onChange={e => setPrefs(p => ({ ...p, visitor_type: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800
                           focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-slate-300 bg-white">
                <option value="local">Local resident</option>
                <option value="tourist">Tourist / visitor</option>
                <option value="researcher">Researcher</option>
                <option value="student">Student</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <FLabel>Preferred language</FLabel>
              <select value={prefs.preferred_lang} onChange={e => setPrefs(p => ({ ...p, preferred_lang: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800
                           focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-slate-300 bg-white">
                <option value="en">English</option>
                <option value="ss">siSwati</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <BtnPrimary type="button" onClick={handleSavePrefs} disabled={savingPrefs}>
              {savingPrefs && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {savingPrefs ? "Saving…" : "Save Preferences"}
            </BtnPrimary>
            {prefsMsg && (
              <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "#10b981" }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {prefsMsg}
              </span>
            )}
          </div>
        </div>
      </Section>

      {/* Password form */}
      <Section title="Change Password" description="Use a strong password of at least 8 characters.">
        <form onSubmit={handleChangePassword} className="space-y-4">
          {pwdError && (
            <div className="p-3 rounded-xl text-sm"
              style={{ background: "rgba(206,17,38,0.06)", border: "1px solid rgba(206,17,38,0.2)", color: "#CE1126" }}>
              {pwdError}
            </div>
          )}

          <div>
            <FLabel required>Current password</FLabel>
            <FInput type="password" value={passwords.currentPassword}
              onChange={setPwd("currentPassword")} required />
          </div>
          <div>
            <FLabel required>New password</FLabel>
            <FInput type="password" value={passwords.newPassword}
              onChange={setPwd("newPassword")} placeholder="At least 8 characters" required />
          </div>
          <div>
            <FLabel required>Confirm new password</FLabel>
            <FInput type="password" value={passwords.confirm}
              onChange={setPwd("confirm")} required />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <BtnPrimary type="submit" disabled={savingPwd}>
              {savingPwd && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {savingPwd ? "Updating…" : "Change Password"}
            </BtnPrimary>
            {pwdMsg && (
              <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "#10b981" }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {pwdMsg}
              </span>
            )}
          </div>
        </form>
      </Section>
    </div>
  );
};

export default ProfileSettings;
