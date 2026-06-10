const BASE = `
  <div style="font-family:sans-serif;max-width:560px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#001540,#002d80);padding:24px 32px;display:flex;align-items:center;gap:12px">
      <div style="width:8px;height:32px;background:#FFD600;border-radius:4px;flex-shrink:0"></div>
      <div>
        <p style="margin:0;color:#FFD600;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Swazi Cultural Heritage</p>
        <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:12px">Kingdom of Eswatini</p>
      </div>
    </div>
    <div style="padding:32px">BODY</div>
    <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb">
      <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center">
        This is an automated message from the Swazi Cultural Heritage Platform. Please do not reply.
      </p>
    </div>
  </div>`;

const wrap = (body) => BASE.replace('BODY', body);

const badge = (status) => {
  const map = {
    published:      { bg: '#dcfce7', color: '#15803d', label: 'Published' },
    rejected:       { bg: '#fee2e2', color: '#dc2626', label: 'Rejected'  },
    pending_review: { bg: '#fef9c3', color: '#a16207', label: 'Pending Review' },
  };
  const s = map[status] || map.pending_review;
  return `<span style="display:inline-block;padding:3px 12px;border-radius:99px;font-size:12px;font-weight:700;background:${s.bg};color:${s.color}">${s.label}</span>`;
};

// ── Sent to ALL admins when a practitioner submits new content
export const pendingReviewEmail = ({ contentType, title, practitionerName, adminName }) => ({
  subject: `New ${contentType} pending review — "${title}"`,
  html: wrap(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827">New Content Awaiting Review</h2>
    <p style="margin:0 0 20px;color:#6b7280;font-size:14px">Hi ${adminName || 'Admin'}, a new submission needs your attention.</p>

    <div style="background:#f3f4f6;border-radius:8px;padding:16px 20px;margin-bottom:20px">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Submission Details</p>
      <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#111827">${title}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280">Type: ${contentType} &nbsp;·&nbsp; Submitted by: ${practitionerName}</p>
      ${badge('pending_review')}
    </div>

    <p style="margin:0;font-size:13px;color:#6b7280">
      Log in to the admin panel to review and publish or reject this submission.
    </p>
  `),
});

// ── Sent to a practitioner when a user sends a service enquiry
export const newEnquiryEmail = ({ serviceName, practitionerName, userName, userEmail, message }) => ({
  subject: `New enquiry for your service — "${serviceName}"`,
  html: wrap(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827">New Service Enquiry</h2>
    <p style="margin:0 0 20px;color:#6b7280;font-size:14px">Hi ${practitionerName || 'there'}, someone is interested in your service.</p>

    <div style="background:#f3f4f6;border-radius:8px;padding:16px 20px;margin-bottom:20px">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Service</p>
      <p style="margin:0;font-size:15px;font-weight:700;color:#111827">${serviceName}</p>
    </div>

    <div style="background:#f3f4f6;border-radius:8px;padding:16px 20px;margin-bottom:20px">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">From</p>
      <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#111827">${userName}</p>
      <p style="margin:0;font-size:13px;color:#6b7280">${userEmail}</p>
    </div>

    <div style="border-left:3px solid #002395;padding:12px 16px;background:#eff6ff;border-radius:0 8px 8px 0;margin-bottom:20px">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:1px">Message</p>
      <p style="margin:0;font-size:14px;color:#1e3a8a;line-height:1.6">${message}</p>
    </div>

    <p style="margin:0;font-size:13px;color:#6b7280">
      Reply directly to <strong>${userEmail}</strong> to respond to this enquiry.
    </p>
  `),
});

// ── Sent to the practitioner when their content status changes
export const contentReviewedEmail = ({ contentType, title, status, rejectionNote, practitionerName }) => ({
  subject: `Your ${contentType} has been ${status} — "${title}"`,
  html: wrap(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827">Submission Update</h2>
    <p style="margin:0 0 20px;color:#6b7280;font-size:14px">Hi ${practitionerName || 'there'}, here is an update on your recent submission.</p>

    <div style="background:#f3f4f6;border-radius:8px;padding:16px 20px;margin-bottom:20px">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px">Submission Details</p>
      <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#111827">${title}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280">Type: ${contentType}</p>
      ${badge(status)}
    </div>

    ${status === 'published' ? `
      <p style="margin:0;font-size:13px;color:#15803d;font-weight:600">
        Congratulations! Your submission is now live and visible to all users.
      </p>
    ` : status === 'rejected' ? `
      <p style="margin:0 0 12px;font-size:13px;color:#dc2626;font-weight:600">
        Your submission was not approved at this time.
      </p>
      ${rejectionNote ? `
        <div style="border-left:3px solid #dc2626;padding:10px 16px;background:#fff1f2;border-radius:0 6px 6px 0">
          <p style="margin:0;font-size:13px;color:#7f1d1d"><strong>Reviewer note:</strong> ${rejectionNote}</p>
        </div>
        <p style="margin:12px 0 0;font-size:13px;color:#6b7280">
          You may edit your submission and resubmit it for review.
        </p>
      ` : ''}
    ` : ''}
  `),
});
